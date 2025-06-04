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

// Rutas específicas (sin parámetros)
router.get('/config', protect, authorize('admin'), getPaymentConfig);

// Callbacks de Webpay (públicos - sin autenticación)
router.post('/webpay/return', handleWebpayReturn);
router.get('/webpay/return', handleWebpayReturn);

// Rutas con parámetros
router.post('/create-transaction/:orderId', protect, createPaymentTransaction);
router.get('/status/:orderId', protect, getPaymentStatus);
router.post('/refund/:orderId', protect, authorize('admin'), processRefund);

module.exports = router;