const KafkaCommon = require('common-kafka');

const TOPIC_PLAYERS = process.env.KAFKA_TOPIC_PLAYERS || 'players-events';

module.exports = {
    subscribe: async (seatUC, unseatUC) => {
        const consumer = await KafkaCommon.initConsumer('tables-service-group');

        console.log(`👂 [tables-service] Listening to ${TOPIC_PLAYERS}`);
        await consumer.subscribe({ topics: [TOPIC_PLAYERS], fromBeginning: true });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const envelope = JSON.parse(message.value.toString());
                const { eventType, payload } = envelope;

                console.log(`📨 [Tables] Received: ${eventType}`);

                try {
                    if (eventType === 'event_tables_add') {
                        await seatUC.execute(
                            payload.playerId,
                            payload.tournamentId,
                            payload.username
                        );
                    }
                    else if (eventType === 'event_tables_eliminate') {
                        await unseatUC.execute(
                            payload.playerId,
                            payload.tournamentId
                        );
                    }
                } catch (err) {
                    console.error('❌ Error in Tables Consumer:', err);
                }
            }
        });
    }
};