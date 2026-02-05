const KafkaCommon = require('common-kafka');

const TOPIC = process.env.KAFKA_TOPIC_TOURNAMENT || 'tournament-events';

module.exports = {
    /**
     * S'abonne au topic Tournoi pour écouter la victoire.
     * @param {object} finishUC - Instance de FinishTournament
     */
    subscribe: async (finishUC) => {
        const consumer = await KafkaCommon.initConsumer('tournament-service-group');

        console.log(`👂 [tournament-service] Listening to ${TOPIC}`);
        await consumer.subscribe({ topics: [TOPIC], fromBeginning: true });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const envelope = JSON.parse(message.value.toString());
                    const { eventType, payload } = envelope;

                    console.log(`📨 [Tournament] Received: ${eventType}`);

                    if (eventType === 'tournament_winner') {
                        console.log('🏆 Winner detected via Kafka. Closing tournament.');
                        await finishUC.execute(payload.tournamentId);
                    }

                } catch (err) {
                    console.error('❌ Error processing message in Tournament Service:', err);
                }
            }
        });
    }
};