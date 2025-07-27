// mi-proyecto-reservas-backend/routes/propertyRoutes.js
const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController'); // Importa el controlador de propiedades
const { protect, authorizeRoles } = require('../middleware/authMiddleware'); // Importa los middlewares de autenticación y autorización
const upload = require('../config/cloudinary'); // <-- ¡IMPORTANTE! Importa el middleware de subida configurado con Cloudinary

// -------------------------------------------------------------------------
// Rutas de propiedades
// -------------------------------------------------------------------------

// Ruta para OBTENER TODAS las propiedades
// Acceso: Pública (cualquier usuario puede ver las propiedades sin necesidad de autenticarse)
router.get('/', propertyController.getAllProperties);

// Ruta para OBTENER UNA PROPIEDAD por su ID
// Acceso: Pública (cualquier usuario puede ver los detalles de una propiedad específica)
router.get('/:id', propertyController.getPropertyById);

// Ruta para CREAR una nueva propiedad
// Acceso: Privada (Requiere autenticación con un token JWT y el rol de 'admin')
// Los middlewares se ejecutan en orden:
// 1. `protect`: Verifica que el usuario esté autenticado y tenga un token válido.
// 2. `authorizeRoles('admin')`: Verifica que el usuario autenticado tenga el rol de 'admin'.
// 3. `upload.single('image')`: Este es el middleware de Multer/Cloudinary.
//    - Espera un archivo en el campo (input name) llamado 'image' de la petición (del frontend).
//    - Procesa la subida del archivo a Cloudinary.
//    - Si la subida es exitosa, adjunta la información del archivo (incluyendo la URL de Cloudinary en `req.file.path`) a la petición.
//    - Si no se sube un archivo, `req.file` será `undefined`.
//    - Luego, pasa el control a `propertyController.createProperty`.
router.post('/', protect, authorizeRoles('admin'), upload.single('image'), propertyController.createProperty);

// Ruta para ACTUALIZAR una propiedad existente por su ID
// Acceso: Privada (Requiere autenticación y el rol de 'admin'. También hay una verificación en el controlador para que solo el propietario o admin pueda editar)
// Si quieres permitir actualizar la imagen con la misma lógica:
router.put('/:id', protect, authorizeRoles('admin'), upload.single('image'), propertyController.updateProperty); // CAMBIO: Añadido upload.single('image') aquí también

// Ruta para ELIMINAR una propiedad existente por su ID
// Acceso: Privada (Requiere autenticación y el rol de 'admin'. También hay una verificación en el controlador para que solo el propietario o admin pueda eliminar)
router.delete('/:id', protect, authorizeRoles('admin'), propertyController.deleteProperty);

module.exports = router;