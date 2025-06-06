const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  addProductRating,
  getProductsOnSale,
  getProductRatings,
  getBrands,
  getCompatibleModels,  // ✅ NUEVO
  getSearchSuggestions  // ✅ NUEVO
} = require('../controllers/product.controller');

const { protect, authorize } = require('../middleware/auth');

// ============ RUTAS PÚBLICAS (SIN AUTENTICACIÓN) ============
// IMPORTANTE: Estas rutas específicas DEBEN ir ANTES de las rutas con parámetros dinámicos

// Obtener todos los productos
router.get('/', getProducts);

// Obtener productos en oferta - DEBE ir antes de /:slug
router.get('/on-sale', getProductsOnSale);

// ✅ CORREGIDO: Obtener todas las marcas únicas - DEBE ir antes de /:slug
router.get('/brands', getBrands);

// ✅ NUEVO: Obtener modelos compatibles únicos - DEBE ir antes de /:slug
router.get('/compatible-models', getCompatibleModels);

// ✅ NUEVO: Obtener sugerencias de búsqueda - DEBE ir antes de /:slug
router.get('/search/suggestions', getSearchSuggestions);

// ============ RUTAS DE CREACIÓN ============
// Crear nuevo producto (solo admin)
router.post('/', protect, authorize('admin'), createProduct);

// ============ RUTAS CON SLUGS/IDs DINÁMICOS (AL FINAL) ============
// CRÍTICO: Estas rutas deben ir AL FINAL para evitar que capturen 
// las rutas específicas de arriba como "on-sale", "brands", "compatible-models", etc.

// Obtener un producto específico por slug o ID
router.get('/:slug', getProduct);

// Actualizar producto por slug o ID (solo admin)
router.put('/:slug', protect, authorize('admin'), updateProduct);

// Eliminar producto por slug o ID (solo admin)
router.delete('/:slug', protect, authorize('admin'), deleteProduct);

// Subir imágenes de producto por slug o ID (solo admin)
router.put('/:slug/images', protect, authorize('admin'), uploadProductImages);

// Obtener valoraciones de producto por slug o ID
router.get('/:slug/ratings', getProductRatings);

// Añadir valoración a producto por slug o ID (solo clientes)
router.post('/:slug/ratings', protect, authorize('client'), addProductRating);

module.exports = router;