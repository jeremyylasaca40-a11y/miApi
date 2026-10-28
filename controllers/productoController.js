const { Producto, Categoria, Proveedor } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
    try {
        const { search } = req.query;
        let where = {};
        if (search) {
            where = {
                [Op.or]: [
                    { nombre: { [Op.like]: `%${search}%` } },
                    { descripcion: { [Op.like]: `%${search}%` } }
                ]
            };
        }
        const productos = await Producto.findAll({
            where,
            include: [
                { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
                { model: Proveedor, as: 'proveedor', attributes: ['id', 'razon_social'] }
            ],
            order: [['id', 'DESC']]
        });
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const producto = await Producto.findByPk(req.params.id, {
            include: [
                { model: Categoria, as: 'categoria' },
                { model: Proveedor, as: 'proveedor' }
            ]
        });
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(producto);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock, stock_minimo, categoria_id, proveedor_id } = req.body;
        const nuevo = await Producto.create({
            nombre,
            descripcion,
            precio,
            stock: stock || 0,
            stock_minimo: stock_minimo || 5,
            categoria_id: categoria_id || null,
            proveedor_id: proveedor_id || null
        });
        const conRelaciones = await Producto.findByPk(nuevo.id, {
            include: [
                { model: Categoria, as: 'categoria' },
                { model: Proveedor, as: 'proveedor' }
            ]
        });
        res.status(201).json(conRelaciones);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const producto = await Producto.findByPk(req.params.id);
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
        await producto.update(req.body);
        const actualizado = await Producto.findByPk(producto.id, {
            include: [
                { model: Categoria, as: 'categoria' },
                { model: Proveedor, as: 'proveedor' }
            ]
        });
        res.json(actualizado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const producto = await Producto.findByPk(req.params.id);
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
        await producto.destroy();
        res.json({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
