const express = require('express');
const router = express.Router();
const {
  createPaymentPreference,
  handleWebhook,
  getPaymentStatus
} = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth');

// Rutas protegidas (requieren autenticación)
router.post('/create-preference/:orderId', protect, createPaymentPreference);
router.get('/status/:orderId', protect, getPaymentStatus);

// Rutas públicas (webhooks)
router.post('/webhook', handleWebhook);

module.exports = router;