CREATE DATABASE IF NOT EXISTS tournament;

USE tournament;

CREATE TABLE tournaments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status ENUM('OPEN_REGISTRATION', 'RUNNING', 'FINISHED') NOT NULL DEFAULT 'OPEN_REGISTRATION',
    currentLevel INT NOT NULL DEFAULT 1,
    levelDuration INT NOT NULL DEFAULT 60000,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE tables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_tournament INT,
    name VARCHAR(50),
    status ENUM('ACTIVE', 'BROKEN', 'CLOSED') DEFAULT 'ACTIVE',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tables_table FOREIGN KEY (id_tournament) REFERENCES tournaments(id)
);

CREATE TABLE players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    status ENUM('REGISTERED', 'SEATED', 'ELIMINATED') NOT NULL DEFAULT 'REGISTERED',
    id_table INT,
    id_tournament INT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_players_table FOREIGN KEY (id_table) REFERENCES tables(id),
    CONSTRAINT fk_players_tournament FOREIGN KEY (id_tournament) REFERENCES tournaments(id) ON DELETE CASCADE,
    CONSTRAINT unique_username_per_tournament UNIQUE (username, id_tournament)
);

CREATE TABLE timers (
    tournament_id INT PRIMARY KEY,
    status ENUM('RUNNING', 'PAUSED', 'FINISHED') NOT NULL DEFAULT 'PAUSED',
    remaining_ms BIGINT NOT NULL DEFAULT 0,
    last_tick_at BIGINT NULL,
    snapshot_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_timers_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
