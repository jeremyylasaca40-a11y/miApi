require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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

// --- PROTECCIÓN CONTRA ATAQUES COMUNES ---

// 1. HELMET: Protege contra XSS y vulnerabilidades de cabecera HTTP
app.use(helmet());

// 2. CORS: Configuración restrictiva para el frontend en Vite
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. RATE LIMIT: Previene ataques de fuerza bruta y DoS por IP
const limitador = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Máximo 100 peticiones por IP en 15 minutos
    message: 'Demasiadas peticiones desde esta IP, por favor intente más tarde.'
});
app.use('/api/', limitador);

// 4. Parsear body a JSON (DEBE IR ANTES DE LAS RUTAS)
app.use(express.json());

// Ruta de estado / bienvenida
app.get('/', (req, res) => {
    res.json({
        mensaje: 'API SENATI - Sistema Administrativo de Inventario funcionando exitosamente',
        version: '2.2.0 (Con JWT, Bcrypt, Helmet, CORS y Rate-Limit)',
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