const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrder,
  getMyOrders,
  getOrders,
  getDistributorOrders,
  updateOrderStatus,
  cancelOrder
} = require('../controllers/order.controller');

const { protect, authorize } = require('../middleware/auth');

// Rutas privadas para todos los usuarios autenticados
router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);

// Rutas para distribuidor - Esta ruta debe estar ANTES de /:id para evitar conflictos
router.get(
  '/distributor-orders',
  protect,
  authorize('distributor'),
  getDistributorOrders
);

// Esta ruta debe venir después de las rutas específicas con patrones como '/algo'
router.get('/:id', protect, getOrder);
router.put('/:id/cancel', protect, cancelOrder);

// Rutas para admin
router.get('/', protect, authorize('admin'), getOrders);

// Rutas para actualizar estado
router.put(
  '/:id/status',
  protect,
  authorize('admin', 'distributor'),
  updateOrderStatus
);

module.exports = router;