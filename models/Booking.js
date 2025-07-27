// mi-proyecto-reservas-backend/models/Booking.js
const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property', // Referencia al modelo de Propiedad
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Referencia al modelo de Usuario que hace la reserva
        required: true
    },
    checkInDate: {
        type: Date,
        required: true
    },
    checkOutDate: {
        type: Date,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    guests: { // Número de huéspedes en esta reserva
        type: Number,
        required: true,
        min: 1
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'], // Estados de la reserva
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Índice para asegurar que no haya reservas duplicadas para la misma propiedad y fechas superpuestas
// NOTA: La lógica de superposición más compleja se hará en el controlador
BookingSchema.index({ property: 1, checkInDate: 1, checkOutDate: 1 });

module.exports = mongoose.model('Booking', BookingSchema);