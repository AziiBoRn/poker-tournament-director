import { useEffect, useState } from 'react'; // Ajout de useState
import { Play, Pause, SkipForward, Rocket, AlertTriangle } from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const BigTimer = () => {
    const {
        timeLeft, isRunning, tournamentId, status,
        loadTournamentData, nextLevel, currentLevel,
        setCurrentLevel
    } = useTournamentStore();

    // État local pour gérer la confirmation du bouton "Suivant"
    const [isConfirmingNext, setIsConfirmingNext] = useState(false);

    useEffect(() => {
        // 1. Connexion Socket
        if (tournamentId) {
            socketService.connect(tournamentId);
        }

        // 2. Appel API initial
        const fetchData = async () => {
            if (!tournamentId) return;
            try {
                const data = await api.getTournament(tournamentId);
                loadTournamentData(data);
            } catch (e) {
                console.error("❌ Erreur chargement API:", e);
            }
        };
        fetchData();

        return () => socketService.disconnect();
    }, [tournamentId]);

    // --- ACTIONS ---

    const handleStart = async () => {
        if(!tournamentId) return;
        try { await api.startTournament(tournamentId); } catch (e) { console.error(e); }
    };

    const handleResume = async () => {
        if(!tournamentId) return;
        try {
            await api.resumeTimer(tournamentId);
            // 👇 ON RECHARGE POUR RÉCUPÉRER LES VRAIES BLINDS (50/100)
            const data = await api.getTournament(tournamentId);
            loadTournamentData(data);
        } catch (e) { console.error(e); }
    };

    const handlePause = async () => {
        if(!tournamentId) return;
        try {
            await api.pauseTimer(tournamentId);

            // 👇 ON RECHARGE POUR RÉCUPÉRER LES BLINDS À 0 (PAUSE)
            // Petit délai de sécurité (50ms) pour être sûr que le Back a bien changé le statut
            setTimeout(async () => {
                const data = await api.getTournament(tournamentId);
                loadTournamentData(data);
            }, 50);

        } catch (e) { console.error(e); }
    };

    // --- LOGIQUE "NEXT LEVEL" AMÉLIORÉE ---
    const handleNextLevel = async () => {
        // Étape 1 : Si on n'est pas en mode confirmation, on active le mode
        if (!isConfirmingNext) {
            setIsConfirmingNext(true);
            // On annule la confirmation automatiquement après 3 secondes si pas de clic
            setTimeout(() => setIsConfirmingNext(false), 3000);
            return;
        }

        // Étape 2 : Si on clique une 2ème fois, on lance l'action
        if (!tournamentId) return;

        try {
            // On prend la durée par défaut du prochain niveau ou du niveau actuel
            const levelData = nextLevel || currentLevel;
            const durationMs = (levelData?.duration || 20) * 60 * 1000;

            const response = await api.nextLevel(tournamentId, durationMs);

            // --- MISE À JOUR DYNAMIQUE ---
            // On met à jour le store immédiatement pour que le panneau de droite change direct
            if (response.currentLevel) {
                setCurrentLevel(response.currentLevel);
            }

            // On reset le bouton
            setIsConfirmingNext(false);
        } catch (e) {
            console.error("Erreur Next Level:", e);
            setIsConfirmingNext(false);
        }
    };

    // --- BARRE DE PROGRESSION CORRIGÉE ---
    // 1. Durée totale du niveau actuel en secondes (défaut 20 min si inconnu)
    const totalDuration = (currentLevel?.duration || 20) * 60;

    // 2. Calcul du pourcentage (timeLeft diminue, donc la barre se vide ou se remplit selon ton choix)
    // Ici : Elle se vide (100% -> 0%)
    const rawProgress = (timeLeft / totalDuration) * 100;

    // 3. Sécurité pour ne pas dépasser 0-100% (évite les bugs graphiques)
    const progress = Math.min(100, Math.max(0, rawProgress));

    return (
        <div className="flex flex-col items-center justify-center h-full p-6 bg-poker-dark/50 relative">

            {/* Affichage du Temps */}
            <div className={`text-[10rem] lg:text-[12rem] leading-none font-bold tracking-tighter tabular-nums drop-shadow-2xl transition-colors duration-300 ${isRunning ? 'text-poker-accent' : 'text-gray-500'}`}>
                {formatTime(timeLeft)}
            </div>

            {/* Barre de progression */}
            <div className="w-full max-w-3xl h-3 bg-gray-800 rounded-full mt-8 overflow-hidden border border-white/5 relative">
                {/* Fond de la barre */}
                <div
                    className="h-full bg-poker-accent transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(255,90,0,0.5)]"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            {/* Contrôles */}
            <div className="flex gap-4 mt-10">

                {/* Bouton Principal (Start / Pause / Resume) */}
                {status === 'OPEN_REGISTRATION' ? (
                    <button onClick={handleStart} className="flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg bg-green-600 hover:bg-green-500 text-white shadow-lg border border-white/10 animate-pulse">
                        <Rocket size={24} /> DÉMARRER
                    </button>
                ) : isRunning ? (
                    <button onClick={handlePause} className="flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg bg-poker-card border border-white/10 hover:bg-red-500/20 text-white shadow-lg">
                        <Pause size={24} /> PAUSE
                    </button>
                ) : (
                    <button onClick={handleResume} className="flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg bg-poker-accent hover:bg-orange-600 text-white shadow-orange-900/50 shadow-lg">
                        <Play size={24} className="fill-current" /> REPRENDRE
                    </button>
                )}

                {/* Bouton Next Level (Avec confirmation UX) */}
                <button
                    onClick={handleNextLevel}
                    className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold text-lg border transition-all duration-200 shadow-lg
                ${isConfirmingNext
                        ? 'bg-red-600 hover:bg-red-700 text-white border-red-400 scale-105' // Style "Attention"
                        : 'bg-gray-700 hover:bg-gray-600 text-white border-white/10'        // Style "Normal"
                    }`}
                >
                    {isConfirmingNext ? (
                        <>
                            <AlertTriangle size={24} />
                            <span>SÛR ?</span>
                        </>
                    ) : (
                        <SkipForward size={24} />
                    )}
                </button>
            </div>
        </div>
    );
};