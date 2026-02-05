function createTicker(deps) {
    const {
        valkey,
        redlock,
        pubSubClient,
        TimerRepository,
        now = () => Date.now(),
        setIntervalFn = (fn, ms) => setInterval(fn, ms),
    } = deps;

    function startTicker() {
        setIntervalFn(tickAll, 1000);
    }

    async function tickAll() {
        const activeIds = await valkey.smembers("active_timers");

        await Promise.all(
            activeIds.map((id) =>
                processTick(id).catch((err) => {
                    if (err?.name !== "ExecutionError") console.error(`Tick error [${id}]:`, err);
                })
            )
        );
    }

    async function processTick(tournamentId) {
        const lockKey = `timer:lock:${tournamentId}`;
        const lock = await redlock.acquire([lockKey], 500);

        try {
            const key = `timer:${tournamentId}`;
            const raw = await valkey.get(key);
            if (!raw) return;

            const state = JSON.parse(raw);

            if (state.status === "RUNNING") {
                const current = now();
                let remaining = state.remainingMs;

                if (state.endTime) {
                    remaining = Math.max(0, state.endTime - current);
                } else if (state.lastTickAt) {
                    const elapsed = current - state.lastTickAt;
                    remaining = Math.max(0, state.remainingMs - elapsed);
                }

                // --- CAS 1 : LE TIMER TOURNE ENCORE ---
                if (remaining > 0) {
                    const payload = {
                        type: "timer_update",
                        tournamentId,
                        remainingMs: remaining,
                        status: "RUNNING",
                    };

                    await pubSubClient.publish("timer.events", JSON.stringify(payload));
                    return;
                }

                // --- CAS 2 : LE TIMER EST FINI ---
                state.status = "FINISHED";
                state.remainingMs = 0;
                state.lastTickAt = current;

                await valkey.set(key, JSON.stringify(state));

                await pubSubClient.publish(
                    "timer.events",
                    JSON.stringify({
                        type: "timer_finished",
                        tournamentId,
                    })
                );

                await valkey.srem("active_timers", tournamentId);

                TimerRepository.saveSnapshot(state).catch(console.error);
            }
        } finally {
            await lock.release();
        }
    }

    return { startTicker, tickAll, processTick };
}

/**
 * Export "prod" par défaut (comportement inchangé)
 */
function createProdTicker() {
    const { valkey, redlock, pubSubClient } = require("../infrastructure/redis/RedisClient");
    const TimerRepository = require("../infrastructure/db/TimerRepository");

    return createTicker({
        valkey,
        redlock,
        pubSubClient,
        TimerRepository,
        now: () => Date.now(),
        setIntervalFn: (fn, ms) => setInterval(fn, ms),
    });
}

module.exports = {
    ...createProdTicker(),
    createTicker,
};
