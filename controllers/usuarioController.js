const { Usuario } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
    try {
        const { search } = req.query;
        let where = {};
        if (search) {
            where = {
                [Op.or]: [
                    { nombre: { [Op.like]: `%${search}%` } },
                    { email: { [Op.like]: `%${search}%` } },
                    { rol: { [Op.like]: `%${search}%` } }
                ]
            };
        }
        const usuarios = await Usuario.findAll({
            where,
            attributes: { exclude: ['password'] },
            order: [['id', 'ASC']]
        });
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { nombre, email, password, rol, estado } = req.body;
        const nuevo = await Usuario.create({
            nombre,
            email,
            password: password || '123456',
            rol: rol || 'Almacenero',
            estado: estado !== undefined ? estado : true
        });
        const resp = nuevo.toJSON();
        delete resp.password;
        res.status(201).json(resp);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
        const { nombre, email, password, rol, estado } = req.body;
        const updateData = {};
        if (nombre !== undefined) updateData.nombre = nombre;
        if (email !== undefined) updateData.email = email;
        if (password) updateData.password = password;
        if (rol !== undefined) updateData.rol = rol;
        if (estado !== undefined) updateData.estado = estado;
        await usuario.update(updateData);
        const resp = usuario.toJSON();
        delete resp.password;
        res.json(resp);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.toggleEstado = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
        await usuario.update({ estado: !usuario.estado });
        res.json({ message: 'Estado actualizado', estado: usuario.estado });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
        await usuario.destroy();
        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
