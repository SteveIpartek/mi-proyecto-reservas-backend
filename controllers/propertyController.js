// mi-proyecto-reservas-backend/controllers/propertyController.js
const Property = require('../models/Property');
const cloudinary = require('cloudinary').v2; // Importa Cloudinary para la gestión de imágenes

// Función auxiliar para extraer el public_id de una URL de Cloudinary
const getPublicIdFromCloudinaryUrl = (url) => {
    if (!url || typeof url !== 'string' || url.includes('placeholder.com')) {
        return null;
    }
    try {
        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1 || uploadIndex + 2 >= parts.length) {
            return null;
        }
        const publicIdWithFolder = parts.slice(uploadIndex + 2).join('/').split('.')[0];
        return publicIdWithFolder;
    } catch (e) {
        console.error('DEBUG: Error al extraer public_id de la URL:', url, e);
        return null;
    }
};


// @desc    Obtener todas las propiedades
// @route   GET /api/properties
// @access  Public
exports.getAllProperties = async (req, res) => {
    try {
        const properties = await Property.find();
        res.status(200).json(properties);
    } catch (error) {
        console.error('Error al obtener propiedades:', error);
        res.status(500).json({ message: 'Error del servidor al obtener propiedades.' });
    }
};

// @desc    Obtener una propiedad por ID
// @route   GET /api/properties/:id
// @access  Public
exports.getPropertyById = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ message: 'Propiedad no encontrada.' });
        }
        res.status(200).json(property);
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID de propiedad inválido.' });
        }
        console.error('Error al obtener propiedad por ID:', error);
        res.status(500).json({ message: 'Error del servidor al obtener la propiedad.' });
    }
};

