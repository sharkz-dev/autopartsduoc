const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getPublicStats
} = require('../controllers/stats.controller');

const { protect, authorize } = require('../middleware/auth');

// Ruta pública
router.get('/public', getPublicStats);

// Rutas privadas
router.get('/admin', protect, authorize('admin'), getAdminStats);

module.exports = router;