require('dotenv').config();
const Fastify = require('fastify');
const WebSocket = require('ws');

const app = Fastify({ logger: true });

// Config URL
const TIMER_SERVICE_URL = process.env.TIMER_SERVICE_URL || 'http://127.0.0.1:3003';
const TIMER_WS_URL = TIMER_SERVICE_URL.replace('http', 'ws');

// 1. CORS (HTTP)
app.register(require('@fastify/cors'), {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
});

// 2. SOCKET.IO (WS Frontend)
app.register(require('fastify-socket.io'), {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// 3. ROUTES
app.register(require('./routes/tournaments'), { prefix: '/tournaments' }); // Note le préfixe ici !

// --- BRIDGE ---
const activeConnections = new Map();

function connectToTimerService(tournamentId) {
    if (activeConnections.has(tournamentId)) return;

    const roomId = `tournament:${tournamentId}`;
    const wsUrl = `${TIMER_WS_URL}/tournaments/${tournamentId}/timer/ws`;

    app.log.info(`🔄 [Bridge] Ouverture tunnel vers Timer Service (${wsUrl})`);

    const ws = new WebSocket(wsUrl);
    activeConnections.set(tournamentId, ws);

    ws.on('open', () => {
        app.log.info(`✅ [Bridge] Tunnel établi pour tournoi ${tournamentId}`);
    });

    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data.toString());
            // Relais vers le Front
            if (msg.type === 'TICK') {
                app.io.to(roomId).emit('timer:update', msg.payload);
            } else {
                app.io.to(roomId).emit(msg.type, msg.payload);
            }
        } catch (e) {
            app.log.error(`❌ [Bridge] Erreur JSON: ${e.message}`);
        }
    });

    ws.on('error', (e) => {
        app.log.warn(`⚠️ [Bridge] Erreur tunnel Timer (${tournamentId}): ${e.message}`);
    });

    ws.on('close', () => {
        activeConnections.delete(tournamentId);
        // Retry si des clients sont encore là
        const room = app.io.sockets.adapter.rooms.get(roomId);
        if (room && room.size > 0) {
            setTimeout(() => connectToTimerService(tournamentId), 3000);
        }
    });
}

app.ready(err => {
    if (err) throw err;

    app.io.on('connection', (socket) => {
        const { tournamentId } = socket.handshake.query;
        if (tournamentId) {
            const roomId = `tournament:${tournamentId}`;
            socket.join(roomId);
            app.log.info(`👤 [Front] Client connecté sur tournoi ${tournamentId} (Socket ID: ${socket.id})`);

            // Lance le pont vers le backend
            connectToTimerService(tournamentId);
        }
    });
});

app.listen({ port: process.env.PORT || 8080, host: '0.0.0.0' }, (err, address) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
    console.log(`🚀 API Gateway ready at ${address}`);
});