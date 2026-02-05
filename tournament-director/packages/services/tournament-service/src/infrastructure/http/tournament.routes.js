const z = require('zod');
const axios = require('axios');
const TournamentRepository = require('../db/TournamentRepository');
const EventProducer = require('../kafka/EventProducer');
const {
    CreateTournament,
    GetTournament,
    StartTournament,
    NextLevelTournament,
    GetTournamentBlind,
    AddPlayerToTournament,
    EliminatePlayerFromTournament
} = require('../../application/TournamentUseCases');

const repo = new TournamentRepository();
const createUC = new CreateTournament(repo, EventProducer);
const getUC = new GetTournament(repo);
const startUC = new StartTournament(repo, EventProducer);
const nextLevelUC = new NextLevelTournament(repo, EventProducer);
const getBlindUC = new GetTournamentBlind(repo);
const addPlayerUC = new AddPlayerToTournament(repo, EventProducer);
const eliminatePlayerUC = new EliminatePlayerFromTournament(repo, EventProducer);

const TIMER_SERVICE_URL = process.env.TIMER_SERVICE_URL || 'http://localhost:3003';

/** @param {import('fastify').FastifyInstance} fastify */
async function tournamentRoutes(fastify) {

    fastify.withTypeProvider().get('/tournaments', async () => await getUC.list());

    fastify.withTypeProvider().get('/tournaments/:id', {
        schema: { params: z.object({ id: z.coerce.number() }) }
    }, async (req, reply) => {
        const t = await getUC.execute(req.params.id);
        if (!t) return reply.code(404).send({ error: 'Tournament not found' });

        const tournamentData = t.toJSON ? t.toJSON() : { ...t };

        let blinds = { smallBlind: 50, bigBlind: 100, ante: 0 };

        try {
            const b = await getBlindUC.execute(req.params.id);
            if (b) {
                const cleanB = b.toJSON ? b.toJSON() : b;
                blinds = {
                    smallBlind: cleanB.smallBlind ?? cleanB.small ?? 50,
                    bigBlind: cleanB.bigBlind ?? cleanB.big ?? 100,
                    ante: cleanB.ante ?? 0
                };
            }
        } catch (e) {
            req.log.warn(`Blinds fetch failed: ${e.message}`);
        }

        try {
            const timerRes = await axios.get(`${TIMER_SERVICE_URL}/tournaments/${req.params.id}/timer`);
            if (timerRes.data.status === 'PAUSED') {
                blinds.smallBlind = 0;
                blinds.bigBlind = 0;
            }
        } catch (e) {
        }

        return {
            ...tournamentData,
            ...blinds
        };
    });

    fastify.withTypeProvider().post('/tournaments', {
        schema: {
            body: z.object({
                name: z.string().min(3),
                levelDuration: z.number().optional()
            }),
            response: { 201: z.object({ id: z.number() }) }
        }
    }, async (req, reply) => {
        const t = await createUC.execute(req.body);
        reply.code(201);
        return { id: t.id };
    });

    fastify.withTypeProvider().post('/tournaments/:id/start', {
        schema: { params: z.object({ id: z.coerce.number() }) }
    }, async (req, reply) => {
        try {
            const t = await startUC.execute(req.params.id);
            return { message: 'Tournament started', status: t.status };
        } catch (e) {
            if (e.message === 'NOT_FOUND') return reply.code(404).send();
            if (e.message === 'ALREADY_STARTED') return reply.code(400).send({ error: 'Tournament already started' });
            throw e;
        }
    });

    fastify.withTypeProvider().post('/tournaments/:id/next', {
        schema: { params: z.object({ id: z.coerce.number() }) }
    }, async (req, reply) => {
        try {
            const t = await nextLevelUC.execute(req.params.id);
            return { message: 'Level increased', currentLevel: t.currentLevel };
        } catch (e) {
            if (e.message === 'NOT_FOUND') return reply.code(404).send();
            if (e.message === 'NOT_RUNNING') return reply.code(400).send({ error: 'Tournament not running' });
            throw e;
        }
    });

    fastify.withTypeProvider().get('/tournaments/:id/blind', {
        schema: {
            params: z.object({ id: z.coerce.number() })
        }
    }, async (req, reply) => {
        try {
            const blindInfo = await getBlindUC.execute(req.params.id);

            const cleanBlind = blindInfo.toJSON ? blindInfo.toJSON() : blindInfo;

            const normalizedBlind = {
                ...cleanBlind,
                smallBlind: cleanBlind.smallBlind ?? cleanBlind.small,
                bigBlind: cleanBlind.bigBlind ?? cleanBlind.big
            };

            try {
                const timerRes = await axios.get(`${TIMER_SERVICE_URL}/timers/${req.params.id}`);

                if (timerRes.data.status === 'PAUSED') {
                    return {
                        ...normalizedBlind,
                        smallBlind: 0,
                        bigBlind: 0
                    };
                }
            } catch (timerError) {
                req.log.error(`Failed to reach Timer Service: ${timerError.message}`);
            }

            return blindInfo;

        } catch (e) {
            if (e.message === 'NOT_FOUND') return reply.code(404).send();
            throw e;
        }
    });

    fastify.withTypeProvider().post('/tournaments/:id/player', {
        schema: {
            params: z.object({ id: z.coerce.number() }),
            body: z.object({
                username: z.string().min(1)
            }),
            response: {
                201: z.object({ message: z.string() }),
                400: z.object({ error: z.string() }),
                404: z.object({ error: z.string() })
            }
        }
    }, async (req, reply) => {
        try {
            const { id } = req.params;
            const { username } = req.body;

            await addPlayerUC.execute(id, username);

            reply.code(201);
            return { message: 'Player registration request sent' };
        } catch (e) {
            if (e.message === 'NOT_FOUND') return reply.code(404).send({ error: 'Tournament not found' });
            if (e.message === 'REGISTRATION_CLOSED') return reply.code(400).send({ error: 'Registration is closed' });
            throw e;
        }
    });

    fastify.withTypeProvider().post('/tournaments/:id/players/:playerId/eliminate', {
        schema: {
            params: z.object({
                id: z.coerce.number(),
                playerId: z.coerce.number()
            }),
            response: {
                200: z.object({ message: z.string() }),
                400: z.object({ error: z.string() }),
                404: z.object({ error: z.string() })
            }
        }
    }, async (req, reply) => {
        try {
            const { id, playerId } = req.params;

            await eliminatePlayerUC.execute(id, playerId);

            return { message: 'Player elimination request sent' };
        } catch (e) {
            if (e.message === 'NOT_FOUND') return reply.code(404).send({ error: 'Tournament not found' });
            if (e.message === 'TOURNAMENT_NOT_STARTED') return reply.code(400).send({ error: 'Tournament has not started yet' });
            throw e;
        }
    });
}

module.exports = tournamentRoutes;