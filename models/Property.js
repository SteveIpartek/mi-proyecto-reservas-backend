// mi-proyecto-reservas-backend/models/Property.js
const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'El título es obligatorio'],
        trim: true,
        maxlength: [100, 'El título no puede exceder los 100 caracteres']
    },
    description: {
        type: String,
        required: [true, 'La descripción es obligatoria'],
        minlength: [20, 'La descripción debe tener al menos 20 caracteres']
    },
    location: {
        type: String,
        required: [true, 'La ubicación es obligatoria'],
        trim: true
    },
    pricePerNight: {
        type: Number,
        required: [true, 'El precio por noche es obligatorio'],
        min: [1, 'El precio por noche debe ser al menos 1']
    },
    bedrooms: {
        type: Number,
        required: [true, 'El número de habitaciones es obligatorio'],
        min: [1, 'Debe haber al menos 1 habitación']
    },
    bathrooms: {
        type: Number,
        required: [true, 'El número de baños es obligatorio'],
        min: [1, 'Debe haber al menos 1 baño']
    },
    guests: {
        type: Number,
        required: [true, 'El número de huéspedes es obligatorio'],
        min: [1, 'Debe haber al menos 1 huésped']
    },
    imageUrl: {
        type: String,
        default: 'https://via.placeholder.com/400x250?text=Vivienda' // Imagen placeholder
    },
    // availableDates: [{ type: Date }], // Para futuras funcionalidades de calendario de disponibilidad
    owner: { // Esto se vincularía a un modelo de Usuario si lo implementas
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // required: true // Si el propietario es obligatorio
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Property', PropertySchema);