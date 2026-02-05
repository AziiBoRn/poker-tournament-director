const SRV_TOURNAMENT = process.env.TOURNAMENT_SERVICE_URL || 'http://127.0.0.1:3001';
const SRV_PLAYERS = process.env.PLAYERS_SERVICE_URL || 'http://127.0.0.1:3002';
const SRV_TIMER = process.env.TIMER_SERVICE_URL || 'http://127.0.0.1:3003';
const SRV_TABLES = process.env.TABLES_SERVICE_URL || 'http://127.0.0.1:3004';

// Helper générique
class ServiceError extends Error {
    constructor(message, statusCode) { super(message); this.statusCode = statusCode; }
}

async function call(baseUrl, method, path, body) {
    try {
        if (method === 'POST' && !body) body = {};
        const res = await fetch(`${baseUrl}${path}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new ServiceError(err.error || res.statusText, res.status);
        }
        if (res.status === 204) return null;
        return await res.json();
    } catch (err) {
        if (err instanceof ServiceError) throw err;
        throw new ServiceError(err.message, 503);
    }
}

module.exports = {
    list: () => call(SRV_TOURNAMENT, 'GET', '/tournaments'),

    create: (body) => call(SRV_TOURNAMENT, 'POST', '/tournaments', body),

    get: async (id) => {
        const [tournament, players] = await Promise.all([
            call(SRV_TOURNAMENT, 'GET', `/tournaments/${id}`),
            call(SRV_PLAYERS, 'GET', `/tournaments/${id}/players`).catch(() => [])
        ]);

        return {
            ...tournament,
            playersCount: players.length,
            remainingPlayers: players.length,
            players: players
        };
    },

    addPlayer: (tId, body) => call(SRV_TOURNAMENT, 'POST', `/tournaments/${tId}/player`, body),
    start: (tId) => call(SRV_TOURNAMENT, 'POST', `/tournaments/${tId}/start`),
    eliminatePlayer: (tId, pId) => call(SRV_TOURNAMENT, 'POST', `/tournaments/${tId}/players/${pId}/eliminate`),
    nextLevel: (tId) => call(SRV_TOURNAMENT, 'POST', `/tournaments/${tId}/next`, { durationMs: undefined }),
    blind: (tId) => call(SRV_TOURNAMENT, 'GET', `/tournaments/${tId}/blind`),
    getTables: (tId) => call(SRV_TABLES, 'GET', `/tournaments/${tId}/tables`),
    getTimer: (tId) => call(SRV_TIMER, 'GET', `/tournaments/${tId}/timer`),
    pauseTimer: (tId) => call(SRV_TIMER, 'POST', `/timers/${tId}/pause`),
    resumeTimer: (tId) => call(SRV_TIMER, 'POST', `/timers/${tId}/resume`),
};