const TimerModel = require('./TimerModel');

class TimerRepository {

    /**
     * Sauvegarde ou met à jour l'état du timer (Upsert).
     * @param {object} state - L'objet state JS { tournamentId, status, remainingMs... }
     */
    async saveSnapshot(state) {
        // Upsert génère: INSERT ... ON DUPLICATE KEY UPDATE
        await TimerModel.upsert({
            tournamentId: state.tournamentId,
            status: state.status,
            remainingMs: state.remainingMs,
            lastTickAt: state.lastTickAt || null,
            snapshotAt: new Date()
        });
    }

    /**
     * Récupère un timer depuis la BDD (Recovery).
     * @param {string|number} tournamentId
     * @returns {Promise<object|null>} State JS formaté ou null
     */
    async findSnapshot(tournamentId) {
        const row = await TimerModel.findByPk(tournamentId);

        if (!row) return null;

        return {
            tournamentId: row.tournamentId.toString(),
            status: row.status,
            remainingMs: parseInt(row.remainingMs, 10),
            lastTickAt: row.lastTickAt ? parseInt(row.lastTickAt, 10) : null,
            version: 0
        };
    }
}

module.exports = new TimerRepository();