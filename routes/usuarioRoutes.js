const express = require('express');
const router = express.Router();
const controller = require('../controllers/usuarioController');

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id/toggle-estado', controller.toggleEstado);
router.delete('/:id', controller.delete);

module.exports = router;
