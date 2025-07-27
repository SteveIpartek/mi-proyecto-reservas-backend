// mi-proyecto-reservas-backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Para encriptar contraseñas

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: true, // Cada email debe ser único
        lowercase: true,
        match: [/.+@.+\..+/, 'Por favor, introduce un email válido'] // Regex para validar formato de email
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
    },
    role: {
        type: String,
        enum: ['user', 'admin'], // Solo puede ser 'user' o 'admin'
        default: 'user' // Por defecto, los usuarios son 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware de Mongoose: Encriptar la contraseña antes de guardar el usuario
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) { // Solo encripta si la contraseña ha sido modificada
        return next();
    }
    const salt = await bcrypt.genSalt(10); // Genera un "salt" para la encriptación
    this.password = await bcrypt.hash(this.password, salt); // Encripta la contraseña
    next();
});

// Método del esquema: Comparar contraseña introducida con la encriptada
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);