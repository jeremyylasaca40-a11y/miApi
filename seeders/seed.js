const { Categoria, Proveedor, Usuario, Producto, Movimiento } = require('../models');

async function seedDatabase() {
    try {
        const catCount = await Categoria.count();
        if (catCount > 0) {
            console.log('✅ Base de datos ya contiene datos. Saltando seeder.');
            return;
        }

        console.log('🌱 Inicializando datos semilla recomendados por la guía SENATI...');

        // 1. Categorías
        const categorias = await Categoria.bulkCreate([
            { nombre: 'Periféricos', descripcion: 'Dispositivos de entrada y salida como mouse, teclados y auriculares' },
            { nombre: 'Laptops y PC', descripcion: 'Computadoras portátiles, de escritorio y todo en uno' },
            { nombre: 'Monitores', descripcion: 'Pantallas, displays y monitores para oficina y gaming' },
            { nombre: 'Impresoras', descripcion: 'Equipos de impresión multifuncionales y suministros de tinta' },
            { nombre: 'Componentes', descripcion: 'Partes internas como memorias RAM, discos duros y placas' }
        ]);

        // 2. Proveedores
        const proveedores = await Proveedor.bulkCreate([
            { razon_social: 'Logitech Perú S.A.C.', contacto: 'Carlos Mendoza', telefono: '987 654 321', email: 'ventas@logitech.pe' },
            { razon_social: 'Tech Import S.A.', contacto: 'Ana Torres', telefono: '912 345 678', email: 'atorres@techimport.com' },
            { razon_social: 'Distribuidora del Norte', contacto: 'Luis Quispe', telefono: '945 876 213', email: 'lquispe@distnorte.pe' },
            { razon_social: 'Global Electrónicos', contacto: 'Marta Gómez', telefono: '981 234 567', email: 'mgomez@globalelec.com' },
            { razon_social: 'Asus Latinoamérica', contacto: 'Javier Soto', telefono: '955 432 109', email: 'jsoto@asus.la' }
        ]);

        // 3. Usuarios
        const usuarios = await Usuario.bulkCreate([
            { nombre: 'Giancarlos Barboza N.', email: 'gbarboza@senati.pe', password: 'password123', rol: 'Administrador', estado: true },
            { nombre: 'Mario Antonio Ruiz', email: 'mruiz@inventario.com', password: 'password123', rol: 'Almacenero', estado: true },
            { nombre: 'Ana Torres Prado', email: 'atorres@inventario.com', password: 'password123', rol: 'Almacenero', estado: true },
            { nombre: 'Carlos Mendoza R.', email: 'cmendoza@inventario.com', password: 'password123', rol: 'Almacenero', estado: true },
            { nombre: 'Sofia Rojas Silva', email: 'srojas@inventario.com', password: 'password123', rol: 'Supervisor', estado: true }
        ]);

        // 4. Productos
        const productos = await Producto.bulkCreate([
            { nombre: 'Mouse Logitech G203', descripcion: 'Mouse gamer 8000 DPI con luces RGB Lightsync', precio: 85.00, stock: 12, stock_minimo: 5, categoria_id: categorias[0].id, proveedor_id: proveedores[0].id },
            { nombre: 'Teclado Mecánico Redragon', descripcion: 'Teclado mecánico switches Outemu Blue anti-ghosting', precio: 180.00, stock: 8, stock_minimo: 5, categoria_id: categorias[0].id, proveedor_id: proveedores[1].id },
            { nombre: 'Monitor LG 24\" IPS', descripcion: 'Monitor Full HD 75Hz con tecnología AMD FreeSync', precio: 550.00, stock: 15, stock_minimo: 4, categoria_id: categorias[2].id, proveedor_id: proveedores[3].id },
            { nombre: 'Laptop ASUS TUF Gaming', descripcion: 'AMD Ryzen 7, 16GB RAM, 512GB SSD, RTX 3050', precio: 3499.00, stock: 3, stock_minimo: 5, categoria_id: categorias[1].id, proveedor_id: proveedores[4].id },
            { nombre: 'Impresora HP Ink Tank', descripcion: 'Impresora inalámbrica con sistema continuo de tinta', precio: 650.00, stock: 2, stock_minimo: 4, categoria_id: categorias[3].id, proveedor_id: proveedores[2].id },
            { nombre: 'Memoria RAM Kingston 16GB DDR4', descripcion: '3200MHz CL16 con disipador térmico', precio: 195.00, stock: 24, stock_minimo: 6, categoria_id: categorias[4].id, proveedor_id: proveedores[1].id }
        ]);

        // 5. Movimientos Iniciales de Kardex
        await Movimiento.bulkCreate([
            { producto_id: productos[0].id, usuario_id: usuarios[1].id, tipo_movimiento: 'Entrada', cantidad: 15, observaciones: 'Llegada lote inicial según guía 001' },
            { producto_id: productos[3].id, usuario_id: usuarios[0].id, tipo_movimiento: 'Salida', cantidad: 2, observaciones: 'Entrega a laboratorio de cómputo' },
            { producto_id: productos[0].id, usuario_id: usuarios[1].id, tipo_movimiento: 'Salida', cantidad: 3, observaciones: 'Venta por mostrador' },
            { producto_id: productos[1].id, usuario_id: usuarios[2].id, tipo_movimiento: 'Entrada', cantidad: 10, observaciones: 'Reabastecimiento de stock' },
            { producto_id: productos[4].id, usuario_id: usuarios[0].id, tipo_movimiento: 'Salida', cantidad: 1, observaciones: 'Entrega a oficina administrativa' }
        ]);

        console.log('✅ Datos semilla insertados correctamente.');
    } catch (error) {
        console.error('⚠️ Error al insertar seeders:', error.message);
    }
}

module.exports = seedDatabase;
