const Player = require('../domain/Player');

/**
 * UseCase: Création d'un joueur (déclenché par le Tournoi).
 * Sauvegarde en BDD puis notifie le service Tables.
 */
class CreatePlayer {
    /**
     * @param {PlayerRepository} repo
     * @param {object} producer - EventProducer
     */
    constructor(repo, producer) {
        this.repo = repo;
        this.producer = producer;
    }

    /**
     * @param {object} payload
     * @param {string|number} payload.tournamentId
     * @param {string} payload.username
     * @returns {Promise<Player>}
     */
    async execute({  tournamentId, username }) {
        console.log(`👤 CreatePlayer: Processing ${username}`);

        const player = new Player({
            username,
            id_tournament: tournamentId,
            status: 'REGISTERED'
        });

        const savedPlayer = await this.repo.save(player);

        if (this.producer) {
            await this.producer.publishTablesAdd(tournamentId, savedPlayer.id, savedPlayer.username);
        }

        return savedPlayer;
    }
}

/**
 * UseCase: Élimination d'un joueur.
 * Met à jour le statut en BDD, notifie le service Tables, et vérifie la victoire.
 */
class EliminatePlayer {
    constructor(repo, producer) {
        this.repo = repo;
        this.producer = producer;
    }

    /**
     * @param {object} payload
     * @param {string|number} payload.playerId
     * @param {string|number} payload.tournamentId
     */
    async execute({ playerId, tournamentId }) {
        console.log(`💀 EliminatePlayer: Processing P${playerId}`);

        const player = await this.repo.findById(playerId);

        if (!player) {
            console.warn(`Player ${playerId} not found, cannot eliminate.`);
            return null;
        }

        if (String(player.id_tournament) !== String(tournamentId)) {
            throw new Error('INVALID_TOURNAMENT');
        }

        player.status = 'ELIMINATED';
        const savedPlayer = await this.repo.save(player);

        if (this.producer) {
            await this.producer.publishTablesEliminate(tournamentId, savedPlayer.id);
        }

        const activeCount = await this.repo.countActive(tournamentId);

        console.log(`ℹ️ Tournament ${tournamentId}: ${activeCount} player(s) remaining.`);

        if (activeCount === 1) {
            const winner = await this.repo.findLastActive(tournamentId);

            if (winner && this.producer) {
                console.log(`🏆 WINNER DETECTED: ${winner.username} (ID: ${winner.id})`);

                await this.producer.publishTournamentWinner({
                    tournamentId,
                    winnerId: winner.id,
                    username: winner.username
                });
            }
        }

        return savedPlayer;
    }
}

/**
 * UseCase: Lecture seule (Pour API ou Debug).
 */
class GetPlayers {
    constructor(repo) { this.repo = repo; }

    async list(tournamentId) {
        const all = await this.repo.findAll();
        if(tournamentId) {
            return all.filter(p => String(p.id_tournament) === String(tournamentId));
        }
        return all;
    }
}

module.exports = { CreatePlayer, EliminatePlayer, GetPlayers };