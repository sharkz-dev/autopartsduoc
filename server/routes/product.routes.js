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
router.get('/on-sale', getProductsOnSale); // Añadir esta nueva ruta antes de la ruta con /:id
router.get('/:id', getProduct);
router.get('/distributor/:id', getProductsByDistributor);
router.get('/:id/ratings', getProductRatings);

// Rutas privadas
router.get('/my/products', protect, authorize('distribuidor', 'admin'), getMyProducts);
router.post('/', protect, authorize('distribuidor', 'admin'), createProduct);
router.put('/:id', protect, authorize('distribuidor', 'admin'), updateProduct);
router.delete('/:id', protect, authorize('distribuidor', 'admin'), deleteProduct);
router.put('/:id/images', protect, authorize('distribuidor', 'admin'), uploadProductImages);
router.post('/:id/ratings', protect, authorize('client'), addProductRating);

module.exports = router;