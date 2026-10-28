const { Usuario } = require('../models');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Por favor ingresa tu correo y contraseña' });
        }

        const usuario = await Usuario.findOne({ where: { email } });
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales inválidas (usuario no encontrado)' });
        }

        if (!usuario.estado) {
            return res.status(403).json({ error: 'Esta cuenta de usuario ha sido desactivada por el administrador' });
        }

        const esValido = await usuario.validPassword(password);
        if (!esValido) {
            return res.status(401).json({ error: 'Contraseña incorrecta. Verifica tus datos' });
        }

        const userJson = usuario.toJSON();
        delete userJson.password;

        res.json({
            message: 'Autenticación exitosa',
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
            password, // se encriptará automáticamente con bcrypt en beforeSave
            rol: rol || 'Almacenero',
            estado: true
        });

        const resp = nuevo.toJSON();
        delete resp.password;

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            usuario: resp
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
