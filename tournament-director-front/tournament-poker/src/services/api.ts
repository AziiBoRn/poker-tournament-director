import axios from 'axios';

const API_URL = 'http://localhost:8080';

export const api = {
  // ==========================================
  // ACCUEIL (HOME)
  // ==========================================

  // Lister tous les tournois
  listTournaments: async () => {
    const { data } = await axios.get(`${API_URL}/tournaments`);
    // L'API peut renvoyer un tableau direct ou un objet { data: [...] }
    return Array.isArray(data) ? data : (data.data || []);
  },

  createTournament: async (name: string, durationMinutes: number) => {
    const { data } = await axios.post(`${API_URL}/tournaments`, {
      name,
      levelDuration: durationMinutes * 60 * 1000
    });
    return data;
  },

  // ==========================================
  // GESTION DU TOURNOI
  // ==========================================

  getTournament: async (id: string) => {
    const [tournamentRes, blindRes] = await Promise.all([
      axios.get(`${API_URL}/tournaments/${id}`),
      axios.get(`${API_URL}/tournaments/${id}/blind`)
    ]);

    return {
      ...tournamentRes.data,
      ...blindRes.data
    };
  },

  // Démarrer le tournoi (Passe de OPEN_REGISTRATION à RUNNING)
  startTournament: async (id: string) => {
    return axios.post(`${API_URL}/tournaments/${id}/start`);
  },

  addPlayer: async (id: string, username: string) => {
    return axios.post(`${API_URL}/tournaments/${id}/player`, {
      username
    });
  },

  // ==========================================
  // TIMER & STRUCTURE
  // ==========================================

  pauseTimer: async (id: string) => {
    return axios.post(`${API_URL}/tournaments/${id}/timer/pause`);
  },

  resumeTimer: async (id: string) => {
    return axios.post(`${API_URL}/tournaments/${id}/timer/resume`);
  },

  nextLevel: async (id: string, durationMs: number) => {
    const response = await axios.post(`${API_URL}/tournaments/${id}/next`, { durationMs });
    return response.data;
  },


  getTables: async (id: string) => {
    const { data } = await axios.get(`${API_URL}/tournaments/${id}/tables`);
    return data;
  },

  eliminatePlayer: async (tournamentId: string, playerId: string) => {
    return axios.post(`${API_URL}/tournaments/${tournamentId}/players/${playerId}/eliminate`);
  },
};