const { Kafka } = require('kafkajs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('kafkajs').Producer} */
let producer = null;

/** @type {import('kafkajs').Consumer} */
let consumer = null;

const createClient = (clientId) => {
    return new Kafka({
        clientId,
        brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
    });
};

module.exports = {
    /**
     * Initialise le singleton Producer.
     * @param {string} clientId
     */
    initProducer: async (clientId) => {
        const kafka = createClient(clientId);
        producer = kafka.producer();
        await producer.connect();
        console.log(`✅ [${clientId}] Kafka Producer connected`);
        return producer;
    },

    /**
     * Publie un message avec l'enveloppe standard.
     */
    publish: async (topic, eventType, key, payload, version = '1.0.0') => {
        if (!producer) throw new Error('Kafka Producer not initialized. Call initProducer() first.');

        const eventEnvelope = {
            eventId: uuidv4(),
            eventType,
            occurredAt: new Date().toISOString(),
            payload,
            version
        };

        await producer.send({
            topic,
            messages: [
                {
                    key: String(key),
                    value: JSON.stringify(eventEnvelope)
                }
            ]
        });

        console.log(`📤 Event sent: ${eventType} -> ${topic}`);
    },

    /**
     * Initialise le singleton Consumer pour un groupe donné.
     * @param {string} groupId - ID du groupe de consommateurs.
     */
    initConsumer: async (groupId) => {
        const kafka = createClient(groupId);
        consumer = kafka.consumer({ groupId });
        await consumer.connect();
        return consumer;
    },
    /**
     * Helper pour s'abonner rapidement à un topic
     */
    subscribe: async (clientId, groupId, topic, callback) => {
        const kafka = createClient(clientId);
        const consumer = kafka.consumer({ groupId });
        
        await consumer.connect();
        await consumer.subscribe({ topic, fromBeginning: true });
        
        console.log(`👂 [${clientId}] Listening on ${topic} (Group: ${groupId})`);

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    await callback({ topic, partition, message });
                } catch (e) {
                    console.error(`❌ Error processing message on ${topic}:`, e);
                }
            }
        });
    }
};