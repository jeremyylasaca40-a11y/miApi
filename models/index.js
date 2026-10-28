const sequelize = require('../config/db');
const Categoria = require('./Categoria');
const Proveedor = require('./Proveedor');
const Usuario = require('./Usuario');
const Producto = require('./Producto');
const Movimiento = require('./Movimiento');

// --- ASOCIACIONES (Llaves Foráneas) ---

// 1. Categoria 1:N Producto
Categoria.hasMany(Producto, { foreignKey: 'categoria_id', as: 'productos', onDelete: 'SET NULL' });
Producto.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria' });

// 2. Proveedor 1:N Producto
Proveedor.hasMany(Producto, { foreignKey: 'proveedor_id', as: 'productos', onDelete: 'SET NULL' });
Producto.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor' });

// 3. Producto 1:N Movimiento
Producto.hasMany(Movimiento, { foreignKey: 'producto_id', as: 'movimientos', onDelete: 'CASCADE' });
Movimiento.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

// 4. Usuario 1:N Movimiento
Usuario.hasMany(Movimiento, { foreignKey: 'usuario_id', as: 'movimientos', onDelete: 'SET NULL' });
Movimiento.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

module.exports = {
    sequelize,
    Categoria,
    Proveedor,
    Usuario,
    Producto,
    Movimiento
};
