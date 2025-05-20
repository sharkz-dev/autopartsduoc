const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// @desc    Obtener todos los usuarios
// @route   GET /api/users
// @access  Private (admin)
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener un usuario por ID
// @route   GET /api/users/:id
// @access  Private (admin)
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Actualizar un usuario
// @route   PUT /api/users/:id
// @access  Private (admin)
exports.updateUser = async (req, res, next) => {
  try {
    // Verificar que el usuario existe
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // No permitir cambiar la contraseña mediante esta ruta
    if (req.body.password) {
      delete req.body.password;
    }

    // Actualizar usuario
    user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).select('-password');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Eliminar un usuario
// @route   DELETE /api/users/:id
// @access  Private (admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Verificar si el usuario es un distribuidor y tiene productos
    if (user.role === 'distributor') {
      const Product = require('../models/Product');
      const products = await Product.countDocuments({ distributor: req.params.id });

      if (products > 0) {
        return res.status(400).json({
          success: false,
          error: `No se puede eliminar este distribuidor porque tiene ${products} productos asociados. Elimine primero los productos o asígnelos a otro distribuidor.`
        });
      }
    }

    // Eliminar la imagen de compañía si existe
    if (user.companyLogo) {
      const logoPath = path.join(__dirname, '../uploads', user.companyLogo);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener todos los distribuidores
// @route   GET /api/users/distributors
// @access  Public
exports.getDistributors = async (req, res, next) => {
  try {
    const distributors = await User.find({ role: 'distributor' })
      .select('name companyName companyLogo email phone address createdAt')
      .sort('companyName');

    res.status(200).json({
      success: true,
      count: distributors.length,
      data: distributors
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener detalles de un distribuidor
// @route   GET /api/users/distributors/:id
// @access  Public
exports.getDistributorDetails = async (req, res, next) => {
  try {
    const distributor = await User.findOne({
      _id: req.params.id,
      role: 'distributor'
    }).select('name companyName companyLogo email phone address createdAt');

    if (!distributor) {
      return res.status(404).json({
        success: false,
        error: 'Distribuidor no encontrado'
      });
    }

    // Obtener productos del distribuidor
    const Product = require('../models/Product');
    const products = await Product.find({ distributor: req.params.id })
      .populate('category', 'name')
      .sort('-createdAt')
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        distributor,
        products: {
          count: products.length,
          data: products
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Subir logo de compañía para distribuidor
// @route   PUT /api/users/:id/logo
// @access  Private (admin y distribuidor dueño)
exports.uploadCompanyLogo = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Verificar permisos: debe ser admin o el propio distribuidor
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(401).json({
        success: false,
        error: 'No está autorizado para realizar esta acción'
      });
    }

    // Verificar que es un distribuidor
    if (user.role !== 'distributor') {
      return res.status(400).json({
        success: false,
        error: 'Solo los distribuidores pueden subir logos de compañía'
      });
    }

    if (!req.files) {
      return res.status(400).json({
        success: false,
        error: 'Por favor suba un archivo'
      });
    }

    const file = req.files.file;

    // Verificar que es una imagen
    if (!file.mimetype.startsWith('image')) {
      return res.status(400).json({
        success: false,
        error: 'Por favor suba una imagen'
      });
    }

    // Verificar tamaño del archivo
    if (file.size > process.env.MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        error: `Por favor suba una imagen de menos de ${process.env.MAX_FILE_SIZE / 1000000} MB`
      });
    }

    // Crear nombre de archivo personalizado
    file.name = `logo_${user._id}_${Date.now()}${path.parse(file.name).ext}`;

    // Eliminar logo anterior si existe
    if (user.companyLogo) {
      const logoPath = path.join(__dirname, '../uploads', user.companyLogo);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
    }

    // Mover archivo
    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          success: false,
          error: 'Problema al subir el archivo'
        });
      }

      // Actualizar usuario con nuevo logo
      await User.findByIdAndUpdate(
        req.params.id,
        { companyLogo: file.name },
        { new: true }
      );

      res.status(200).json({
        success: true,
        data: file.name
      });
    });
  } catch (err) {
    next(err);
  }
};