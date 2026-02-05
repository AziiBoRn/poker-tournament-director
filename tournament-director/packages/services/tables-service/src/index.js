const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

const Fastify = require('fastify');
const { serializerCompiler, validatorCompiler } = require('fastify-type-provider-zod');
const sequelize = require('common-mysql');
const valkey = require('common-valkey');

const tableRoutes = require('./infrastructure/http/table.routes');
const EventConsumer = require('./infrastructure/kafka/EventConsumer');
const TableRepository = require('./infrastructure/db/TableRepository');
const { SeatPlayer, UnseatPlayer, RebalanceTables } = require('./application/TableUseCases');

const app = Fastify({ logger: true });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
app.register(tableRoutes);

const start = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL Connected (Tables Service)');

        if (valkey.status === 'ready' || valkey.status === 'connect') {
            console.log('✅ Redis/Valkey Connected (Tables Service)');
        }

        const repo = new TableRepository();

        const rebalanceUC = new RebalanceTables(repo, null);

        const seatUC = new SeatPlayer(repo, null, rebalanceUC);

        const unseatUC = new UnseatPlayer(repo, null, rebalanceUC);

        await EventConsumer.subscribe(seatUC, unseatUC);
        console.log('👂 Kafka Consumer Subscribed');

        const address = await app.listen({
            port: Number(process.env.PORT_TABLES) || 3004,
            host: '0.0.0.0'
        });
        console.log(`🚀 Tables Service running on ${address}`);

    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();