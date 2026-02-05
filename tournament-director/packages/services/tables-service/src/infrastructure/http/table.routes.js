const z = require('zod');
const TableRepository = require('../db/TableRepository');

const repo = new TableRepository();

/** * Définition des routes Fastify pour le module Tables.
 * @param {import('fastify').FastifyInstance} fastify
 */
async function tableRoutes(fastify) {

    fastify.withTypeProvider().get('/tournaments/:id/tables', {
        schema: {
            params: z.object({ id: z.coerce.number() }),
            response: {
                200: z.array(z.object({
                    id: z.number(),
                    id_tournament: z.number(),
                    players: z.array(z.any())
                }))
            }
        }
    }, async (req, reply) => {
        return await repo.findAllByTournament(req.params.id);
    });

    fastify.withTypeProvider().post('/tournaments/:id/tables', {
        schema: {
            params: z.object({ id: z.coerce.number() }),
            body: z.object({ count: z.number().min(1).default(1) })
        }
    }, async (req, reply) => {
        const { id } = req.params;
        const { count } = req.body;

        const created = [];
        for (let i = 0; i < count; i++) {
            created.push(await repo.create(id));
        }
        return { message: `${count} tables created`, tables: created };
    });
}

module.exports = tableRoutes;