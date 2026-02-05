const Player = require('../../domain/Player');
const PlayerModel = require('./PlayerModel');
const valkey = require('common-valkey');
const { Op } = require('sequelize');

const CACHE_TTL = 3600;
const LIST_KEY = 'player:all';

/**
 * Repository gérant l'accès aux données Joueurs (MySQL + Redis Cache).
 */
class PlayerRepository {

    /**
     * Convertit un modèle Sequelize en entité de Domaine.
     * @param {object} row
     * @returns {Player|null}
     */
    toDomain(row) {
        if (!row) return null;
        const data = typeof row.toJSON === 'function' ? row.toJSON() : row;
        return new Player(data);
    }

    /**
     * Récupère un joueur par son ID (Strategy: Read-through Cache).
     * @param {number|string} id
     * @returns {Promise<Player|null>}
     */
    async findById(id) {
        const key = `player:${id}`;

        const cached = await valkey.get(key);
        if (cached) return this.toDomain(JSON.parse(cached));

        const row = await PlayerModel.findByPk(id);
        if (!row) return null;

        const domainObj = this.toDomain(row);
        await valkey.set(key, JSON.stringify(domainObj), 'EX', CACHE_TTL);

        return domainObj;
    }

    /**
     * Récupère tous les joueurs (Cache simple sur la liste).
     * @returns {Promise<Player[]>}
     */
    async findAll() {
        const cached = await valkey.get(LIST_KEY);
        if (cached) return JSON.parse(cached).map(i => this.toDomain(i));

        const rows = await PlayerModel.findAll({ order: [['createdAt', 'DESC']] });
        const list = rows.map(r => this.toDomain(r));

        await valkey.set(LIST_KEY, JSON.stringify(list), 'EX', 60);
        return list;
    }

    /**
     * Sauvegarde ou met à jour un joueur (Strategy: Write-through / Invalidate).
     * Gère l'upsert si l'ID est fourni.
     * @param {Player} player
     * @returns {Promise<Player>}
     */
    async save(player) {
        const data = {
            id: player.id, // Important pour l'upsert
            username: player.username,
            status: player.status,
            id_table: player.id_table,
            id_tournament: player.id_tournament
        };

        let savedRecord;

        if (player.id) {
            await PlayerModel.upsert(data);
            savedRecord = await PlayerModel.findByPk(player.id);
            await valkey.del(`player:${player.id}`);
        } else {
            savedRecord = await PlayerModel.create(data);
        }
        await valkey.del(LIST_KEY);

        return this.toDomain(savedRecord);
    }

    /**
     * Compte le nombre de joueurs NON éliminés dans un tournoi spécifique.
     * @param {string|number} tournamentId
     * @returns {Promise<number>}
     */
    async countActive(tournamentId) {
        return await PlayerModel.count({
            where: {
                id_tournament: tournamentId,
                status: { [Op.ne]: 'ELIMINATED' }
            }
        });
    }

    /**
     * Trouve le dernier survivant (ou le premier actif trouvé) d'un tournoi.
     * @param {string|number} tournamentId
     * @returns {Promise<Player|null>}
     */
    async findLastActive(tournamentId) {
        const row = await PlayerModel.findOne({
            where: {
                id_tournament: tournamentId,
                status: { [Op.ne]: 'ELIMINATED' }
            }
        });
        return this.toDomain(row);
    }
}

module.exports = PlayerRepository;