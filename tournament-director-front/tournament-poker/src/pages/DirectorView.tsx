import { Trophy, Crown } from 'lucide-react';
import { BigTimer } from "../features/timer/BigTimer";
import { BlindsPanel } from "../features/blinds/BlindsPanel";
import { useTournamentStore } from "../store/tournamentStore";

export const DirectorView = () => {
    // 1. On récupère players et status
    const {
        currentLevel,
        status,
        players // 👈 Ajout : On a besoin de la liste pour trouver le vainqueur
    } = useTournamentStore();

    // 2. Calcul des niveaux futurs
    const baseId = currentLevel?.id || 1;
    const baseSb = currentLevel?.smallBlind || 50;
    const baseBb = currentLevel?.bigBlind || 100;
    const baseAnte = currentLevel?.ante || 0;
    const duration = currentLevel?.duration || 20;

    const nextLevel = {
        id: baseId + 1,
        sb: baseSb * 2,
        bb: baseBb * 2,
        ante: baseAnte * 2
    };

    const nextNextLevel = {
        id: baseId + 2,
        sb: nextLevel.sb * 2,
        bb: nextLevel.bb * 2,
        ante: nextLevel.ante * 2
    };

    // 3. Logique pour trouver le vainqueur
    // C'est le seul joueur qui n'a pas le statut "ELIMINATED"
    const winner = players.find(p => p.status !== 'ELIMINATED');

    // 4. GESTION DE L'AFFICHAGE "TOURNOI TERMINÉ"
    if (status === 'FINISHED') {
        return (
            <div className="flex flex-col items-center justify-center h-full animate-fade-in bg-gray-800/50 rounded-3xl border border-white/5 p-10 shadow-2xl relative overflow-hidden">
                {/* Fond lumineux subtil */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/10 blur-[100px] rounded-full pointer-events-none"></div>

                <Trophy size={100} className="text-yellow-500 mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />

                <h2 className="text-5xl font-black text-white uppercase tracking-wider mb-2 drop-shadow-lg">
                    Tournoi Terminé
                </h2>

                <div className="text-xl text-gray-400 font-light mb-8">
                    Félicitations au grand vainqueur
                </div>

                {/* 🏆 AFFICHAGE DU NOM DU VAINQUEUR */}
                {winner && (
                    <div className="flex flex-col items-center animate-scale-in">
                        <div className="bg-gradient-to-r from-yellow-600 to-yellow-400 p-[2px] rounded-2xl shadow-2xl">
                            <div className="bg-gray-900 rounded-2xl px-12 py-6 flex flex-col items-center relative">
                                <div className="absolute -top-6 text-yellow-400">
                                    <Crown size={48} fill="currentColor" />
                                </div>
                                <span className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-200 tracking-tight">
                                    {winner.username}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // 5. AFFICHAGE PRINCIPAL (En cours)
    return (
        <div className="flex flex-col gap-6 h-full">

            <div className="flex-1 min-h-[400px] grid grid-cols-1 lg:grid-cols-12 gap-6">
                <section className="lg:col-span-8 shadow-xl rounded-2xl overflow-hidden relative flex flex-col">
                    <BigTimer />
                </section>

                <section className="lg:col-span-4 shadow-xl rounded-2xl overflow-hidden h-full flex flex-col">
                    <BlindsPanel />
                </section>
            </div>

            <footer className="shrink-0">
                <div className="bg-poker-card rounded-xl border border-white/5 p-4 shadow-lg min-h-[140px] flex flex-col w-full">
                    <h3 className="text-poker-muted text-xs font-bold uppercase mb-3 tracking-wider">Structure à venir</h3>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex justify-between items-center p-3 bg-black/20 rounded border border-white/5">
                            <div className="flex flex-col">
                                <span className="text-xs text-poker-muted uppercase">Niveau {nextLevel.id}</span>
                                <span className="font-mono text-white font-bold text-lg">
                                    {nextLevel.sb.toLocaleString()} / {nextLevel.bb.toLocaleString()}
                                </span>
                            </div>
                            {nextLevel.ante > 0 && (
                                <span className="text-poker-accent font-bold text-lg">({nextLevel.ante.toLocaleString()})</span>
                            )}
                            <span className="text-sm font-mono text-poker-muted bg-white/5 px-3 py-1 rounded">
                                {duration} min
                            </span>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-black/20 rounded border border-white/5 opacity-50">
                            <div className="flex flex-col">
                                <span className="text-xs text-poker-muted uppercase">Niveau {nextNextLevel.id}</span>
                                <span className="font-mono text-white font-bold text-lg">
                                    {nextNextLevel.sb.toLocaleString()} / {nextNextLevel.bb.toLocaleString()}
                                </span>
                            </div>
                            {nextNextLevel.ante > 0 && (
                                <span className="text-poker-accent font-bold text-lg">({nextNextLevel.ante.toLocaleString()})</span>
                            )}
                            <span className="text-sm font-mono text-poker-muted bg-white/5 px-3 py-1 rounded">
                                {duration} min
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};