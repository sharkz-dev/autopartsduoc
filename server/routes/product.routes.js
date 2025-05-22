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

// Rutas públicas
router.get('/', getProducts);
router.get('/on-sale', getProductsOnSale);
router.get('/distributor/:id', getProductsByDistributor);

// Rutas privadas
router.get('/my/products', protect, authorize('distribuidor', 'admin'), getMyProducts);
router.post('/', protect, authorize('distribuidor', 'admin'), createProduct);

// Rutas que usan slug (deben ir al final para evitar conflictos)
router.get('/:slug', getProduct);
router.put('/:slug', protect, authorize('distribuidor', 'admin'), updateProduct);
router.delete('/:slug', protect, authorize('distribuidor', 'admin'), deleteProduct);
router.put('/:slug/images', protect, authorize('distribuidor', 'admin'), uploadProductImages);
router.get('/:slug/ratings', getProductRatings);
router.post('/:slug/ratings', protect, authorize('client'), addProductRating);

module.exports = router;