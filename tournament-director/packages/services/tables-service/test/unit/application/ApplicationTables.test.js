import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
const { SeatPlayer, UnseatPlayer, RebalanceTables } = require('../../../src/application/TableUseCases');
const Table = require('../../../src/domain/Table');

describe('Tables Service: Use Cases', () => {
    let mockRepo;
    let mockProducer;

    beforeEach(() => {
        mockRepo = {
            upsertPlayer: vi.fn(),
            findAllByTournament: vi.fn(),
            create: vi.fn(),
            assignPlayerToTable: vi.fn(),
            removePlayerFromTable: vi.fn(),
            deleteTable: vi.fn(),
            clearTableReferences: vi.fn()
        };

        mockProducer = {
            publishPlayerSeated: vi.fn(),
            publishPlayerMoved: vi.fn(),
            publishTableBroken: vi.fn()
        };
    });

    describe('SeatPlayer', () => {
        let useCase;
        let mockRebalance;

        beforeEach(() => {
            mockRebalance = { execute: vi.fn().mockResolvedValue() };
            useCase = new SeatPlayer(mockRepo, mockProducer, mockRebalance);
        });

        it('should seat player at existing table if space available', async () => {
            const table1 = new Table({ id: 1, id_tournament: 100, players: ['p1'] });
            mockRepo.findAllByTournament.mockResolvedValue([table1]);

            await useCase.execute(2, 100, 'NewGuy');

            expect(mockRepo.assignPlayerToTable).toHaveBeenCalledWith(2, 1, 100);
            expect(mockProducer.publishPlayerSeated).toHaveBeenCalledWith(2, 1, 100);
            expect(mockRebalance.execute).toHaveBeenCalledWith(100);
        });

        it('should create new table if all full', async () => {
            const fullTable = new Table({ id: 1, id_tournament: 100, players: new Array(10).fill('p') });
            mockRepo.findAllByTournament.mockResolvedValue([fullTable]);
            
            const newTable = new Table({ id: 2, id_tournament: 100 });
            mockRepo.create.mockResolvedValue(newTable);

            await useCase.execute(99, 100, 'OverflowGuy');

            expect(mockRepo.create).toHaveBeenCalledWith(100);
            expect(mockRepo.assignPlayerToTable).toHaveBeenCalledWith(99, 2, 100);
        });
    });

    describe('UnseatPlayer', () => {
        let useCase;
        let mockRebalance;

        beforeEach(() => {
            vi.useFakeTimers();
            mockRebalance = { execute: vi.fn().mockResolvedValue() };
            useCase = new UnseatPlayer(mockRepo, mockProducer, mockRebalance);
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should remove player and trigger rebalance after delay', async () => {
            await useCase.execute(5, 100);

            expect(mockRepo.removePlayerFromTable).toHaveBeenCalledWith(5, 100);
            expect(mockRebalance.execute).not.toHaveBeenCalled();

            vi.advanceTimersByTime(150);

            expect(mockRebalance.execute).toHaveBeenCalledWith(100);
        });
    });

    describe('RebalanceTables Logic', () => {
        let useCase;

        beforeEach(() => {
            useCase = new RebalanceTables(mockRepo, mockProducer);
        });

        it('should detect imbalance (7 vs 5) and move 1 player', async () => {
            const table1 = new Table({ 
                id: 1, id_tournament: 100, 
                players: new Array(7).fill(0).map((_, i) => ({ id: 10 + i }))
            });
            const table2 = new Table({ 
                id: 2, id_tournament: 100, 
                players: new Array(5).fill(0).map((_, i) => ({ id: 20 + i }))
            });

            mockRepo.findAllByTournament.mockResolvedValue([table1, table2]);

            const isBalanced = await useCase.runSinglePass(100);

            expect(isBalanced).toBe(false); 
            expect(mockRepo.assignPlayerToTable).toHaveBeenCalledWith(10, 2, 100);
            expect(mockProducer.publishPlayerMoved).toHaveBeenCalledWith(10, 1, 2, 100);
        });

        it('should return true if tables are already balanced (6 vs 6)', async () => {
            const table1 = new Table({ id: 1, players: new Array(6).fill({}) });
            const table2 = new Table({ id: 2, players: new Array(6).fill({}) });

            mockRepo.findAllByTournament.mockResolvedValue([table1, table2]);

            const isBalanced = await useCase.runSinglePass(100);

            expect(isBalanced).toBe(true);
            expect(mockRepo.assignPlayerToTable).not.toHaveBeenCalled();
        });

        it('should break a table if population is too low (Reduce Tables)', async () => {
            const table1 = new Table({ id: 1, players: [{id: 10}, {id: 11}] });
            const table2 = new Table({ id: 2, players: [{id: 20}] });

            mockRepo.findAllByTournament.mockResolvedValue([table1, table2]);

            const isBalanced = await useCase.runSinglePass(100);

            expect(isBalanced).toBe(false);
            expect(mockRepo.clearTableReferences).toHaveBeenCalledWith(2);
            expect(mockRepo.assignPlayerToTable).toHaveBeenCalledWith(20, 1, 100);
            expect(mockRepo.deleteTable).toHaveBeenCalledWith(2, 100);
            expect(mockProducer.publishTableBroken).toHaveBeenCalledWith(2, 100);
        });
    });
});