const { Sequelize } = require("sequelize");
require('dotenv').config();

const dialectOptions = process.env.DB_SSL === 'true' ? {
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false
    }
} : {};

const sequelize = new Sequelize(
    process.env.DB_NAME || 'inventario',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        dialectOptions,
        logging: false
    }
);
module.exports = sequelize;
