import { useEffect, useState } from 'react';
import { Trash2, Skull, Trophy, Star } from 'lucide-react';
import Confetti from 'react-confetti'; // 👈 IMPORT
import { api } from '../services/api';
import { useTournamentStore } from '../store/tournamentStore';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export const TablesView = () => {
    const [tables, setTablesList] = useState([]);
    const { tournamentId, status, players, loadTournamentData } = useTournamentStore();

    const [playerToEliminate, setPlayerToEliminate] = useState<{id: string, name: string} | null>(null);
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    // Gestion resize fenêtre pour confettis
    useEffect(() => {
        const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const refreshAll = async () => { /* ...identique... */ if (!tournamentId) return; try { const tablesData = await api.getTables(tournamentId); setTablesList(tablesData); const tournamentData = await api.getTournament(tournamentId); loadTournamentData(tournamentData); } catch (err) { console.error("Erreur refresh:", err); } };

    useEffect(() => { refreshAll(); const interval = setInterval(refreshAll, 3000); return () => clearInterval(interval); }, [tournamentId]);

    const initiateElimination = (playerId: string, username: string) => { setPlayerToEliminate({ id: playerId, name: username }); };
    const confirmElimination = async () => { /* ...identique... */ if (!tournamentId || !playerToEliminate) return; try { await api.eliminatePlayer(tournamentId, playerToEliminate.id); setTimeout(refreshAll, 200); } catch (e) { console.error(e); } };

    const eliminatedPlayers = players.filter(p => p.status === 'ELIMINATED');

    // LOGIQUE DE VICTOIRE
    const isFinished = status === 'FINISHED';
    // On trouve le vainqueur (le seul non éliminé)
    const winner = players.find(p => p.status !== 'ELIMINATED');

    if (!tournamentId) return <div className="p-8 text-white text-xl">Chargement...</div>;

    // ✨ VUE VICTOIRE (TABLES)
    if (isFinished && winner) {
        return (
            <div className="h-full flex flex-col items-center justify-center relative">
                <Confetti width={windowSize.width} height={windowSize.height} numberOfPieces={300} recycle={true} />

                <div className="bg-gray-800/80 p-12 rounded-3xl border border-yellow-500/30 backdrop-blur-md shadow-[0_0_100px_rgba(234,179,8,0.2)] text-center animate-fade-in">
                    <div className="flex justify-center mb-6">
                        <Trophy size={100} className="text-yellow-400 animate-bounce" />
                    </div>
                    <h1 className="text-5xl font-black text-white mb-2 uppercase tracking-widest">Le Tournoi est fini</h1>
                    <div className="text-xl text-yellow-500 font-mono mb-8">TABLE FINALE TERMINÉE</div>

                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 rounded-2xl border border-white/10 flex items-center gap-6 mx-auto w-fit">
                        <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center text-4xl font-bold text-gray-900 border-4 border-white shadow-lg">
                            {winner.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left">
                            <p className="text-sm text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                                <Star size={14} className="text-yellow-400" fill="currentColor"/> Champion
                            </p>
                            <p className="text-4xl font-bold text-white">{winner.username}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 👇 VUE CLASSIQUE
    return (
        <>
            <ConfirmModal
                isOpen={!!playerToEliminate}
                onClose={() => setPlayerToEliminate(null)}
                onConfirm={confirmElimination}
                title="Sortir le joueur ?"
                message={`Voulez-vous vraiment éliminer ${playerToEliminate?.name} de la table ?`}
                confirmLabel="Éliminer"
                isDestructive={true}
            />

            <div className="flex flex-col gap-10 pb-10">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {tables.length === 0 && (
                        <div className="col-span-3 text-gray-500 text-center py-16 border-2 border-dashed border-gray-700 rounded-2xl bg-gray-800/30 text-xl">
                            Aucune table active.
                        </div>
                    )}

                    {tables.map((table: any) => (
                        <div key={table.id} className="bg-gray-800 rounded-2xl p-6 shadow-2xl border border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-poker-accent to-orange-600"></div>

                            <h3 className="text-white font-bold mb-6 border-b border-white/10 pb-4 flex justify-between items-center">
                                <span className="bg-poker-accent text-white px-3 py-1 rounded-lg shadow font-bold text-sm tracking-wide">TABLE {table.id}</span>
                                <span className="text-gray-300 font-mono bg-black/40 px-3 py-1 rounded-lg text-sm border border-white/5">{table.players?.length || 0} / 9 JOUEURS</span>
                            </h3>

                            <ul className="space-y-3">
                                {table.players?.map((player: any) => (
                                    <li key={player.id} className="flex justify-between items-center bg-gray-900/60 p-3 rounded-xl border border-white/5 group hover:bg-gray-700 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold text-white border-2 border-gray-600 shadow-inner">
                                                {player.username.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-white font-bold text-lg tracking-tight">{player.username}</span>
                                        </div>
                                        <button onClick={() => initiateElimination(player.id, player.username)} className="text-gray-500 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Éliminer">
                                            <Trash2 size={20} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {eliminatedPlayers.length > 0 && (
                    <div className="mt-4">
                        <h2 className="text-2xl font-bold text-red-400 mb-6 flex items-center gap-3">
                            <Skull size={28} /> Joueurs Éliminés ({eliminatedPlayers.length})
                        </h2>
                        <div className="bg-red-950/20 border border-red-900/40 rounded-2xl p-8 shadow-inner">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {eliminatedPlayers.map((p) => (
                                    <div key={p.id} className="bg-black/60 p-3 rounded-xl flex items-center gap-3 border border-red-500/20 shadow-sm group hover:border-red-500/50 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-red-900/30 flex items-center justify-center text-red-500 font-bold border border-red-500/20"><Skull size={14} /></div>
                                        <span className="truncate font-medium text-lg text-red-100 opacity-70 group-hover:opacity-100 line-through decoration-red-600 decoration-2">{p.username}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </>
    );
};