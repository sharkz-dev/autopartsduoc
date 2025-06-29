const SystemConfig = require('../models/SystemConfig');

// Cache en memoria para configuraciones frecuentemente accedidas
let configCache = new Map();
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Servicio para manejar configuraciones del sistema
 */
class SystemConfigService {
  
  /**
   * Obtiene una configuración del cache o base de datos
   * @param {string} key - Clave de configuración
   * @param {any} defaultValue - Valor por defecto
   * @returns {Promise<any>} Valor de configuración
   */
  static async getConfig(key, defaultValue = null) {
    try {
      // Verificar cache
      if (this.isCacheValid() && configCache.has(key)) {
        return configCache.get(key);
      }

      // Obtener de base de datos
      const config = await SystemConfig.findOne({ key });
      const value = config ? config.value : defaultValue;
      
      // Actualizar cache
      configCache.set(key, value);
      if (!cacheTimestamp) cacheTimestamp = Date.now();
      
      return value;
    } catch (error) {
      console.error(`Error al obtener configuración ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Establece una configuración y actualiza el cache
   * @param {string} key - Clave de configuración
   * @param {any} value - Valor a establecer
   * @param {string} userId - ID del usuario que modifica
   * @returns {Promise<Object>} Configuración actualizada
   */
  static async setConfig(key, value, userId = null) {
    try {
      const config = await SystemConfig.findOneAndUpdate(
        { key },
        { 
          value, 
          lastModifiedBy: userId,
          updatedAt: Date.now()
        },
        { new: true }
      );

      if (!config) {
        throw new Error(`Configuración con clave '${key}' no encontrada`);
      }

      // Actualizar cache
      configCache.set(key, value);
      
      // Si es configuración de IVA, limpiar cache completo para forzar actualización
      if (key === 'tax_rate') {
        this.clearCache();
      }

      return config;
    } catch (error) {
      console.error(`Error al establecer configuración ${key}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene el porcentaje de IVA actual
   * @returns {Promise<number>} Porcentaje de IVA
   */
  static async getTaxRate() {
    return await this.getConfig('tax_rate', 19);
  }

  /**
   * Calcula el monto de IVA para un precio dado
   * @param {number} amount - Monto base
   * @returns {Promise<number>} Monto de IVA
   */
  static async calculateTax(amount) {
    const taxRate = await this.getTaxRate();
    return Math.round(amount * (taxRate / 100));
  }

  /**
   * Calcula el precio con IVA incluido
   * @param {number} baseAmount - Monto base sin IVA
   * @returns {Promise<number>} Monto con IVA incluido
   */
  static async calculatePriceWithTax(baseAmount) {
    const taxAmount = await this.calculateTax(baseAmount);
    return baseAmount + taxAmount;
  }

  /**
   * Obtiene configuraciones de envío
   * @returns {Promise<Object>} Configuraciones de envío
   */
  static async getShippingConfig() {
    const freeShippingThreshold = await this.getConfig('free_shipping_threshold', 100000);
    const defaultShippingCost = await this.getConfig('default_shipping_cost', 5000);
    
    return {
      freeShippingThreshold,
      defaultShippingCost
    };
  }

  /**
   * Calcula el costo de envío basado en configuraciones
   * @param {number} orderAmount - Monto total del pedido
   * @param {string} shippingMethod - Método de envío
   * @returns {Promise<number>} Costo de envío
   */
  static async calculateShippingCost(orderAmount, shippingMethod = 'delivery') {
    if (shippingMethod === 'pickup') {
      return 0; // Retiro en tienda es gratuito
    }

    const shippingConfig = await this.getShippingConfig();
    
    // Envío gratuito si supera el umbral
    if (orderAmount >= shippingConfig.freeShippingThreshold) {
      return 0;
    }

    return shippingConfig.defaultShippingCost;
  }

  /**
   * Obtiene múltiples configuraciones de una vez
   * @param {Array<string>} keys - Array de claves
   * @returns {Promise<Object>} Objeto con todas las configuraciones
   */
  static async getMultipleConfigs(keys) {
    const configs = {};
    
    for (const key of keys) {
      configs[key] = await this.getConfig(key);
    }
    
    return configs;
  }

  /**
   * Inicializa configuraciones por defecto si no existen
   * @returns {Promise<void>}
   */
  static async initializeDefaultConfigs() {
    const defaultConfigs = [
      {
        key: 'tax_rate',
        value: 19,
        description: 'Porcentaje de IVA aplicado a las ventas',
        type: 'number',
        category: 'tax',
        validationRules: { min: 0, max: 100 }
      },
      {
        key: 'free_shipping_threshold',
        value: 100000,
        description: 'Monto mínimo para envío gratuito (CLP)',
        type: 'number',
        category: 'shipping',
        validationRules: { min: 0 }
      },
      {
        key: 'default_shipping_cost',
        value: 5000,
        description: 'Costo de envío por defecto (CLP)',
        type: 'number',
        category: 'shipping',
        validationRules: { min: 0 }
      },
      {
        key: 'site_name',
        value: 'AutoRepuestos',
        description: 'Nombre del sitio web',
        type: 'string',
        category: 'general'
      },
      {
        key: 'contact_email',
        value: 'info@autorepuestos.com',
        description: 'Email de contacto principal',
        type: 'string',
        category: 'general'
      },
      {
        key: 'max_file_size',
        value: 5242880,
        description: 'Tamaño máximo de archivo en bytes (5MB)',
        type: 'number',
        category: 'general',
        validationRules: { min: 1048576, max: 10485760 }, // 1MB - 10MB
        isEditable: false
      }
    ];

    for (const configData of defaultConfigs) {
      try {
        const existingConfig = await SystemConfig.findOne({ key: configData.key });
        if (!existingConfig) {
          await SystemConfig.create(configData);
          console.log(`✅ Configuración por defecto creada: ${configData.key}`);
        }
      } catch (error) {
        console.error(`❌ Error al crear configuración ${configData.key}:`, error);
      }
    }
  }

  /**
   * Verifica si el cache es válido
   * @returns {boolean} True si el cache es válido
   */
  static isCacheValid() {
    return cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_DURATION;
  }

  /**
   * Limpia el cache de configuraciones
   */
  static clearCache() {
    configCache.clear();
    cacheTimestamp = null;
  }

  /**
   * Obtiene estadísticas del cache
   * @returns {Object} Estadísticas del cache
   */
  static getCacheStats() {
    return {
      size: configCache.size,
      isValid: this.isCacheValid(),
      lastUpdate: cacheTimestamp ? new Date(cacheTimestamp) : null,
      keys: Array.from(configCache.keys())
    };
  }

  // Exponer propiedades para tests
  static get cacheTimestamp() {
    return cacheTimestamp;
  }

  static set cacheTimestamp(value) {
    cacheTimestamp = value;
  }
}

module.exports = SystemConfigService;