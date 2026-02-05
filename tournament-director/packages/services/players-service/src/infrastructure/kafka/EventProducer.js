const KafkaCommon = require('common-kafka');
const { EventTablesAddPayload, EventTablesEliminatePayload, TournamentWinnerPayload } = require('common-types');

const TOPIC_PLAYERS = process.env.KAFKA_TOPIC_PLAYERS || 'players-events';
const TOPIC_TOURNAMENT = process.env.KAFKA_TOPIC_TOURNAMENT || 'tournament-events';

module.exports = {
    connect: async () => await KafkaCommon.initProducer('players-service'),

    /**
     * Notifie le service Tables qu'un joueur est prêt à être assis.
     */
    publishTablesAdd: async (tournamentId, playerId, username) => {
        const payload = new EventTablesAddPayload({ tournamentId, playerId, username });
        console.log(`📤 [Players] -> event_tables_add (Player ${playerId})`);
        await KafkaCommon.publish(TOPIC_PLAYERS, 'event_tables_add', String(playerId), payload);
    },

    /**
     * Notifie le service Tables qu'un joueur doit être retiré.
     */
    publishTablesEliminate: async (tournamentId, playerId) => {
        const payload = new EventTablesEliminatePayload({ tournamentId, playerId });
        console.log(`📤 [Players] -> event_tables_eliminate (Player ${playerId})`);
        await KafkaCommon.publish(TOPIC_PLAYERS, 'event_tables_eliminate', String(playerId), payload);
    },

    /**
     * Notifie qu'il y a un vainqueur (Tournoi terminé).
     */
    publishTournamentWinner: async ({ tournamentId, winnerId, username }) => {
        const payload = new TournamentWinnerPayload({ tournamentId, winnerId, username });

        console.log(`📤 [Players] -> tournament_winner (T: ${tournamentId}, Winner: ${username}) -> TOPIC: ${TOPIC_TOURNAMENT}`);

        await KafkaCommon.publish(TOPIC_TOURNAMENT, 'tournament_winner', String(tournamentId), payload);
    },
};