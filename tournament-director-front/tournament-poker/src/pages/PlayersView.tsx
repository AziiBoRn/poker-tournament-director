import { useState, useEffect } from 'react';
import { UserPlus, User, Search, Trash2, Skull, Trophy, Crown } from 'lucide-react';
import Confetti from 'react-confetti'; // 👈 IMPORT
import { useTournamentStore } from '../store/tournamentStore';
import { api } from '../services/api';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export const PlayersView = () => {
    const {
        tournamentId, status, players,
        loadTournamentData, addPlayerOptimistic, removePlayerOptimistic
    } = useTournamentStore();

    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [playerToDelete, setPlayerToDelete] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'active' | 'eliminated'>('active');
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    // Mise à jour de la taille pour les confettis
    useEffect(() => {
        const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const activePlayers = players.filter(p => p.status !== 'ELIMINATED');
    // Le vainqueur est le dernier actif
    const winner = activePlayers.length === 1 ? activePlayers[0] : null;
    const isFinished = status === 'FINISHED';

    // Logique de filtre classique...
    const filteredPlayers = players.filter(p => {
        const matchesSearch = p.username.toLowerCase().includes(searchTerm.toLowerCase());
        if (activeTab === 'active') return matchesSearch && p.status !== 'ELIMINATED';
        return matchesSearch && p.status === 'ELIMINATED';
    });

    const countActive = activePlayers.length;
    const countEliminated = players.filter(p => p.status === 'ELIMINATED').length;

    useEffect(() => { if (tournamentId) refreshData(); }, [tournamentId]);

    const refreshData = async () => { /* ...code inchangé... */ if (!tournamentId) return; try { const data = await api.getTournament(tournamentId); loadTournamentData(data); } catch (e) { console.error(e); } };
    const handleAddPlayer = async (e?: React.FormEvent) => { /* ...code inchangé... */ e?.preventDefault(); if (!username.trim() || !tournamentId) return; setActiveTab('active'); setSearchTerm(''); const tempPlayer = { id: Date.now(), username: username, status: 'ACTIVE' }; addPlayerOptimistic(tempPlayer); const backupUsername = username; setUsername(''); setIsLoading(true); try { await api.addPlayer(tournamentId, backupUsername); setTimeout(() => refreshData(), 500); } catch (err: any) { setError("Erreur ajout"); refreshData(); } finally { setIsLoading(false); } };
    const initiateDelete = (playerId: string) => setPlayerToDelete(playerId);
    const confirmDelete = async () => { /* ...code inchangé... */ if (!tournamentId || !playerToDelete) return; removePlayerOptimistic(playerToDelete); try { await api.eliminatePlayer(tournamentId, playerToDelete); setTimeout(() => refreshData(), 500); } catch (err) { console.error(err); refreshData(); } setPlayerToDelete(null); };

    const isRegistrationOpen = status === 'OPEN_REGISTRATION';

    // ✨ VUE VICTOIRE (Si le tournoi est FINI)
    if (isFinished && winner) {
        return (
            <div className="h-full flex flex-col items-center justify-center relative overflow-hidden">
                <Confetti width={windowSize.width} height={windowSize.height} numberOfPieces={500} recycle={true} />

                <div className="z-10 flex flex-col items-center animate-bounce-in">
                    <div className="relative mb-8">
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-yellow-500 animate-pulse">
                            <Crown size={80} fill="currentColor" />
                        </div>
                        <div className="w-48 h-48 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.6)] border-4 border-white">
                          <span className="text-6xl font-bold text-white drop-shadow-md">
                              {winner.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="absolute -bottom-4 right-0 bg-poker-accent p-3 rounded-full border-4 border-gray-900">
                            <Trophy size={32} className="text-white" />
                        </div>
                    </div>

                    <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 mb-4 drop-shadow-sm">
                        {winner.username}
                    </h1>
                    <p className="text-2xl text-gray-300 font-light tracking-widest uppercase">
                        Grand Vainqueur du Tournoi
                    </p>

                    <div className="mt-12 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                        <p className="text-gray-400 text-sm mb-2 text-center">Adversaires éliminés</p>
                        <p className="text-3xl font-bold text-white text-center">{countEliminated}</p>
                    </div>
                </div>
            </div>
        )
    }

    // 👇 VUE CLASSIQUE (Si le tournoi continue)
    return (
        <>
            <ConfirmModal
                isOpen={!!playerToDelete}
                onClose={() => setPlayerToDelete(null)}
                onConfirm={confirmDelete}
                title="Éliminer ce joueur ?"
                message="Voulez-vous vraiment sortir ce joueur du tournoi ?"
                confirmLabel="Oui, Éliminer"
                isDestructive={true}
            />

            <div className="h-full flex flex-col gap-6">
                <header className="flex justify-between items-center shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <UserPlus className="text-poker-accent" /> Gestion des Joueurs
                        </h1>
                    </div>
                </header>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">

                    {/* COLONNE GAUCHE */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-white/5 h-fit shadow-xl">
                        <h2 className="font-bold text-lg mb-4 text-white">Ajouter un joueur</h2>
                        {isRegistrationOpen ? (
                            <form onSubmit={handleAddPlayer} className="flex flex-col gap-4">
                                <input
                                    autoFocus
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-4 text-white text-lg focus:border-poker-accent outline-none transition"
                                    placeholder="Pseudo..."
                                />
                                <button type="submit" disabled={isLoading || !username} className="w-full bg-poker-accent hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50">
                                    Ajouter
                                </button>
                            </form>
                        ) : (
                            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-200 text-center text-sm">
                                Inscriptions fermées.
                            </div>
                        )}
                    </div>

                    {/* COLONNE DROITE */}
                    <div className="lg:col-span-2 bg-poker-card rounded-xl border border-white/5 flex flex-col shadow-xl overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-gray-800/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                            <div className="flex bg-gray-900 p-1 rounded-lg border border-white/5">
                                <button onClick={() => setActiveTab('active')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'active' ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-white'}`}>
                                    Actifs <span className="bg-gray-800 px-1.5 py-0.5 rounded text-xs text-poker-accent">{countActive}</span>
                                </button>
                                <button onClick={() => setActiveTab('eliminated')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'eliminated' ? 'bg-red-900/30 text-red-400 border border-red-500/20 shadow' : 'text-gray-500 hover:text-red-400'}`}>
                                    <Skull size={14}/> Éliminés <span className="bg-gray-800 px-1.5 py-0.5 rounded text-xs text-gray-400">{countEliminated}</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 bg-gray-900 p-2 rounded-lg border border-white/5 w-full max-w-xs">
                                <Search size={18} />
                                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher..." className="bg-transparent outline-none text-sm w-full text-white placeholder-gray-600" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {filteredPlayers.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                                    <User size={64} className="mb-4" />
                                    <p>Aucun joueur trouvé.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {filteredPlayers.map((p, i) => (
                                        <div key={p.id || i} className={`p-3 rounded-lg border flex items-center gap-3 transition group relative ${activeTab === 'eliminated' ? 'bg-red-900/10 border-red-500/10 opacity-75' : 'bg-gray-800 border-white/5 hover:bg-gray-750'}`}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${activeTab === 'eliminated' ? 'bg-red-900/50 text-red-300' : 'bg-gray-700 text-gray-300 group-hover:bg-poker-accent group-hover:text-white'}`}>
                                                {activeTab === 'eliminated' ? <Skull size={18}/> : p.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-bold truncate text-lg ${activeTab === 'eliminated' ? 'text-gray-400 line-through' : 'text-white'}`}>{p.username}</div>
                                            </div>
                                            {activeTab === 'active' && (
                                                <button onClick={() => initiateDelete(p.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={20} /></button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};