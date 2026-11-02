const express = require('express');
const router = express.Router();
const controller = require('../controllers/productoController');
const autenticar = require('../middleware/authMiddleware');

router.get('/', autenticar(['Administrador', 'Almacenero', 'Supervisor']), controller.getAll);
router.get('/:id', autenticar(['Administrador', 'Almacenero', 'Supervisor']), controller.getById);
router.post('/', autenticar(['Administrador', 'Almacenero']), controller.create);
router.put('/:id', autenticar(['Administrador', 'Almacenero']), controller.update);
router.delete('/:id', autenticar(['Administrador', 'Almacenero']), controller.delete);

module.exports = router;