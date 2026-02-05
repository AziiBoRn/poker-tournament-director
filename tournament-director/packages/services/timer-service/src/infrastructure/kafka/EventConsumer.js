const KafkaCommon = require('common-kafka');
const { TimerStartPayload } = require('common-types');
const TimerUseCases = require('../../application/TimerUseCases');

const TOPIC = process.env.KAFKA_TOPIC_TOURNAMENT || 'tournament-events';

module.exports = {
    connect: async () => {
        console.log('🔌 [timer-service] Connecting to Kafka...');

        const consumer = await KafkaCommon.initConsumer('timer-service-group');

        if (!consumer) {
            throw new Error('❌ Kafka Consumer is undefined! Verify common-kafka initialization.');
        }

        console.log(`👂 [timer-service] Subscribing to topic: ${TOPIC}`);

        await consumer.subscribe({ topics: [TOPIC], fromBeginning: true });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const value = message.value.toString();
                    console.log(`📨 [timer-service] Received: ${value}`);

                    const data = JSON.parse(value);
                    const { eventType, payload } = data;

                    switch (eventType) {
                        case 'timer_start':
                        case 'event_timer_restart':
                            console.log('⏱️ Processing START/RESTART event');
                            const event = new TimerStartPayload({
                                tournamentId: payload.tournamentId,
                                durationMs: payload.durationMs || payload.newDurationMs
                            });

                            await TimerUseCases.startTimer(event.tournamentId, event.durationMs);
                            break;

                        case 'tournament_winner':
                            console.log(`🏆 Tournament Finished event received for T#${payload.tournamentId}`);
                            await TimerUseCases.stopTimer(payload.tournamentId);
                            break;

                        default:
                            console.log(`ℹ️ Ignored event type: ${eventType}`);
                    }

                } catch (err) {
                    console.error('❌ Error processing Kafka message:', err);
                }
            },
        });

        console.log('✅ [timer-service] Kafka Consumer is RUNNING');
    }
};