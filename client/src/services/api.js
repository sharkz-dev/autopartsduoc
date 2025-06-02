import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// CORREGIDO: Interceptor para agregar el token a cada solicitud
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('📤 Enviando solicitud con token:', token.substring(0, 20) + '...');
      config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.log('⚠️ No hay token disponible para la solicitud');
    }
    return config;
  },
  (error) => {
    console.error('❌ Error en interceptor de request:', error);
    return Promise.reject(error);
  }
);

// CORREGIDO: Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => {
    // Log exitoso para debugging
    if (response.config.url.includes('/auth/me')) {
      console.log('✅ Respuesta de getCurrentUser:', response.data);
    }
    return response;
  },
  (error) => {
    console.error('❌ Error en respuesta de API:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.error || error.message
    });

    // Si recibimos un error 401 (no autorizado), limpiar y redirigir
    if (error.response && error.response.status === 401) {
      console.log('🚪 Error 401 - Token inválido o expirado');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Solo redirigir si no estamos ya en páginas de auth
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        console.log('🔄 Redirigiendo a login...');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// CORREGIDO: Servicios de autenticación
export const authService = {
  // NUEVO: Configurar token manualmente
  setAuthToken: (token) => {
    if (token) {
      console.log('🔑 Configurando token en headers de API');
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      console.log('❌ Eliminando token de headers de API');
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  },

  // NUEVO: Remover token
  removeAuthToken: () => {
    console.log('🗑️ Removiendo token completamente');
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  },

  // Login
  login: (credentials) => {
    console.log('🔐 Enviando solicitud de login...');
    return api.post('/auth/login', credentials);
  },

  // Register
  register: (userData) => {
    console.log('📝 Enviando solicitud de registro...');
    return api.post('/auth/register', userData);
  },

  // CORREGIDO: Obtener usuario actual con mejor logging
  getCurrentUser: () => {
    console.log('👤 Solicitando datos del usuario current...');
    return api.get('/auth/me');
  },

  // CORREGIDO: Actualizar perfil
  updateProfile: (userData) => {
    console.log('🔄 Enviando actualización de perfil:', userData);
    return api.put('/auth/updatedetails', userData);
  },

  // Actualizar contraseña
  updatePassword: (passwords) => {
    console.log('🔐 Enviando actualización de contraseña...');
    return api.put('/auth/updatepassword', passwords);
  },

  // CORREGIDO: Subir logo de empresa con mejor logging
  uploadCompanyLogo: (userId, formData, options = {}) => {
    console.log('📸 Subiendo logo de empresa para usuario:', userId);
    
    return api.put(`/users/${userId}/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...options // Para onUploadProgress y otras opciones
    }).then(response => {
      console.log('✅ Logo subido exitosamente:', response.data);
      return response;
    }).catch(error => {
      console.error('❌ Error al subir logo:', error.response?.data);
      throw error;
    });
  }
};

export const productService = {
  getProducts: (params) => api.get('/products', { params }),
  
  // ✅ CORREGIDO: Usar slug o ID para obtener producto individual
  getProduct: (slugOrId) => {
    console.log('🔍 Obteniendo producto:', slugOrId);
    return api.get(`/products/${slugOrId}`);
  },
  
  createProduct: (productData) => {
    console.log('➕ Creando producto:', productData.name);
    return api.post('/products', productData);
  },
  
  // ✅ CORREGIDO: Usar slug o ID para actualizar
  updateProduct: (slugOrId, productData) => {
    console.log('🔄 Actualizando producto:', slugOrId);
    return api.put(`/products/${slugOrId}`, productData);
  },
  
  // ✅ CORREGIDO: Usar slug o ID para eliminar
  deleteProduct: (slugOrId) => {
    console.log('🗑️ Eliminando producto:', slugOrId);
    return api.delete(`/products/${slugOrId}`);
  },
  
  // ✅ CORREGIDO: Usar slug o ID para subir imágenes
  uploadProductImage: (slugOrId, formData, config = {}) => {
    console.log('📸 Subiendo imagen de producto:', slugOrId);
    return api.put(`/products/${slugOrId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      ...config
    });
  },
  
  getMyProducts: () => {
    console.log('📦 Obteniendo mis productos...');
    return api.get('/products/my/products');
  },
  
  getProductsByDistributor: (id) => api.get(`/products/distributor/${id}`),
  
  // ✅ CORREGIDO: Usar slug o ID para ratings
  addProductRating: (slugOrId, ratingData) => api.post(`/products/${slugOrId}/ratings`, ratingData),
  getProductsOnSale: (params) => api.get('/products/on-sale', { params }),
  
  // Nuevas funciones para valoraciones - CORREGIDAS
  getProductReviews: (slugOrId) => api.get(`/products/${slugOrId}/ratings`),
  addProductReview: (slugOrId, reviewData) => api.post(`/products/${slugOrId}/ratings`, reviewData),

  // ✅ NUEVO: Función para obtener marcas únicas
  getBrands: () => {
    console.log('🏷️ Obteniendo marcas únicas...');
    return api.get('/products/brands');
  }
};

// Servicios de categorías - VERSIÓN CORREGIDA
export const categoryService = {
  // Obtener todas las categorías
  getCategories: () => {
    console.log('📂 Obteniendo todas las categorías...');
    return api.get('/categories');
  },
  
  // ✅ CORREGIDO: Usar slug o ID para obtener categoría individual
  getCategory: (slugOrId) => {
    console.log('🔍 Obteniendo categoría:', slugOrId);
    return api.get(`/categories/${slugOrId}`);
  },
  
  // Crear nueva categoría
  createCategory: (data) => {
    console.log('➕ Creando categoría:', data.name);
    return api.post('/categories', data);
  },
  
  // ✅ CORREGIDO: Usar slug o ID para actualizar
  updateCategory: (slugOrId, data) => {
    console.log('🔄 Actualizando categoría:', slugOrId);
    return api.put(`/categories/${slugOrId}`, data);
  },
  
  // ✅ CORREGIDO: Usar slug o ID para eliminar
  deleteCategory: (slugOrId) => {
    console.log('🗑️ Eliminando categoría:', slugOrId);
    return api.delete(`/categories/${slugOrId}`);
  },
  
  // ✅ CORREGIDO: Subir imagen de categoría usando slug o ID
  uploadCategoryImage: (slugOrId, formData) => {
    console.log('📸 Subiendo imagen de categoría:', slugOrId);
    return api.put(`/categories/${slugOrId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // ✅ CORREGIDO: Obtener subcategorías usando slug o ID
  getSubcategories: (slugOrId) => {
    console.log('📂 Obteniendo subcategorías de:', slugOrId);
    return api.get(`/categories/${slugOrId}/subcategories`);
  },
};

// Servicios de órdenes
export const orderService = {
  createOrder: (orderData) => {
    console.log('🛒 Creando nueva orden...');
    return api.post('/orders', orderData);
  },
  
  getMyOrders: () => {
    console.log('📋 Obteniendo mis órdenes...');
    return api.get('/orders/my-orders');
  },
  
  getOrder: (id) => {
    console.log('🔍 Obteniendo orden:', id);
    return api.get(`/orders/${id}`);
  },
  
  cancelOrder: (id) => {
    console.log('❌ Cancelando orden:', id);
    return api.put(`/orders/${id}/cancel`);
  },
  
  getOrders: () => {
    console.log('📋 Obteniendo todas las órdenes (admin)...');
    return api.get('/orders');
  },
  
  getDistributorOrders: () => {
    console.log('📋 Obteniendo órdenes del distribuidor...');
    return api.get('/orders/distributor-orders');
  },
  
  updateOrderStatus: (id, statusData) => {
    console.log('🔄 Actualizando estado de orden:', id, 'a:', statusData.status);
    return api.put(`/orders/${id}/status`, statusData);
  }
};

// Servicios de estadísticas
export const statsService = {
  getAdminStats: () => {
    console.log('📊 Obteniendo estadísticas de admin...');
    return api.get('/stats/admin');
  },
  
  getDistributorStats: () => {
    console.log('📊 Obteniendo estadísticas de distribuidor...');
    return api.get('/stats/distributor');
  },
  
  getPublicStats: () => {
    console.log('📊 Obteniendo estadísticas públicas...');
    return api.get('/stats/public');
  }
};

// Servicios de usuarios (admin)
export const userService = {
  getUsers: () => {
    console.log('👥 Obteniendo todos los usuarios...');
    return api.get('/users');
  },
  
  getUser: (id) => {
    console.log('👤 Obteniendo usuario:', id);
    return api.get(`/users/${id}`);
  },
  
  updateUser: (id, userData) => {
    console.log('🔄 Actualizando usuario:', id);
    return api.put(`/users/${id}`, userData);
  },
  
  deleteUser: (id) => {
    console.log('🗑️ Eliminando usuario:', id);
    return api.delete(`/users/${id}`);
  }
};

// NUEVO: Servicio de configuración del sistema
export const systemConfigService = {
  // Obtener todas las configuraciones
  getConfigurations: () => api.get('/system-config'),
  
  // Obtener configuración específica
  getConfiguration: (key) => api.get(`/system-config/${key}`),
  
  // Actualizar configuración
  updateConfiguration: (key, data) => api.put(`/system-config/${key}`, data),
  
  // Obtener tasa de IVA (público)
  getTaxRate: () => axios.get(`${API_URL}/system-config/tax/rate`),
  
  // Actualizar tasa de IVA
  updateTaxRate: (data) => api.put('/system-config/tax/rate', data),
  
  // Resetear configuraciones
  resetConfigurations: () => api.post('/system-config/reset')
};

export default api;