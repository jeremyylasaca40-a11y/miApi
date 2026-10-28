const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Proveedor = sequelize.define('Proveedor', {
    razon_social: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    contacto: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    telefono: {
        type: DataTypes.STRING(30),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: { isEmail: true }
    }
}, {
    tableName: 'proveedores',
    timestamps: true
});

module.exports = Proveedor;
