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
    
    return api.put(`/auth/upload-logo`, formData, {
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
  },

  // Logout
  logout: () => {
    console.log('👋 Cerrando sesión...');
    return api.get('/auth/logout');
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
  
  cancelOrder: (id, reason = '') => {
    console.log('❌ Cancelando orden:', id);
    return api.put(`/orders/${id}/cancel`, { reason });
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
  },

  // NUEVA: Obtener historial de estados de una orden
  getOrderHistory: (orderId) => {
    console.log('📋 Obteniendo historial de orden:', orderId);
    return api.get(`/orders/${orderId}/history`);
  },

  // NUEVA: Solicitar reembolso
  requestRefund: (orderId, refundData) => {
    console.log('💰 Solicitando reembolso para orden:', orderId);
    return api.post(`/orders/${orderId}/refund`, refundData);
  }
};

// Servicios de pago
export const paymentService = {
  // Crear transacción de pago
  createPaymentTransaction: (orderId) => {
    console.log('💳 Creando transacción de pago para orden:', orderId);
    return api.post(`/payment/create-transaction/${orderId}`);
  },

  // Obtener estado de pago
  getPaymentStatus: (orderId) => {
    console.log('📊 Obteniendo estado de pago para orden:', orderId);
    return api.get(`/payment/status/${orderId}`);
  },

  // Procesar reembolso (admin)
  processRefund: (orderId, refundData) => {
    console.log('💰 Procesando reembolso para orden:', orderId);
    return api.post(`/payment/refund/${orderId}`, refundData);
  },

  // Obtener configuración de pago (admin)
  getPaymentConfig: () => {
    console.log('🔧 Obteniendo configuración de pago...');
    return api.get('/payment/config');
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

// NUEVO: Servicio de notificaciones
export const notificationService = {
  // Obtener notificaciones del usuario
  getNotifications: () => {
    console.log('🔔 Obteniendo notificaciones...');
    return api.get('/notifications');
  },

  // Marcar notificación como leída
  markAsRead: (notificationId) => {
    console.log('✅ Marcando notificación como leída:', notificationId);
    return api.put(`/notifications/${notificationId}/read`);
  },

  // Marcar todas las notificaciones como leídas
  markAllAsRead: () => {
    console.log('✅ Marcando todas las notificaciones como leídas');
    return api.put('/notifications/mark-all-read');
  },

  // Eliminar notificación
  deleteNotification: (notificationId) => {
    console.log('🗑️ Eliminando notificación:', notificationId);
    return api.delete(`/notifications/${notificationId}`);
  },

  // Obtener número de notificaciones no leídas
  getUnreadCount: () => {
    console.log('🔢 Obteniendo número de notificaciones no leídas...');
    return api.get('/notifications/unread-count');
  }
};

// NUEVO: Servicio de favoritos/wishlist
export const wishlistService = {
  // Obtener lista de favoritos
  getWishlist: () => {
    console.log('❤️ Obteniendo lista de favoritos...');
    return api.get('/wishlist');
  },

  // Agregar producto a favoritos
  addToWishlist: (productId) => {
    console.log('❤️ Agregando producto a favoritos:', productId);
    return api.post(`/wishlist/${productId}`);
  },

  // Remover producto de favoritos
  removeFromWishlist: (productId) => {
    console.log('💔 Removiendo producto de favoritos:', productId);
    return api.delete(`/wishlist/${productId}`);
  },

  // Verificar si un producto está en favoritos
  isInWishlist: (productId) => {
    console.log('🔍 Verificando si producto está en favoritos:', productId);
    return api.get(`/wishlist/check/${productId}`);
  },

  // Limpiar lista de favoritos
  clearWishlist: () => {
    console.log('🗑️ Limpiando lista de favoritos...');
    return api.delete('/wishlist/clear');
  }
};

// NUEVO: Servicio de direcciones
export const addressService = {
  // Obtener direcciones del usuario
  getAddresses: () => {
    console.log('📍 Obteniendo direcciones del usuario...');
    return api.get('/addresses');
  },

  // Crear nueva dirección
  createAddress: (addressData) => {
    console.log('➕ Creando nueva dirección...');
    return api.post('/addresses', addressData);
  },

  // Actualizar dirección
  updateAddress: (addressId, addressData) => {
    console.log('🔄 Actualizando dirección:', addressId);
    return api.put(`/addresses/${addressId}`, addressData);
  },

  // Eliminar dirección
  deleteAddress: (addressId) => {
    console.log('🗑️ Eliminando dirección:', addressId);
    return api.delete(`/addresses/${addressId}`);
  },

  // Establecer dirección como predeterminada
  setDefaultAddress: (addressId) => {
    console.log('⭐ Estableciendo dirección predeterminada:', addressId);
    return api.put(`/addresses/${addressId}/set-default`);
  }
};

// NUEVO: Servicio de soporte/tickets
export const supportService = {
  // Crear ticket de soporte
  createTicket: (ticketData) => {
    console.log('🎫 Creando ticket de soporte...');
    return api.post('/support/tickets', ticketData);
  },

  // Obtener tickets del usuario
  getMyTickets: () => {
    console.log('📋 Obteniendo mis tickets de soporte...');
    return api.get('/support/my-tickets');
  },

  // Obtener ticket específico
  getTicket: (ticketId) => {
    console.log('🔍 Obteniendo ticket:', ticketId);
    return api.get(`/support/tickets/${ticketId}`);
  },

  // Responder a ticket
  replyToTicket: (ticketId, replyData) => {
    console.log('💬 Respondiendo a ticket:', ticketId);
    return api.post(`/support/tickets/${ticketId}/reply`, replyData);
  },

  // Cerrar ticket
  closeTicket: (ticketId) => {
    console.log('✅ Cerrando ticket:', ticketId);
    return api.put(`/support/tickets/${ticketId}/close`);
  }
};

// NUEVO: Servicio de reportes
export const reportService = {
  // Generar reporte de ventas
  getSalesReport: (params) => {
    console.log('📊 Generando reporte de ventas...');
    return api.get('/reports/sales', { params });
  },

  // Generar reporte de productos
  getProductsReport: (params) => {
    console.log('📊 Generando reporte de productos...');
    return api.get('/reports/products', { params });
  },

  // Generar reporte de usuarios
  getUsersReport: (params) => {
    console.log('📊 Generando reporte de usuarios...');
    return api.get('/reports/users', { params });
  },

  // Exportar reporte
  exportReport: (reportType, format, params) => {
    console.log('📥 Exportando reporte:', reportType, 'formato:', format);
    return api.get(`/reports/${reportType}/export`, {
      params: { ...params, format },
      responseType: 'blob'
    });
  }
};

// NUEVO: Servicio de búsqueda avanzada
export const searchService = {
  // Búsqueda global
  globalSearch: (query, filters = {}) => {
    console.log('🔍 Realizando búsqueda global:', query);
    return api.get('/search/global', {
      params: { q: query, ...filters }
    });
  },

  // Búsqueda de productos avanzada
  searchProducts: (query, filters = {}) => {
    console.log('🔍 Búsqueda avanzada de productos:', query);
    return api.get('/search/products', {
      params: { q: query, ...filters }
    });
  },

  // Sugerencias de búsqueda
  getSearchSuggestions: (query) => {
    console.log('💡 Obteniendo sugerencias para:', query);
    return api.get('/search/suggestions', {
      params: { q: query }
    });
  },

  // Búsquedas populares
  getPopularSearches: () => {
    console.log('🔥 Obteniendo búsquedas populares...');
    return api.get('/search/popular');
  }
};

// NUEVO: Servicio de configuración de usuario
export const userConfigService = {
  // Obtener configuraciones del usuario
  getUserConfig: () => {
    console.log('⚙️ Obteniendo configuraciones del usuario...');
    return api.get('/user-config');
  },

  // Actualizar configuración específica
  updateUserConfig: (key, value) => {
    console.log('🔄 Actualizando configuración de usuario:', key);
    return api.put('/user-config', { key, value });
  },

  // Resetear configuraciones a valores por defecto
  resetUserConfig: () => {
    console.log('🔄 Reseteando configuraciones de usuario...');
    return api.post('/user-config/reset');
  }
};

export default api;