const { DataTypes } = require('sequelize');
const sequelize = require('common-mysql');

/**
 * Modèle Sequelize pour la table 'timers'.
 * Gère la persistance long-terme et le recovery.
 */
const TimerModel = sequelize.define('Timer', {
    tournamentId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: 'tournament_id'
    },
    status: {
        type: DataTypes.ENUM('RUNNING', 'PAUSED', 'FINISHED'),
        allowNull: false,
        defaultValue: 'PAUSED'
    },
    remainingMs: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'remaining_ms'
    },
    lastTickAt: {
        type: DataTypes.BIGINT,
        allowNull: true,
        field: 'last_tick_at'
    },
    snapshotAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'snapshot_at'
    }
}, {
    tableName: 'timers',
    timestamps: false,
    underscored: true
});

module.exports = TimerModel;