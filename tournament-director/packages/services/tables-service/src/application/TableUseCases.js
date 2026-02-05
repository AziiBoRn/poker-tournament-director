const MAX_PLAYERS_PER_TABLE = 9;

/**
 * Cas d'utilisation : Asseoir un joueur arrivant du Service Players.
 */
class SeatPlayer {
    /**
     * @param {import('../infrastructure/db/TableRepository')} repo
     * @param {import('../infrastructure/kafka/EventProducer')} producer
     * @param {RebalanceTables} rebalanceUC - Dépendance circulaire injectée
     */
    constructor(repo, producer, rebalanceUC) {
        this.repo = repo;
        this.producer = producer;
        this.rebalanceUC = rebalanceUC;
    }

    /**
     * Exécute la logique d'assignation.
     * 1. Upsert joueur local
     * 2. Trouve table dispo ou crée
     * 3. Assigne
     * 4. Publie Event
     * 5. Déclenche Equilibrage
     * * @param {number} playerId
     * @param playerId
     * @param {number} tournamentId
     * @param {string} username
     * @returns {Promise<import('../domain/Table')>} La table cible
     */
    async execute(playerId, tournamentId, username) {
        console.log(`🎯 SeatPlayer: P${playerId} -> T${tournamentId}`);

        await this.repo.upsertPlayer({ id: playerId, tournamentId, username });

        const tables = await this.repo.findAllByTournament(tournamentId);

        let availableTables = tables
            .filter(t => t.players.length < MAX_PLAYERS_PER_TABLE)
            .sort((a, b) => a.players.length - b.players.length);

        let targetTable;

        if (availableTables.length === 0) {
            console.log(`✨ Creating new table for T${tournamentId}`);
            targetTable = await this.repo.create(tournamentId);
        } else {
            targetTable = availableTables[0];
        }

        await this.repo.assignPlayerToTable(playerId, targetTable.id, tournamentId);

        if (this.producer) {
            await this.producer.publishPlayerSeated(playerId, targetTable.id, tournamentId);
        }

        if (this.rebalanceUC) {
            this.rebalanceUC.execute(tournamentId).catch(err => console.error("⚠️ Rebalance failed:", err));
        }

        return targetTable;
    }
}

/**
 * Cas d'utilisation : Retirer un joueur éliminé.
 */
class UnseatPlayer {
    /**
     * @param {import('../infrastructure/db/TableRepository')} repo
     * @param {import('../infrastructure/kafka/EventProducer')} producer
     * @param {RebalanceTables} rebalanceUC
     */
    constructor(repo, producer, rebalanceUC) {
        this.repo = repo;
        this.producer = producer;
        this.rebalanceUC = rebalanceUC;
    }

    /**
     * @param {number} playerId
     * @param {number} tournamentId
     */
    async execute(playerId, tournamentId) {
        console.log(`👋 UnseatPlayer: P${playerId} eliminated.`);

        await this.repo.removePlayerFromTable(playerId, tournamentId);

        if (this.rebalanceUC) {
            setTimeout(() => {
                this.rebalanceUC.execute(tournamentId).catch(err => console.error("⚠️ Rebalance failed:", err));
            }, 100);
        }
    }
}

/**
 * Cas d'utilisation : Algorithme d'équilibrage des tables.
 * Assure que la différence de joueurs entre les tables est <= 1.
 */
class RebalanceTables {
    /**
     * @param {import('../infrastructure/db/TableRepository')} repo
     * @param {import('../infrastructure/kafka/EventProducer')} producer
     */
    constructor(repo, producer) {
        this.repo = repo;
        this.producer = producer;
    }

    /**
     * Lance l'algorithme complet jusqu'à ce que ce soit équilibré.
     * @param {number} tournamentId
     */
    async execute(tournamentId) {
        let balanced = false;
        let safetyBreak = 0;

        while (!balanced && safetyBreak < 20) {
            balanced = await this.runSinglePass(tournamentId);
            safetyBreak++;
        }
        if (balanced && safetyBreak > 1) console.log(`⚖️ Balanced achieved in ${safetyBreak} passes.`);
    }

    /**
     * Exécute une seule passe de vérification/action.
     * @param {number} tournamentId
     * @returns {Promise<boolean>} True si équilibré, False si une modification a eu lieu
     */
    async runSinglePass(tournamentId) {
        const tables = await this.repo.findAllByTournament(tournamentId);
        if (tables.length <= 1) return true;

        const allPlayers = tables.flatMap(t => t.players);
        const totalPlayers = allPlayers.length;
        if (totalPlayers === 0) return true;

        const optimalTableCount = Math.ceil(totalPlayers / MAX_PLAYERS_PER_TABLE);
        const currentTableCount = tables.length;

        if (currentTableCount > optimalTableCount) {
            console.log(`📉 Reducing tables: ${currentTableCount} -> ${optimalTableCount}`);

            const sortedTables = tables.sort((a, b) => a.players.length - b.players.length);
            const tableToBreak = sortedTables[0];

            await this.repo.clearTableReferences(tableToBreak.id);

            for (const player of tableToBreak.players) {
                const currentStatus = await this.repo.findAllByTournament(tournamentId);
                const target = currentStatus
                    .filter(t => t.id !== tableToBreak.id)
                    .sort((a, b) => a.players.length - b.players.length)[0];

                if (target) {
                    await this.repo.assignPlayerToTable(player.id, target.id, tournamentId);
                    if (this.producer) {
                        await this.producer.publishPlayerMoved(player.id, tableToBreak.id, target.id, tournamentId);
                    }
                }
            }

            await this.repo.deleteTable(tableToBreak.id, tournamentId);
            if (this.producer) await this.producer.publishTableBroken(tableToBreak.id, tournamentId);

            return false;
        }

        const sortedTables = tables.sort((a, b) => a.players.length - b.players.length);
        const minTable = sortedTables[0];
        const maxTable = sortedTables[sortedTables.length - 1];

        if ((maxTable.players.length - minTable.players.length) > 1) {
            console.log(`⚖️ Balancing: T${maxTable.id}(${maxTable.players.length}) -> T${minTable.id}(${minTable.players.length})`);

            const playerToMove = maxTable.players[0];

            await this.repo.assignPlayerToTable(playerToMove.id, minTable.id, tournamentId);

            if (this.producer) {
                await this.producer.publishPlayerMoved(playerToMove.id, maxTable.id, minTable.id, tournamentId);
            }

            return false;
        }

        return true;
    }
}

module.exports = { SeatPlayer, UnseatPlayer, RebalanceTables };