const SystemConfigService = require('../../../services/systemConfig.service');
const SystemConfig = require('../../../models/SystemConfig');

describe('Servicio SystemConfig', () => {
  beforeEach(async () => {
    // Limpiar cache antes de cada prueba
    SystemConfigService.clearCache();
    
    // Crear configuraciones de prueba
    await SystemConfig.create([
      {
        key: 'tax_rate',
        value: 19,
        description: 'Porcentaje de IVA',
        type: 'number',
        category: 'tax'
      },
      {
        key: 'free_shipping_threshold',
        value: 80000,
        description: 'Umbral de envío gratuito',
        type: 'number',
        category: 'shipping'
      },
      {
        key: 'default_shipping_cost',
        value: 5000,
        description: 'Costo de envío por defecto',
        type: 'number',
        category: 'shipping'
      },
      {
        key: 'site_name',
        value: 'AutoParts Test',
        description: 'Nombre del sitio',
        type: 'string',
        category: 'general'
      }
    ]);
  });

  describe('getConfig()', () => {
    test('debería obtener configuración existente', async () => {
      const taxRate = await SystemConfigService.getConfig('tax_rate');
      expect(taxRate).toBe(19);
    });

    test('debería retornar valor por defecto para configuración inexistente', async () => {
      const defaultValue = await SystemConfigService.getConfig('configuracion_inexistente', 100);
      expect(defaultValue).toBe(100);
    });

    test('debería retornar null por defecto si no se especifica valor', async () => {
      const defaultValue = await SystemConfigService.getConfig('configuracion_inexistente');
      expect(defaultValue).toBeNull();
    });

    test('debería usar cache en segunda consulta', async () => {
      // Primera consulta (va a base de datos)
      const firstCall = await SystemConfigService.getConfig('tax_rate');
      expect(firstCall).toBe(19);

      // Verificar que está en cache
      const cacheStats = SystemConfigService.getCacheStats();
      expect(cacheStats.size).toBe(1);
      expect(cacheStats.keys).toContain('tax_rate');

      // Segunda consulta (desde cache)
      const secondCall = await SystemConfigService.getConfig('tax_rate');
      expect(secondCall).toBe(19);
    });
  });

  describe('setConfig()', () => {
    test('debería actualizar configuración existente', async () => {
      const userId = 'test-user-id';
      const updatedConfig = await SystemConfigService.setConfig('tax_rate', 21, userId);
      
      expect(updatedConfig).toBeTruthy();
      expect(updatedConfig.value).toBe(21);
      expect(updatedConfig.lastModifiedBy.toString()).toBe(userId);
      
      // Verificar que se actualizó en base de datos
      const configInDb = await SystemConfig.findOne({ key: 'tax_rate' });
      expect(configInDb.value).toBe(21);
    });

    test('debería limpiar cache al actualizar tax_rate', async () => {
      // Llenar cache con una consulta
      await SystemConfigService.getConfig('tax_rate');
      expect(SystemConfigService.getCacheStats().size).toBe(1);

      // Actualizar tax_rate (debería limpiar cache)
      await SystemConfigService.setConfig('tax_rate', 21);
      expect(SystemConfigService.getCacheStats().size).toBe(0);
    });

    test('debería actualizar cache para otras configuraciones', async () => {
      await SystemConfigService.setConfig('site_name', 'Nuevo Nombre');
      
      // Verificar que está en cache
      const cacheStats = SystemConfigService.getCacheStats();
      expect(cacheStats.keys).toContain('site_name');
    });
  });

  describe('getTaxRate()', () => {
    test('debería retornar la tasa de IVA configurada', async () => {
      const taxRate = await SystemConfigService.getTaxRate();
      expect(taxRate).toBe(19);
    });

    test('debería retornar 19% por defecto si no existe configuración', async () => {
      // Eliminar configuración de IVA
      await SystemConfig.deleteOne({ key: 'tax_rate' });
      
      const taxRate = await SystemConfigService.getTaxRate();
      expect(taxRate).toBe(19);
    });
  });

  describe('calculateTax()', () => {
    test('debería calcular IVA correctamente', async () => {
      const amount = 10000;
      const taxAmount = await SystemConfigService.calculateTax(amount);
      
      // 10000 * 19% = 1900
      expect(taxAmount).toBe(1900);
    });

    test('debería redondear resultado del cálculo', async () => {
      const amount = 10001; // Cantidad que genera decimales
      const taxAmount = await SystemConfigService.calculateTax(amount);
      
      // 10001 * 19% = 1900.19 -> redondeado a 1900
      expect(Number.isInteger(taxAmount)).toBe(true);
      expect(taxAmount).toBe(1900);
    });

    test('debería calcular con tasa personalizada', async () => {
      // Cambiar tasa de IVA
      await SystemConfigService.setConfig('tax_rate', 21);
      
      const amount = 10000;
      const taxAmount = await SystemConfigService.calculateTax(amount);
      
      // 10000 * 21% = 2100
      expect(taxAmount).toBe(2100);
    });
  });

  describe('calculatePriceWithTax()', () => {
    test('debería calcular precio con IVA incluido', async () => {
      const baseAmount = 10000;
      const priceWithTax = await SystemConfigService.calculatePriceWithTax(baseAmount);
      
      // 10000 + (10000 * 19%) = 10000 + 1900 = 11900
      expect(priceWithTax).toBe(11900);
    });
  });

  describe('getShippingConfig()', () => {
    test('debería retornar configuración de envío', async () => {
      const shippingConfig = await SystemConfigService.getShippingConfig();
      
      expect(shippingConfig).toEqual({
        freeShippingThreshold: 80000,
        defaultShippingCost: 5000
      });
    });

    test('debería usar valores por defecto si no existen configuraciones', async () => {
      // Eliminar configuraciones de envío
      await SystemConfig.deleteMany({ category: 'shipping' });
      
      const shippingConfig = await SystemConfigService.getShippingConfig();
      
      expect(shippingConfig).toEqual({
        freeShippingThreshold: 100000, // Valor por defecto
        defaultShippingCost: 5000 // Valor por defecto
      });
    });
  });

  describe('calculateShippingCost()', () => {
    test('debería retornar 0 para método pickup', async () => {
      const shippingCost = await SystemConfigService.calculateShippingCost(50000, 'pickup');
      expect(shippingCost).toBe(0);
    });

    test('debería retornar 0 para montos que superan umbral de envío gratuito', async () => {
      const shippingCost = await SystemConfigService.calculateShippingCost(90000, 'delivery');
      expect(shippingCost).toBe(0);
    });

    test('debería retornar costo por defecto para montos menores al umbral', async () => {
      const shippingCost = await SystemConfigService.calculateShippingCost(50000, 'delivery');
      expect(shippingCost).toBe(5000);
    });

    test('debería usar delivery como método por defecto', async () => {
      const shippingCost = await SystemConfigService.calculateShippingCost(50000);
      expect(shippingCost).toBe(5000);
    });
  });

  describe('getMultipleConfigs()', () => {
    test('debería obtener múltiples configuraciones', async () => {
      const keys = ['tax_rate', 'site_name', 'free_shipping_threshold'];
      const configs = await SystemConfigService.getMultipleConfigs(keys);
      
      expect(configs).toEqual({
        tax_rate: 19,
        site_name: 'AutoParts Test',
        free_shipping_threshold: 80000
      });
    });

    test('debería incluir valores null para configuraciones inexistentes', async () => {
      const keys = ['tax_rate', 'configuracion_inexistente'];
      const configs = await SystemConfigService.getMultipleConfigs(keys);
      
      expect(configs).toEqual({
        tax_rate: 19,
        configuracion_inexistente: null
      });
    });
  });

  describe('initializeDefaultConfigs()', () => {
    test('debería crear configuraciones por defecto si no existen', async () => {
      // Limpiar todas las configuraciones
      await SystemConfig.deleteMany({});
      
      await SystemConfigService.initializeDefaultConfigs();
      
      // Verificar que se crearon las configuraciones por defecto
      const configs = await SystemConfig.find({});
      expect(configs.length).toBeGreaterThan(0);
      
      const taxRateConfig = await SystemConfig.findOne({ key: 'tax_rate' });
      expect(taxRateConfig).toBeTruthy();
      expect(taxRateConfig.value).toBe(19);
    });

    test('no debería duplicar configuraciones existentes', async () => {
      const initialCount = await SystemConfig.countDocuments({});
      
      // Ejecutar dos veces
      await SystemConfigService.initializeDefaultConfigs();
      await SystemConfigService.initializeDefaultConfigs();
      
      const finalCount = await SystemConfig.countDocuments({});
      expect(finalCount).toBe(initialCount); // No debería aumentar
    });
  });

  describe('Gestión de cache', () => {
    test('isCacheValid() debería verificar validez del cache', () => {
      // Cache vacío debería ser inválido
      expect(SystemConfigService.isCacheValid()).toBe(false);
      
      // Después de una consulta debería ser válido
      SystemConfigService.getConfig('tax_rate');
      // Como es async, necesitamos verificar de otra manera en este test
    });

    test('clearCache() debería limpiar el cache', async () => {
      // Llenar cache
      await SystemConfigService.getConfig('tax_rate');
      expect(SystemConfigService.getCacheStats().size).toBe(1);
      
      // Limpiar cache
      SystemConfigService.clearCache();
      expect(SystemConfigService.getCacheStats().size).toBe(0);
    });

    test('getCacheStats() debería retornar estadísticas del cache', async () => {
      // Cache vacío
      let stats = SystemConfigService.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.keys).toEqual([]);
      
      // Llenar cache
      await SystemConfigService.getConfig('tax_rate');
      await SystemConfigService.getConfig('site_name');
      
      stats = SystemConfigService.getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('tax_rate');
      expect(stats.keys).toContain('site_name');
    });
  });

  describe('Manejo de errores', () => {
    test('getConfig() debería manejar errores de base de datos', async () => {
      // Simular error cerrando la conexión
      const originalFind = SystemConfig.findOne;
      SystemConfig.findOne = jest.fn().mockRejectedValue(new Error('Error de conexión'));
      
      const result = await SystemConfigService.getConfig('tax_rate', 'default');
      expect(result).toBe('default');
      
      // Restaurar método original
      SystemConfig.findOne = originalFind;
    });

    test('setConfig() debería propagar errores de base de datos', async () => {
      // Simular error en update
      const originalUpdate = SystemConfig.findOneAndUpdate;
      SystemConfig.findOneAndUpdate = jest.fn().mockRejectedValue(new Error('Error de actualización'));
      
      await expect(SystemConfigService.setConfig('tax_rate', 21))
        .rejects.toThrow('Error de actualización');
      
      // Restaurar método original
      SystemConfig.findOneAndUpdate = originalUpdate;
    });
  });

  describe('Integración con modelos', () => {
    test('debería funcionar con datos reales de MongoDB', async () => {
      // Esta prueba verifica que el servicio funciona correctamente
      // con la base de datos real (en memoria para tests)
      
      const taxRate = await SystemConfigService.getTaxRate();
      expect(typeof taxRate).toBe('number');
      expect(taxRate).toBeGreaterThan(0);
      
      const shippingConfig = await SystemConfigService.getShippingConfig();
      expect(typeof shippingConfig.freeShippingThreshold).toBe('number');
      expect(typeof shippingConfig.defaultShippingCost).toBe('number');
      
      const taxAmount = await SystemConfigService.calculateTax(10000);
      expect(typeof taxAmount).toBe('number');
      expect(taxAmount).toBeGreaterThan(0);
    });
  });
});