const { valkey, redlock, pubSubClient } = require('../infrastructure/redis/RedisClient');
const TimerRepository = require('../infrastructure/db/TimerRepository');
const { TimerUpdatePayload } = require('common-types');

/**
 * Logique applicative pour la gestion des Timers.
 * Orchestre les interactions entre Redis (Hot Path) et MySQL (Cold Path/Recovery).
 */
class TimerUseCases {

    /**
     * Récupère l'état d'un timer (Méthode publique pour l'API).
     * @param {string|number} tournamentId
     * @returns {Promise<object|null>}
     */
    async getTimer(tournamentId) {
        return await this._getState(tournamentId);
    }

    /**
     * Récupère l'état interne.
     * Stratégie : Redis (Rapide) -> MySQL (Recovery) -> Réhydratation.
     * @private
     * @param {string|number} tournamentId
     * @returns {Promise<object|null>} L'état du timer ou null.
     */
    async _getState(tournamentId) {
        const key = `timer:${tournamentId}`;

        const raw = await valkey.get(key);
        if (raw) return JSON.parse(raw);

        const snapshot = await TimerRepository.findSnapshot(tournamentId);

        if (snapshot) {
            if (snapshot.status === 'RUNNING') {
                snapshot.lastTickAt = Date.now();
            }

            await valkey.set(key, JSON.stringify(snapshot));
            await valkey.sadd('active_timers', tournamentId);
            console.log(`✅ Timer ${tournamentId} recovered from DB.`);

            return snapshot;
        }

        return null;
    }

    /**
     * Démarre (ou redémarre) un timer.
     * @param {string|number} tournamentId
     * @param {number} durationMs
     */
    async startTimer(tournamentId, durationMs) {
        const state = {
            tournamentId: String(tournamentId),
            status: 'RUNNING',
            remainingMs: durationMs,
            lastTickAt: Date.now(),
            version: 1
        };

        const key = `timer:${tournamentId}`;

        await valkey.set(key, JSON.stringify(state));
        await valkey.sadd('active_timers', tournamentId);

        await TimerRepository.saveSnapshot(state);

        console.log(`⏱️ Timer started for ${tournamentId} (${durationMs}ms)`);
        await this._publishUpdate(tournamentId, state);

        return state;
    }

    /**
     * Met le timer en pause.
     * @param {string|number} tournamentId
     * @returns {Promise<object>} Le nouvel état.
     */
    async pause(tournamentId) {
        const lockKey = `timer:lock:${tournamentId}`;
        const lock = await redlock.acquire([lockKey], 1000);

        try {
            const state = await this._getState(tournamentId);

            if (!state) throw new Error('TIMER_NOT_FOUND');
            if (state.status !== 'RUNNING') return state;

            const now = Date.now();
            const elapsed = now - state.lastTickAt;

            state.remainingMs = Math.max(0, state.remainingMs - elapsed);
            state.status = 'PAUSED';
            state.lastTickAt = null;

            await valkey.set(`timer:${tournamentId}`, JSON.stringify(state));
            await TimerRepository.saveSnapshot(state);

            console.log(`⏸️ Timer paused for ${tournamentId}`);
            await this._publishUpdate(tournamentId, state);

            return state;
        } finally {
            await lock.release();
        }
    }

    /**
     * Relance le timer.
     * @param {string|number} tournamentId
     * @returns {Promise<object>} Le nouvel état.
     */
    async resume(tournamentId) {
        const lockKey = `timer:lock:${tournamentId}`;
        const lock = await redlock.acquire([lockKey], 1000);

        try {
            const state = await this._getState(tournamentId);

            if (!state) throw new Error('TIMER_NOT_FOUND');
            if (state.status !== 'PAUSED') return state;

            state.status = 'RUNNING';
            state.lastTickAt = Date.now();

            await valkey.set(`timer:${tournamentId}`, JSON.stringify(state));
            await TimerRepository.saveSnapshot(state);

            console.log(`▶️ Timer resumed for ${tournamentId}`);
            await this._publishUpdate(tournamentId, state);

            return state;
        } finally {
            await lock.release();
        }
    }

    /**
     * Arrete le timer.
     * @param {string|number} tournamentId
     * @returns {Promise<object>} Le nouvel état.
     */
    async stopTimer(tournamentId) {
        const lockKey = `timer:lock:${tournamentId}`;
        const lock = await redlock.acquire([lockKey], 1000);

        try {
            const state = await this._getState(tournamentId);

            if (!state) throw new Error('TIMER_NOT_FOUND');
            if (state.status !== 'RUNNING') return state;

            state.status = 'FINISHED';
            state.lastTickAt = Date.now();

            await valkey.set(`timer:${tournamentId}`, JSON.stringify(state));
            await TimerRepository.saveSnapshot(state);

            console.log(`▶️ Timer finished for ${tournamentId}`);
            await this._publishUpdate(tournamentId, state);

            return state;
        } finally {
            await lock.release();
        }
    }

    /**
     * Publie l'événement de mise à jour sur Redis Pub/Sub.
     * @private
     */
    async _publishUpdate(tournamentId, state) {
        const eventPayload = new TimerUpdatePayload({
            tournamentId: tournamentId,
            remainingMs: state.remainingMs,
            status: state.status
        });

        const message = {
            type: 'timer_update',
            ...eventPayload
        };

        await pubSubClient.publish('timer.events', JSON.stringify(message));
    }
}

module.exports = new TimerUseCases();