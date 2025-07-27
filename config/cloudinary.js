// mi-proyecto-reservas-backend/config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configurar Cloudinary con tus credenciales
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurar el almacenamiento para Multer usando Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'viviendas_vacacionales', // Carpeta donde se guardarán las imágenes en Cloudinary
    format: async (req, file) => 'jpeg', // Formato de la imagen (ej. 'jpeg', 'png')
    public_id: (req, file) => `property-${Date.now()}-${file.originalname.split('.')[0]}`, // Nombre público único
    transformation: [{ width: 500, height: 350, crop: 'fill' }] // Opcional: transformaciones al subir
  },
});

// Crear el middleware de Multer para subir un solo archivo 'image'
const upload = multer({ storage: storage });

module.exports = upload;