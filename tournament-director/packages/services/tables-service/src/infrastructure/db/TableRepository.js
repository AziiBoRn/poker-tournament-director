const TableModel = require('./TableModel');
const PlayerModel = require('./PlayerModel');
const valkey = require('common-valkey');
const Table = require('../../domain/Table');

const CACHE_TTL = 600;

/**
 * Repository gérant l'accès aux Tables et l'assignation des joueurs.
 * Implémente le pattern "Repository with Caching" via Valkey (Redis).
 */
class TableRepository {

    /**
     * Supprime le cache associé à un tournoi spécifique.
     * Doit être appelé après toute modification (écriture).
     * @private
     * @param {number|string} tournamentId
     * @returns {Promise<void>}
     */
    async invalidateCache(tournamentId) {
        if (!tournamentId) return;
        const key = `tournament:${tournamentId}:tables`;
        await valkey.del(key);
    }

    /**
     * Crée une nouvelle table vide pour un tournoi.
     * @param {number|string} tournamentId
     * @returns {Promise<Table>} La table créée
     */
    async create(tournamentId) {
        const row = await TableModel.create({ id_tournament: tournamentId });
        await this.invalidateCache(tournamentId);
        return new Table(row.toJSON());
    }

    /**
     * Trouve une table par son ID.
     * @param {number} id
     * @returns {Promise<Table|null>}
     */
    async findById(id) {
        const row = await TableModel.findByPk(id, { include: ['players'] });
        return row ? new Table(row.toJSON()) : null;
    }

    /**
     * Récupère toutes les tables d'un tournoi avec les joueurs assis.
     * Stratégie : Cache-First (Lecture Redis, fallback MySQL).
     * * @param {number|string} tournamentId
     * @returns {Promise<Table[]>} Liste des tables
     */
    async findAllByTournament(tournamentId) {
        const key = `tournament:${tournamentId}:tables`;

        const cached = await valkey.get(key);
        if (cached) {
            return JSON.parse(cached);
        }

        const rows = await TableModel.findAll({
            where: { id_tournament: tournamentId },
            include: [{
                model: PlayerModel,
                as: 'players',
                where: { status: 'SEATED' },
                required: false
            }],
            order: [['id', 'ASC']]
        });

        const tables = rows.map(r => new Table(r.toJSON()));

        await valkey.set(key, JSON.stringify(tables), 'EX', CACHE_TTL);

        return tables;
    }

    /**
     * Insère ou met à jour un joueur dans la base locale du service Tables.
     * Nécessaire pour garantir l'intégrité référentielle avant de l'asseoir.
     * @param {object} p
     * @param {number} p.id
     * @param {string} p.username
     * @param {number|string} p.tournamentId
     * @returns {Promise<void>}
     */
    async upsertPlayer({ id, username, tournamentId }) {
        await PlayerModel.upsert({
            id: id,
            username: username,
            id_tournament: tournamentId,
            status: 'REGISTERED'
        });
    }

    /**
     * Assigne un joueur à une table spécifique.
     * Met à jour le statut à 'SEATED'.
     * @param {number|string} playerId
     * @param {number|string} tableId
     * @param {number|string} tournamentId - Requis pour l'invalidation du cache
     * @returns {Promise<void>}
     */
    async assignPlayerToTable(playerId, tableId, tournamentId) {
        await PlayerModel.update(
            { id_table: tableId, status: 'SEATED' },
            { where: { id: playerId } }
        );
        await this.invalidateCache(tournamentId);
    }

    /**
     * Retire un joueur d'une table (Élimination).
     * @param {number|string} playerId
     * @param {number|string} tournamentId
     * @returns {Promise<void>}
     */
    async removePlayerFromTable(playerId, tournamentId) {
        await PlayerModel.update(
            { id_table: null, status: 'ELIMINATED' },
            { where: { id: playerId } }
        );
        await this.invalidateCache(tournamentId);
    }

    /**
     * Supprime physiquement une table.
     * @param {number|string} tableId
     * @param {number|string} tournamentId
     * @returns {Promise<void>}
     */
    async deleteTable(tableId, tournamentId) {
        await TableModel.destroy({ where: { id: tableId } });
        await this.invalidateCache(tournamentId);
    }

    /**
     * Retire tous les joueurs d'une table donnée (préparation à la suppression).
     * @param {number|string} tableId
     * @returns {Promise<void>}
     */
    async clearTableReferences(tableId) {
        await PlayerModel.update(
            { id_table: null },
            { where: { id_table: tableId } }
        );
    }
}

module.exports = TableRepository;