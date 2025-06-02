import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: `${API_URL}/system-config`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autorización
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Error en API de configuración del sistema:', error);
    
    // Manejar errores de autenticación
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

/**
 * Servicio para manejar configuraciones del sistema
 */
export const systemConfigService = {
  /**
   * Obtiene todas las configuraciones del sistema
   * @returns {Promise} Configuraciones agrupadas por categoría
   */
  async getConfigurations() {
    const response = await api.get('/');
    return response;
  },

  /**
   * Obtiene una configuración específica por clave
   * @param {string} key - Clave de configuración
   * @returns {Promise} Configuración específica
   */
  async getConfiguration(key) {
    const response = await api.get(`/${key}`);
    return response;
  },

  /**
   * Actualiza una configuración específica
   * @param {string} key - Clave de configuración
   * @param {Object} data - Datos a actualizar
   * @returns {Promise} Configuración actualizada
   */
  async updateConfiguration(key, data) {
    const response = await api.put(`/${key}`, data);
    return response;
  },

  /**
   * Obtiene el porcentaje de IVA actual
   * @returns {Promise} Información del IVA
   */
  async getTaxRate() {
    const response = await api.get('/tax/rate');
    return response;
  },

  /**
   * Actualiza el porcentaje de IVA
   * @param {Object} data - { rate: number }
   * @returns {Promise} IVA actualizado
   */
  async updateTaxRate(data) {
    const response = await api.put('/tax/rate', data);
    return response;
  },

  /**
   * Resetea todas las configuraciones a valores por defecto
   * @returns {Promise} Resultado del reset
   */
  async resetConfigurations() {
    const response = await api.post('/reset');
    return response;
  }
};

// Servicio público para obtener configuraciones sin autenticación
export const publicSystemConfigService = {
  /**
   * Obtiene el porcentaje de IVA actual (público)
   * @returns {Promise} Información del IVA
   */
  async getTaxRate() {
    try {
      const response = await axios.get(`${API_URL}/system-config/tax/rate`);
      return response;
    } catch (error) {
      console.error('Error al obtener IVA:', error);
      // Retornar valor por defecto en caso de error
      return {
        data: {
          success: true,
          data: {
            rate: 19,
            percentage: '19%',
            decimal: 0.19
          }
        }
      };
    }
  }
};

export default systemConfigService;