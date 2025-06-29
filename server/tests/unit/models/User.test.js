const User = require('../../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Modelo User', () => {
  describe('Validaciones de campos', () => {
    test('debería crear un usuario válido', async () => {
      const userData = global.testUtils.validUser;
      const user = new User(userData);
      
      const savedUser = await user.save();
      
      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe(userData.role);
      expect(savedUser._id).toBeDefined();
    });

    test('debería fallar sin nombre', async () => {
      const userData = { ...global.testUtils.validUser };
      delete userData.name;
      
      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow('Por favor ingrese un nombre');
    });

    test('debería fallar sin email', async () => {
      const userData = { ...global.testUtils.validUser };
      delete userData.email;
      
      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow('Por favor ingrese un email');
    });

    test('debería fallar con email inválido', async () => {
      const userData = {
        ...global.testUtils.validUser,
        email: 'email-invalido'
      };
      
      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow('Por favor ingrese un email válido');
    });

    test('debería fallar sin contraseña', async () => {
      const userData = { ...global.testUtils.validUser };
      delete userData.password;
      
      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow('Por favor ingrese una contraseña');
    });

    test('debería fallar con contraseña muy corta', async () => {
      const userData = {
        ...global.testUtils.validUser,
        password: '123'
      };
      
      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    test('debería fallar con email duplicado', async () => {
      const userData = global.testUtils.validUser;
      
      // Crear primer usuario
      const user1 = new User(userData);
      await user1.save();
      
      // Intentar crear segundo usuario con mismo email
      const user2 = new User(userData);
      
      await expect(user2.save()).rejects.toThrow();
    });
  });

  describe('Encriptación de contraseña', () => {
    test('debería encriptar la contraseña antes de guardar', async () => {
      const userData = global.testUtils.validUser;
      const user = new User(userData);
      
      const savedUser = await user.save();
      
      expect(savedUser.password).not.toBe(userData.password);
      expect(savedUser.password.length).toBeGreaterThan(50);
    });

    test('no debería re-encriptar contraseña si no cambió', async () => {
      const userData = global.testUtils.validUser;
      const user = new User(userData);
      await user.save();
      
      const originalPassword = user.password;
      user.name = 'Nombre Actualizado';
      await user.save();
      
      expect(user.password).toBe(originalPassword);
    });
  });

  describe('Métodos de instancia', () => {
    let user;

    beforeEach(async () => {
      const userData = global.testUtils.validUser;
      user = new User(userData);
      await user.save();
    });

    describe('getSignedJwtToken()', () => {
      test('debería generar un token JWT válido', () => {
        const token = user.getSignedJwtToken();
        
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        
        // Verificar que el token se puede decodificar
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        expect(decoded.id).toBe(user._id.toString());
      });
    });

    describe('matchPassword()', () => {
      test('debería retornar true para contraseña correcta', async () => {
        const isMatch = await user.matchPassword('contraseña123');
        expect(isMatch).toBe(true);
      });

      test('debería retornar false para contraseña incorrecta', async () => {
        const isMatch = await user.matchPassword('contraseña-incorrecta');
        expect(isMatch).toBe(false);
      });
    });

    describe('isApprovedDistributor()', () => {
      test('debería retornar false para cliente regular', () => {
        const result = user.isApprovedDistributor();
        expect(result).toBe(false);
      });

      test('debería retornar true para distribuidor aprobado', async () => {
        const distributorData = global.testUtils.validDistributor;
        const distributor = new User(distributorData);
        await distributor.save();
        
        const result = distributor.isApprovedDistributor();
        expect(result).toBe(true);
      });

      test('debería retornar false para distribuidor no aprobado', async () => {
        const distributorData = {
          ...global.testUtils.validDistributor,
          distributorInfo: {
            ...global.testUtils.validDistributor.distributorInfo,
            isApproved: false
          }
        };
        const distributor = new User(distributorData);
        await distributor.save();
        
        const result = distributor.isApprovedDistributor();
        expect(result).toBe(false);
      });
    });

    describe('getCartType()', () => {
      test('debería retornar B2C para cliente regular', () => {
        const cartType = user.getCartType();
        expect(cartType).toBe('B2C');
      });

      test('debería retornar B2B para distribuidor', async () => {
        const distributorData = global.testUtils.validDistributor;
        const distributor = new User(distributorData);
        await distributor.save();
        
        const cartType = distributor.getCartType();
        expect(cartType).toBe('B2B');
      });
    });

    describe('canAccessWholesalePrices()', () => {
      test('debería retornar false para cliente regular', () => {
        const canAccess = user.canAccessWholesalePrices();
        expect(canAccess).toBe(false);
      });

      test('debería retornar true para distribuidor aprobado', async () => {
        const distributorData = global.testUtils.validDistributor;
        const distributor = new User(distributorData);
        await distributor.save();
        
        const canAccess = distributor.canAccessWholesalePrices();
        expect(canAccess).toBe(true);
      });

      test('debería retornar false para distribuidor no aprobado', async () => {
        const distributorData = {
          ...global.testUtils.validDistributor,
          distributorInfo: {
            ...global.testUtils.validDistributor.distributorInfo,
            isApproved: false
          }
        };
        const distributor = new User(distributorData);
        await distributor.save();
        
        const canAccess = distributor.canAccessWholesalePrices();
        expect(canAccess).toBe(false);
      });
    });
  });

  describe('Validaciones específicas de distribuidor', () => {
    test('debería requerir información de empresa para distribuidores', async () => {
      const distributorData = {
        ...global.testUtils.validUser,
        role: 'distributor'
        // Sin distributorInfo
      };
      
      const distributor = new User(distributorData);
      
      await expect(distributor.save()).rejects.toThrow();
    });

    test('debería requerir nombre de empresa para distribuidores', async () => {
      const distributorData = {
        ...global.testUtils.validUser,
        role: 'distributor',
        distributorInfo: {
          ...global.testUtils.validDistributor.distributorInfo,
          companyName: undefined
        }
      };
      
      const distributor = new User(distributorData);
      
      await expect(distributor.save()).rejects.toThrow();
    });

    test('debería requerir RUT de empresa para distribuidores', async () => {
      const distributorData = {
        ...global.testUtils.validUser,
        role: 'distributor',
        distributorInfo: {
          ...global.testUtils.validDistributor.distributorInfo,
          companyRUT: undefined
        }
      };
      
      const distributor = new User(distributorData);
      
      await expect(distributor.save()).rejects.toThrow();
    });

    test('debería crear distribuidor válido con toda la información', async () => {
      const distributorData = global.testUtils.validDistributor;
      const distributor = new User(distributorData);
      
      const savedDistributor = await distributor.save();
      
      expect(savedDistributor.role).toBe('distributor');
      expect(savedDistributor.distributorInfo.companyName).toBe(distributorData.distributorInfo.companyName);
      expect(savedDistributor.distributorInfo.companyRUT).toBe(distributorData.distributorInfo.companyRUT);
      expect(savedDistributor.distributorInfo.isApproved).toBe(true);
    });
  });

  describe('Campos por defecto', () => {
    test('debería establecer rol por defecto como client', async () => {
      const userData = { ...global.testUtils.validUser };
      delete userData.role;
      
      const user = new User(userData);
      const savedUser = await user.save();
      
      expect(savedUser.role).toBe('client');
    });

    test('debería establecer fecha de creación automáticamente', async () => {
      const userData = global.testUtils.validUser;
      const user = new User(userData);
      
      const beforeSave = new Date();
      const savedUser = await user.save();
      const afterSave = new Date();
      
      expect(savedUser.createdAt).toBeInstanceOf(Date);
      expect(savedUser.createdAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
      expect(savedUser.createdAt.getTime()).toBeLessThanOrEqual(afterSave.getTime());
    });
  });
});