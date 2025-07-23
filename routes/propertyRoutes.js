// mi-proyecto-reservas-backend/routes/propertyRoutes.js
const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');

// Rutas CRUD para propiedades
router.get('/', propertyController.getAllProperties);
router.get('/:id', propertyController.getPropertyById);
router.post('/', propertyController.createProperty); // Faltaría middleware de autenticación aquí
router.put('/:id', propertyController.updateProperty); // Faltaría middleware de autenticación y autorización aquí
router.delete('/:id', propertyController.deleteProperty); // Faltaría middleware de autenticación y autorización aquí

module.exports = router;