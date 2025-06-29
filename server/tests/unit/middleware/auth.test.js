const authMiddleware = require('../../../middleware/auth');
const jwt = require('jsonwebtoken');

describe('Middleware de Autenticación', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      cookies: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('protect middleware', () => {
    test('debería autenticar con token válido en header', async () => {
      const testUser = await global.testHelpers.createTestUser();
      const token = global.testHelpers.generateTestToken(testUser._id);
      
      req.headers.authorization = `Bearer ${token}`;
      
      await authMiddleware.protect(req, res, next);
      
      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(testUser._id.toString());
    });

    test('debería autenticar con token válido en cookies', async () => {
      const testUser = await global.testHelpers.createTestUser();
      const token = global.testHelpers.generateTestToken(testUser._id);
      
      req.cookies.token = token;
      
      await authMiddleware.protect(req, res, next);
      
      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(testUser._id.toString());
    });

    test('debería fallar sin token', async () => {
      await authMiddleware.protect(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No estás autorizado para acceder a esta ruta. Token no proporcionado.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debería fallar con token inválido', async () => {
      req.headers.authorization = 'Bearer token-invalido';
      
      await authMiddleware.protect(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No estás autorizado para acceder a esta ruta. Token inválido.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debería fallar con token expirado', async () => {
      const testUser = await global.testHelpers.createTestUser();
      
      // Crear token expirado
      const expiredToken = jwt.sign(
        { id: testUser._id }, 
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expirado hace una hora
      );
      
      req.headers.authorization = `Bearer ${expiredToken}`;
      
      await authMiddleware.protect(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token expirado. Por favor inicia sesión nuevamente.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debería fallar con usuario inexistente', async () => {
      // Crear token con ID de usuario inexistente
      const fakeToken = jwt.sign(
        { id: '507f1f77bcf86cd799439011' }, 
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      req.headers.authorization = `Bearer ${fakeToken}`;
      
      await authMiddleware.protect(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No se encontró usuario asociado al token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debería manejar header de autorización malformado', async () => {
      req.headers.authorization = 'InvalidFormat token123';
      
      await authMiddleware.protect(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No estás autorizado para acceder a esta ruta. Token inválido.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debería priorizar token del header sobre cookies', async () => {
      const testUser = await global.testHelpers.createTestUser();
      const validToken = global.testHelpers.generateTestToken(testUser._id);
      const invalidToken = 'token-invalido';
      
      req.headers.authorization = `Bearer ${validToken}`;
      req.cookies.token = invalidToken;
      
      await authMiddleware.protect(req, res, next);
      
      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(testUser._id.toString());
    });
  });

  describe('authorize middleware', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await global.testHelpers.createTestUser();
      req.user = testUser;
    });

    test('debería permitir acceso con rol autorizado', () => {
      const authorizeAdmin = authMiddleware.authorize('admin', 'client');
      req.user.role = 'admin';
      
      authorizeAdmin(req, res, next);
      
      expect(next).toHaveBeenCalledWith();
    });

    test('debería permitir acceso con uno de múltiples roles', () => {
      const authorizeMultiple = authMiddleware.authorize('admin', 'distributor', 'client');
      req.user.role = 'distributor';
      
      authorizeMultiple(req, res, next);
      
      expect(next).toHaveBeenCalledWith();
    });

    test('debería denegar acceso con rol no autorizado', () => {
      const authorizeAdmin = authMiddleware.authorize('admin');
      req.user.role = 'client';
      
      authorizeAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'El rol client no está autorizado para acceder a esta ruta'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debería fallar sin usuario autenticado', () => {
      const authorizeAdmin = authMiddleware.authorize('admin');
      req.user = null;
      
      authorizeAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Usuario no autenticado'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debería manejar usuario sin rol definido', () => {
      const authorizeAdmin = authMiddleware.authorize('admin');
      delete req.user.role;
      
      authorizeAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'El rol undefined no está autorizado para acceder a esta ruta'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Integración protect + authorize', () => {
    test('debería funcionar en secuencia correctamente', async () => {
      const adminUser = await global.testHelpers.createTestUser({
        ...global.testUtils.validAdmin,
        email: 'admin-test@autoparts.cl'
      });
      const token = global.testHelpers.generateTestToken(adminUser._id);
      
      req.headers.authorization = `Bearer ${token}`;
      
      // Simular middleware protect
      await authMiddleware.protect(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      
      // Reset next mock
      next.mockClear();
      
      // Simular middleware authorize
      const authorizeAdmin = authMiddleware.authorize('admin');
      authorizeAdmin(req, res, next);
      
      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user.role).toBe('admin');
    });

    test('debería fallar si protect falla antes de authorize', async () => {
      req.headers.authorization = 'Bearer token-invalido';
      
      // Simular middleware protect (debería fallar)
      await authMiddleware.protect(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      
      // authorize no debería ejecutarse si protect falla
    });
  });

  describe('Casos edge', () => {
    test('debería manejar token con espacios extra', async () => {
      const testUser = await global.testHelpers.createTestUser();
      const token = global.testHelpers.generateTestToken(testUser._id);
      
      req.headers.authorization = `  Bearer   ${token}  `;
      
      await authMiddleware.protect(req, res, next);
      
      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
    });

    test('debería manejar header Authorization con mayúsculas mixtas', async () => {
      const testUser = await global.testHelpers.createTestUser();
      const token = global.testHelpers.generateTestToken(testUser._id);
      
      req.headers.Authorization = `Bearer ${token}`;
      
      await authMiddleware.protect(req, res, next);
      
      // Debería fallar porque Express es case-sensitive para headers
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('debería manejar múltiples tokens en header (tomar el primero)', async () => {
      const testUser = await global.testHelpers.createTestUser();
      const validToken = global.testHelpers.generateTestToken(testUser._id);
      
      req.headers.authorization = `Bearer ${validToken} extra-content`;
      
      await authMiddleware.protect(req, res, next);
      
      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
    });
  });

  describe('Logging y debugging', () => {
    test('debería logear información de token decodificado', async () => {
      const testUser = await global.testHelpers.createTestUser();
      const token = global.testHelpers.generateTestToken(testUser._id);
      
      // Spy en console.log para verificar logging
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      req.headers.authorization = `Bearer ${token}`;
      
      await authMiddleware.protect(req, res, next);
      
      expect(consoleSpy).toHaveBeenCalledWith('Token decodificado:', expect.objectContaining({
        id: testUser._id.toString()
      }));
      
      consoleSpy.mockRestore();
    });

    test('debería logear errores de autenticación', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      req.headers.authorization = 'Bearer token-invalido';
      
      await authMiddleware.protect(req, res, next);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error en middleware de autenticación:', 
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });
  });
});