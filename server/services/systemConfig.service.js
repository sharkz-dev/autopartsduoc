const SystemConfigService = require('../../../services/systemConfig.service');
const SystemConfig = require('../../../models/SystemConfig');

// Mock del modelo SystemConfig
jest.mock('../../../models/SystemConfig');

describe('SystemConfig Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Limpiar cache
    SystemConfigService.clearCache();
  });

  describe('getConfig()', () => {
    test('debería retornar valor de configuración', async () => {
      const mockConfig = {
        key: 'tax_rate',
        value: 19
      };

      SystemConfig.findOne.mockResolvedValue(mockConfig);

      const result = await SystemConfigService.getConfig('tax_rate');
      
      expect(result).toBe(19);
      expect(SystemConfig.findOne).toHaveBeenCalledWith({ key: 'tax_rate' });
    });

    test('debería retornar valor por defecto si no existe configuración', async () => {
      SystemConfig.findOne.mockResolvedValue(null);

      const result = await SystemConfigService.getConfig('nonexistent_key', 'default_value');
      
      expect(result).toBe('default_value');
    });

    test('debería usar cache si está disponible', async () => {
      const mockConfig = {
        key: 'tax_rate',
        value: 19
      };

      SystemConfig.findOne.mockResolvedValue(mockConfig);

      // Primera llamada
      await SystemConfigService.getConfig('tax_rate');
      
      // Segunda llamada (debería usar cache)
      const result = await SystemConfigService.getConfig('tax_rate');
      
      expect(result).toBe(19);
      // Solo debería llamar una vez a la base de datos
      expect(SystemConfig.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTaxRate()', () => {
    test('debería retornar tasa de IVA configurada', async () => {
      const mockConfig = {
        key: 'tax_rate',
        value: 21
      };

      SystemConfig.findOne.mockResolvedValue(mockConfig);

      const result = await SystemConfigService.getTaxRate();
      
      expect(result).toBe(21);
    });

    test('debería retornar 19% por defecto si no hay configuración', async () => {
      SystemConfig.findOne.mockResolvedValue(null);

      const result = await SystemConfigService.getTaxRate();
      
      expect(result).toBe(19);
    });
  });

  describe('calculateTax()', () => {
    test('debería calcular IVA correctamente', async () => {
      SystemConfig.findOne.mockResolvedValue({ value: 19 });

      const result = await SystemConfigService.calculateTax(100);
      
      expect(result).toBe(19); // 100 * 0.19 = 19
    });

    test('debería redondear el resultado', async () => {
      SystemConfig.findOne.mockResolvedValue({ value: 19 });

      const result = await SystemConfigService.calculateTax(105);
      
      expect(result).toBe(20); // Math.round(105 * 0.19) = Math.round(19.95) = 20
    });
  });

  describe('setConfig()', () => {
    test('debería actualizar configuración', async () => {
      const mockUpdatedConfig = {
        key: 'tax_rate',
        value: 21,
        lastModifiedBy: 'user123'
      };

      SystemConfig.findOneAndUpdate.mockResolvedValue(mockUpdatedConfig);

      const result = await SystemConfigService.setConfig('tax_rate', 21, 'user123');
      
      expect(result).toEqual(mockUpdatedConfig);
      expect(SystemConfig.findOneAndUpdate).toHaveBeenCalledWith(
        { key: 'tax_rate' },
        expect.objectContaining({
          value: 21,
          lastModifiedBy: 'user123'
        }),
        { new: true }
      );
    });
  });

  describe('calculateShippingCost()', () => {
    test('debería retornar 0 para pickup', async () => {
      const result = await SystemConfigService.calculateShippingCost(50000, 'pickup');
      
      expect(result).toBe(0);
    });

    test('debería retornar 0 si supera umbral de envío gratuito', async () => {
      SystemConfig.findOne
        .mockResolvedValueOnce({ value: 80000 }) // free_shipping_threshold
        .mockResolvedValueOnce({ value: 5000 });  // default_shipping_cost

      const result = await SystemConfigService.calculateShippingCost(100000, 'delivery');
      
      expect(result).toBe(0);
    });

    test('debería retornar costo por defecto si no supera umbral', async () => {
      SystemConfig.findOne
        .mockResolvedValueOnce({ value: 80000 }) // free_shipping_threshold
        .mockResolvedValueOnce({ value: 5000 });  // default_shipping_cost

      const result = await SystemConfigService.calculateShippingCost(50000, 'delivery');
      
      expect(result).toBe(5000);
    });
  });

  describe('Cache management', () => {
    test('debería limpiar cache correctamente', () => {
      SystemConfigService.clearCache();
      const stats = SystemConfigService.getCacheStats();
      
      expect(stats.size).toBe(0);
      expect(stats.isValid).toBe(false);
    });

    test('debería retornar estadísticas de cache', async () => {
      SystemConfig.findOne.mockResolvedValue({ value: 19 });
      
      await SystemConfigService.getConfig('test_key');
      
      const stats = SystemConfigService.getCacheStats();
      
      expect(stats.size).toBe(1);
      expect(stats.keys).toContain('test_key');
    });
  });
});