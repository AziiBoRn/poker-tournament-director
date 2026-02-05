const { DataTypes } = require('sequelize');
const sequelize = require('common-mysql');

/** @type {import('sequelize').Model} */
const TournamentModel = sequelize.define('Tournament', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    status: {
        type: DataTypes.ENUM('OPEN_REGISTRATION', 'RUNNING', 'FINISHED'),
        defaultValue: 'OPEN_REGISTRATION'
    },
    currentLevel: { type: DataTypes.INTEGER, defaultValue: 1, allowNull: false },
    levelDuration: {
        type: DataTypes.INTEGER,
        defaultValue: 60000,
        allowNull: false
    }
}, {
    tableName: 'tournaments',
    timestamps: true,
    updatedAt: false
});

module.exports = TournamentModel;