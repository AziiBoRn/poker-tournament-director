const { Tournament } = require('common-types');
const TournamentModel = require('./TournamentModel');
const valkey = require('common-valkey');

const CACHE_TTL = 3600;
const KEY_PREFIX = 'tournament:';
const LIST_KEY = 'tournaments:all';

class TournamentRepository {

    /** @param {object} row @returns {Tournament} */
    toDomain(row) {
        if (!row) return null;
        const data = typeof row.toJSON === 'function' ? row.toJSON() : row;

        return new Tournament({
            id: data.id,
            name: data.name,
            status: data.status,
            currentLevel: data.currentLevel,
            createdAt: data.createdAt,
            levelDuration: data.levelDuration
        });
    }

    /** * Read-through cache strategy.
     * @param {number} id
     * @returns {Promise<Tournament|null>}
     */
    async findById(id) {
        const key = `${KEY_PREFIX}${id}`;

        const cached = await valkey.get(key);
        if (cached) return this.toDomain(JSON.parse(cached));

        const row = await TournamentModel.findByPk(id);
        if (!row) return null;

        const domainObj = this.toDomain(row);
        await valkey.set(key, JSON.stringify(domainObj), 'EX', CACHE_TTL);

        return domainObj;
    }

    /** @returns {Promise<Tournament[]>} */
    async findAll() {
        const cached = await valkey.get(LIST_KEY);
        if (cached) return JSON.parse(cached).map(i => this.toDomain(i));

        const rows = await TournamentModel.findAll({ order: [['createdAt', 'DESC']] });
        const list = rows.map(r => this.toDomain(r));

        await valkey.set(LIST_KEY, JSON.stringify(list), 'EX', 60);
        return list;
    }

    /** * Write-through cache strategy (Invalidate).
     * @param {Tournament} t
     * @returns {Promise<Tournament>}
     */
    async save(t) {
        const data = {
            name: t.name,
            status: t.status,
            currentLevel: t.currentLevel,
            levelDuration: t.levelDuration
        };

        let saved;
        if (t.id) {
            await TournamentModel.update(data, { where: { id: t.id } });
            saved = await TournamentModel.findByPk(t.id);
            await valkey.del(`${KEY_PREFIX}${t.id}`);
        } else {
            saved = await TournamentModel.create(data);
        }

        await valkey.del(LIST_KEY);
        return this.toDomain(saved);
    }
}

module.exports = TournamentRepository;