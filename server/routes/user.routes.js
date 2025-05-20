const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getDistributors,
  getDistributorDetails,
  uploadCompanyLogo
} = require('../controllers/user.controller');

const { protect, authorize } = require('../middleware/auth');

// Rutas públicas
router.get('/distributors', getDistributors);
router.get('/distributors/:id', getDistributorDetails);

// Rutas privadas (admin)
router.use(protect);
router.get('/', authorize('admin'), getUsers);
router.get('/:id', authorize('admin'), getUser);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

// Rutas para logo de compañía (admin y distribuidor dueño)
router.put('/:id/logo', uploadCompanyLogo);

module.exports = router;