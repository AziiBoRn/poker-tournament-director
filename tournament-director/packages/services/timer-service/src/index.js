const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });
const Fastify = require('fastify');
const fastifyWebsocket = require('@fastify/websocket');
const { serializerCompiler, validatorCompiler } = require('fastify-type-provider-zod');

const timerRoutes = require('./infrastructure/http/timer.routes');
const { startTicker } = require('./domain/Ticker');
const EventConsumer = require('./infrastructure/kafka/EventConsumer');

const app = Fastify({ logger: true });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifyWebsocket);
app.register(timerRoutes);

/**
 * Bootstrap du service.
 */
const start = async () => {
    try {
        await EventConsumer.connect();
        console.log('✅ Kafka Consumer ready');

        startTicker();
        console.log('⏱️ Ticker loop running');

        const address = await app.listen({
            port: Number(process.env.PORT_TIMER) || 3003,
            host: '0.0.0.0'
        });
        console.log(`🚀 Timer Service listening on ${address}`);

    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();