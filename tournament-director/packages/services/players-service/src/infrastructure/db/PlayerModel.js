const { DataTypes } = require('sequelize');
const sequelize = require('common-mysql');
const TableModel = require('../../../../tables-service/src/infrastructure/db/TableModel');

const PlayerModel = sequelize.define('Player', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('REGISTERED', 'SEATED', 'ELIMINATED'),
        defaultValue: 'REGISTERED'
    },
    id_table: {
        type: DataTypes.INTEGER,
        references: { model: TableModel, key: 'id' }
    },
    id_tournament: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'players',
    timestamps: true,
    updatedAt: false,
    createdAt: 'createdAt'
});

TableModel.hasMany(PlayerModel, { foreignKey: 'id_table', as: 'players' });
PlayerModel.belongsTo(TableModel, { foreignKey: 'id_table' });

module.exports = PlayerModel;