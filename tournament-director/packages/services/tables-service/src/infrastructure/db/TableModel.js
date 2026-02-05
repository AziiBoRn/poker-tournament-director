const { DataTypes } = require('sequelize');
const sequelize = require('common-mysql');

const TableModel = sequelize.define('Table', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_tournament: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'tables',
    timestamps: true,
    updatedAt: false,
    createdAt: 'createdAt'
});

module.exports = TableModel;