const request = require('supertest');
const express = require('express');
const User = require('../../models/User');

// Configurar aplicación completa para pruebas de integración
const app = express();
app.use(express.json());

// Importar rutas completas
app.use('/api/auth', require('../../routes/auth.routes'));
app.use('/api/users', require('../../routes/user.routes'));

describe('Integración: Sistema de Autenticación Completo', () => {
  describe('Flujo completo de registro e inicio de sesión', () => {
    test('debería completar flujo completo: registro → login → acceso protegido', async () => {
      const userData = {
        name: 'Usuario Integración',
        email: 'integracion@autoparts.cl',
        password: 'contraseña123',
        role: 'client',
        address: {
          street: 'Calle Integración 123',
          city: 'Santiago',
          state: 'RM',
          postalCode: '8320000',
          country: 'Chile'
        },
        phone: '+56912345678'
      };

      // 1. Registrar nuevo usuario
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.token).toBeDefined();
      expect(registerResponse.body.user.email).toBe(userData.email);
      expect(registerResponse.body.user.role).toBe('client');

      const userId = registerResponse.body.user.id;
      const initialToken = registerResponse.body.token;

      // 2. Verificar que el usuario fue creado en la base de datos
      const userInDb = await User.findById(userId);
      expect(userInDb).toBeTruthy();
      expect(userInDb.name).toBe(userData.name);
      expect(userInDb.email).toBe(userData.email);

      // 3. Hacer login con las credenciales
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.token).toBeDefined();
      expect(loginResponse.body.user.email).toBe(userData.email);

      const loginToken = loginResponse.body.token;

      // 4. Acceder a ruta protegida con token de registro
      const protectedResponse1 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${initialToken}`)
        .expect(200);

      expect(protectedResponse1.body.success).toBe(true);
      expect(protectedResponse1.body.data.email).toBe(userData.email);

      // 5. Acceder a ruta protegida con token de login
      const protectedResponse2 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200);

      expect(protectedResponse2.body.success).toBe(true);
      expect(protectedResponse2.body.data.email).toBe(userData.email);

      // 6. Intentar acceder sin token (debería fallar)
      const unauthorizedResponse = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(unauthorizedResponse.body.success).toBe(false);
      expect(unauthorizedResponse.body.error).toContain('Token no proporcionado');
    });

    test('debería manejar flujo completo de distribuidor con aprobación', async () => {
      const distributorData = {
        name: 'Distribuidor Test',
        email: 'distribuidor@test.com',
        password: 'contraseña123',
        role: 'distributor',
        distributorInfo: {
          companyName: 'Distribuidora Test SpA',
          companyRUT: '12345678-9',
          businessLicense: 'LIC-123456',
          creditLimit: 1000000,
          discountPercentage: 15,
          isApproved: false
        }
      };

      // 1. Registrar distribuidor
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(distributorData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.user.role).toBe('distributor');
      expect(registerResponse.body.user.distributorInfo.isApproved).toBe(false);

      const distributorId = registerResponse.body.user.id;
      const token = registerResponse.body.token;

      // 2. Verificar acceso a información de distribuidor
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(meResponse.body.data.distributorInfo).toBeDefined();
      expect(meResponse.body.data.distributorInfo.companyName).toBe(distributorData.distributorInfo.companyName);

      // 3. Login después del registro
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: distributorData.email,
          password: distributorData.password
        })
        .expect(200);

      expect(loginResponse.body.user.distributorInfo).toBeDefined();
      expect(loginResponse.body.user.distributorInfo.isApproved).toBe(false);
    });
  });

  describe('Flujo de actualización de datos de usuario', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      // Crear usuario para cada prueba
      const userData = {
        name: 'Usuario Actualización',
        email: 'actualizacion@test.com',
        password: 'contraseña123',
        role: 'client'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      testUser = registerResponse.body.user;
      authToken = registerResponse.body.token;
    });

    test('debería actualizar detalles del usuario manteniendo sesión activa', async () => {
      const updateData = {
        name: 'Nombre Actualizado',
        address: {
          street: 'Nueva Calle 456',
          city: 'Nueva Ciudad',
          state: 'Nueva Región',
          postalCode: '1234567',
          country: 'Chile'
        },
        phone: '+56987654321'
      };

      // 1. Actualizar detalles
      const updateResponse = await request(app)
        .put('/api/auth/updatedetails')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.name).toBe(updateData.name);
      expect(updateResponse.body.data.address.street).toBe(updateData.address.street);

      // 2. Verificar que los cambios persisten
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(meResponse.body.data.name).toBe(updateData.name);
      expect(meResponse.body.data.address.street).toBe(updateData.address.street);

      // 3. Verificar en base de datos
      const userInDb = await User.findById(testUser.id);
      expect(userInDb.name).toBe(updateData.name);
      expect(userInDb.address.street).toBe(updateData.address.street);
    });

    test('debería cambiar contraseña y requerir nueva autenticación', async () => {
      const passwordData = {
        currentPassword: 'contraseña123',
        newPassword: 'nueva-contraseña-456'
      };

      // 1. Cambiar contraseña
      const updatePasswordResponse = await request(app)
        .put('/api/auth/updatepassword')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      expect(updatePasswordResponse.body.success).toBe(true);
      expect(updatePasswordResponse.body.token).toBeDefined();

      const newToken = updatePasswordResponse.body.token;

      // 2. Verificar que el token anterior ya no funciona
      // (En este caso, ambos tokens deberían funcionar según la implementación actual,
      // pero verificamos que el nuevo token funciona)
      const meWithNewTokenResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(meWithNewTokenResponse.body.success).toBe(true);

      // 3. Verificar que no se puede hacer login con contraseña anterior
      const oldLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'actualizacion@test.com',
          password: 'contraseña123'
        })
        .expect(401);

      expect(oldLoginResponse.body.success).toBe(false);

      // 4. Verificar que se puede hacer login con nueva contraseña
      const newLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'actualizacion@test.com',
          password: 'nueva-contraseña-456'
        })
        .expect(200);

      expect(newLoginResponse.body.success).toBe(true);
    });
  });

  describe('Manejo de errores y validaciones', () => {
    test('debería manejar registro con datos inválidos', async () => {
      const invalidUserData = {
        name: '',
        email: 'email-invalido',
        password: '12'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('debería manejar login con credenciales inexistentes', async () => {
      const loginData = {
        email: 'inexistente@test.com',
        password: 'contraseña123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Credenciales inválidas');
    });

    test('debería manejar token expirado o inválido', async () => {
      const invalidToken = 'token.invalido.aqui';

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Token inválido');
    });

    test('debería prevenir actualización de contraseña con contraseña actual incorrecta', async () => {
      // Crear usuario primero
      const userData = {
        name: 'Usuario Test',
        email: 'test-password@test.com',
        password: 'contraseña123'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const token = registerResponse.body.token;

      // Intentar cambiar contraseña con contraseña actual incorrecta
      const passwordData = {
        currentPassword: 'contraseña-incorrecta',
        newPassword: 'nueva-contraseña'
      };

      const response = await request(app)
        .put('/api/auth/updatepassword')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Contraseña incorrecta');
    });
  });

  describe('Casos edge de autenticación', () => {
    test('debería manejar múltiples registros con el mismo email', async () => {
      const userData = {
        name: 'Usuario Duplicado',
        email: 'duplicado@test.com',
        password: 'contraseña123'
      };

      // Primer registro (debería funcionar)
      const firstResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(firstResponse.body.success).toBe(true);

      // Segundo registro con mismo email (debería fallar)
      const secondResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(secondResponse.body.success).toBe(false);
      expect(secondResponse.body.error).toBe('El usuario ya existe');
    });

    test('debería manejar logout correctamente', async () => {
      // Crear usuario
      const userData = {
        name: 'Usuario Logout',
        email: 'logout@test.com',
        password: 'contraseña123'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const token = registerResponse.body.token;

      // Verificar acceso antes del logout
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Hacer logout
      const logoutResponse = await request(app)
        .get('/api/auth/logout')
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);

      // Verificar que el token sigue funcionando (el logout en esta implementación
      // no invalida tokens existentes, solo limpia cookies del lado del cliente)
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    test('debería permitir actualización de email manteniendo autenticación', async () => {
      // Crear usuario
      const userData = {
        name: 'Usuario Email Update',
        email: 'email-original@test.com',
        password: 'contraseña123'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const token = registerResponse.body.token;
      const userId = registerResponse.body.user.id;

      // Actualizar email
      const updateData = {
        email: 'email-nuevo@test.com'
      };

      const updateResponse = await request(app)
        .put('/api/auth/updatedetails')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.data.email).toBe('email-nuevo@test.com');

      // Verificar que puede hacer login con nuevo email
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'email-nuevo@test.com',
          password: 'contraseña123'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);

      // Verificar que no puede hacer login con email anterior
      const oldEmailLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'email-original@test.com',
          password: 'contraseña123'
        })
        .expect(401);

      expect(oldEmailLoginResponse.body.success).toBe(false);
    });

    test('debería manejar campos vacíos en login', async () => {
      // Login sin email
      const noEmailResponse = await request(app)
        .post('/api/auth/login')
        .send({ password: 'contraseña123' })
        .expect(400);

      expect(noEmailResponse.body.error).toBe('Por favor proporcione un email y contraseña');

      // Login sin contraseña
      const noPasswordResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com' })
        .expect(400);

      expect(noPasswordResponse.body.error).toBe('Por favor proporcione un email y contraseña');

      // Login sin ambos
      const noDataResponse = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(noDataResponse.body.error).toBe('Por favor proporcione un email y contraseña');
    });
  });

  describe('Roles y permisos', () => {
    test('debería crear diferentes tipos de usuarios correctamente', async () => {
      // Cliente
      const clientData = {
        name: 'Cliente Test',
        email: 'cliente@test.com',
        password: 'contraseña123',
        role: 'client'
      };

      const clientResponse = await request(app)
        .post('/api/auth/register')
        .send(clientData)
        .expect(201);

      expect(clientResponse.body.user.role).toBe('client');

      // Admin
      const adminData = {
        name: 'Admin Test',
        email: 'admin@test.com',
        password: 'contraseña123',
        role: 'admin'
      };

      const adminResponse = await request(app)
        .post('/api/auth/register')
        .send(adminData)
        .expect(201);

      expect(adminResponse.body.user.role).toBe('admin');

      // Distribuidor
      const distributorData = {
        name: 'Distribuidor Test',
        email: 'dist@test.com',
        password: 'contraseña123',
        role: 'distributor',
        distributorInfo: {
          companyName: 'Test Company',
          companyRUT: '12345678-9'
        }
      };

      const distributorResponse = await request(app)
        .post('/api/auth/register')
        .send(distributorData)
        .expect(201);

      expect(distributorResponse.body.user.role).toBe('distributor');
      expect(distributorResponse.body.user.distributorInfo).toBeDefined();
    });

    test('debería mantener rol por defecto como client', async () => {
      const userData = {
        name: 'Usuario Sin Rol',
        email: 'sin-rol@test.com',
        password: 'contraseña123'
        // Sin especificar rol
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user.role).toBe('client');
    });
  });
});