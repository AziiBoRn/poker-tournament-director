const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });
const Fastify = require('fastify');
const { serializerCompiler, validatorCompiler } = require('fastify-type-provider-zod');
const tournamentRoutes = require('./infrastructure/http/tournament.routes');
const sequelize = require('common-mysql');
const KafkaProducer = require('./infrastructure/kafka/EventProducer');
const { FinishTournament } = require('./application/TournamentUseCases');
const EventConsumer = require('./infrastructure/kafka/EventConsumer');
const TournamentRepository = require('./infrastructure/db/TournamentRepository');

const app = Fastify({ logger: true });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(tournamentRoutes);

const start = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL Connected');

        await KafkaProducer.connect();

        const repo = new TournamentRepository();

        const finishUC = new FinishTournament(repo);

        const startConsumer = async () => {
            try {
                await EventConsumer.subscribe(finishUC);
            } catch (err) {
                console.error('Failed to start Tournament Consumer', err);
            }
        };

        startConsumer();

        const address = await app.listen({
            port: Number(process.env.PORT_TOURNAMENT) || 3001,
            host: '0.0.0.0'
        });

        console.log(`🚀 Tournament Service running on ${address}`);

    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();