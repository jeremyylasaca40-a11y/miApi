const { Proveedor, Producto } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
    try {
        const { search } = req.query;
        let where = {};
        if (search) {
            where = {
                [Op.or]: [
                    { razon_social: { [Op.like]: `%${search}%` } },
                    { contacto: { [Op.like]: `%${search}%` } },
                    { email: { [Op.like]: `%${search}%` } }
                ]
            };
        }
        const proveedores = await Proveedor.findAll({
            where,
            include: [{ model: Producto, as: 'productos', attributes: ['id'] }],
            order: [['id', 'ASC']]
        });
        const resultado = proveedores.map(p => {
            const json = p.toJSON();
            json.total_productos = json.productos ? json.productos.length : 0;
            return json;
        });
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const proveedor = await Proveedor.findByPk(req.params.id, {
            include: [{ model: Producto, as: 'productos' }]
        });
        if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });
        res.json(proveedor);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const nuevo = await Proveedor.create(req.body);
        res.status(201).json(nuevo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const proveedor = await Proveedor.findByPk(req.params.id);
        if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });
        await proveedor.update(req.body);
        res.json(proveedor);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const proveedor = await Proveedor.findByPk(req.params.id);
        if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });
        await proveedor.destroy();
        res.json({ message: 'Proveedor eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
