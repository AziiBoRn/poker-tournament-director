const KafkaCommon = require('common-kafka');

const TOPIC_TOURNAMENT = process.env.KAFKA_TOPIC_TOURNAMENT || 'tournament-events';

module.exports = {
    /**
     * S'abonne au topic Tournoi et délègue aux UseCases.
     * @param {object} createUC - Instance de CreatePlayer
     * @param {object} eliminateUC - Instance de EliminatePlayer
     */
    subscribe: async (createUC, eliminateUC) => {
        const consumer = await KafkaCommon.initConsumer('players-service-group');

        console.log(`👂 [players-service] Listening to ${TOPIC_TOURNAMENT}`);
        await consumer.subscribe({ topics: [TOPIC_TOURNAMENT], fromBeginning: true });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const envelope = JSON.parse(message.value.toString());
                const { eventType, payload } = envelope;

                console.log(`📨 [Players] Received: ${eventType}`);

                try {
                    if (eventType === 'event_player_add' || eventType === 'player.registered') {
                        console.log('Receiving event_player_add or player.registered. Delegating to CreatePlayer UC.')
                        await createUC.execute(payload);
                    }
                    else if (eventType === 'event_player_eliminate') {
                        await eliminateUC.execute(payload);
                    }
                } catch (err) {
                    console.error('❌ Error processing message in Players:', err);
                }
            }
        });
    }
};