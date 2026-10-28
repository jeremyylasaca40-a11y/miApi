const { Categoria, Producto, sequelize } = require('../models');
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
        const categorias = await Categoria.findAll({
            where,
            include: [{
                model: Producto,
                as: 'productos',
                attributes: ['id']
            }],
            order: [['id', 'ASC']]
        });
        const resultado = categorias.map(c => {
            const json = c.toJSON();
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
        const categoria = await Categoria.findByPk(req.params.id, {
            include: [{ model: Producto, as: 'productos' }]
        });
        if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });
        res.json(categoria);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        const nueva = await Categoria.create({ nombre, descripcion });
        res.status(201).json(nueva);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const categoria = await Categoria.findByPk(req.params.id);
        if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });
        await categoria.update(req.body);
        res.json(categoria);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const categoria = await Categoria.findByPk(req.params.id);
        if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });
        await categoria.destroy();
        res.json({ message: 'Categoría eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
