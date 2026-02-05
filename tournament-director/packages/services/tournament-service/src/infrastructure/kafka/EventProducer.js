const KafkaCommon = require('common-kafka');
const {
    PlayerRegisteredPayload,
    TimerStartPayload,
    EventPlayerAddPayload,
    EventPlayerEliminatePayload
} = require('common-types');

const TOPIC = process.env.KAFKA_TOPIC_TOURNAMENT || 'tournament-events';

module.exports = {
    connect: async () => await KafkaCommon.initProducer('tournament-service'),

    publishCreated: async (t) => {
        await KafkaCommon.publish(TOPIC, 'tournament.created', t.id, t);
    },

    publishTimerStart: async (tournamentId, durationMs) => {
        const payload = new TimerStartPayload({ tournamentId, durationMs });
        await KafkaCommon.publish(TOPIC, 'timer_start', tournamentId, payload);
    },

    publishTimerRestart: async (tournamentId, newDurationMs) => {
        const payload = new TimerStartPayload({ tournamentId, durationMs: newDurationMs });
        await KafkaCommon.publish(TOPIC, 'event_timer_restart', tournamentId, payload);
    },

    publishPlayerRegistered: async (tournamentId, playerId, username) => {
        const payload = new PlayerRegisteredPayload({
            playerId,
            tournamentId,
            username
        });

        console.log(`📤 Sending Request: Add Player ${playerId} to Tournament ${tournamentId}`);
        await KafkaCommon.publish(TOPIC, 'player.registered', tournamentId, payload);
    },

    publishPlayerAdd: async (tournamentId, username) => {
        const payload = new EventPlayerAddPayload({ tournamentId, username });
        console.log('Publishing Player Add Event')
        await KafkaCommon.publish(TOPIC, 'event_player_add', tournamentId, payload);
    },

    publishPlayerEliminate: async (tournamentId, playerId) => {
        const payload = new EventPlayerEliminatePayload({ tournamentId, playerId });
        console.log(`📤 [Tournament] -> event_player_eliminate (Player ${playerId})`);
        await KafkaCommon.publish(TOPIC, 'event_player_eliminate', tournamentId, payload);
    }
};