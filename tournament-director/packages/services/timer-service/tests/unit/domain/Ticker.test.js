import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Timer Service: Ticker Logic", () => {
    let mocks;
    let processTick;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(100000);

        mocks = {
            valkey: {
                get: vi.fn(),
                set: vi.fn(),
                smembers: vi.fn(),
                srem: vi.fn(),
                del: vi.fn(),
            },
            pubSubClient: {
                publish: vi.fn(),
            },
            redlock: {
                acquire: vi.fn().mockResolvedValue({ release: vi.fn() }),
            },
            TimerRepository: {
                saveSnapshot: vi.fn().mockResolvedValue(true),
            },
        };

        const { createTicker } = require("../../../src/domain/Ticker");

        const ticker = createTicker({
            valkey: mocks.valkey,
            redlock: mocks.redlock,
            pubSubClient: mocks.pubSubClient,
            TimerRepository: mocks.TimerRepository,
            now: () => Date.now(),
            setIntervalFn: vi.fn(),
        });

        processTick = ticker.processTick;
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it("should NOT update Redis if timer is running normally (Read-Only Optimization)", async () => {
        const tournamentId = "1";

        const state = {
            status: "RUNNING",
            endTime: 105000,
            version: 1,
            lastTickAt: 99000,
        };
        mocks.valkey.get.mockResolvedValue(JSON.stringify(state));

        await processTick(tournamentId);

        expect(mocks.pubSubClient.publish).toHaveBeenCalledWith(
            "timer.events",
            expect.stringContaining('"remainingMs":5000')
        );
        expect(mocks.valkey.set).not.toHaveBeenCalled();
    });

    it("should finish timer and update Redis when time is up", async () => {
        const tournamentId = "2";

        const state = {
            status: "RUNNING",
            endTime: 90000,
            version: 1,
        };
        mocks.valkey.get.mockResolvedValue(JSON.stringify(state));

        await processTick(tournamentId);

        expect(mocks.pubSubClient.publish).toHaveBeenCalledWith(
            "timer.events",
            expect.stringContaining('"type":"timer_finished"')
        );

        expect(mocks.valkey.set).toHaveBeenCalled();
        const savedState = JSON.parse(mocks.valkey.set.mock.calls[0][1]);
        expect(savedState.status).toBe("FINISHED");

        expect(mocks.valkey.srem).toHaveBeenCalledWith("active_timers", tournamentId);
    });

    it("should do nothing if timer is PAUSED", async () => {
        const tournamentId = "3";
        const state = { status: "PAUSED", remainingMs: 5000 };
        mocks.valkey.get.mockResolvedValue(JSON.stringify(state));

        await processTick(tournamentId);

        expect(mocks.pubSubClient.publish).not.toHaveBeenCalled();
        expect(mocks.valkey.set).not.toHaveBeenCalled();
    });
});
