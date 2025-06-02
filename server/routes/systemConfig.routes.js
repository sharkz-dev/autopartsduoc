const express = require('express');
const router = express.Router();
const {
  getConfigurations,
  getConfiguration,
  updateConfiguration,
  getTaxRate,
  updateTaxRate,
  resetConfigurations
} = require('../controllers/systemConfig.controller');

const { protect, authorize } = require('../middleware/auth');

// ============ RUTAS PÚBLICAS ============
// Obtener porcentaje de IVA actual (público para el cálculo en frontend)
router.get('/tax/rate', getTaxRate);

// ============ RUTAS PRIVADAS (ADMIN SOLAMENTE) ============
// Proteger todas las rutas siguientes con autenticación y autorización
router.use(protect, authorize('admin'));

// Rutas generales de configuración
router.get('/', getConfigurations);
router.post('/reset', resetConfigurations);

// Rutas específicas para IVA
router.put('/tax/rate', updateTaxRate);

// Rutas para configuraciones individuales
router.get('/:key', getConfiguration);
router.put('/:key', updateConfiguration);

module.exports = router;