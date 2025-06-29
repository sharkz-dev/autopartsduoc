const request = require('supertest');
const express = require('express');
const authRoutes = require('../../../routes/auth.routes');
const User = require('../../../models/User');

// Configurar app de pruebas
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Controlador Auth - Integración', () => {
  
  describe('POST /api/auth/register', () => {
    test('debe registrar un cliente correctamente', async () => {
      const userData = {
        name: 'Carlos Mendoza',
        email: 'carlos@test.com',
        password: 'password123',
        role: 'client',
        address: {
          street: 'Calle Test 123',
          city: 'Santiago',
          state: 'RM',
          country: 'Chile'
        },
        phone: '+56912345678'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.role).toBe('client');
    });

    test('debe registrar un distribuidor correctamente', async () => {
      const distributorData = {
        name: 'Repuestos Central',
        email: 'distribuidor@test.com',
        password: 'password123',
        role: 'distributor',
        distributorInfo: {
          companyName: 'Repuestos Central SpA',
          companyRUT: '76.123.456-7',
          businessLicense: 'LIC-2025-001'
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(distributorData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user.role).toBe('distributor');
      expect(response.body.user.distributorInfo.companyName).toBe('Repuestos Central SpA');
      expect(response.body.user.distributorInfo.isApproved).toBe(false);
    });

    test('debe rechazar email duplicado', async () => {
      const userData = {
        name: 'Usuario 1',
        email: 'duplicado@test.com',
        password: 'password123'
      };

      // Registrar primer usuario
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Intentar registrar segundo usuario con mismo email
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...userData, name: 'Usuario 2' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('ya existe');
    });

    test('debe rechazar distribuidor sin información requerida', async () => {
      const invalidDistributor = {
        name: 'Distribuidor Test',
        email: 'test@distribuidor.com',
        password: 'password123',
        role: 'distributor'
        // distributorInfo faltante
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidDistributor)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('información de distribuidor');
    });

    test('debe validar campos requeridos', async () => {
      const incompleteData = {
        name: 'Test User'
        // email y password faltantes
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = new User({
        name: 'Usuario Test',
        email: 'login@test.com',
        password: 'password123',
        role: 'client'
      });
      await testUser.save();
    });

    test('debe iniciar sesión correctamente', async () => {
      const loginData = {
        email: 'login@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.headers['set-cookie']).toBeDefined();
    });

    test('debe rechazar credenciales incorrectas', async () => {
      const loginData = {
        email: 'login@test.com',
        password: 'password_incorrecta'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Credenciales inválidas');
    });

    test('debe rechazar usuario inexistente', async () => {
      const loginData = {
        email: 'inexistente@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Credenciales inválidas');
    });

    test('debe validar campos requeridos en login', async () => {
      const incompleteLogin = {
        email: 'test@example.com'
        // password faltante
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(incompleteLogin)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('email y contraseña');
    });
  });

  describe('GET /api/auth/me', () => {
    let testUser, authToken;

    beforeEach(async () => {
      testUser = new User({
        name: 'Usuario Autenticado',
        email: 'me@test.com',
        password: 'password123',
        role: 'client'
      });
      await testUser.save();
      authToken = testUser.getSignedJwtToken();
    });

    test('debe obtener información del usuario autenticado', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('me@test.com');
      expect(response.body.data.name).toBe('Usuario Autenticado');
    });

    test('debe rechazar petición sin token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Token no proporcionado');
    });

    test('debe manejar token inválido', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token_invalido')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/updatedetails', () => {
    let testUser, authToken;

    beforeEach(async () => {
      testUser = new User({
        name: 'Usuario Original',
        email: 'update@test.com',
        password: 'password123',
        role: 'client',
        phone: '+56911111111'
      });
      await testUser.save();
      authToken = testUser.getSignedJwtToken();
    });

    test('debe actualizar información del usuario', async () => {
      const updateData = {
        name: 'Nombre Actualizado',
        phone: '+56922222222',
        address: {
          street: 'Nueva Calle 456',
          city: 'Valparaíso'
        }
      };

      const response = await request(app)
        .put('/api/auth/updatedetails')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Nombre Actualizado');
      expect(response.body.data.phone).toBe('+56922222222');
      expect(response.body.data.address.city).toBe('Valparaíso');
    });

    test('debe actualizar información de distribuidor', async () => {
      // Crear distribuidor
      const distributor = new User({
        name: 'Distribuidor Test',
        email: 'dist@test.com',
        password: 'password123',
        role: 'distributor',
        distributorInfo: {
          companyName: 'Empresa Original',
          companyRUT: '76.123.456-7',
          isApproved: true
        }
      });
      await distributor.save();
      const distToken = distributor.getSignedJwtToken();

      const updateData = {
        distributorInfo: {
          companyName: 'Empresa Actualizada',
          businessLicense: 'LIC-2025-UPDATE'
        }
      };

      const response = await request(app)
        .put('/api/auth/updatedetails')
        .set('Authorization', `Bearer ${distToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.distributorInfo.companyName).toBe('Empresa Actualizada');
      expect(response.body.data.distributorInfo.isApproved).toBe(true); // Preservado
    });

    test('debe requerir autenticación', async () => {
      const response = await request(app)
        .put('/api/auth/updatedetails')
        .send({ name: 'Nuevo Nombre' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/updatepassword', () => {
    let testUser, authToken;

    beforeEach(async () => {
      testUser = new User({
        name: 'Usuario Password',
        email: 'password@test.com',
        password: 'password123',
        role: 'client'
      });
      await testUser.save();
      authToken = testUser.getSignedJwtToken();
    });

    test('debe actualizar contraseña correctamente', async () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: 'nueva_password456'
      };

      const response = await request(app)
        .put('/api/auth/updatepassword')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();

      // Verificar que la nueva contraseña funciona
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'password@test.com',
          password: 'nueva_password456'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    test('debe rechazar contraseña actual incorrecta', async () => {
      const passwordData = {
        currentPassword: 'password_incorrecta',
        newPassword: 'nueva_password456'
      };

      const response = await request(app)
        .put('/api/auth/updatepassword')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Contraseña incorrecta');
    });

    test('debe requerir autenticación', async () => {
      const response = await request(app)
        .put('/api/auth/updatepassword')
        .send({
          currentPassword: 'password123',
          newPassword: 'nueva_password'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/logout', () => {
    let testUser, authToken;

    beforeEach(async () => {
      testUser = new User({
        name: 'Usuario Logout',
        email: 'logout@test.com',
        password: 'password123',
        role: 'client'
      });
      await testUser.save();
      authToken = testUser.getSignedJwtToken();
    });

    test('debe cerrar sesión correctamente', async () => {
      const response = await request(app)
        .get('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({});
    });

    test('debe requerir autenticación', async () => {
      const response = await request(app)
        .get('/api/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Validaciones de email', () => {
    test('debe rechazar email con formato inválido', async () => {
      const userData = {
        name: 'Test User',
        email: 'email_invalido_sin_arroba',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Cookies de autenticación', () => {
    test('debe establecer cookie HttpOnly en login', async () => {
      const testUser = new User({
        name: 'Cookie User',
        email: 'cookie@test.com',
        password: 'password123'
      });
      await testUser.save();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'cookie@test.com',
          password: 'password123'
        })
        .expect(200);

      const setCookieHeader = response.headers['set-cookie'];
      expect(setCookieHeader).toBeDefined();
      expect(setCookieHeader[0]).toContain('HttpOnly');
    });
  });
});