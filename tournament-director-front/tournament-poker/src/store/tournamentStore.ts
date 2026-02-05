import { create } from 'zustand';

interface TournamentState {
  tournamentId: string | null;
  tournamentName: string;
  status: string;
  isRunning: boolean;
  timeLeft: number;

  currentLevelIndex: number;
  totalPlayers: number;
  remainingPlayers: number;

  players: any[];

  currentLevel: any;
  nextLevel: any;

  // Actions
  setTournamentId: (id: string | null) => void;
  syncTimerFromSocket: (payload: any) => void;
  loadTournamentData: (apiData: any) => void;
  setCurrentLevel: (level: any) => void;
  setStatus: (status: string) => void;
  addPlayerOptimistic: (player: any) => void;
  removePlayerOptimistic: (playerId: string | number) => void;
}

export const useTournamentStore = create<TournamentState>((set) => ({
  // État Initial
  tournamentId: null,
  tournamentName: "",
  status: 'OPEN_REGISTRATION',
  isRunning: false,
  timeLeft: 0,

  currentLevelIndex: 1,
  totalPlayers: 0,
  remainingPlayers: 0,
  players: [],

  currentLevel: null,
  nextLevel: null,

  // --- ACTIONS ---

  setTournamentId: (id) => set({ tournamentId: id }),

  setStatus: (status) => set({ status }),

  setCurrentLevel: (level) => set({ currentLevel: level }),

  syncTimerFromSocket: (payload) => {
    set({
      timeLeft: Math.max(0, Math.floor(payload.remainingMs / 1000)),
      isRunning: payload.status === 'RUNNING'
    });
  },

  addPlayerOptimistic: (player) => set((state) => {
    const newPlayers = [...state.players, { ...player, status: 'ACTIVE' }];
    return {
      players: newPlayers,
      totalPlayers: newPlayers.length,
      remainingPlayers: newPlayers.filter(p => p.status !== 'ELIMINATED').length
    };
  }),

  removePlayerOptimistic: (playerId) => set((state) => {
    const updatedPlayers = state.players.map(p =>
        p.id == playerId ? { ...p, status: 'ELIMINATED' } : p
    );
    return {
      players: updatedPlayers,
      remainingPlayers: updatedPlayers.filter(p => p.status !== 'ELIMINATED').length
    };
  }),

  loadTournamentData: (data) => {

    const durationMin = data.levelDuration ? data.levelDuration / 1000 / 60 : 20;
    const playersList = data.players || [];
    const totalCount = playersList.length;
    const activeCount = playersList.filter((p: any) => p.status !== 'ELIMINATED').length;

    // 👇 CORRECTION ICI : On utilise ?? pour ne pas écraser une vraie pause (0)
    // Mais si c'est undefined/null, on met 50/100 pour éviter l'affichage "Pause" par erreur.
    const currentLvl = {
      id: data.currentLevel || 1,
      // 👇 C'EST ICI QU'IL FAUT CORRIGER
      smallBlind: data.smallBlind ?? 50, // Utilise ?? (Si c'est 0, ça reste 0)
      bigBlind: data.bigBlind ?? 100,    // Utilise ??
      ante: data.ante ?? 0,
      duration: durationMin
    };

    const nextLvl = {
      id: currentLvl.id + 1,
      smallBlind: currentLvl.smallBlind * 2,
      bigBlind: currentLvl.bigBlind * 2,
      ante: (currentLvl.ante || 0) * 2,
      duration: durationMin
    };

    set({
      tournamentName: data.name || `Tournoi #${data.id}`,
      status: data.status,

      totalPlayers: totalCount,
      remainingPlayers: activeCount,
      players: playersList,

      currentLevelIndex: data.currentLevel || 1,
      currentLevel: currentLvl,
      nextLevel: nextLvl
    });
  }
}));