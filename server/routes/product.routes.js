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
  addProductRating
} = require('../controllers/product.controller');

const { protect, authorize } = require('../middleware/auth');

// Rutas públicas
router.get('/', getProducts);
router.get('/:id', getProduct);
router.get('/distributor/:id', getProductsByDistributor);

// Rutas privadas
router.get('/my/products', protect, authorize('distributor', 'admin'), getMyProducts);
router.post('/', protect, authorize('distributor', 'admin'), createProduct);
router.put('/:id', protect, authorize('distributor', 'admin'), updateProduct);
router.delete('/:id', protect, authorize('distributor', 'admin'), deleteProduct);
router.put('/:id/images', protect, authorize('distributor', 'admin'), uploadProductImages);
router.post('/:id/ratings', protect, authorize('client'), addProductRating);

module.exports = router;