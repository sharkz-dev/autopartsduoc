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

// ============ RUTAS PÚBLICAS ============
router.get('/', getCategories);

// ============ RUTAS PRIVADAS (ADMIN SOLAMENTE) ============
// Crear nueva categoría - ruta específica sin parámetros
router.post('/', protect, authorize('admin'), createCategory);

// ============ RUTAS CON SLUGS (AL FINAL) ============
// Todas estas rutas usan :slug como parámetro

// Obtener una categoría por slug (público)
router.get('/:slug', getCategory);

// Obtener subcategorías de una categoría (público)
router.get('/:slug/subcategories', getSubcategories);

// Actualizar categoría (admin) - acepta tanto slug como ID
router.put('/:slug', protect, authorize('admin'), updateCategory);

// Eliminar categoría (admin) - acepta tanto slug como ID
router.delete('/:slug', protect, authorize('admin'), deleteCategory);

// Subir imagen de categoría (admin) - acepta tanto slug como ID
router.put('/:slug/image', protect, authorize('admin'), uploadCategoryImage);

module.exports = router;