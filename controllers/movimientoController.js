const { Movimiento, Producto, Usuario, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
    try {
        const { search, tipo } = req.query;
        let where = {};
        if (tipo) {
            where.tipo_movimiento = tipo;
        }
        const movimientos = await Movimiento.findAll({
            where,
            include: [
                { model: Producto, as: 'producto', attributes: ['id', 'nombre', 'stock', 'precio'] },
                { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'rol'] }
            ],
            order: [['fecha_hora', 'DESC'], ['id', 'DESC']]
        });
        res.json(movimientos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const mov = await Movimiento.findByPk(req.params.id, {
            include: [
                { model: Producto, as: 'producto' },
                { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'rol'] }
            ]
        });
        if (!mov) return res.status(404).json({ error: 'Movimiento no encontrado' });
        res.json(mov);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Reto Técnico: Transacción en Sequelize.
 * Al registrar un movimiento (Entrada, Salida, Ajuste), se inserta en Movimientos
 * y simultáneamente se actualiza el stock en la tabla Productos dentro de una sola transacción atómica.
 */
exports.create = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { producto_id, usuario_id, tipo_movimiento, cantidad, fecha_hora, observaciones } = req.body;
        
        const cant = parseInt(cantidad, 10);
        if (isNaN(cant) || cant <= 0) {
            await t.rollback();
            return res.status(400).json({ error: 'La cantidad debe ser un número entero mayor a 0' });
        }

        const producto = await Producto.findByPk(producto_id, { transaction: t, lock: true });
        if (!producto) {
            await t.rollback();
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        let nuevoStock = producto.stock;
        if (tipo_movimiento === 'Entrada') {
            nuevoStock += cant;
        } else if (tipo_movimiento === 'Salida') {
            if (producto.stock < cant) {
                await t.rollback();
                return res.status(400).json({
                    error: `Stock insuficiente. Stock actual: ${producto.stock}, cantidad solicitada: ${cant}`
                });
            }
            nuevoStock -= cant;
        } else if (tipo_movimiento === 'Ajuste') {
            nuevoStock = cant;
        } else {
            await t.rollback();
            return res.status(400).json({ error: 'Tipo de movimiento inválido (Entrada, Salida, Ajuste)' });
        }

        // 1. Insertar el registro en Movimientos
        const nuevoMovimiento = await Movimiento.create({
            producto_id,
            usuario_id: usuario_id || null,
            tipo_movimiento,
            cantidad: cant,
            fecha_hora: fecha_hora || new Date(),
            observaciones: observaciones || ''
        }, { transaction: t });

        // 2. Actualizar simultáneamente el stock en Productos
        await producto.update({ stock: nuevoStock }, { transaction: t });

        // Confirmar la transacción
        await t.commit();

        // Devolver respuesta con relaciones cargadas
        const respuesta = await Movimiento.findByPk(nuevoMovimiento.id, {
            include: [
                { model: Producto, as: 'producto' },
                { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'rol'] }
            ]
        });

        res.status(201).json({
            message: 'Movimiento registrado y stock actualizado exitosamente',
            movimiento: respuesta,
            stock_anterior: producto.stock,
            nuevo_stock: nuevoStock
        });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};
