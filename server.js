// mi-proyecto-reservas-backend/server.js
require('dotenv').config(); // Carga las variables de entorno desde .env al inicio

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Middleware para permitir peticiones desde tu frontend

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;

// --- ✅ CONFIGURACIÓN DE CORS MEJORADA ---
// Lista de los orígenes (dominios) que permitiremos conectar a nuestra API.
const allowedOrigins = [
    'http://localhost:3000',                        // Permitimos tu frontend en desarrollo local.
    process.env.FRONTEND_URL                        // Permitimos la URL de tu frontend en Render (desde .env).
];

const corsOptions = {
    origin: function (origin, callback) {
        // La lógica permite que los orígenes de nuestra lista y las peticiones sin origen (como las de Postman) pasen.
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Acceso no permitido por CORS'));
        }
    },
    credentials: true
};

app.use(cors(corsOptions)); // Usamos la nueva configuración de CORS.
// --- FIN DE LA CONFIGURACIÓN DE CORS ---

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

const propertyRoutes = require('./routes/propertyRoutes');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

app.use('/api/properties', propertyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);


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
    console.log(`🚀 Servidor backend corriendo en el puerto ${PORT}`);
});