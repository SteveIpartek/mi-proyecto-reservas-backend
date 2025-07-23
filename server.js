// mi-proyecto-reservas-backend/server.js
require('dotenv').config(); // Carga las variables de entorno desde .env

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Middleware para permitir peticiones desde tu frontend

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Permite el acceso desde tu frontend
    credentials: true // Si vas a usar cookies o sesiones
}));
app.use(express.json()); // Permite a Express parsear JSON en el body de las peticiones

// Conexión a la base de datos
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Conectado a MongoDB Atlas'))
    .catch(err => {
        console.error('❌ Error de conexión a MongoDB:', err);
        process.exit(1); // Sale de la aplicación si no se conecta a la DB
    });

// Rutas
const propertyRoutes = require('./routes/propertyRoutes');
app.use('/api/properties', propertyRoutes); // Todas las rutas para /api/properties

// Ruta de prueba inicial
app.get('/', (req, res) => {
    res.send('🏠 API de Reservas de Viviendas funcionando correctamente!');
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});