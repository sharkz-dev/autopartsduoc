const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// Proteger rutas
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Obtener token del header
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // Si el token está en cookies
    token = req.cookies.token;
  }

  // Verificar si el token existe
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No estás autorizado para acceder a esta ruta. Token no proporcionado.'
    });
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Log para debugging
    console.log('Token decodificado:', decoded);

    // Buscar usuario
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'No se encontró usuario asociado al token'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Error en middleware de autenticación:', err);
    
    // Error específico para token expirado
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado. Por favor inicia sesión nuevamente.'
      });
    }
    
    // Otros errores de token
    return res.status(401).json({
      success: false,
      error: 'No estás autorizado para acceder a esta ruta. Token inválido.'
    });
  }
};

// Autorización por rol
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }
    
    // Verificar si el usuario tiene uno de los roles permitidos
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `El rol ${req.user.role} no está autorizado para acceder a esta ruta`
      });
    }
    next();
  };
};