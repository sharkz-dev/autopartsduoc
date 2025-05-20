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
router.get('/:id', getCategory);
router.get('/:id/subcategories', getSubcategories);

// Rutas privadas (solo admin)
router.post('/', protect, authorize('admin'), createCategory);
router.put('/:id', protect, authorize('admin'), updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);
router.put('/:id/image', protect, authorize('admin'), uploadCategoryImage);

module.exports = router;