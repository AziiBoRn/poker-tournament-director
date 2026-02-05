const z = require('zod');
const timerUseCases = require('../../application/TimerUseCases');
const { valkey } = require('../redis/RedisClient');

const connections = new Map();

/** @param {import('fastify').FastifyInstance} fastify */
async function timerRoutes(fastify) {

    const sub = valkey.duplicate({
        enableReadyCheck: false,
        maxRetriesPerRequest: null
    });

    sub.on('error', (err) => {
        console.error('⚠️ [WS-Bridge] Redis Subscriber Error:', err.message);
    });

    sub.subscribe('timer.events', (err) => {
        if (err) console.error('❌ Failed to subscribe:', err.message);
        else console.log('✅ [WS-Bridge] Subscribed to timer.events');
    });

    sub.on('message', (channel, message) => {
        try {
            const event = JSON.parse(message);
            const tournamentSockets = connections.get(String(event.tournamentId));

            if (tournamentSockets) {
                const payload = JSON.stringify({ type: 'TICK', payload: event });

                for (const s of tournamentSockets) {
                    if (s && s.readyState === 1) { // 1 = OPEN
                        s.send(payload);
                    }
                }
            }
        } catch (err) {
            console.error('❌ WebSocket Broadcast Error:', err.message);
        }
    });

    fastify.addHook('onClose', (instance, done) => {
        sub.disconnect();
        done();
    });

    fastify.withTypeProvider().post('/timers/:id/pause', {
        schema: { params: z.object({ id: z.coerce.string() }) }
    }, async (req) => {
        return await timerUseCases.pause(req.params.id);
    });

    fastify.withTypeProvider().post('/timers/:id/resume', {
        schema: { params: z.object({ id: z.coerce.string() }) }
    }, async (req) => {
        return await timerUseCases.resume(req.params.id);
    });

    fastify.withTypeProvider().get('/tournaments/:id/timer', {
        schema: { params: z.object({ id: z.coerce.number() }) }
    }, async (req, reply) => {
        const timer = await timerUseCases.getTimer(req.params.id);
        if (!timer) return reply.code(404).send({ error: 'Timer not found' });
        return timer;
    });

    fastify.get('/tournaments/:id/timer/ws', { websocket: true }, async (connection, req) => {
        const socket = connection.socket || connection;
        const tournamentId = String(req.params.id);

        if (!socket) {
            req.log.error('❌ ERREUR CRITIQUE: Socket undefined lors de la connexion WS');
            return;
        }

        if (!connections.has(tournamentId)) {
            connections.set(tournamentId, new Set());
        }

        connections.get(tournamentId).add(socket);

        try {
            const currentTimer = await timerUseCases.getTimer(tournamentId);
            if (currentTimer && socket.readyState === 1) {
                socket.send(JSON.stringify({ type: 'TICK', payload: currentTimer }));
            }
        } catch (err) {
            req.log.error(err);
        }

        socket.on('close', () => {
            const sockets = connections.get(tournamentId);
            if (sockets) {
                sockets.delete(socket);
                if (sockets.size === 0) {
                    connections.delete(tournamentId);
                }
            }
        });

        socket.on('error', (err) => {
            req.log.warn(`WS Error for tournament ${tournamentId}: ${err.message}`);
        });
    });
}

module.exports = timerRoutes;