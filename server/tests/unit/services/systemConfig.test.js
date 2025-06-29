const SystemConfigService = require('../../../services/systemConfig.service');
const SystemConfig = require('../../../models/SystemConfig');

describe('Servicio SystemConfig', () => {
  beforeEach(async () => {
    // Limpiar cache antes de cada prueba
    SystemConfigService.clearCache();
    
    // Crear configuraciones de prueba
    await SystemConfig.create({
      key: 'tax_rate',
      value: 19,
      description: 'Porcentaje de IVA',
      type: 'number',
      category: 'tax'
    });

    await SystemConfig.create({
      key: 'free_shipping_threshold',
      value: 100000,
      description: 'Umbral envío gratuito',
      type: 'number',
      category: 'shipping'
    });

    await SystemConfig.create({
      key: 'default_shipping_cost',
      value: 5000,
      description: 'Costo envío por defecto',
      type: 'number',
      category: 'shipping'
    });
  });

  describe('Obtener configuraciones', () => {
    test('debe obtener configuración existente', async () => {
      const taxRate = await SystemConfigService.getConfig('tax_rate');
      expect(taxRate).toBe(19);
    });

    test('debe retornar valor por defecto si no existe', async () => {
      const nonExistent = await SystemConfigService.getConfig('config_inexistente', 'default');
      expect(nonExistent).toBe('default');
    });

    test('debe retornar null por defecto si no se especifica', async () => {
      const nonExistent = await SystemConfigService.getConfig('config_inexistente');
      expect(nonExistent).toBeNull();
    });

    test('debe usar cache en segunda consulta', async () => {
      // Primera consulta
      const firstCall = await SystemConfigService.getConfig('tax_rate');
      
      // Segunda consulta (debería usar cache)
      const secondCall = await SystemConfigService.getConfig('tax_rate');
      
      expect(firstCall).toBe(secondCall);
      expect(firstCall).toBe(19);
    });
  });

  describe('Establecer configuraciones', () => {
    test('debe actualizar configuración existente', async () => {
      const updatedConfig = await SystemConfigService.setConfig('tax_rate', 21);
      
      expect(updatedConfig.value).toBe(21);
      
      // Verificar que se actualiza en base de datos
      const retrieved = await SystemConfigService.getConfig('tax_rate');
      expect(retrieved).toBe(21);
    });

    test('debe manejar error cuando configuración no existe', async () => {
      await expect(
        SystemConfigService.setConfig('config_inexistente', 'valor')
      ).rejects.toThrow();
    });
  });

  describe('Configuraciones de IVA', () => {
    test('debe obtener tasa de IVA', async () => {
      const taxRate = await SystemConfigService.getTaxRate();
      expect(taxRate).toBe(19);
    });

    test('debe calcular IVA correctamente', async () => {
      const amount = 100000;
      const tax = await SystemConfigService.calculateTax(amount);
      
      // 19% de 100000 = 19000
      expect(tax).toBe(19000);
    });

    test('debe calcular precio con IVA incluido', async () => {
      const baseAmount = 100000;
      const priceWithTax = await SystemConfigService.calculatePriceWithTax(baseAmount);
      
      // 100000 + 19000 = 119000
      expect(priceWithTax).toBe(119000);
    });

    test('debe redondear cálculo de IVA', async () => {
      const amount = 12345; // Resultará en decimal
      const tax = await SystemConfigService.calculateTax(amount);
      
      // Debe retornar entero redondeado
      expect(Number.isInteger(tax)).toBe(true);
      expect(tax).toBe(2346); // 12345 * 0.19 = 2345.55, redondeado = 2346
    });
  });

  describe('Configuraciones de envío', () => {
    test('debe obtener configuraciones de envío', async () => {
      const shippingConfig = await SystemConfigService.getShippingConfig();
      
      expect(shippingConfig.freeShippingThreshold).toBe(100000);
      expect(shippingConfig.defaultShippingCost).toBe(5000);
    });

    test('debe calcular envío gratuito para orden mayor al umbral', async () => {
      const orderAmount = 150000; // Mayor al umbral
      const shippingCost = await SystemConfigService.calculateShippingCost(orderAmount);
      
      expect(shippingCost).toBe(0);
    });

    test('debe calcular costo de envío para orden menor al umbral', async () => {
      const orderAmount = 50000; // Menor al umbral
      const shippingCost = await SystemConfigService.calculateShippingCost(orderAmount);
      
      expect(shippingCost).toBe(5000);
    });

    test('debe retornar 0 para retiro en tienda', async () => {
      const orderAmount = 50000;
      const shippingCost = await SystemConfigService.calculateShippingCost(orderAmount, 'pickup');
      
      expect(shippingCost).toBe(0);
    });

    test('debe manejar método de envío por defecto', async () => {
      const orderAmount = 50000;
      const shippingCost = await SystemConfigService.calculateShippingCost(orderAmount);
      
      expect(shippingCost).toBe(5000); // Costo por defecto para delivery
    });
  });

  describe('Configuraciones múltiples', () => {
    test('debe obtener múltiples configuraciones a la vez', async () => {
      const keys = ['tax_rate', 'free_shipping_threshold', 'default_shipping_cost'];
      const configs = await SystemConfigService.getMultipleConfigs(keys);
      
      expect(configs).toHaveProperty('tax_rate', 19);
      expect(configs).toHaveProperty('free_shipping_threshold', 100000);
      expect(configs).toHaveProperty('default_shipping_cost', 5000);
    });

    test('debe manejar configuraciones inexistentes en múltiples', async () => {
      const keys = ['tax_rate', 'config_inexistente'];
      const configs = await SystemConfigService.getMultipleConfigs(keys);
      
      expect(configs).toHaveProperty('tax_rate', 19);
      expect(configs).toHaveProperty('config_inexistente', null);
    });
  });

  describe('Gestión de cache', () => {
    test('debe invalidar cache después del tiempo límite', async () => {
      // Obtener configuración para cargar cache
      await SystemConfigService.getConfig('tax_rate');
      
      // Verificar que cache es válido
      expect(SystemConfigService.isCacheValid()).toBe(true);
      
      // Simular que ha pasado el tiempo límite
      SystemConfigService.cacheTimestamp = Date.now() - (6 * 60 * 1000); // 6 minutos atrás
      
      expect(SystemConfigService.isCacheValid()).toBe(false);
    });

    test('debe limpiar cache correctamente', async () => {
      // Cargar cache
      await SystemConfigService.getConfig('tax_rate');
      
      // Verificar que hay datos en cache
      const stats = SystemConfigService.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
      
      // Limpiar cache
      SystemConfigService.clearCache();
      
      const newStats = SystemConfigService.getCacheStats();
      expect(newStats.size).toBe(0);
      expect(newStats.isValid).toBe(false);
    });

    test('debe obtener estadísticas de cache', async () => {
      await SystemConfigService.getConfig('tax_rate');
      await SystemConfigService.getConfig('free_shipping_threshold');
      
      const stats = SystemConfigService.getCacheStats();
      
      expect(stats.size).toBe(2);
      expect(stats.isValid).toBe(true);
      expect(stats.keys).toContain('tax_rate');
      expect(stats.keys).toContain('free_shipping_threshold');
      expect(stats.lastUpdate).toBeInstanceOf(Date);
    });
  });

  describe('Inicialización de configuraciones por defecto', () => {
    beforeEach(async () => {
      // Limpiar todas las configuraciones
      await SystemConfig.deleteMany({});
    });

    test('debe crear configuraciones por defecto', async () => {
      await SystemConfigService.initializeDefaultConfigs();
      
      const taxRate = await SystemConfig.findOne({ key: 'tax_rate' });
      expect(taxRate).toBeTruthy();
      expect(taxRate.value).toBe(19);
      
      const shippingThreshold = await SystemConfig.findOne({ key: 'free_shipping_threshold' });
      expect(shippingThreshold).toBeTruthy();
      expect(shippingThreshold.value).toBe(100000);
    });

    test('no debe duplicar configuraciones existentes', async () => {
      // Crear una configuración
      await SystemConfig.create({
        key: 'tax_rate',
        value: 21,
        description: 'IVA personalizado',
        type: 'number',
        category: 'tax'
      });

      await SystemConfigService.initializeDefaultConfigs();
      
      // Verificar que no se duplicó
      const configs = await SystemConfig.find({ key: 'tax_rate' });
      expect(configs).toHaveLength(1);
      expect(configs[0].value).toBe(21); // Valor original preservado
    });
  });

  describe('Manejo de errores', () => {
    test('debe manejar error en base de datos gracefully', async () => {
      // Simular error cerrando conexión
      const originalFind = SystemConfig.findOne;
      SystemConfig.findOne = jest.fn().mockRejectedValue(new Error('Database error'));
      
      const result = await SystemConfigService.getConfig('tax_rate', 'default');
      expect(result).toBe('default');
      
      // Restaurar método original
      SystemConfig.findOne = originalFind;
    });

    test('debe manejar configuración nula', async () => {
      // Simular configuración que retorna null
      const originalFind = SystemConfig.findOne;
      SystemConfig.findOne = jest.fn().mockResolvedValue(null);
      
      const result = await SystemConfigService.getConfig('test_key', 'fallback');
      expect(result).toBe('fallback');
      
      SystemConfig.findOne = originalFind;
    });
  });
});