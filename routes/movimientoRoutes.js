const express = require('express');
const router = express.Router();
const controller = require('../controllers/movimientoController');

router.get('/', controller.getAll);
router.get('/guias', controller.getGuias);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.post('/despacho-multiple', controller.createMultiple);

module.exports = router;
