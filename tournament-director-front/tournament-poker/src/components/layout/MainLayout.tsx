import { useEffect } from 'react';
import { Outlet, Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { Users, MonitorPlay, ArrowLeft, UserPlus } from 'lucide-react'; // J'ai retiré 'Settings'
import clsx from 'clsx';
import { useTournamentStore } from '../../store/tournamentStore';
import { socketService } from '../../services/socket';
import { api } from '../../services/api';

export const MainLayout = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const { setTournamentId, loadTournamentData, tournamentName } = useTournamentStore();

    useEffect(() => {
        if (!id) return;
        setTournamentId(id);
        socketService.connect(id);
        api.getTournament(id)
            .then(data => loadTournamentData(data))
            .catch(err => console.error(err));

        return () => socketService.disconnect();
    }, [id]);

    // 👇 MENU MIS À JOUR (Sans Structure)
    const navItems = [
        { path: `/tournament/${id}`, label: 'Director', icon: MonitorPlay },
        { path: `/tournament/${id}/players`, label: 'Joueurs', icon: UserPlus },
        { path: `/tournament/${id}/tables`, label: 'Tables', icon: Users },
        // La ligne Structure a été supprimée ici
    ];

    return (
        <div className="flex flex-col h-screen bg-poker-dark text-white overflow-hidden">
            <header className="h-16 bg-poker-card border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg tracking-tight leading-none">Poker Director</span>
                        <span className="text-xs text-poker-accent font-medium">{tournamentName || `Tournoi #${id}`}</span>
                    </div>
                </div>

                <nav className="flex gap-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium",
                                    isActive
                                        ? "bg-poker-accent text-white shadow-lg shadow-orange-900/20"
                                        : "text-poker-muted hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <Icon size={18} />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>
                <div className="w-8 h-8 rounded-full bg-gray-700 border border-white/10"></div>
            </header>
            <main className="flex-1 overflow-auto p-4">
                <div className="h-full max-w-[1920px] mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};