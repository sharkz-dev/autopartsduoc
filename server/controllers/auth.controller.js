const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// @desc    Registrar usuario
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, address, phone, distributorInfo } = req.body;

    console.log('📝 Datos de registro recibidos:', {
      name,
      email,
      role,
      distributorInfo: distributorInfo ? 'Presente' : 'No presente'
    });

    // Verificar si el usuario ya existe
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({
        success: false,
        error: 'El usuario ya existe'
      });
    }

    // ✅ CORREGIDO: Preparar datos de usuario según el rol
    const userData = {
      name,
      email,
      password,
      role: role || 'client',
      address,
      phone
    };

    // ✅ NUEVO: Si es distribuidor, agregar información específica
    if (role === 'distributor') {
      console.log('👔 Procesando registro de distribuidor...');
      
      // Validar que se proporcione información de distribuidor
      if (!distributorInfo) {
        return res.status(400).json({
          success: false,
          error: 'La información de distribuidor es requerida'
        });
      }

      // Validar campos requeridos para distribuidor
      if (!distributorInfo.companyName || !distributorInfo.companyRUT) {
        return res.status(400).json({
          success: false,
          error: 'El nombre de la empresa y RUT son requeridos para distribuidores'
        });
      }

      console.log('✅ Información de distribuidor válida:', distributorInfo);
      
      // Agregar información de distribuidor al userData
      userData.distributorInfo = {
        companyName: distributorInfo.companyName,
        companyRUT: distributorInfo.companyRUT,
        businessLicense: distributorInfo.businessLicense || '',
        creditLimit: 0,
        discountPercentage: 0,
        isApproved: false // Por defecto no aprobado, requiere revisión de admin
      };
    }

    console.log('💾 Creando usuario con datos:', {
      ...userData,
      password: '[REDACTED]'
    });

    // Crear usuario
    user = await User.create(userData);

    console.log('✅ Usuario creado exitosamente:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isDistributor: user.role === 'distributor',
      companyName: user.distributorInfo?.companyName
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    console.error('❌ Error en registro:', err);
    
    // Manejar errores específicos de validación
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }
    
    next(err);
  }
};

// @desc    Login de usuario
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validar email y password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Por favor proporcione un email y contraseña'
      });
    }

    // Verificar usuario
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Verificar si la contraseña coincide
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener usuario actual
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    // Verifica si req.user existe antes de acceder a su id
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No estás autenticado. Por favor inicia sesión.'
      });
    }

    const user = await User.findById(req.user.id);

    // Si por alguna razón el usuario no existe en la base de datos
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

// @desc    Actualizar detalles de usuario
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email
    };

    if (req.body.address) fieldsToUpdate.address = req.body.address;
    if (req.body.phone) fieldsToUpdate.phone = req.body.phone;

    // ✅ NUEVO: Permitir actualización de información de distribuidor
    if (req.body.distributorInfo && req.user && req.user.role === 'distributor') {
      fieldsToUpdate.distributorInfo = {
        ...req.user.distributorInfo,
        ...req.body.distributorInfo,
        // Preservar campos que solo el admin puede cambiar
        isApproved: req.user.distributorInfo?.isApproved || false,
        approvedBy: req.user.distributorInfo?.approvedBy,
        approvedAt: req.user.distributorInfo?.approvedAt
      };
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Actualizar contraseña
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Verificar contraseña actual
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        error: 'Contraseña incorrecta'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Logout / limpiar cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {}
  });
};

// Helper para enviar respuesta con token
const sendTokenResponse = (user, statusCode, res) => {
  // Crear token
  const token = user.getSignedJwtToken();

  // Opciones para cookie
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  // Usar cookie segura en producción
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  // ✅ MEJORADO: Incluir información más completa del usuario en la respuesta
  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    address: user.address
  };

  // Agregar información de distribuidor si aplica
  if (user.role === 'distributor' && user.distributorInfo) {
    userResponse.distributorInfo = user.distributorInfo;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: userResponse
    });
};