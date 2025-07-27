// mi-proyecto-reservas-backend/routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// -------------------------------------------------------------------------
// Rutas de Reservas
// -------------------------------------------------------------------------

// Ruta para CREAR una nueva reserva
router.post('/', protect, bookingController.createBooking);

// Ruta para OBTENER TODAS LAS RESERVAS de un usuario (Mis Reservas)
router.get('/my', protect, bookingController.getMyBookings);

// Ruta para OBTENER TODAS LAS RESERVAS de una PROPIEDAD específica
router.get('/property/:propertyId', protect, bookingController.getPropertyBookings);

// Ruta para CANCELAR una reserva
router.put('/:id/cancel', protect, bookingController.cancelBooking);

// Ruta para ACTUALIZAR el estado de una reserva (ej. a 'confirmed', 'completed', 'cancelled')
router.put('/:id/status', protect, bookingController.updateBookingStatus); // <-- ¡Esta es la ruta CLAVE!

// Ruta para OBTENER FECHAS OCUPADAS de una propiedad específica (PÚBLICA)
router.get('/property/:propertyId/occupied-dates', bookingController.getOccupiedDates); // <-- ¡Esta es la ruta que está dando 404!

module.exports = router;