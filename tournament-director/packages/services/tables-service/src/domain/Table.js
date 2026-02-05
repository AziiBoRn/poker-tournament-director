/**
 * @typedef {Object} PlayerEntity
 * @property {number} id
 * @property {string} username
 * @property {string} status - 'REGISTERED' | 'SEATED' | 'ELIMINATED'
 * @property {number|null} id_table
 * @property {number} id_tournament
 */

/**
 * Représente une Table de poker.
 */
class Table {
    /**
     * @param {object} data
     * @param {number} [data.id]
     * @param {number} data.id_tournament
     * @param {PlayerEntity[]} [data.players] - Liste des joueurs assis
     */
    constructor(data) {
        this.id = data.id;
        this.id_tournament = data.id_tournament;
        this.players = data.players || [];
    }
}

module.exports = Table;