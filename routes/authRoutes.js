// mi-proyecto-reservas-backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // Middleware para proteger rutas

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getProfile); // Ruta protegida de ejemplo

module.exports = router;