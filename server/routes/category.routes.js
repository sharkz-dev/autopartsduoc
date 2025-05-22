const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  getSubcategories
} = require('../controllers/category.controller');

const { protect, authorize } = require('../middleware/auth');

// Rutas públicas
router.get('/', getCategories);

// Rutas privadas (solo admin) - van antes de las rutas con slug
router.post('/', protect, authorize('admin'), createCategory);

// Rutas que usan slug
router.get('/:slug', getCategory);
router.put('/:slug', protect, authorize('admin'), updateCategory);
router.delete('/:slug', protect, authorize('admin'), deleteCategory);
router.put('/:slug/image', protect, authorize('admin'), uploadCategoryImage);
router.get('/:slug/subcategories', getSubcategories);

module.exports = router;