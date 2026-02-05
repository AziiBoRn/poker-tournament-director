import { useNavigate } from 'react-router-dom'; // 👈 Import
import { useTournamentStore } from '../../store/tournamentStore';

export const BlindsPanel = () => {
    const { currentLevel, totalPlayers, remainingPlayers, tournamentId } = useTournamentStore();
    const navigate = useNavigate(); // 👈 Hook navigation

    // Protection Anti-Crash
    if (!currentLevel) {
        return (
            <div className="grid grid-rows-2 gap-6 h-full animate-pulse">
                <div className="bg-white/5 rounded-xl border border-white/5"></div>
                <div className="bg-white/5 rounded-xl border border-white/5"></div>
            </div>
        );
    }

    const isBreak = currentLevel.smallBlind === 0;

    return (
        <div className="grid grid-rows-2 gap-6 h-full">

            {/* ---------------------------
          JOUEURS RESTANTS (Cliquable)
          --------------------------- */}
            <div
                onClick={() => navigate(`/tournament/${tournamentId}/players`)} // 👈 ACTION CLIC
                className="bg-poker-card rounded-xl p-6 flex flex-col items-center justify-center border border-white/5 relative overflow-hidden group cursor-pointer hover:border-poker-accent hover:shadow-lg hover:shadow-orange-900/20 transition-all"
            >
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>

                {/* Petit indicateur visuel qu'on peut cliquer */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-poker-accent text-xs font-bold border border-poker-accent px-2 py-0.5 rounded">
                    GÉRER
                </div>

                <span className="text-poker-muted uppercase text-xs tracking-widest font-bold mb-4 group-hover:text-white transition-colors">Joueurs</span>
                <div className="text-7xl font-bold text-white tracking-tighter">
                    {remainingPlayers || 0} <span className="text-4xl text-poker-muted align-top ml-2">/ {totalPlayers || 0}</span>
                </div>
            </div>

            {/* ---------------------------
          BLINDS ACTUELLES
          --------------------------- */}
            <div className={`rounded-xl p-6 flex flex-col items-center justify-center border transition-all duration-500 ${isBreak ? 'bg-green-900/20 border-green-500/30' : 'bg-poker-card border-white/5 border-l-4 border-l-poker-accent'}`}>

        <span className={`uppercase text-xs tracking-widest font-bold mb-4 ${isBreak ? 'text-green-400' : 'text-poker-accent'}`}>
            {isBreak ? '☕ PAUSE' : `Niveau ${currentLevel.id}`}
        </span>

                {isBreak ? (
                    <div className="text-5xl font-bold text-white text-center">
                        PAUSE
                        <div className="text-lg text-poker-muted font-normal mt-2">
                            Reprise dans quelques instants...
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="text-6xl font-bold text-white tracking-tight mb-2">
                            {currentLevel.smallBlind?.toLocaleString()}
                            <span className="text-poker-muted text-4xl mx-2">/</span>
                            {currentLevel.bigBlind?.toLocaleString()}
                        </div>

                        {currentLevel.ante > 0 && (
                            <div className="text-poker-muted mt-2 text-lg font-mono bg-black/20 px-4 py-1 rounded-full border border-white/5">
                                Ante {currentLevel.ante}
                            </div>
                        )}
                    </>
                )}
            </div>

        </div>
    );
};