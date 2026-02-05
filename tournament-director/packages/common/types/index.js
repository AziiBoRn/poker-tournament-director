/**
 * Entité Tournoi partagée.
 */
class Tournament {
    constructor({ id, name, status, currentLevel, levelDuration, createdAt }) {
        this.id = id;
        this.name = name;
        this.status = status || 'OPEN_REGISTRATION';
        this.currentLevel = currentLevel || 1;
        this.levelDuration = levelDuration || 1200000;
        this.createdAt = createdAt;
    }

    increaseLevel() {
        this.currentLevel++;
    }
}

/** DTO Timer (Existants) */
class TimerStartPayload {
    constructor({ tournamentId, durationMs }) {
        this.tournamentId = String(tournamentId);
        this.durationMs = Number(durationMs);
    }
}

class TimerUpdatePayload {
    constructor({ tournamentId, remainingMs, status }) {
        this.tournamentId = String(tournamentId);
        this.remainingMs = Number(remainingMs);
        this.status = status;
    }
}

/**
 * Payload: Joueur inscrit via le Tournament Service.
 * Utilisation: 'player.registered'
 */
class PlayerRegisteredPayload {
    /**
     * @param {object} data
     * @param {string|number} data.playerId
     * @param {string|number} data.tournamentId
     * @param {string} data.username
     */
    constructor({ playerId, tournamentId, username }) {
        this.eventId = 'event_tables_add'; // Legacy compatibility si nécessaire
        this.playerId = String(playerId);
        this.tournamentId = String(tournamentId);
        this.username = username;
        this.timestamp = new Date();
    }
}

/**
 * Payload: Joueur éliminé -> Doit être levé de table.
 * Utilisation: 'player.eliminated'
 */
class PlayerEliminatedPayload {
    constructor({ playerId, tournamentId }) {
        this.eventId = 'event_tables_eliminate'; // Legacy compatibility
        this.playerId = String(playerId);
        this.tournamentId = String(tournamentId);
        this.timestamp = new Date();
    }
}

/**
 * Payload: Joueur assis à une table.
 * Utilisation: 'table.player_seated'
 */
class PlayerSeatedPayload {
    constructor({ playerId, tableId, tournamentId }) {
        this.eventId = 'player_seated';
        this.playerId = String(playerId);
        this.tableId = String(tableId);
        this.tournamentId = String(tournamentId);
        this.timestamp = new Date();
    }
}

/**
 * Payload: Joueur déplacé (équilibrage).
 * Utilisation: 'table.player_moved'
 */
class PlayerMovedPayload {
    constructor({ playerId, oldTableId, newTableId, tournamentId }) {
        this.eventId = 'player_moved';
        this.playerId = String(playerId);
        this.oldTableId = String(oldTableId);
        this.newTableId = String(newTableId);
        this.tournamentId = String(tournamentId);
        this.timestamp = new Date();
    }
}

/**
 * Payload: Table cassée (fermée).
 * Utilisation: 'table.broken'
 */
class TableBrokenPayload {
    constructor({ tableId, tournamentId }) {
        this.eventId = 'table_broken';
        this.tableId = String(tableId);
        this.tournamentId = String(tournamentId);
        this.timestamp = new Date();
    }
}

class EventPlayerAddPayload {
    constructor({ tournamentId, username }) {
        this.tournamentId = String(tournamentId);
        this.username = username;
    }
}

class EventPlayerEliminatePayload {
    constructor({ tournamentId, playerId }) {
        this.tournamentId = String(tournamentId);
        this.playerId = String(playerId);
    }
}

class EventTablesAddPayload {
    constructor({ tournamentId, playerId, username }) {
        this.tournamentId = String(tournamentId);
        this.playerId = String(playerId);
        this.username = username;
    }
}

class EventTablesEliminatePayload {
    constructor({ tournamentId, playerId }) {
        this.tournamentId = String(tournamentId);
        this.playerId = String(playerId);
    }
}

class TournamentWinnerPayload {
    constructor({ tournamentId, winnerId, username }) {
        this.eventId = 'tournament_winner';
        this.tournamentId = String(tournamentId);
        this.winnerId = String(winnerId);
        this.username = username;
        this.timestamp = new Date();
    }
}

module.exports = {
    Tournament,
    TimerStartPayload,
    TimerUpdatePayload,
    PlayerRegisteredPayload,
    PlayerEliminatedPayload,
    PlayerSeatedPayload,
    PlayerMovedPayload,
    TableBrokenPayload,
    EventPlayerAddPayload,
    EventPlayerEliminatePayload,
    EventTablesAddPayload,
    EventTablesEliminatePayload,
    TournamentWinnerPayload
};