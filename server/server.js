const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const path = require('path');
const fileUpload = require('express-fileupload');
const ErrorResponse = require('./utils/errorResponse');
const fs = require('fs');

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
connectDB();

// Inicializar Express
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
  createParentPath: true
}));

// Logging en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Asegurarse de que la carpeta de uploads exista
const uploadsDir = process.env.FILE_UPLOAD_PATH || './uploads';
// Convertir a ruta absoluta
const absoluteUploadsDir = path.isAbsolute(uploadsDir) 
  ? uploadsDir 
  : path.join(__dirname, uploadsDir);

// Crear carpeta de uploads si no existe
if (!fs.existsSync(absoluteUploadsDir)) {
  console.log(`Creando directorio de uploads: ${absoluteUploadsDir}`);
  fs.mkdirSync(absoluteUploadsDir, { recursive: true });
}

// Verificar permisos de escritura
try {
  fs.accessSync(absoluteUploadsDir, fs.constants.W_OK);
  console.log(`Directorio de uploads con permisos correctos: ${absoluteUploadsDir}`);
} catch (err) {
  console.error(`ERROR: No se puede escribir en el directorio de uploads: ${absoluteUploadsDir}`);
  console.error('Por favor, verifica los permisos de la carpeta o crea el directorio manualmente.');
}

// IMPORTANTE: Configurar carpeta estática ANTES de las rutas de API
// Esto es crítico para que Express sirva las imágenes correctamente
app.use('/uploads', express.static(absoluteUploadsDir));
console.log(`Serviendo archivos estáticos desde: ${absoluteUploadsDir} en la ruta /uploads`);
app.use('/api/uploads', express.static(absoluteUploadsDir));

// Rutas de API
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/stats', require('./routes/stats.routes'));

// Rutas de pago
app.use('/api/payment', require('./routes/payment.routes'));

// Ruta de prueba
app.use('/api/test', require('./routes/test.routes'));

// Añadir rutas de depuración en desarrollo
if (process.env.NODE_ENV !== 'production') {
  console.log('Cargando rutas de debug...');
  app.use('/api/debug', require('./routes/debug.routes'));
  console.log('Rutas de debug cargadas correctamente');
}

// Ruta para el frontend en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Middleware para redirigir solicitudes incorrectas
app.use('/products', (req, res) => {
  const redirectUrl = `/api/products${req.url}`;
  console.log(`Redirigiendo solicitud de ${req.originalUrl} a ${redirectUrl}`);
  res.status(200).json({ redirected: true, message: 'Usando ruta incorrecta. Por favor actualiza la URL a /api/products' });
});

// Middleware para manejar rutas no encontradas
app.use((req, res, next) => {
  next(new ErrorResponse(`Ruta no encontrada: ${req.originalUrl}`, 404));
});

// Middleware para manejar errores
app.use((err, req, res, next) => {
  console.error('Error completo:', err);
  
  let error = { ...err };
  error.message = err.message;
  
  // Log para desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
  
  // Error de MongoDB - ID inválido
  if (err.name === 'CastError') {
    const message = `Recurso no encontrado. ID inválido: ${err.value}`;
    error = new ErrorResponse(message, 404);
  }
  
  // Error de MongoDB - Duplicado
  if (err.code === 11000) {
    const message = `Valor duplicado ingresado para el campo ${Object.keys(err.keyValue).join(', ')}`;
    error = new ErrorResponse(message, 400);
  }
  
  // Error de validación de MongoDB
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ErrorResponse(message, 400);
  }
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Error del servidor',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});

// Puerto
const PORT = process.env.PORT || 5000;

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en modo ${process.env.NODE_ENV} en puerto ${PORT}`);
});

// Manejar rechazos de promesas no manejados
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Cerrar el servidor y salir del proceso
  server.close(() => process.exit(1));
});