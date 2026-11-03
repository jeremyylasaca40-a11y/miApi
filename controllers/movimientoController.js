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


/**
 * Despacho Múltiple / Orden de Salida Atómica:
 * Procesa una lista de productos en una sola transacción atómica.
 * Si algún producto no cuenta con stock suficiente, se cancela toda la operación (rollback).
 */
exports.createMultiple = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { items, usuario_id, destinatario, guia_numero, observaciones } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            await t.rollback();
            return res.status(400).json({ error: 'Debes incluir al menos un producto en la orden de despacho' });
        }

        const fechaActual = new Date();
        const resumenItems = [];

        for (const item of items) {
            const cant = parseInt(item.cantidad, 10);
            if (isNaN(cant) || cant <= 0) {
                await t.rollback();
                return res.status(400).json({ error: `La cantidad solicitada para el producto ID ${item.producto_id} no es válida` });
            }

            const producto = await Producto.findByPk(item.producto_id, { transaction: t, lock: true });
            if (!producto) {
                await t.rollback();
                return res.status(404).json({ error: `Producto ID ${item.producto_id} no encontrado en catálogo` });
            }

            if (producto.stock < cant) {
                await t.rollback();
                return res.status(400).json({
                    error: `Stock insuficiente para "${producto.nombre}". Stock disponible: ${producto.stock} uds, solicitaste: ${cant} uds`
                });
            }

            const nuevoStock = producto.stock - cant;
            const obsFormateada = `[Guía: ${guia_numero || 'S/N'}] Destino: ${destinatario || 'General'} - ${observaciones || 'Despacho múltiple'}`;

            // Registrar movimiento de salida en Kardex
            await Movimiento.create({
                producto_id: producto.id,
                usuario_id: usuario_id || null,
                tipo_movimiento: 'Salida',
                cantidad: cant,
                fecha_hora: fechaActual,
                observaciones: obsFormateada
            }, { transaction: t });

            // Descontar stock
            await producto.update({ stock: nuevoStock }, { transaction: t });

            const stockMinimo = producto.stock_minimo || 5;
            const quedoCritico = nuevoStock <= stockMinimo;

            resumenItems.push({
                producto_id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                cantidad: cant,
                stock_anterior: producto.stock,
                nuevo_stock: nuevoStock,
                stock_minimo: stockMinimo,
                quedo_critico: quedoCritico,
                subtotal: (parseFloat(producto.precio) * cant).toFixed(2)
            });
        }

        await t.commit();

        res.status(201).json({
            message: 'Despacho registrado y stock descontado exitosamente',
            guia_numero: guia_numero || `GD-2026-${Date.now().toString().slice(-4)}`,
            fecha: fechaActual,
            destinatario: destinatario || 'General',
            observaciones: observaciones || '',
            items: resumenItems,
            articulos_criticos: resumenItems.filter(it => it.quedo_critico),
            total_items: resumenItems.reduce((acc, it) => acc + it.cantidad, 0),
            total_valor: resumenItems.reduce((acc, it) => acc + parseFloat(it.subtotal), 0).toFixed(2)
        });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

/**
 * Obtener Historial de Guías de Despacho Emitidas:
 * Recupera todas las salidas que cuentan con referencia de guía y las agrupa por número de guía.
 */
exports.getGuias = async (req, res) => {
    try {
        const movimientos = await Movimiento.findAll({
            where: {
                tipo_movimiento: 'Salida',
                observaciones: { [Op.like]: '%[Guía:%' }
            },
            include: [
                { model: Producto, as: 'producto' },
                { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'rol'] }
            ],
            order: [['fecha_hora', 'DESC'], ['id', 'DESC']]
        });

        const guiasMap = new Map();

        for (const mov of movimientos) {
            const matchGuia = mov.observaciones ? mov.observaciones.match(/\[Guía:\s*([^\]]+)\]/i) : null;
            const guiaNumero = matchGuia ? matchGuia[1].trim() : `GD-00${mov.id}`;

            const matchDest = mov.observaciones ? mov.observaciones.match(/Destino:\s*([^-]+)/i) : null;
            const destinatario = matchDest ? matchDest[1].trim() : 'General';

            const matchObs = mov.observaciones ? mov.observaciones.split('-').slice(1).join('-').trim() : '';

            const precio = parseFloat(mov.producto?.precio || 0);
            const cant = parseInt(mov.cantidad, 10) || 1;
            const subtotal = (precio * cant).toFixed(2);

            if (!guiasMap.has(guiaNumero)) {
                guiasMap.set(guiaNumero, {
                    guia_numero: guiaNumero,
                    fecha: mov.fecha_hora,
                    despachador: mov.usuario?.nombre || 'Administrador',
                    destinatario,
                    observaciones: matchObs || mov.observaciones,
                    items: [],
                    total_items: 0,
                    total_valor: 0
                });
            }

            const guiaObj = guiasMap.get(guiaNumero);
            guiaObj.items.push({
                producto_id: mov.producto_id,
                nombre: mov.producto?.nombre || 'Producto eliminado',
                precio: precio.toFixed(2),
                cantidad: cant,
                subtotal
            });
            guiaObj.total_items += cant;
            guiaObj.total_valor = (parseFloat(guiaObj.total_valor) + parseFloat(subtotal)).toFixed(2);
        }

        const guiasList = Array.from(guiasMap.values());
        res.json(guiasList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
