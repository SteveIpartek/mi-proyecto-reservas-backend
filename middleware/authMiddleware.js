// mi-proyecto-reservas-backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para proteger rutas (verificar token y usuario)
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Obtener token del header
            token = req.headers.authorization.split(' ')[1];

            // Verificar token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Buscar usuario por ID del token y adjuntarlo a la petición
            req.user = await User.findById(decoded.id).select('-password'); // Excluir la contraseña
            next(); // Continuar a la siguiente función middleware/ruta
        } catch (error) {
            console.error('Error de autenticación:', error);
            res.status(401).json({ message: 'No autorizado, token fallido o expirado' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'No autorizado, no hay token' });
    }
};

// Middleware para autorizar roles
const authorizeRoles = (...roles) => { // Recibe un número variable de roles
    return (req, res, next) => {
        // req.user debe venir del middleware `protect` que se ejecuta antes
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Acceso denegado, no tienes los permisos necesarios' });
        }
        next();
    };
};

module.exports = { protect, authorizeRoles };