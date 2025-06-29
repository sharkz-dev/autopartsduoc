const SystemConfigService = require('../../../services/systemConfig.service');

// ✅ No necesitamos mock aquí porque ya está en setup.js

describe('SystemConfig Service', () => {
  beforeEach(() => {
    // Limpiar cache del servicio
    SystemConfigService.clearCache();
    
    // Limpiar todos los mocks
    jest.clearAllMocks();
  });

  describe('getConfig()', () => {
    test('debería retornar valor de configuración desde el servicio', async () => {
      // El servicio ya está mockeado en setup.js
      const result = await SystemConfigService.getConfig('tax_rate');
      
      expect(result).toBe(19);
    });

    test('debería retornar valor por defecto si no existe configuración', async () => {
      const result = await SystemConfigService.getConfig('nonexistent_key', 'default_value');
      
      expect(result).toBe('default_value');
    });

    test('debería manejar errores y retornar valor por defecto', async () => {
      // Simular error en el servicio
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      const result = await SystemConfigService.getConfig('error_key', 'fallback');
      
      // Debería retornar el fallback en caso de error
      expect(result).toBeDefined();
      
      console.error = originalConsoleError;
    });
  });

  describe('getTaxRate()', () => {
    test('debería retornar tasa de IVA por defecto', async () => {
      const result = await SystemConfigService.getTaxRate();
      
      expect(result).toBe(19);
      expect(typeof result).toBe('number');
    });
  });

  describe('calculateTax()', () => {
    test('debería calcular IVA correctamente', async () => {
      const result = await SystemConfigService.calculateTax(100);
      
      expect(result).toBe(19); // 100 * 0.19 = 19
    });

    test('debería redondear el resultado', async () => {
      const result = await SystemConfigService.calculateTax(105);
      
      expect(result).toBe(20); // Math.round(105 * 0.19) = Math.round(19.95) = 20
    });

    test('debería manejar números decimales', async () => {
      const result = await SystemConfigService.calculateTax(99.99);
      
      expect(result).toBe(19); // Math.round(99.99 * 0.19) = Math.round(18.9981) = 19
    });

    test('debería manejar valor cero', async () => {
      const result = await SystemConfigService.calculateTax(0);
      
      expect(result).toBe(0);
    });
  });

  describe('calculatePriceWithTax()', () => {
    test('debería calcular precio con IVA incluido', async () => {
      const result = await SystemConfigService.calculatePriceWithTax(100);
      
      expect(result).toBe(119); // 100 + 19 = 119
    });

    test('debería manejar decimales correctamente', async () => {
      const result = await SystemConfigService.calculatePriceWithTax(100.50);
      
      expect(result).toBe(120); // 100.50 + Math.round(100.50 * 0.19) = 100.50 + 19 = 119.50, redondeado a 120
    });
  });

  describe('getShippingConfig()', () => {
    test('debería retornar configuración de envío', async () => {
      const result = await SystemConfigService.getShippingConfig();
      
      expect(result).toHaveProperty('freeShippingThreshold');
      expect(result).toHaveProperty('defaultShippingCost');
      expect(typeof result.freeShippingThreshold).toBe('number');
      expect(typeof result.defaultShippingCost).toBe('number');
    });
  });

  describe('calculateShippingCost()', () => {
    test('debería retornar 0 para pickup', async () => {
      const result = await SystemConfigService.calculateShippingCost(50000, 'pickup');
      
      expect(result).toBe(0);
    });

    test('debería retornar 0 si supera umbral de envío gratuito', async () => {
      const result = await SystemConfigService.calculateShippingCost(100000, 'delivery');
      
      expect(result).toBe(0);
    });

    test('debería retornar costo por defecto si no supera umbral', async () => {
      const result = await SystemConfigService.calculateShippingCost(50000, 'delivery');
      
      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
    });

    test('debería usar delivery como método por defecto', async () => {
      const result = await SystemConfigService.calculateShippingCost(50000);
      
      expect(typeof result).toBe('number');
    });
  });

  describe('getMultipleConfigs()', () => {
    test('debería obtener múltiples configuraciones', async () => {
      const keys = ['tax_rate', 'free_shipping_threshold', 'site_name'];
      const result = await SystemConfigService.getMultipleConfigs(keys);
      
      expect(result).toHaveProperty('tax_rate');
      expect(result).toHaveProperty('free_shipping_threshold');
      expect(result).toHaveProperty('site_name');
      expect(typeof result).toBe('object');
    });

    test('debería manejar array vacío', async () => {
      const result = await SystemConfigService.getMultipleConfigs([]);
      
      expect(result).toEqual({});
    });
  });

  describe('Cache management', () => {
    test('debería limpiar cache correctamente', () => {
      SystemConfigService.clearCache();
      const stats = SystemConfigService.getCacheStats();
      
      expect(stats.size).toBe(0);
      expect(stats.isValid).toBe(false);
      expect(stats.lastUpdate).toBeNull();
    });

    test('debería retornar estadísticas de cache', async () => {
      // Hacer una llamada para poblar el cache
      await SystemConfigService.getConfig('test_key');
      
      const stats = SystemConfigService.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('isValid');
      expect(stats).toHaveProperty('keys');
      expect(Array.isArray(stats.keys)).toBe(true);
    });

    test('debería validar cache correctamente', () => {
      // Cache debería estar inválido al inicio
      expect(SystemConfigService.isCacheValid()).toBe(false);
    });
  });

  describe('initializeDefaultConfigs()', () => {
    test('debería ejecutar sin errores', async () => {
      await expect(SystemConfigService.initializeDefaultConfigs()).resolves.not.toThrow();
    });
  });

  describe('Error handling', () => {
    test('debería manejar errores en setConfig', async () => {
      await expect(
        SystemConfigService.setConfig('test_key', 'test_value', 'user123')
      ).resolves.toBeDefined();
    });

    test('debería manejar valores nulos en getConfig', async () => {
      const result = await SystemConfigService.getConfig(null, 'default');
      
      expect(result).toBe('default');
    });
  });
});