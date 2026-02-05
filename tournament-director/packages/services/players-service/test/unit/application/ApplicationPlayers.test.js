import { describe, it, expect, vi, beforeEach } from 'vitest';
const { CreatePlayer, EliminatePlayer } = require('../../../src/application/PlayerUseCases');
const Player = require('../../../src/domain/Player');

describe('Player Service: Use Cases', () => {
    let mockRepo;
    let mockProducer;

    beforeEach(() => {
        mockRepo = {
            save: vi.fn(),
            findById: vi.fn(),
            findAll: vi.fn(),
            countActive: vi.fn(),
            findLastActive: vi.fn()
        };

        mockProducer = {
            publishTablesAdd: vi.fn(),
            publishTablesEliminate: vi.fn(),
            publishTournamentWinner: vi.fn()
        };
    });

    describe('CreatePlayer', () => {
        let useCase;

        beforeEach(() => {
            useCase = new CreatePlayer(mockRepo, mockProducer);
        });

        it('should create a player, save to DB and publish event', async () => {
            const input = { playerId: 1, tournamentId: 100, username: 'Phil Ivey' };

            const expectedPlayer = new Player({
                id: 1,
                username: 'Phil Ivey',
                id_tournament: 100,
                status: 'REGISTERED'
            });
            mockRepo.save.mockResolvedValue(expectedPlayer);

            const result = await useCase.execute(input);

            expect(result).toEqual(expectedPlayer);
            expect(mockRepo.save).toHaveBeenCalled();
            expect(mockProducer.publishTablesAdd).toHaveBeenCalledWith(100, 1, 'Phil Ivey');
        });
    });

    describe('EliminatePlayer', () => {
        let useCase;

        beforeEach(() => {
            useCase = new EliminatePlayer(mockRepo, mockProducer);
        });

        it('should eliminate existing player and publish event', async () => {
            const existingPlayer = new Player({ id: 2, username: 'Tom Dwan', id_tournament: 100, status: 'SEATED' });

            mockRepo.findById.mockResolvedValue(existingPlayer);
            mockRepo.save.mockImplementation(p => Promise.resolve(p));

            mockRepo.countActive.mockResolvedValue(5);

            await useCase.execute({ playerId: 2, tournamentId: 100 });

            const savedArg = mockRepo.save.mock.calls[0][0];
            expect(savedArg.status).toBe('ELIMINATED');
            expect(mockProducer.publishTablesEliminate).toHaveBeenCalledWith(100, 2);

            expect(mockRepo.countActive).toHaveBeenCalledWith(100);
        });

        it('should throw error if player is in another tournament', async () => {
            const spyPlayer = new Player({ id: 3, id_tournament: 999 });
            mockRepo.findById.mockResolvedValue(spyPlayer);

            await expect(useCase.execute({ playerId: 3, tournamentId: 100 }))
                .rejects.toThrow('INVALID_TOURNAMENT');

            expect(mockProducer.publishTablesEliminate).not.toHaveBeenCalled();
        });

        it('should return null if player does not exist', async () => {
            mockRepo.findById.mockResolvedValue(null);

            const result = await useCase.execute({ playerId: 99, tournamentId: 100 });

            expect(result).toBeNull();
            expect(mockProducer.publishTablesEliminate).not.toHaveBeenCalled();
        });
    });
});