const request = require('supertest');
const express = require('express');
const userController = require('../../../controllers/user.controller');
const User = require('../../../models/User');

// Configurar aplicación Express para pruebas
const app = express();
app.use(express.json());

// Mock del middleware de autenticación
const mockAdminAuth = (req, res, next) => {
  req.user = { 
    id: 'test-admin-id', 
    role: 'admin',
    _id: 'test-admin-id'
  };
  next();
};

// Configurar rutas de prueba
app.get('/users', mockAdminAuth, userController.getUsers);
app.get('/users/:id', mockAdminAuth, userController.getUser);
app.put('/users/:id', mockAdminAuth, userController.updateUser);
app.delete('/users/:id', mockAdminAuth, userController.deleteUser);

describe('Controlador User', () => {
  let testUser1, testUser2, testDistributor;

  beforeEach(async () => {
    // Crear usuarios de prueba
    testUser1 = await global.testHelpers.createTestUser();
    testUser2 = await global.testHelpers.createTestUser({
      name: 'Usuario 2',
      email: 'user2@test.com'
    });
    testDistributor = await global.testHelpers.createTestUser(global.testUtils.validDistributor);
  });

  describe('GET /users', () => {
    test('debería retornar lista de todos los usuarios', async () => {
      const response = await request(app)
        .get('/users')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBe(3); // testUser1, testUser2, testDistributor
      
      // Verificar que no incluye contraseñas
      response.body.data.forEach(user => {
        expect(user.password).toBeUndefined();
      });
    });

    test('debería incluir diferentes tipos de usuarios', async () => {
      const response = await request(app)
        .get('/users')
        .expect(200);
      
      const users = response.body.data;
      const roles = users.map(user => user.role);
      
      expect(roles).toContain('client');
      expect(roles).toContain('distributor');
    });

    test('debería incluir información de distribuidor para usuarios distribuidores', async () => {
      const response = await request(app)
        .get('/users')
        .expect(200);
      
      const distributor = response.body.data.find(user => user.role === 'distributor');
      expect(distributor).toBeDefined();
      expect(distributor.distributorInfo).toBeDefined();
      expect(distributor.distributorInfo.companyName).toBeDefined();
      expect(distributor.distributorInfo.companyRUT).toBeDefined();
    });
  });

  describe('GET /users/:id', () => {
    test('debería retornar un usuario específico', async () => {
      const response = await request(app)
        .get(`/users/${testUser1._id}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data._id.toString()).toBe(testUser1._id.toString());
      expect(response.body.data.name).toBe(testUser1.name);
      expect(response.body.data.email).toBe(testUser1.email);
      expect(response.body.data.password).toBeUndefined();
    });

    test('debería retornar información completa de distribuidor', async () => {
      const response = await request(app)
        .get(`/users/${testDistributor._id}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('distributor');
      expect(response.body.data.distributorInfo).toBeDefined();
      expect(response.body.data.distributorInfo.companyName).toBe('Distribuidora Test SpA');
      expect(response.body.data.distributorInfo.isApproved).toBe(true);
    });

    test('debería fallar con ID inexistente', async () => {
      const response = await request(app)
        .get('/users/507f1f77bcf86cd799439011')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Usuario no encontrado');
    });

    test('debería fallar con ID inválido', async () => {
      const response = await request(app)
        .get('/users/id-invalido')
        .expect(500);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /users/:id', () => {
    test('debería actualizar información básica del usuario', async () => {
      const updateData = {
        name: 'Nombre Actualizado',
        email: 'nuevo-email@test.com',
        phone: '+56987654321'
      };

      const response = await request(app)
        .put(`/users/${testUser1._id}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.email).toBe(updateData.email);
      expect(response.body.data.phone).toBe(updateData.phone);
      expect(response.body.data.password).toBeUndefined();
    });

    test('debería actualizar dirección del usuario', async () => {
      const updateData = {
        address: {
          street: 'Nueva Calle 456',
          city: 'Nueva Ciudad',
          state: 'Nueva Región',
          postalCode: '1234567',
          country: 'Chile'
        }
      };

      const response = await request(app)
        .put(`/users/${testUser1._id}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.address.street).toBe(updateData.address.street);
      expect(response.body.data.address.city).toBe(updateData.address.city);
    });

    test('debería cambiar rol de usuario', async () => {
      const updateData = {
        role: 'admin'
      };

      const response = await request(app)
        .put(`/users/${testUser1._id}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('admin');
    });

    test('no debería permitir actualizar contraseña', async () => {
      const updateData = {
        name: 'Nuevo Nombre',
        password: 'nueva-contraseña'
      };

      const response = await request(app)
        .put(`/users/${testUser1._id}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      
      // Verificar que la contraseña no cambió
      const userInDb = await User.findById(testUser1._id).select('+password');
      const originalPassword = testUser1.password || 'contraseña123';
      const isOriginalPassword = await userInDb.matchPassword(originalPassword);
      expect(isOriginalPassword).toBe(true);
    });

    test('debería actualizar información de distribuidor', async () => {
      const updateData = {
        distributorInfo: {
          companyName: 'Nueva Empresa SpA',
          creditLimit: 2000000,
          discountPercentage: 20,
          isApproved: false
        }
      };

      const response = await request(app)
        .put(`/users/${testDistributor._id}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.distributorInfo.companyName).toBe(updateData.distributorInfo.companyName);
      expect(response.body.data.distributorInfo.creditLimit).toBe(updateData.distributorInfo.creditLimit);
      expect(response.body.data.distributorInfo.isApproved).toBe(updateData.distributorInfo.isApproved);
    });

    test('debería fallar con usuario inexistente', async () => {
      const updateData = {
        name: 'Nuevo Nombre'
      };

      const response = await request(app)
        .put('/users/507f1f77bcf86cd799439011')
        .send(updateData)
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Usuario no encontrado');
    });

    test('debería fallar con datos inválidos', async () => {
      const updateData = {
        email: 'email-invalido'
      };

      const response = await request(app)
        .put(`/users/${testUser1._id}`)
        .send(updateData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });

    test('debería manejar email duplicado', async () => {
      const updateData = {
        email: testUser2.email // Email ya existente
      };

      const response = await request(app)
        .put(`/users/${testUser1._id}`)
        .send(updateData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /users/:id', () => {
    test('debería eliminar un usuario existente', async () => {
      const response = await request(app)
        .delete(`/users/${testUser1._id}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({});
      
      // Verificar que fue eliminado de la base de datos
      const userInDb = await User.findById(testUser1._id);
      expect(userInDb).toBeNull();
    });

    test('debería eliminar distribuidor con información completa', async () => {
      const response = await request(app)
        .delete(`/users/${testDistributor._id}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      
      // Verificar que fue eliminado
      const userInDb = await User.findById(testDistributor._id);
      expect(userInDb).toBeNull();
    });

    test('debería fallar con usuario inexistente', async () => {
      const response = await request(app)
        .delete('/users/507f1f77bcf86cd799439011')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Usuario no encontrado');
    });

    test('debería fallar con ID inválido', async () => {
      const response = await request(app)
        .delete('/users/id-invalido')
        .expect(500);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('Casos edge y validaciones', () => {
    test('debería manejar actualización parcial de dirección', async () => {
      const updateData = {
        address: {
          street: 'Solo nueva calle'
          // Solo actualizar calle, mantener resto
        }
      };

      const response = await request(app)
        .put(`/users/${testUser1._id}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.address.street).toBe(updateData.address.street);
    });

    test('debería preservar campos no enviados en la actualización', async () => {
      const originalEmail = testUser1.email;
      const updateData = {
        name: 'Solo actualizar nombre'
      };

      const response = await request(app)
        .put(`/users/${testUser1._id}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.email).toBe(originalEmail);
    });

    test('debería manejar actualización con objeto vacío', async () => {
      const response = await request(app)
        .put(`/users/${testUser1._id}`)
        .send({})
        .expect(200);
      
      expect(response.body.success).toBe(true);
      // Los datos deberían permanecer igual
      expect(response.body.data.name).toBe(testUser1.name);
      expect(response.body.data.email).toBe(testUser1.email);
    });

    test('debería ignorar campos no válidos en actualización', async () => {
      const updateData = {
        name: 'Nombre válido',
        _id: 'nuevo-id-malicioso',
        createdAt: new Date(),
        invalidField: 'valor-inválido'
      };

      const response = await request(app)
        .put(`/users/${testUser1._id}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data._id.toString()).toBe(testUser1._id.toString()); // No cambió
    });
  });

  describe('Integración con diferentes roles', () => {
    test('debería manejar actualización de cliente a distribuidor', async () => {
      const updateData = {
        role: 'distributor',
        distributorInfo: {
          companyName: 'Nueva Distribuidora',
          companyRUT: '12345678-9',
          businessLicense: 'LIC-123',
          creditLimit: 500000,
          discountPercentage: 10,
          isApproved: false
        }
      };

      const response = await request(app)
        .put(`/users/${testUser1._id}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('distributor');
      expect(response.body.data.distributorInfo).toBeDefined();
      expect(response.body.data.distributorInfo.companyName).toBe(updateData.distributorInfo.companyName);
    });

    test('debería manejar cambio de distribuidor a cliente', async () => {
      const updateData = {
        role: 'client'
      };

      const response = await request(app)
        .put(`/users/${testDistributor._id}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('client');
      // La información de distribuidor debería mantenerse pero no ser relevante
    });
  });

  describe('Filtrado de datos sensibles', () => {
    test('todas las respuestas deberían excluir contraseñas', async () => {
      // GET /users
      let response = await request(app).get('/users').expect(200);
      response.body.data.forEach(user => {
        expect(user.password).toBeUndefined();
      });

      // GET /users/:id
      response = await request(app).get(`/users/${testUser1._id}`).expect(200);
      expect(response.body.data.password).toBeUndefined();

      // PUT /users/:id
      response = await request(app)
        .put(`/users/${testUser1._id}`)
        .send({ name: 'Test' })
        .expect(200);
      expect(response.body.data.password).toBeUndefined();
    });

    test('no debería exponer tokens de reset de contraseña', async () => {
      // Simular token de reset
      await User.findByIdAndUpdate(testUser1._id, {
        resetPasswordToken: 'token-secreto',
        resetPasswordExpire: Date.now() + 3600000
      });

      const response = await request(app)
        .get(`/users/${testUser1._id}`)
        .expect(200);
      
      expect(response.body.data.resetPasswordToken).toBeUndefined();
      expect(response.body.data.resetPasswordExpire).toBeUndefined();
    });
  });
});