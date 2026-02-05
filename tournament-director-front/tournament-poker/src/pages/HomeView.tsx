import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { MonitorPlay, Plus, Users, Clock, Timer } from 'lucide-react';

export const HomeView = () => {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState<any[]>([]);

    // États du formulaire
    const [newByName, setNewByName] = useState("");
    const [duration, setDuration] = useState(20); // 👈 Par défaut 20 min

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadTournaments();
    }, []);

    const loadTournaments = async () => {
        try {
            const data = await api.listTournaments();
            setTournaments(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Erreur chargement", e);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newByName) return;

        setLoading(true);
        try {
            // On passe le nom ET la durée
            const res = await api.createTournament(newByName, duration);
            navigate(`/tournament/${res.id}`);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-5xl mx-auto">
                <header className="mb-12 text-center">
                    <h1 className="text-4xl font-bold text-poker-accent mb-2">Poker Director</h1>
                    <p className="text-gray-400">Gérez vos tournois en temps réel</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Colonne Création */}
                    <div className="bg-gray-800 p-6 rounded-2xl border border-white/5 shadow-xl h-fit">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Plus className="text-poker-accent" /> Nouveau Tournoi
                        </h2>
                        <form onSubmit={handleCreate} className="space-y-4">

                            {/* Champ NOM */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nom du tournoi</label>
                                <input
                                    type="text"
                                    value={newByName}
                                    onChange={(e) => setNewByName(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-poker-accent outline-none transition"
                                    placeholder="Ex: Sunday Special"
                                />
                            </div>

                            {/* Champ DURÉE */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Durée des niveaux (min)</label>
                                <div className="relative">
                                    <Timer className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="number"
                                        min="1"
                                        max="120"
                                        value={duration}
                                        onChange={(e) => setDuration(parseInt(e.target.value) || 10)}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 pl-10 text-white focus:border-poker-accent outline-none transition font-mono"
                                    />
                                </div>
                            </div>

                            <button
                                disabled={loading || !newByName}
                                className="w-full bg-poker-accent hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 mt-2"
                            >
                                {loading ? 'Création...' : 'Créer et Démarrer'}
                            </button>
                        </form>
                    </div>

                    {/* Colonne Liste */}
                    <div className="lg:col-span-2">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <MonitorPlay className="text-blue-400" /> Tournois Existants
                        </h2>
                        <div className="grid gap-4">
                            {tournaments.length === 0 ? (
                                <div className="text-gray-500 italic text-center py-10 border border-dashed border-gray-700 rounded-xl">
                                    Aucun tournoi trouvé. Créez-en un à gauche !
                                </div>
                            ) : (
                                tournaments.map((t) => (
                                    <div
                                        key={t.id}
                                        onClick={() => navigate(`/tournament/${t.id}`)}
                                        className="group bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-poker-accent cursor-pointer transition-all flex justify-between items-center shadow-lg"
                                    >
                                        <div>
                                            <h3 className="font-bold text-lg group-hover:text-poker-accent transition-colors">{t.name}</h3>
                                            <div className="flex gap-4 text-sm text-gray-400 mt-1">
                                        <span className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded">
                                            <Clock size={14}/>
                                            {/* On convertit les ms (backend) en minutes (affichage) */}
                                            {Math.floor((t.levelDuration || 600000) / 1000 / 60)} min
                                        </span>
                                                <span className="flex items-center gap-1"><Users size={14}/> ID: {t.id}</span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${t.status === 'RUNNING' ? 'bg-green-900 text-green-400' : 'bg-gray-700 text-gray-300'}`}>
                                            {t.status === 'OPEN_REGISTRATION' ? 'INSCRIPTIONS' : t.status}
                                        </span>
                                            </div>
                                        </div>
                                        <div className="bg-gray-700 p-3 rounded-full group-hover:bg-poker-accent group-hover:text-white transition-all">
                                            <MonitorPlay size={20} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};