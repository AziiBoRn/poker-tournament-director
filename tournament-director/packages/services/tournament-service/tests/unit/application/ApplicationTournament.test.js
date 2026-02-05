import { describe, it, expect, vi, beforeEach } from 'vitest';
const {
    NextLevelTournament,
    GetTournamentBlind,
    StartTournament,
    CreateTournament
} = require('../../../src/application/TournamentUseCases');
const { Tournament } = require('common-types');

describe('Application: Use Cases', () => {
    let mockRepo;
    let mockProducer;

    beforeEach(() => {
        mockRepo = {
            findById: vi.fn(),
            save: vi.fn()
        };

        mockProducer = {
            publishUpdated: vi.fn(),
            publishCreated: vi.fn(),
            publishTimerStart: vi.fn(),
            publishTimerRestart: vi.fn()
        };
    });

    // --- TEST 1: NEXT LEVEL (Correction de ton ancien test) ---
    describe('NextLevelTournament', () => {
        let useCase;

        beforeEach(() => {
            useCase = new NextLevelTournament(mockRepo, mockProducer);
        });

        it('should successfully increase level and publish timer restart', async () => {
            const existingTournament = new Tournament({
                id: 1,
                name: 'Test',
                currentLevel: 1,
                status: 'RUNNING',
                levelDuration: 60000
            });

            mockRepo.findById.mockResolvedValue(existingTournament);
            mockRepo.save.mockResolvedValue({ ...existingTournament, currentLevel: 2 });

            const result = await useCase.execute(1);

            expect(result.currentLevel).toBe(2);

            const savedArg = mockRepo.save.mock.calls[0][0];
            expect(savedArg.currentLevel).toBe(2);

            expect(mockProducer.publishTimerRestart).toHaveBeenCalledWith(1, 60000);
        });

        it('should throw error if tournament is not RUNNING', async () => {
            const pausedTournament = new Tournament({
                id: 1,
                name: 'Test',
                status: 'OPEN_REGISTRATION'
            });

            mockRepo.findById.mockResolvedValue(pausedTournament);

            await expect(useCase.execute(1)).rejects.toThrow('NOT_RUNNING');
            expect(mockRepo.save).not.toHaveBeenCalled();
        });
    });

    // --- TEST 2: GET BLINDS (Logique Mathématique) ---
    describe('GetTournamentBlind', () => {
        let useCase;

        beforeEach(() => {
            useCase = new GetTournamentBlind(mockRepo);
        });

        it('should calculate Level 1 blinds correctly (25/50)', async () => {
            const t = new Tournament({ id: 1, name: 'T', currentLevel: 1, levelDuration: 5000 });
            mockRepo.findById.mockResolvedValue(t);

            const result = await useCase.execute(1);

            expect(result).toEqual({
                level: 1,
                small: 25,
                big: 50,
                duration: 5000
            });
        });

        it('should calculate Level 2 blinds correctly (50/100)', async () => {
            const t = new Tournament({ id: 1, name: 'T', currentLevel: 2 });
            mockRepo.findById.mockResolvedValue(t);

            const result = await useCase.execute(1);
            expect(result.small).toBe(50);
            expect(result.big).toBe(100);
        });

        it('should calculate Level 5 blinds correctly (Progression exponentielle)', async () => {
            // Formule : 25 * 2^(5-1) = 25 * 16 = 400
            const t = new Tournament({ id: 1, name: 'T', currentLevel: 5 });
            mockRepo.findById.mockResolvedValue(t);

            const result = await useCase.execute(1);
            expect(result.small).toBe(400);
            expect(result.big).toBe(800);
        });
    });

    // --- TEST 3: START TOURNAMENT ---
    describe('StartTournament', () => {
        let useCase;

        beforeEach(() => {
            useCase = new StartTournament(mockRepo, mockProducer);
        });

        it('should start tournament and send duration to timer', async () => {
            const t = new Tournament({
                id: 1,
                name: 'Turbo',
                status: 'OPEN_REGISTRATION',
                levelDuration: 30000
            });

            mockRepo.findById.mockResolvedValue(t);
            mockRepo.save.mockImplementation(arg => Promise.resolve(arg)); // Mock save return

            await useCase.execute(1);

            const savedArg = mockRepo.save.mock.calls[0][0];
            expect(savedArg.status).toBe('RUNNING');
            expect(savedArg.currentLevel).toBe(1);

            expect(mockProducer.publishTimerStart).toHaveBeenCalledWith(1, 30000);
        });
    });

    // --- TEST 4: CREATE TOURNAMENT ---
    describe('CreateTournament', () => {
        let useCase;

        beforeEach(() => {
            useCase = new CreateTournament(mockRepo, mockProducer);
        });

        it('should create tournament with custom duration', async () => {
            mockRepo.save.mockImplementation(t => Promise.resolve({ ...t, id: 123 }));

            const result = await useCase.execute({ name: 'Speed', levelDuration: 10000 });

            expect(result.name).toBe('Speed');
            expect(result.levelDuration).toBe(10000);
            expect(mockProducer.publishCreated).toHaveBeenCalled();
        });
    });
});