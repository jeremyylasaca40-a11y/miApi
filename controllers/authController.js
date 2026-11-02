const { Usuario } = require('../models');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Por favor ingresa tu correo y contraseña' });
        }

        const usuario = await Usuario.findOne({ where: { email } });
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        if (!usuario.estado) {
            return res.status(403).json({ error: 'Esta cuenta de usuario ha sido desactivada por el administrador' });
        }

        const esValido = await usuario.validPassword(password);
        if (!esValido) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Generar JWT
        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol },
            process.env.JWT_SECRET || '@senati2026@',
            { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
        );

        const userJson = usuario.toJSON();
        delete userJson.password;

        res.json({
            message: 'Inicio de sesión exitoso',
            token,
            usuario: userJson
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.register = async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Por favor completa todos los campos obligatorios' });
        }

        const existe = await Usuario.findOne({ where: { email } });
        if (existe) {
            return res.status(400).json({ error: 'Ya existe una cuenta con este correo institucional' });
        }

        const nuevo = await Usuario.create({
            nombre,
            email,
            password,
            rol: rol || 'Almacenero',
            estado: true
        });

        const token = jwt.sign(
            { id: nuevo.id, rol: nuevo.rol },
            process.env.JWT_SECRET || '@senati2026@',
            { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
        );

        const resp = nuevo.toJSON();
        delete resp.password;

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            usuario: resp,
            id: nuevo.id
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};