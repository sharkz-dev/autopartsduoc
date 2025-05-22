// server/routes/product.routes.js - ORDEN CORRECTO DE RUTAS
const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  getProductsByDistributor,
  getMyProducts,
  addProductRating,
  getProductsOnSale,
  getProductRatings
} = require('../controllers/product.controller');

const { protect, authorize } = require('../middleware/auth');

// ============ RUTAS PÚBLICAS (SIN AUTENTICACIÓN) ============
// IMPORTANTE: Estas rutas específicas DEBEN ir ANTES de las rutas con parámetros dinámicos

// Obtener todos los productos
router.get('/', getProducts);

// Obtener productos en oferta - DEBE ir antes de /:slug
router.get('/on-sale', getProductsOnSale);

// ============ RUTAS PRIVADAS CON PATRONES ESPECÍFICOS ============
// Estas también DEBEN ir antes de /:slug para evitar conflictos

// Obtener productos del distribuidor actual - DEBE ir antes de /:slug  
router.get('/my/products', protect, authorize('distributor', 'admin'), getMyProducts);

// Obtener productos por distribuidor específico - DEBE ir antes de /:slug
router.get('/distributor/:id', getProductsByDistributor);

// ============ RUTAS DE CREACIÓN ============
// Crear nuevo producto
router.post('/', protect, authorize('distributor', 'admin'), createProduct);

// ============ RUTAS CON SLUGS/IDs DINÁMICOS (AL FINAL) ============
// CRÍTICO: Estas rutas deben ir AL FINAL para evitar que capturen 
// las rutas específicas de arriba como "on-sale", "my", "distributor"

// Obtener un producto específico por slug o ID
router.get('/:slug', getProduct);

// Actualizar producto por slug o ID
router.put('/:slug', protect, authorize('distributor', 'admin'), updateProduct);

// Eliminar producto por slug o ID  
router.delete('/:slug', protect, authorize('distributor', 'admin'), deleteProduct);

// Subir imágenes de producto por slug o ID
router.put('/:slug/images', protect, authorize('distributor', 'admin'), uploadProductImages);

// Obtener valoraciones de producto por slug o ID
router.get('/:slug/ratings', getProductRatings);

// Añadir valoración a producto por slug o ID
router.post('/:slug/ratings', protect, authorize('client'), addProductRating);

module.exports = router;