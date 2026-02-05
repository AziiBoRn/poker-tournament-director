const { Tournament } = require('common-types');

/**
 * Calcule les blinds pour un niveau donné.
 * Formule : Small Blind = 25 * 2^(level-1)
 */
function calculateBlinds(level, durationMs) {
    const safeLevel = Math.max(1, level);
    const smallBlind = 25 * Math.pow(2, safeLevel - 1);

    return {
        level: safeLevel,
        small: smallBlind,
        big: smallBlind * 2,
        duration: durationMs
    };
}

class CreateTournament {
    constructor(repo, producer) { this.repo = repo; this.producer = producer; }

    async execute({ name, levelDuration }) {
        const t = new Tournament({ name, levelDuration });
        const saved = await this.repo.save(t);
        await this.producer.publishCreated(saved);
        return saved;
    }
}

class GetTournament {
    constructor(repo) { this.repo = repo; }
    async execute(id) { return this.repo.findById(id); }
    async list() { return this.repo.findAll(); }
}

class GetTournamentBlind {
    constructor(repo) { this.repo = repo; }

    async execute(id) {
        const t = await this.repo.findById(id);
        if (!t) throw new Error('NOT_FOUND');

        return calculateBlinds(t.currentLevel, t.levelDuration);
    }
}

class StartTournament {
    constructor(repo, producer) { this.repo = repo; this.producer = producer; }

    async execute(id) {
        const t = await this.repo.findById(id);
        if (!t) throw new Error('NOT_FOUND');
        if (t.status !== 'OPEN_REGISTRATION') throw new Error('ALREADY_STARTED');

        t.status = 'RUNNING';
        t.currentLevel = 1;

        const saved = await this.repo.save(t);

        await this.producer.publishTimerStart(saved.id, saved.levelDuration);

        return saved;
    }
}

class NextLevelTournament {
    constructor(repo, producer) { this.repo = repo; this.producer = producer; }

    async execute(id) {
        const t = await this.repo.findById(id);
        if (!t) throw new Error('NOT_FOUND');
        if (t.status !== 'RUNNING') throw new Error('NOT_RUNNING');

        t.increaseLevel();

        const saved = await this.repo.save(t);

        await this.producer.publishTimerRestart(saved.id, saved.levelDuration);

        return saved;
    }
}

class AddPlayerToTournament {
    constructor(tournamentRepository, eventProducer) {
        this.tournamentRepository = tournamentRepository;
        this.eventProducer = eventProducer;
    }

    async execute(tournamentId, username) {
        const tournament = await this.tournamentRepository.findById(tournamentId);

        if (!tournament) throw new Error('NOT_FOUND');
        if (tournament.status !== 'OPEN_REGISTRATION') throw new Error('REGISTRATION_CLOSED');

        await this.eventProducer.publishPlayerAdd(
            tournament.id,
            username
        );

        return { success: true };
    }
}

class EliminatePlayerFromTournament {
    constructor(tournamentRepository, eventProducer) {
        this.tournamentRepository = tournamentRepository;
        this.eventProducer = eventProducer;
    }

    async execute(tournamentId, playerId) {
        const tournament = await this.tournamentRepository.findById(tournamentId);

        if (!tournament) throw new Error('NOT_FOUND');

        if (tournament.status === 'OPEN_REGISTRATION') throw new Error('TOURNAMENT_NOT_STARTED');

        await this.eventProducer.publishPlayerEliminate(
            tournament.id,
            playerId
        );

        return { success: true };
    }
}

class FinishTournament {
    constructor(tournamentRepository) {
        this.tournamentRepository = tournamentRepository;
    }

    async execute(tournamentId) {
        console.log(`🏁 Finishing Tournament #${tournamentId}...`);

        const tournament = await this.tournamentRepository.findById(tournamentId);

        if (!tournament) {
            console.error(`❌ Tournament ${tournamentId} not found.`);
            return;
        }

        tournament.status = 'FINISHED';

        await this.tournamentRepository.save(tournament);
        console.log(`✅ Tournament #${tournamentId} is now FINISHED.`);
    }
}

module.exports = {
    CreateTournament,
    GetTournament,
    StartTournament,
    NextLevelTournament,
    GetTournamentBlind,
    AddPlayerToTournament,
    EliminatePlayerFromTournament,
    FinishTournament
};