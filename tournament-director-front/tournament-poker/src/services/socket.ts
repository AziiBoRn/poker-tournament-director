import { io, Socket } from 'socket.io-client';
import { useTournamentStore } from '../store/tournamentStore';

class SocketService {
  private socket: Socket | null = null;

  connect(tournamentId: string) {
    if (this.socket?.connected) {
      // Déjà connecté au bon tournoi ? On ne touche à rien.
      // @ts-ignore (accès privé pour vérifier la query)
      if (this.socket.io.opts.query?.tournamentId === tournamentId) return;
      this.socket.disconnect();
    }

    console.log(`🔌 [WS] Connexion au Gateway pour le tournoi ${tournamentId}...`);

    this.socket = io('http://localhost:8080', {
      query: { tournamentId },
      transports: ['websocket'], // 👈 FORCE WEBSOCKET (Évite le polling et les erreurs 404/CORS)
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('✅ [WS] Connecté au Gateway ! ID:', this.socket?.id);
    });

    this.socket.on('connect_error', (err) => {
      // On ignore les erreurs "interrompues" classiques du rechargement de page
      if (err.message !== "xhr poll error") {
        console.warn('⚠️ [WS] Erreur connexion:', err.message);
      }
    });

    // Écoute du Timer
    this.socket.on('timer:update', (payload: any) => {
      useTournamentStore.getState().syncTimerFromSocket(payload);
    });

    // Écoute du changement de niveau
    this.socket.on('tournament.level_changed', (payload: any) => {
      console.log('🆙 LEVEL UP:', payload);
      if (payload && payload.currentLevel) {
        useTournamentStore.getState().setCurrentLevel(payload.currentLevel);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('🛑 [WS] Déconnexion propre');
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();