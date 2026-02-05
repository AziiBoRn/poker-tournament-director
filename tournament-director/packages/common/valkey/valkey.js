const Redis = require('ioredis');

/**
 * Client ioredis (compatible Valkey).
 * Gère la reconnexion auto avec backoff linéaire plafonné.
 * @type {import('ioredis').Redis}
 */
const valkey = new Redis({
    host: 'localhost',
    port: 6379,
    /**
     * Stratégie de retry :
     * 1er échec: 50ms, 10ème échec: 500ms... Plafonné à 2000ms.
     * Évite le thundering herd sur le serveur Valkey au redémarrage.
     */
    retryStrategy: (times) => {
        return Math.min(times * 50, 2000);
    },
    showFriendlyErrorStack: true
});

valkey.on('connect', () => {
    console.log('✅ Connected to Valkey');
});

valkey.on('error', (err) => {
    console.error('❌ Valkey Error:', err);
});

module.exports = valkey;