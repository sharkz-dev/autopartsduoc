const express = require('express');
const router = express.Router();
const {
  createPaymentTransaction,
  handleWebpayReturn,
  getPaymentStatus,
  processRefund,
  getPaymentConfig
} = require('../controllers/payment.controller');
const { protect, authorize } = require('../middleware/auth');

// ✅ DEBUGGING: Confirmar que este archivo se está cargando
console.log('🔧 === CARGANDO payment.routes.js ===');

// ✅ DEBUGGING: Middleware para loggear TODAS las peticiones a /payment
router.use((req, res, next) => {
  console.log(`🔍 PAYMENT ROUTE INTERCEPTED: ${req.method} ${req.originalUrl}`);
  console.log('📋 User authenticated:', !!req.user);
  console.log('📋 Headers:', {
    authorization: req.headers.authorization ? 'Present' : 'Missing',
    contentType: req.headers['content-type']
  });
  next();
});

// ✅ RUTA DE PRUEBA (debe responder en /api/payment/test)
router.get('/test', (req, res) => {
  console.log('✅ RUTA DE PRUEBA /api/payment/test ALCANZADA');
  res.json({
    success: true,
    message: 'Payment routes are working correctly!',
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
});

// ✅ RUTAS ESPECÍFICAS PRIMERO (sin parámetros)

// Configuración de Transbank (solo admin)
router.get('/config', protect, authorize('admin'), (req, res, next) => {
  console.log('🔧 Ruta /config alcanzada');
  getPaymentConfig(req, res, next);
});

// ✅ CALLBACKS DE WEBPAY (PÚBLICOS - SIN AUTENTICACIÓN)
router.post('/webpay/return', (req, res, next) => {
  console.log('🔄 POST /webpay/return alcanzada');
  handleWebpayReturn(req, res, next);
});

router.get('/webpay/return', (req, res, next) => {
  console.log('🔄 GET /webpay/return alcanzada');
  handleWebpayReturn(req, res, next);
});

// ✅ RUTAS CON PARÁMETROS (AL FINAL para evitar conflictos)

// ✅ CRÍTICO: Crear transacción de pago (la que está fallando)
router.post('/create-transaction/:orderId', protect, (req, res, next) => {
  console.log(`💳 RUTA CRÍTICA /create-transaction/${req.params.orderId} ALCANZADA`);
  console.log('👤 Usuario:', req.user ? req.user.id : 'No user');
  console.log('📋 OrderId:', req.params.orderId);
  
  createPaymentTransaction(req, res, next);
});

// Estado de pago
router.get('/status/:orderId', protect, (req, res, next) => {
  console.log(`📊 Ruta /status/${req.params.orderId} alcanzada`);
  getPaymentStatus(req, res, next);
});

// Procesar reembolso (solo admin)
router.post('/refund/:orderId', protect, authorize('admin'), (req, res, next) => {
  console.log(`💰 Ruta /refund/${req.params.orderId} alcanzada`);
  processRefund(req, res, next);
});

// ✅ DEBUGGING: Middleware para capturar rutas NO encontradas dentro de /payment
router.use('*', (req, res) => {
  console.error(`❌ RUTA DE PAYMENT NO ENCONTRADA: ${req.method} ${req.originalUrl}`);
  console.error('📋 Rutas disponibles en payment router:');
  console.error('   GET  /api/payment/test');
  console.error('   GET  /api/payment/config');  
  console.error('   POST /api/payment/webpay/return');
  console.error('   GET  /api/payment/webpay/return');
  console.error('   POST /api/payment/create-transaction/:orderId ← ESTA DEBERÍA FUNCIONAR');
  console.error('   GET  /api/payment/status/:orderId');
  console.error('   POST /api/payment/refund/:orderId');
  
  res.status(404).json({
    success: false,
    error: `Ruta de payment no encontrada: ${req.method} ${req.originalUrl}`,
    requestedRoute: req.originalUrl,
    availableRoutes: [
      'GET /api/payment/test',
      'GET /api/payment/config',
      'POST /api/payment/webpay/return',
      'GET /api/payment/webpay/return',
      'POST /api/payment/create-transaction/:orderId',
      'GET /api/payment/status/:orderId',
      'POST /api/payment/refund/:orderId'
    ]
  });
});

// ✅ DEBUGGING: Confirmar que el router se configuró completamente
console.log('✅ === payment.routes.js CONFIGURADO COMPLETAMENTE ===');
console.log('📋 Rutas configuradas:');
console.log('   - GET  /test');
console.log('   - GET  /config');
console.log('   - POST /webpay/return'); 
console.log('   - GET  /webpay/return');
console.log('   - POST /create-transaction/:orderId');
console.log('   - GET  /status/:orderId');
console.log('   - POST /refund/:orderId');

module.exports = router;