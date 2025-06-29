const User = require('../../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Modelo User', () => {
  // Datos de prueba
  const userData = {
    name: 'Carlos Mendoza',
    email: 'carlos@example.com',
    password: 'password123',
    role: 'client'
  };

  const distributorData = {
    name: 'Repuestos Central',
    email: 'distribuidor@example.com',
    password: 'password123',
    role: 'distributor',
    distributorInfo: {
      companyName: 'Repuestos Central SpA',
      companyRUT: '76.123.456-7',
      creditLimit: 500000,
      discountPercentage: 15,
      isApproved: true
    }
  };

  describe('Creación de usuarios', () => {
    test('debe crear un cliente correctamente', async () => {
      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe('client');
      expect(savedUser._id).toBeDefined();
      expect(savedUser.createdAt).toBeDefined();
    });

    test('debe crear un distribuidor correctamente', async () => {
      const distributor = new User(distributorData);
      const savedDistributor = await distributor.save();

      expect(savedDistributor.name).toBe(distributorData.name);
      expect(savedDistributor.role).toBe('distributor');
      expect(savedDistributor.distributorInfo.companyName).toBe('Repuestos Central SpA');
      expect(savedDistributor.distributorInfo.isApproved).toBe(true);
    });

    test('debe encriptar la contraseña automáticamente', async () => {
      const user = new User(userData);
      await user.save();

      expect(user.password).not.toBe(userData.password);
      expect(user.password.length).toBeGreaterThan(50);
    });

    test('debe requerir campos obligatorios', async () => {
      const user = new User({});
      
      await expect(user.save()).rejects.toThrow();
    });

    test('debe validar formato de email', async () => {
      const invalidUser = new User({
        ...userData,
        email: 'email_invalido'
      });

      await expect(invalidUser.save()).rejects.toThrow();
    });

    test('debe asignar rol por defecto como client', async () => {
      const user = new User({
        name: 'Usuario Test',
        email: 'test@example.com',
        password: 'password123'
      });
      
      await user.save();
      expect(user.role).toBe('client');
    });
  });

  describe('Métodos del usuario', () => {
    let user;

    beforeEach(async () => {
      user = new User(userData);
      await user.save();
    });

    test('getSignedJwtToken debe generar un token válido', () => {
      const token = user.getSignedJwtToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(user._id.toString());
    });

    test('matchPassword debe validar contraseña correcta', async () => {
      const isMatch = await user.matchPassword('password123');
      expect(isMatch).toBe(true);
    });

    test('matchPassword debe rechazar contraseña incorrecta', async () => {
      const isMatch = await user.matchPassword('password_incorrecta');
      expect(isMatch).toBe(false);
    });
  });

  describe('Métodos de distribuidor', () => {
    let distributor;

    beforeEach(async () => {
      distributor = new User(distributorData);
      await distributor.save();
    });

    test('isApprovedDistributor debe retornar true para distribuidor aprobado', () => {
      expect(distributor.isApprovedDistributor()).toBe(true);
    });

    test('isApprovedDistributor debe retornar false para cliente regular', async () => {
      const client = new User(userData);
      await client.save();
      
      expect(client.isApprovedDistributor()).toBe(false);
    });

    test('getCartType debe retornar B2B para distribuidor', () => {
      expect(distributor.getCartType()).toBe('B2B');
    });

    test('getCartType debe retornar B2C para cliente', async () => {
      const client = new User(userData);
      await client.save();
      
      expect(client.getCartType()).toBe('B2C');
    });

    test('canAccessWholesalePrices debe retornar true para distribuidor aprobado', () => {
      expect(distributor.canAccessWholesalePrices()).toBe(true);
    });

    test('canAccessWholesalePrices debe retornar false para distribuidor no aprobado', async () => {
      const unapprovedDistributor = new User({
        ...distributorData,
        email: 'no_aprobado@example.com',
        distributorInfo: {
          ...distributorData.distributorInfo,
          isApproved: false
        }
      });
      await unapprovedDistributor.save();
      
      expect(unapprovedDistributor.canAccessWholesalePrices()).toBe(false);
    });
  });

  describe('Validaciones de distribuidor', () => {
    test('debe requerir companyName para distribuidor', async () => {
      const invalidDistributor = new User({
        name: 'Test Distribuidor',
        email: 'test@distribuidor.com',
        password: 'password123',
        role: 'distributor',
        distributorInfo: {
          companyRUT: '76.123.456-7'
          // companyName faltante
        }
      });

      await expect(invalidDistributor.save()).rejects.toThrow();
    });

    test('debe requerir companyRUT para distribuidor', async () => {
      const invalidDistributor = new User({
        name: 'Test Distribuidor',
        email: 'test@distribuidor.com',
        password: 'password123',
        role: 'distributor',
        distributorInfo: {
          companyName: 'Test Company'
          // companyRUT faltante
        }
      });

      await expect(invalidDistributor.save()).rejects.toThrow();
    });

    test('debe establecer valores por defecto para distribuidor', async () => {
      const distributor = new User({
        name: 'Test Distribuidor',
        email: 'test@distribuidor.com',
        password: 'password123',
        role: 'distributor',
        distributorInfo: {
          companyName: 'Test Company',
          companyRUT: '76.123.456-7'
        }
      });

      await distributor.save();
      
      expect(distributor.distributorInfo.creditLimit).toBe(0);
      expect(distributor.distributorInfo.discountPercentage).toBe(0);
      expect(distributor.distributorInfo.isApproved).toBe(false);
    });
  });

  describe('Unicidad de email', () => {
    test('no debe permitir emails duplicados', async () => {
      const user1 = new User(userData);
      await user1.save();

      const user2 = new User({
        ...userData,
        name: 'Otro Usuario'
      });

      await expect(user2.save()).rejects.toThrow();
    });
  });

  describe('Longitud de contraseña', () => {
    test('debe requerir contraseña de al menos 6 caracteres', async () => {
      const userWithShortPassword = new User({
        ...userData,
        password: '123'
      });

      await expect(userWithShortPassword.save()).rejects.toThrow();
    });

    test('debe aceptar contraseña de 6 caracteres', async () => {
      const user = new User({
        ...userData,
        password: '123456'
      });

      const savedUser = await user.save();
      expect(savedUser._id).toBeDefined();
    });
  });
});