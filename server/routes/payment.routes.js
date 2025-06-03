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

// Rutas protegidas (requieren autenticación)
router.post('/create-transaction/:orderId', protect, createPaymentTransaction);
router.get('/status/:orderId', protect, getPaymentStatus);

// Rutas de administrador
router.post('/refund/:orderId', protect, authorize('admin'), processRefund);
router.get('/config', protect, authorize('admin'), getPaymentConfig);

// Rutas públicas (callbacks de Webpay)
router.post('/webpay/return', handleWebpayReturn);

// Ruta GET para manejar redirects GET de Webpay (algunos casos)
router.get('/webpay/return', (req, res) => {
  // Webpay a veces puede enviar GET en lugar de POST
  console.log('🔄 Retorno GET de Webpay recibido:', req.query);
  
  if (req.query.token_ws) {
    // Convertir a POST para procesamiento
    req.body = { token_ws: req.query.token_ws };
    return handleWebpayReturn(req, res);
  }
  
  // Si no hay token, redirigir a error
  res.redirect(`${process.env.FRONTEND_URL}/payment/failure?error=no_token`);
});

module.exports = router;