// mi-proyecto-reservas-backend/server.js
require('dotenv').config(); // Carga las variables de entorno desde .env al inicio

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Middleware para permitir peticiones desde tu frontend

const app = express();
const PORT = process.env.PORT || 3001; // Puerto por defecto o el definido en .env
const MONGO_URI = process.env.MONGO_URI; // URI de conexión a MongoDB desde .env
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'; // URL del frontend para CORS

// Middleware
app.use(cors({
    origin: FRONTEND_URL, // Permitimos el acceso desde la URL de tu frontend
    credentials: true // Si vas a usar cookies o sesiones (útil para futuras expansiones)
}));
app.use(express.json()); // Permite a Express parsear cuerpos de petición JSON

// Conexión a la base de datos MongoDB
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Conectado a MongoDB Atlas'))
    .catch(err => {
        console.error('❌ Error de conexión a MongoDB:', err);
        process.exit(1);
    });

// -------------------------------------------------------------------
// Definición e inclusión de rutas API
// -------------------------------------------------------------------

// Importar los archivos de rutas
const propertyRoutes = require('./routes/propertyRoutes');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes'); // <-- ¡IMPORTACIÓN DE BOOKINGROUTES AQUÍ!

// Usar las rutas con sus prefijos base
app.use('/api/properties', propertyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes); // <-- ¡USO DE BOOKINGROUTES AQUÍ!


// Ruta de prueba inicial para verificar que el servidor está funcionando
app.get('/', (req, res) => {
    res.send('🏠 API de Reservas de Viviendas funcionando correctamente!');
});

// Middleware para manejar rutas no encontradas (404)
app.use((req, res, next) => {
    res.status(404).send('La ruta solicitada no fue encontrada.');
});

// Middleware para manejar errores generales (500)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo salió mal en el servidor.');
});


// Iniciar el servidor Express
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en ${FRONTEND_URL.replace('http://', 'http://api.')} o http://localhost:${PORT}`);
});