// @desc    Crear una nueva propiedad
// @route   POST /api/properties
// @access  Private (se requiere autenticación y rol de propietario/admin)
exports.createProperty = async (req, res) => {
    const { title, description, location, pricePerNight, bedrooms, bathrooms, guests } = req.body;
    const imageUrl = req.file ? req.file.path : 'https://via.placeholder.com/400x250?text=No+Image';

    if (!title || !description || !location || !pricePerNight || !bedrooms || !bathrooms || !guests) {
        if (req.file) {
             const publicId = req.file.filename;
             cloudinary.uploader.destroy(publicId)
                .then(result => console.log('🗑️ Imagen huérfana eliminada de Cloudinary (validación faltante):', result))
                .catch(err => console.error('❌ Error al eliminar imagen huérfana:', err));
        }
        return res.status(400).json({ message: 'Por favor, rellena todos los campos obligatorios.' });
    }

    try {
        const newProperty = new Property({
            title,
            description,
            location,
            pricePerNight,
            bedrooms,
            bathrooms,
            guests,
            imageUrl,
            owner: req.user._id // Asigna el ID del usuario autenticado como propietario
        });
        const savedProperty = await newProperty.save();
        res.status(201).json(savedProperty);
    } catch (error) {
        console.error('Error al crear propiedad:', error);
        if (req.file) {
            const publicId = req.file.filename;
            cloudinary.uploader.destroy(publicId)
                .then(result => console.log('🗑️ Imagen huérfana eliminada de Cloudinary (error en DB):', result))
                .catch(err => console.error('❌ Error al eliminar imagen huérfana en DB error:', err));
        }
        if (error.name === 'ValidationError') {
            let messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Error del servidor al crear la propiedad.' });
    }
};

// @desc    Actualizar una propiedad existente
// @route   PUT /api/properties/:id
// @access  Private (solo el propietario o un admin puede actualizar)
exports.updateProperty = async (req, res) => {
    console.log('----------------------------------------------------');
    console.log('Petición PUT a updateProperty recibida.');
    console.log('req.body (campos de texto):', req.body);
    console.log('req.file (información del archivo):', req.file);
    console.log('----------------------------------------------------');

    try {
        let property = await Property.findById(req.params.id);
        if (!property) {
            if (req.file) {
                const publicId = req.file.filename;
                cloudinary.uploader.destroy(publicId)
                    .then(result => console.log('🗑️ Imagen huérfana eliminada de Cloudinary: propiedad no encontrada:', result))
                    .catch(err => console.error('❌ Error al eliminar imagen huérfana:', err));
            }
            return res.status(404).json({ message: 'Propiedad no encontrada para actualizar.' });
        }

        // --- LÓGICA DE AUTORIZACIÓN MEJORADA Y EXPLÍCITA PARA ADMIN ---
        console.log('DEBUG UPDATE: property.owner =', property.owner);
        console.log('DEBUG UPDATE: req.user.id =', req.user.id);
        console.log('DEBUG UPDATE: req.user.role =', req.user.role);

        // Si el usuario es ADMIN, permitir siempre la actualización.
        if (req.user.role === 'admin') {
            console.log('DEBUG UPDATE: Usuario es ADMIN. Acceso PERMITIDO.');
        } else { // Si el usuario NO es admin, verificar si es el propietario
            // Si la propiedad no tiene owner, o el owner no coincide con el usuario logueado, denegar.
            if (!property.owner || property.owner.toString() !== req.user.id.toString()) {
                console.log('DEBUG UPDATE: Usuario NO es admin Y NO es propietario. Acceso DENEGADO.');
                if (req.file) {
                    const publicId = req.file.filename;
                    cloudinary.uploader.destroy(publicId)
                        .then(result => console.log('🗑️ Imagen huérfana eliminada de Cloudinary: acceso denegado:', result))
                        .catch(err => console.error('❌ Error al eliminar imagen huérfana:', err));
                }
                return res.status(403).json({ message: 'No autorizado para actualizar esta propiedad.' });
            }
            console.log('DEBUG UPDATE: Usuario es PROPIETARIO. Acceso PERMITIDO.');
        }
        // ---------------------------------------------------------------

        let newImageUrl = property.imageUrl;

        if (req.file) {
            newImageUrl = req.file.path;
            if (property.imageUrl && !property.imageUrl.includes('placeholder.com')) {
                const oldPublicId = getPublicIdFromCloudinaryUrl(property.imageUrl);
                console.log('DEBUG UPDATE: Old Public ID para borrar:', oldPublicId);
                if (oldPublicId) {
                    cloudinary.uploader.destroy(oldPublicId)
                        .then(result => console.log('🗑️ Imagen antigua eliminada de Cloudinary:', result))
                        .catch(err => console.error('❌ Error al eliminar imagen antigua:', err));
                }
            }
        }

        const updatedData = { ...req.body, imageUrl: newImageUrl };

        const updatedProperty = await Property.findByIdAndUpdate(
            req.params.id,
            updatedData,
            { new: true, runValidators: true }
        );
        res.status(200).json(updatedProperty);
    } catch (error) {
        console.error('DEBUG UPDATE: Catch general de error:', error);
        if (req.file) {
            const publicId = req.file.filename;
            cloudinary.uploader.destroy(publicId)
                .then(result => console.log('🗑️ Imagen huérfana eliminada de Cloudinary (error en update):', result))
                .catch(err => console.error('❌ Error al eliminar imagen huérfana en update error:', err));
        }
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID de propiedad inválido para actualización.' });
        }
        if (error.name === 'ValidationError') {
            let messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Error del servidor al actualizar la propiedad.' });
    }
};

// @desc    Eliminar una propiedad
// @route   DELETE /api/properties/:id
// @access  Private (solo el propietario o un admin puede eliminar)
exports.deleteProperty = async (req, res) => {
    console.log('----------------------------------------------------');
    console.log('Petición DELETE a deleteProperty recibida.');
    console.log('ID de propiedad:', req.params.id);
    console.log('req.user.id:', req.user.id);
    console.log('req.user.role:', req.user.role);
    console.log('----------------------------------------------------');
    try {
        let property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ message: 'Propiedad no encontrada para eliminar.' });
        }

        // --- LÓGICA DE AUTORIZACIÓN MEJORADA Y EXPLÍCITA PARA ADMIN ---
        // Si el usuario es ADMIN, permitir siempre la eliminación.
        // Si NO es admin, ENTONCES verificar si es el propietario.
        console.log('DEBUG DELETE: property.owner =', property.owner);
        if (req.user.role === 'admin') {
            console.log('DEBUG DELETE: Usuario es ADMIN. Acceso PERMITIDO.');
        } else { // Si el usuario NO es admin, verificar si es el propietario
            // Si la propiedad no tiene owner, o el owner no coincide con el usuario logueado, denegar.
            if (!property.owner || property.owner.toString() !== req.user.id.toString()) {
                console.log('DEBUG DELETE: Usuario NO es admin Y NO es propietario. Acceso DENEGADO.');
                return res.status(403).json({ message: 'No autorizado para eliminar esta propiedad.' });
            }
            console.log('DEBUG DELETE: Usuario es PROPIETARIO. Acceso PERMITIDO.');
        }
        // ---------------------------------------------------------------

        if (property.imageUrl && !property.imageUrl.includes('placeholder.com')) {
             const publicId = getPublicIdFromCloudinaryUrl(property.imageUrl);
             console.log('DEBUG DELETE: Public ID para borrar:', publicId);
             if (publicId) {
                 cloudinary.uploader.destroy(publicId)
                     .then(result => console.log('🗑️ Imagen de propiedad eliminada de Cloudinary:', result))
                     .catch(err => console.error('❌ Error al eliminar imagen de propiedad:', err));
             }
        }

        await Property.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Propiedad eliminada correctamente.' });
    } catch (error) {
        console.error('DEBUG DELETE: Catch general de error:', error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID de propiedad inválido para eliminación.' });
        }
        console.error('Error al eliminar propiedad:', error);
        res.status(500).json({ message: 'Error del servidor al eliminar la propiedad.' });
    }
};