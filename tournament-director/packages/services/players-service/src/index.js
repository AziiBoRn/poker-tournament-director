const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

const Fastify = require('fastify');
const { serializerCompiler, validatorCompiler } = require('fastify-type-provider-zod');
const sequelize = require('common-mysql');
const valkey = require('common-valkey');

const playerRoutes = require('./infrastructure/http/players.routes');
const KafkaConsumer = require('./infrastructure/kafka/EventConsumer');
const KafkaProducer = require('./infrastructure/kafka/EventProducer');
const PlayerRepository = require('./infrastructure/db/PlayerRepository');
const { CreatePlayer, EliminatePlayer, GetPlayers } = require('./application/PlayerUseCases');

const app = Fastify({ logger: true });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
app.register(playerRoutes);

const start = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL Connected (Players Service)');

        if (valkey.status === 'ready' || valkey.status === 'connect') {
            console.log('✅ Redis/Valkey Connected (Players Service)');
        }

        await KafkaProducer.connect();
        console.log('✅ Kafka Producer Connected');

        const repo = new PlayerRepository();

        const createUC = new CreatePlayer(repo, KafkaProducer);
        const eliminateUC = new EliminatePlayer(repo, KafkaProducer);
        const getUC = new GetPlayers(repo);

        await KafkaConsumer.subscribe(createUC, eliminateUC);
        console.log('👂 Kafka Consumer Subscribed');

        app.decorate('getUC', getUC);

        const address = await app.listen({
            port: Number(process.env.PORT_PLAYERS) || 3002,
            host: '0.0.0.0'
        });

        console.log(`🚀 Players Service running on ${address}`);

    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();