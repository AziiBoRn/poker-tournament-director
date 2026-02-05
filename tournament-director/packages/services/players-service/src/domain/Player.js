/**
 * Représente un Joueur dans le domaine.
 */
class Player {
    /**
     * @param {object} data
     * @param {number|string} [data.id] - ID unique du joueur (optionnel à la création)
     * @param {string} data.username - Nom d'utilisateur
     * @param {string} [data.status] - 'REGISTERED', 'SEATED', 'ELIMINATED'
     * @param {number|string} [data.id_table] - ID de la table assignée
     * @param {number|string} data.id_tournament - ID du tournoi parent
     */
    constructor(data) {
        this.id = data.id;
        this.username = data.username;
        this.status = data.status || 'REGISTERED';
        this.id_table = data.id_table || null;
        this.id_tournament = data.id_tournament;
    }
}

module.exports = Player;