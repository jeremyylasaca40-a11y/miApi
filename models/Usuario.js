const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcryptjs');

const Usuario = sequelize.define('Usuario', {
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    rol: {
        type: DataTypes.ENUM('Administrador', 'Almacenero', 'Supervisor'),
        defaultValue: 'Almacenero'
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'usuarios',
    timestamps: true,
    hooks: {
        beforeSave: async (usuario) => {
            if (usuario.changed('password')) {
                // Si la contraseña no está ya hasheada con bcrypt
                if (!usuario.password.startsWith('$2a$') && !usuario.password.startsWith('$2b$')) {
                    usuario.password = await bcrypt.hash(usuario.password, 10);
                }
            }
        }
    }
});

// Método para verificar contraseña
Usuario.prototype.validPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = Usuario;
