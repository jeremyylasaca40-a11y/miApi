const { Producto, Categoria, Proveedor, Movimiento, Usuario, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getStats = async (req, res) => {
    try {
        const totalProductos = await Producto.count();
        const totalCategorias = await Categoria.count();
        const totalProveedores = await Proveedor.count();

        // Obtener todos los productos para valorización y lista rápida
        const todosProductos = await Producto.findAll({
            attributes: ['id', 'nombre', 'precio', 'stock', 'stock_minimo', 'categoria_id', 'proveedor_id'],
            include: [{ model: Categoria, as: 'categoria', attributes: ['nombre'] }]
        });

        // Calcular valorización monetaria total
        const valorTotalInventario = todosProductos.reduce((acc, p) => {
            const precio = parseFloat(p.precio) || 0;
            const stock = parseInt(p.stock, 10) || 0;
            return acc + (precio * stock);
        }, 0);

        // Alertas de bajo stock
        const productosBajoStock = todosProductos.filter(p => p.stock <= (p.stock_minimo || 5));
        const bajoStockCount = productosBajoStock.length;

        // Tasa de salud del inventario (%)
        const tasaSalud = totalProductos > 0
            ? Math.round(((totalProductos - bajoStockCount) / totalProductos) * 100)
            : 100;

        // Movimientos recientes
        const movimientosRecientes = await Movimiento.findAll({
            limit: 8,
            include: [
                { model: Producto, as: 'producto', attributes: ['id', 'nombre'] },
                { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'rol'] }
            ],
            order: [['fecha_hora', 'DESC'], ['id', 'DESC']]
        });

        // Stock por Categoría (para gráfico de dona)
        const categorias = await Categoria.findAll({
            include: [{ model: Producto, as: 'productos', attributes: ['stock', 'precio'] }]
        });
        const stockPorCategoria = categorias.map(c => {
            const totalStock = c.productos ? c.productos.reduce((acc, p) => acc + (p.stock || 0), 0) : 0;
            return {
                id: c.id,
                categoria: c.nombre,
                totalStock,
                cantidadProductos: c.productos ? c.productos.length : 0
            };
        });

        // Tendencia de Kardex (Entradas vs Salidas por mes/día reciente)
        const ultimosMovimientos = await Movimiento.findAll({
            limit: 30,
            order: [['fecha_hora', 'ASC']]
        });

        const diasMap = {};
        ultimosMovimientos.forEach(m => {
            const fechaKey = new Date(m.fecha_hora).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
            if (!diasMap[fechaKey]) {
                diasMap[fechaKey] = { fecha: fechaKey, entradas: 0, salidas: 0, ajustes: 0 };
            }
            if (m.tipo_movimiento === 'Entrada') diasMap[fechaKey].entradas += m.cantidad;
            if (m.tipo_movimiento === 'Salida') diasMap[fechaKey].salidas += m.cantidad;
            if (m.tipo_movimiento === 'Ajuste') diasMap[fechaKey].ajustes += m.cantidad;
        });
        const tendenciaKardex = Object.values(diasMap);

        res.json({
            kpis: {
                totalProductos,
                totalCategorias,
                totalProveedores,
                bajoStockCount,
                valorTotalInventario,
                tasaSalud
            },
            productosBajoStock,
            movimientosRecientes,
            stockPorCategoria,
            tendenciaKardex,
            productosLista: todosProductos
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
