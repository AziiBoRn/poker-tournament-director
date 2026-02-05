const valkey = require('common-valkey');
const Redlock = require('redlock').default;

/**
 * Client Redis dédié à la publication d'événements (Pub/Sub).
 * Nécessite une connexion distincte car une connexion en mode "Subscribe"
 * ne peut pas émettre d'autres commandes.
 */
const pubSubClient = valkey.duplicate();

/**
 * Gestionnaire de verrous distribués.
 * @type {Redlock}
 */
const redlock = new Redlock(
    [valkey],
    {
        driftFactor: 0.01,
        retryCount: 0,
        retryDelay: 200,
        retryJitter: 200
    }
);

module.exports = {
    valkey,
    pubSubClient,
    redlock
};