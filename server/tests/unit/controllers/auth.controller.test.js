const request = require('supertest');
const express = require('express');
const authController = require('../../../controllers/auth.controller');
const User = require('../../../models/User');
const jwt = require('jsonwebtoken');

// Configurar aplicación Express para pruebas
const app = express();
app.use(express.json());

// Configurar rutas de prueba
app.post('/register', authController.register);
app.post('/login', authController.login);
app.get('/me', require('../../../middleware/auth').protect, authController.getMe);
app.put('/updatedetails', require('../../../middleware/auth').protect, authController.updateDetails);
app.put('/updatepassword', require('../../../middleware/auth').protect, authController.updatePassword);
app.get('/logout', authController.logout);

describe('Controlador Auth', () => {
  describe('POST /register', () => {
    test('debería registrar un nuevo usuario cliente', async () => {
      const userData = global.testUtils.validUser;
      
      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.role).toBe('client');
      
      // Verificar que el usuario fue creado en la base de datos
      const userInDb = await User.findOne({ email: userData.email });
      expect(userInDb).toBeTruthy();
      expect(userInDb.name).toBe(userData.name);
    });

    test('debería registrar un nuevo distribuidor', async () => {
      const distributorData = global.testUtils.validDistributor;
      
      const response = await request(app)
        .post('/register')
        .send(distributorData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.user.role).toBe('distributor');
      expect(response.body.user.distributorInfo).toBeDefined();
      expect(response.body.user.distributorInfo.companyName).toBe(distributorData.distributorInfo.companyName);
    });

    test('debería fallar con email duplicado', async () => {
      const userData = global.testUtils.validUser;
      
      // Crear primer usuario
      await request(app)
        .post('/register')
        .send(userData)
        .expect(201);
      
      // Intentar crear segundo usuario con mismo email
      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('El usuario ya existe');
    });

    test('debería fallar sin información de distribuidor', async () => {
      const invalidDistributorData = {
        ...global.testUtils.validUser,
        role: 'distributor'
        // Sin distributorInfo
      };
      
      const response = await request(app)
        .post('/register')
        .send(invalidDistributorData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('La información de distribuidor es requerida');
    });

    test('debería fallar sin nombre de empresa para distribuidor', async () => {
      const invalidDistributorData = {
        ...global.testUtils.validUser,
        role: 'distributor',
        distributorInfo: {
          companyRUT: '12345678-9'
          // Sin companyName
        }
      };
      
      const response = await request(app)
        .post('/register')
        .send(invalidDistributorData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('El nombre de la empresa y RUT son requeridos para distribuidores');
    });

    test('debería fallar con datos inválidos', async () => {
      const invalidData = {
        name: '', // Nombre vacío
        email: 'email-invalido', // Email inválido
        password: '123' // Contraseña muy corta
      };
      
      const response = await request(app)
        .post('/register')
        .send(invalidData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await global.testHelpers.createTestUser();
    });

    test('debería autenticar usuario con credenciales válidas', async () => {
      const loginData = {
        email: global.testUtils.validUser.email,
        password: global.testUtils.validUser.password
      };
      
      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(loginData.email);
      
      // Verificar que el token es válido
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(testUser._id.toString());
    });

    test('debería fallar con email incorrecto', async () => {
      const loginData = {
        email: 'email-inexistente@test.com',
        password: global.testUtils.validUser.password
      };
      
      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Credenciales inválidas');
    });

    test('debería fallar con contraseña incorrecta', async () => {
      const loginData = {
        email: global.testUtils.validUser.email,
        password: 'contraseña-incorrecta'
      };
      
      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Credenciales inválidas');
    });

    test('debería fallar sin email', async () => {
      const loginData = {
        password: global.testUtils.validUser.password
      };
      
      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Por favor proporcione un email y contraseña');
    });

    test('debería fallar sin contraseña', async () => {
      const loginData = {
        email: global.testUtils.validUser.email
      };
      
      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Por favor proporcione un email y contraseña');
    });
  });

  describe('GET /me', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      testUser = await global.testHelpers.createTestUser();
      authToken = global.testHelpers.generateTestToken(testUser._id);
    });

    test('debería retornar información del usuario autenticado', async () => {
      const response = await request(app)
        .get('/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data._id.toString()).toBe(testUser._id.toString());
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.password).toBeUndefined(); // No debe incluir contraseña
    });

    test('debería fallar sin token de autenticación', async () => {
      const response = await request(app)
        .get('/me')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Token no proporcionado');
    });

    test('debería fallar con token inválido', async () => {
      const response = await request(app)
        .get('/me')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Token inválido');
    });
  });

  describe('PUT /updatedetails', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      testUser = await global.testHelpers.createTestUser();
      authToken = global.testHelpers.generateTestToken(testUser._id);
    });

    test('debería actualizar detalles del usuario', async () => {
      const updateData = {
        name: 'Nombre Actualizado',
        email: 'nuevo-email@test.com',
        address: {
          street: 'Nueva Calle 456',
          city: 'Nueva Ciudad'
        }
      };
      
      const response = await request(app)
        .put('/updatedetails')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.email).toBe(updateData.email);
      expect(response.body.data.address.street).toBe(updateData.address.street);
    });

    test('debería actualizar información de distribuidor', async () => {
      // Crear distribuidor
      const distributor = await global.testHelpers.createTestUser(global.testUtils.validDistributor);
      const distributorToken = global.testHelpers.generateTestToken(distributor._id);
      
      const updateData = {
        distributorInfo: {
          companyName: 'Nueva Empresa SpA',
          businessLicense: 'NUEVA-LIC-456'
        }
      };
      
      const response = await request(app)
        .put('/updatedetails')
        .set('Authorization', `Bearer ${distributorToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.distributorInfo.companyName).toBe(updateData.distributorInfo.companyName);
      expect(response.body.data.distributorInfo.businessLicense).toBe(updateData.distributorInfo.businessLicense);
      // Debe preservar campos críticos
      expect(response.body.data.distributorInfo.isApproved).toBe(true);
    });

    test('debería fallar sin autenticación', async () => {
      const updateData = {
        name: 'Nombre Actualizado'
      };
      
      const response = await request(app)
        .put('/updatedetails')
        .send(updateData)
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /updatepassword', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      testUser = await global.testHelpers.createTestUser();
      authToken = global.testHelpers.generateTestToken(testUser._id);
    });

    test('debería actualizar contraseña con datos válidos', async () => {
      const updateData = {
        currentPassword: global.testUtils.validUser.password,
        newPassword: 'nueva-contraseña-123'
      };
      
      const response = await request(app)
        .put('/updatepassword')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      
      // Verificar que la nueva contraseña funciona
      const loginResponse = await request(app)
        .post('/login')
        .send({
          email: testUser.email,
          password: updateData.newPassword
        })
        .expect(200);
      
      expect(loginResponse.body.success).toBe(true);
    });

    test('debería fallar con contraseña actual incorrecta', async () => {
      const updateData = {
        currentPassword: 'contraseña-incorrecta',
        newPassword: 'nueva-contraseña-123'
      };
      
      const response = await request(app)
        .put('/updatepassword')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Contraseña incorrecta');
    });

    test('debería fallar sin autenticación', async () => {
      const updateData = {
        currentPassword: global.testUtils.validUser.password,
        newPassword: 'nueva-contraseña-123'
      };
      
      const response = await request(app)
        .put('/updatepassword')
        .send(updateData)
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /logout', () => {
    test('debería retornar respuesta exitosa de logout', async () => {
      const response = await request(app)
        .get('/logout')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({});
    });
  });
});