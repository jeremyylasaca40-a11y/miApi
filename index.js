require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const seedDatabase = require('./seeders/seed');

// Importar Rutas Modulares
const authRoutes = require('./routes/authRoutes');
const productoRoutes = require('./routes/productoRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const proveedorRoutes = require('./routes/proveedorRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const movimientoRoutes = require('./routes/movimientoRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// Ruta de estado / bienvenida
app.get('/', (req, res) => {
    res.json({
        mensaje: 'API SENATI - Sistema Administrativo de Inventario funcionando exitosamente',
        version: '2.1.0 (Con Autenticación y Encriptación Bcrypt)',
        endpoints: [
            '/api/auth/login',
            '/api/dashboard/stats',
            '/api/productos',
            '/api/categorias',
            '/api/proveedores',
            '/api/usuarios',
            '/api/movimientos'
        ]
    });
});

// --- REGISTRO DE RUTAS ---
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);

app.use('/productos', productoRoutes);
app.use('/api/productos', productoRoutes);

app.use('/categorias', categoriaRoutes);
app.use('/api/categorias', categoriaRoutes);

app.use('/proveedores', proveedorRoutes);
app.use('/api/proveedores', proveedorRoutes);

app.use('/usuarios', usuarioRoutes);
app.use('/api/usuarios', usuarioRoutes);

app.use('/movimientos', movimientoRoutes);
app.use('/api/movimientos', movimientoRoutes);

app.use('/dashboard', dashboardRoutes);
app.use('/api/dashboard', dashboardRoutes);

// --- SINCRONIZACIÓN Y ARRANQUE ---
const PORT = process.env.PORT || 3006;

sequelize.sync({ alter: true })
    .then(async () => {
        console.log('✅ Base de datos conectada y modelos sincronizados con éxito.');
        await seedDatabase();
        app.listen(PORT, () => {
            console.log('🚀 Servidor backend corriendo en http://localhost:' + PORT);
        });
    })
    .catch(error => {
        console.error('❌ Error al conectar con la base de datos:', error);
    });
