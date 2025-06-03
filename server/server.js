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
app.use('/uploads', express.static(absoluteUploadsDir));
console.log(`Serviendo archivos estáticos desde: ${absoluteUploadsDir} en la ruta /uploads`);
app.use('/api/uploads', express.static(absoluteUploadsDir));

// ✅ RUTAS DE API EN ORDEN CORRECTO
console.log('🔧 Configurando rutas de API...');

// Rutas básicas
app.use('/api/auth', require('./routes/auth.routes'));
console.log('✅ Rutas de autenticación configuradas: /api/auth');

app.use('/api/users', require('./routes/user.routes'));
console.log('✅ Rutas de usuarios configuradas: /api/users');

app.use('/api/products', require('./routes/product.routes'));
console.log('✅ Rutas de productos configuradas: /api/products');

app.use('/api/categories', require('./routes/category.routes'));
console.log('✅ Rutas de categorías configuradas: /api/categories');

app.use('/api/orders', require('./routes/order.routes'));
console.log('✅ Rutas de órdenes configuradas: /api/orders');

// ✅ CRÍTICO: Rutas de pago - verificar que se cargan correctamente
try {
  app.use('/api/payment', require('./routes/payment.routes'));
  console.log('✅ Rutas de pago configuradas: /api/payment');
  
  // Verificar que el archivo de rutas existe
  const paymentRoutesPath = path.join(__dirname, 'routes', 'payment.routes.js');
  if (fs.existsSync(paymentRoutesPath)) {
    console.log('✅ Archivo payment.routes.js encontrado');
  } else {
    console.error('❌ CRÍTICO: Archivo payment.routes.js NO encontrado');
  }
} catch (paymentError) {
  console.error('❌ ERROR AL CARGAR RUTAS DE PAGO:', paymentError);
}

app.use('/api/stats', require('./routes/stats.routes'));
console.log('✅ Rutas de estadísticas configuradas: /api/stats');

// Rutas de configuración del sistema
app.use('/api/system-config', require('./routes/systemConfig.routes'));
console.log('✅ Rutas de configuración del sistema configuradas: /api/system-config');

// Ruta de prueba
app.use('/api/test', require('./routes/test.routes'));
console.log('✅ Rutas de prueba configuradas: /api/test');

// Añadir rutas de depuración en desarrollo
if (process.env.NODE_ENV !== 'production') {
  console.log('🔧 Cargando rutas de debug...');
  app.use('/api/debug', require('./routes/debug.routes'));
  console.log('✅ Rutas de debug cargadas correctamente');
}

// ✅ MIDDLEWARE DE DEPURACIÓN PARA RUTAS DE PAGO
app.use('/api/payment/*', (req, res, next) => {
  console.log(`🔍 PAYMENT ROUTE DEBUG: ${req.method} ${req.originalUrl}`);
  console.log('📋 Headers:', req.headers);
  console.log('📋 Body:', req.body);
  console.log('📋 Params:', req.params);
  next();
});

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

// ✅ MIDDLEWARE PARA LISTAR TODAS LAS RUTAS REGISTRADAS
app.use('/api/routes-debug', (req, res) => {
  const routes = [];
  
  function extractRoutes(stack, prefix = '') {
    stack.forEach(layer => {
      if (layer.route) {
        // Ruta directa
        const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
        routes.push(`${methods} ${prefix}${layer.route.path}`);
      } else if (layer.name === 'router' && layer.handle.stack) {
        // Router anidado
        const routerPrefix = layer.regexp.source
          .replace('\\', '')
          .replace('(?:\\/(?=$))?', '')
          .replace('(?=\\/|$)', '')
          .replace(/\?\(\?\=/g, '')
          .replace(/\$|\^/g, '')
          .replace('(?:/(?=$))?', '')
          .replace(/\\?\//g, '/');
        
        extractRoutes(layer.handle.stack, prefix + routerPrefix);
      }
    });
  }
  
  extractRoutes(app._router.stack, '');
  
  res.json({
    totalRoutes: routes.length,
    routes: routes.sort(),
    paymentRoutes: routes.filter(route => route.includes('/api/payment'))
  });
});

// Middleware para manejar rutas no encontradas
app.use((req, res, next) => {
  // Log especial para rutas de payment que fallan
  if (req.originalUrl.includes('/api/payment')) {
    console.error(`❌ RUTA DE PAGO NO ENCONTRADA: ${req.method} ${req.originalUrl}`);
    console.error('📋 Todas las rutas registradas que contienen "payment":');
    
    // Listar rutas de payment disponibles
    const routes = [];
    function extractRoutes(stack, prefix = '') {
      stack.forEach(layer => {
        if (layer.route) {
          const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
          const fullPath = `${methods} ${prefix}${layer.route.path}`;
          if (fullPath.includes('payment')) {
            routes.push(fullPath);
          }
        } else if (layer.name === 'router' && layer.handle.stack) {
          const routerPrefix = layer.regexp.source
            .replace('\\', '')
            .replace('(?:\\/(?=$))?', '')
            .replace('(?=\\/|$)', '')
            .replace(/\?\(\?\=/g, '')
            .replace(/\$|\^/g, '')
            .replace('(?:/(?=$))?', '')
            .replace(/\\?\//g, '/');
          
          extractRoutes(layer.handle.stack, prefix + routerPrefix);
        }
      });
    }
    
    extractRoutes(app._router.stack, '');
    console.error('🔍 Rutas de payment disponibles:', routes);
  }
  
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
  console.log(`🚀 Servidor ejecutándose en modo ${process.env.NODE_ENV} en puerto ${PORT}`);
  console.log(`🌐 URL del servidor: http://localhost:${PORT}`);
  console.log(`📁 Directorio de uploads: ${absoluteUploadsDir}`);
  console.log('🔧 Para ver todas las rutas disponibles, visita: http://localhost:5000/api/routes-debug');
});

// Manejar rechazos de promesas no manejados
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Cerrar el servidor y salir del proceso
  server.close(() => process.exit(1));
});