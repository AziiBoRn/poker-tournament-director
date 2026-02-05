const z = require('zod');
const PlayerRepository = require('../db/PlayerRepository');
const repo = new PlayerRepository();
const { GetPlayers } = require('../../application/PlayerUseCases');
const getUC = new GetPlayers(repo);

/** @param {import('fastify').FastifyInstance} fastify */
async function playerRoutes(fastify) {

    fastify.withTypeProvider().get('/tournaments/:id/players', {
        schema: {
            params: z.object({ id: z.coerce.number() })
        }
    }, async (req, reply) => {
        return await getUC.list(req.params.id);
    });
}

module.exports = playerRoutes;