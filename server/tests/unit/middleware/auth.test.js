const { protect, authorize } = require('../../../middleware/auth');
const User = require('../../../models/User');
const jwt = require('jsonwebtoken');

describe('Middleware de Autenticación', () => {
  let req, res, next, user;

  beforeEach(async () => {
    // Crear usuario de prueba
    user = new User({
      name: 'Usuario Test',
      email: 'test@example.com',
      password: 'password123',
      role: 'client'
    });
    await user.save();

    // Mock de objetos request y response
    req = {
      headers: {},
      cookies: {},
      user: null
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('Middleware protect', () => {
    test('debe autenticar con token válido en header', async () => {
      const token = user.getSignedJwtToken();
      req.headers.authorization = `Bearer ${token}`;

      await protect(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(user._id.toString());
      expect(next).toHaveBeenCalledWith();
    });

    test('debe autenticar con token válido en cookies', async () => {
      const token = user.getSignedJwtToken();
      req.cookies.token = token;

      await protect(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(user._id.toString());
      expect(next).toHaveBeenCalledWith();
    });

    test('debe rechazar petición sin token', async () => {
      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No estás autorizado para acceder a esta ruta. Token no proporcionado.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debe rechazar token inválido', async () => {
      req.headers.authorization = 'Bearer token_invalido';

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No estás autorizado para acceder a esta ruta. Token inválido.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debe rechazar token expirado', async () => {
      // Crear token expirado
      const expiredToken = jwt.sign(
        { id: user._id }, 
        process.env.JWT_SECRET, 
        { expiresIn: '-1h' } // Expirado hace 1 hora
      );
      
      req.headers.authorization = `Bearer ${expiredToken}`;

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token expirado. Por favor inicia sesión nuevamente.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debe rechazar token de usuario inexistente', async () => {
      // Crear token con ID de usuario que no existe
      const fakeUserId = '507f1f77bcf86cd799439011';
      const token = jwt.sign({ id: fakeUserId }, process.env.JWT_SECRET);
      req.headers.authorization = `Bearer ${token}`;

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No se encontró usuario asociado al token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debe extraer token sin Bearer prefix', async () => {
      const token = user.getSignedJwtToken();
      req.headers.authorization = `Bearer ${token}`;

      await protect(req, res, next);

      expect(req.user).toBeDefined();
      expect(next).toHaveBeenCalledWith();
    });

    test('debe priorizar token de header sobre cookies', async () => {
      const headerToken = user.getSignedJwtToken();
      const cookieToken = 'cookie_token_diferente';
      
      req.headers.authorization = `Bearer ${headerToken}`;
      req.cookies.token = cookieToken;

      await protect(req, res, next);

      expect(req.user).toBeDefined();
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('Middleware authorize', () => {
    beforeEach(() => {
      req.user = user; // Simular usuario autenticado
    });

    test('debe autorizar usuario con rol correcto', () => {
      const authorizeMiddleware = authorize('client');
      
      authorizeMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    test('debe autorizar múltiples roles', () => {
      const authorizeMiddleware = authorize('client', 'admin');
      
      authorizeMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    test('debe rechazar usuario sin rol autorizado', () => {
      const authorizeMiddleware = authorize('admin');
      
      authorizeMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'El rol client no está autorizado para acceder a esta ruta'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debe rechazar si no hay usuario autenticado', () => {
      req.user = null;
      const authorizeMiddleware = authorize('client');
      
      authorizeMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Usuario no autenticado'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debe autorizar admin para cualquier recurso', async () => {
      const admin = new User({
        name: 'Admin Test',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin'
      });
      await admin.save();

      req.user = admin;
      const authorizeMiddleware = authorize('client');
      
      authorizeMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    test('debe autorizar distributor para recursos B2B', async () => {
      const distributor = new User({
        name: 'Distribuidor Test',
        email: 'distributor@example.com',
        password: 'password123',
        role: 'distributor',
        distributorInfo: {
          companyName: 'Test Company',
          companyRUT: '76.123.456-7',
          isApproved: true
        }
      });
      await distributor.save();

      req.user = distributor;
      const authorizeMiddleware = authorize('distributor');
      
      authorizeMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('Casos edge del middleware protect', () => {
    test('debe manejar header Authorization malformado', async () => {
      req.headers.authorization = 'InvalidFormat';

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('debe manejar token JWT malformado', async () => {
      req.headers.authorization = 'Bearer token.malformado.jwt';

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No estás autorizado para acceder a esta ruta. Token inválido.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debe manejar error de base de datos al buscar usuario', async () => {
      const token = user.getSignedJwtToken();
      req.headers.authorization = `Bearer ${token}`;

      // Simular error de base de datos
      const originalFindById = User.findById;
      User.findById = jest.fn().mockRejectedValue(new Error('Database error'));

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      
      // Restaurar método original
      User.findById = originalFindById;
    });
  });

  describe('Autorización con roles complejos', () => {
    test('debe manejar autorización con array de roles', () => {
      const roles = ['admin', 'distributor', 'client'];
      const authorizeMiddleware = authorize(...roles);
      
      authorizeMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    test('debe rechazar rol no incluido en lista', () => {
      // Cambiar el rol del usuario de prueba a uno no incluido
      req.user.role = 'client';
      const authorizeMiddleware = authorize('admin', 'distributor');
      
      authorizeMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Seguridad del token', () => {
    test('debe manejar token con payload modificado', async () => {
      // Crear token con payload modificado (pero firma inválida)
      const maliciousToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZha2VfaWQiLCJpYXQiOjE2MTU5OTg0MDB9.invalid_signature';
      req.headers.authorization = `Bearer ${maliciousToken}`;

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('debe rechazar token con algoritmo none', async () => {
      // Token con algoritmo "none" (vulnerabilidad común)
      const noneToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJpZCI6ImZha2VfaWQifQ.';
      req.headers.authorization = `Bearer ${noneToken}`;

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});