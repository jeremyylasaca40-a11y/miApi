const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Producto = sequelize.define('Producto', {
    nombre: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    stock: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    stock_minimo: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
        allowNull: false
    },
    categoria_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    proveedor_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'productos',
    timestamps: true
});

module.exports = Producto;
