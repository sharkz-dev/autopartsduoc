const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrder,
  getMyOrders,
  getOrders,
  updateOrderStatus,
  cancelOrder
} = require('../controllers/order.controller');

const { protect, authorize } = require('../middleware/auth');

// Rutas privadas para todos los usuarios autenticados
router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);

// Esta ruta debe venir después de las rutas específicas con patrones como '/my-orders'
router.get('/:id', protect, getOrder);
router.put('/:id/cancel', protect, cancelOrder);

// Rutas para admin
router.get('/', protect, authorize('admin'), getOrders);

// Rutas para actualizar estado (solo admin)
router.put(
  '/:id/status',
  protect,
  authorize('admin'),
  updateOrderStatus
);

module.exports = router;