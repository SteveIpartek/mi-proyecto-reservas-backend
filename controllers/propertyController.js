// mi-proyecto-reservas-backend/controllers/propertyController.js
const Property = require('../models/Property');

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
        // Esto captura errores de ID mal formados de MongoDB
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID de propiedad inválido.' });
        }
        console.error('Error al obtener propiedad por ID:', error);
        res.status(500).json({ message: 'Error del servidor al obtener la propiedad.' });
    }
};

// @desc    Crear una nueva propiedad
// @route   POST /api/properties
// @access  Private (se requeriría autenticación de propietario)
exports.createProperty = async (req, res) => {
    const { title, description, location, pricePerNight, bedrooms, bathrooms, guests, imageUrl } = req.body;

    // Validación básica de entrada
    if (!title || !description || !location || !pricePerNight || !bedrooms || !bathrooms || !guests) {
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
            imageUrl
            // owner: req.user.id // Si tuvieras un middleware de autenticación que adjunte el usuario a req
        });
        const savedProperty = await newProperty.save();
        res.status(201).json(savedProperty);
    } catch (error) {
        console.error('Error al crear propiedad:', error);
        // Manejo de errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            let messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Error del servidor al crear la propiedad.' });
    }
};

// @desc    Actualizar una propiedad
// @route   PUT /api/properties/:id
// @access  Private (solo el propietario puede actualizar)
exports.updateProperty = async (req, res) => {
    try {
        const updatedProperty = await Property.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true } // `new: true` devuelve el documento actualizado; `runValidators: true` ejecuta validadores del schema
        );
        if (!updatedProperty) {
            return res.status(404).json({ message: 'Propiedad no encontrada para actualizar.' });
        }
        res.status(200).json(updatedProperty);
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID de propiedad inválido para actualización.' });
        }
        if (error.name === 'ValidationError') {
            let messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        console.error('Error al actualizar propiedad:', error);
        res.status(500).json({ message: 'Error del servidor al actualizar la propiedad.' });
    }
};

// @desc    Eliminar una propiedad
// @route   DELETE /api/properties/:id
// @access  Private (solo el propietario puede eliminar)
exports.deleteProperty = async (req, res) => {
    try {
        const deletedProperty = await Property.findByIdAndDelete(req.params.id);
        if (!deletedProperty) {
            return res.status(404).json({ message: 'Propiedad no encontrada para eliminar.' });
        }
        res.status(200).json({ message: 'Propiedad eliminada correctamente.' });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID de propiedad inválido para eliminación.' });
        }
        console.error('Error al eliminar propiedad:', error);
        res.status(500).json({ message: 'Error del servidor al eliminar la propiedad.' });
    }
};