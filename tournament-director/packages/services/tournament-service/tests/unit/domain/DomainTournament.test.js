import { describe, it, expect } from 'vitest';
const { Tournament } = require('common-types');

describe('Domain: Tournament Entity', () => {

    it('should initialize with default values', () => {
        const t = new Tournament({ name: 'Poker Night' });

        expect(t.name).toBe('Poker Night');
        expect(t.status).toBe('OPEN_REGISTRATION');
        expect(t.currentLevel).toBe(1);
        expect(t.levelDuration).toBe(1200000);
    });

    it('should initialize with custom duration', () => {
        const t = new Tournament({
            name: 'Turbo',
            levelDuration: 5000
        });

        expect(t.levelDuration).toBe(5000);
    });

    it('should increase level correctly', () => {
        const t = new Tournament({ name: 'Test', currentLevel: 1 });

        t.increaseLevel();
        expect(t.currentLevel).toBe(2);

        t.increaseLevel();
        expect(t.currentLevel).toBe(3);
    });

    it('should respect passed values in constructor', () => {
        const t = new Tournament({
            name: 'Old Tournament',
            status: 'FINISHED',
            currentLevel: 10,
            levelDuration: 60000
        });

        expect(t.status).toBe('FINISHED');
        expect(t.currentLevel).toBe(10);
        expect(t.levelDuration).toBe(60000);
    });
});