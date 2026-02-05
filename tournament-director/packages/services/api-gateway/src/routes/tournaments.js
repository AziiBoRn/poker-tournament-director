const { z } = require('zod');
const service = require('../services/tournament.service');

const createTournamentSchema = z.object({
    name: z.string().min(3),
    levelDuration: z.number().optional()
});
const addPlayerSchema = z.object({
    username: z.string().min(1)
});
const paramsIdSchema = z.object({ id: z.coerce.string() });
const paramsEliminateSchema = z.object({ id: z.coerce.string(), playerId: z.coerce.string() });

module.exports = async function (app) {
    app.setValidatorCompiler(({ schema }) => (data) => schema.parse(data));

    app.get('/', async () => {
        return service.list();
    });

    app.post('/', {
        schema: { body: createTournamentSchema }
    }, async (req, reply) => {
        const result = await service.create(req.body);
        reply.code(201);
        return result;
    });

    app.get('/:id', {
        schema: { params: paramsIdSchema }
    }, async (req, reply) => {
        try {
            return await service.get(req.params.id);
        } catch (err) {
            return reply.code(404).send({ error: err.message });
        }
    });

    app.post('/:id/player', {
        schema: { params: paramsIdSchema, body: addPlayerSchema }
    }, async (req, reply) => service.addPlayer(req.params.id, req.body));

    app.post('/:id/start', { schema: { params: paramsIdSchema } }, async (req) => service.start(req.params.id));

    app.post('/:id/players/:playerId/eliminate', { schema: { params: paramsEliminateSchema } }, async (req) => service.eliminatePlayer(req.params.id, req.params.playerId));

    app.post('/:id/next', { schema: { params: paramsIdSchema } }, async (req) => service.nextLevel(req.params.id));

    app.get('/:id/blind', { schema: { params: paramsIdSchema } }, async (req) => service.blind(req.params.id));

    app.get('/:id/tables', { schema: { params: paramsIdSchema } }, async (req) => service.getTables(req.params.id));

    app.get('/:id/timer', { schema: { params: paramsIdSchema } }, async (req) => service.getTimer(req.params.id));
    app.post('/:id/timer/pause', { schema: { params: paramsIdSchema } }, async (req) => service.pauseTimer(req.params.id));
    app.post('/:id/timer/resume', { schema: { params: paramsIdSchema } }, async (req) => service.resumeTimer(req.params.id));
};