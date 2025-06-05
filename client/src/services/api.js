import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar el token a cada solicitud
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Error en interceptor de request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Error en respuesta de API:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.error || error.message
    });

    // Si recibimos un error 401 (no autorizado), limpiar y redirigir
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Solo redirigir si no estamos ya en páginas de auth
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authService = {
  // Configurar token manualmente
  setAuthToken: (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  },

  // Remover token
  removeAuthToken: () => {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  },

  // Login
  login: (credentials) => {
    return api.post('/auth/login', credentials);
  },

  // Register
  register: (userData) => {
    return api.post('/auth/register', userData);
  },

  // Obtener usuario actual
  getCurrentUser: () => {
    return api.get('/auth/me');
  },

  // Actualizar perfil
  updateProfile: (userData) => {
    return api.put('/auth/updatedetails', userData);
  },

  // Actualizar contraseña
  updatePassword: (passwords) => {
    return api.put('/auth/updatepassword', passwords);
  },

  // Subir logo de empresa
  uploadCompanyLogo: (userId, formData, options = {}) => {
    return api.put(`/auth/upload-logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...options // Para onUploadProgress y otras opciones
    }).then(response => {
      return response;
    }).catch(error => {
      throw error;
    });
  },

  // Logout
  logout: () => {
    return api.get('/auth/logout');
  }
};

export const productService = {
  getProducts: (params) => api.get('/products', { params }),
  
  // Usar slug o ID para obtener producto individual
  getProduct: (slugOrId) => {
    return api.get(`/products/${slugOrId}`);
  },
  
  createProduct: (productData) => {
    return api.post('/products', productData);
  },
  
  // Usar slug o ID para actualizar
  updateProduct: (slugOrId, productData) => {
    return api.put(`/products/${slugOrId}`, productData);
  },
  
  // Usar slug o ID para eliminar
  deleteProduct: (slugOrId) => {
    return api.delete(`/products/${slugOrId}`);
  },
  
  // Usar slug o ID para subir imágenes
  uploadProductImage: (slugOrId, formData, config = {}) => {
    return api.put(`/products/${slugOrId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      ...config
    });
  },
  
  getMyProducts: () => {
    return api.get('/products/my/products');
  },
  
  getProductsByDistributor: (id) => api.get(`/products/distributor/${id}`),
  
  // Usar slug o ID para ratings
  addProductRating: (slugOrId, ratingData) => api.post(`/products/${slugOrId}/ratings`, ratingData),
  getProductsOnSale: (params) => api.get('/products/on-sale', { params }),
  
  // Nuevas funciones para valoraciones
  getProductReviews: (slugOrId) => api.get(`/products/${slugOrId}/ratings`),
  addProductReview: (slugOrId, reviewData) => api.post(`/products/${slugOrId}/ratings`, reviewData),

  // Función para obtener marcas únicas
  getBrands: () => {
    return api.get('/products/brands');
  }
};

// Servicios de categorías
export const categoryService = {
  // Obtener todas las categorías
  getCategories: () => {
    return api.get('/categories');
  },
  
  // Usar slug o ID para obtener categoría individual
  getCategory: (slugOrId) => {
    return api.get(`/categories/${slugOrId}`);
  },
  
  // Crear nueva categoría
  createCategory: (data) => {
    return api.post('/categories', data);
  },
  
  // Usar slug o ID para actualizar
  updateCategory: (slugOrId, data) => {
    return api.put(`/categories/${slugOrId}`, data);
  },
  
  // Usar slug o ID para eliminar
  deleteCategory: (slugOrId) => {
    return api.delete(`/categories/${slugOrId}`);
  },
  
  // Subir imagen de categoría usando slug o ID
  uploadCategoryImage: (slugOrId, formData) => {
    return api.put(`/categories/${slugOrId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Obtener subcategorías usando slug o ID
  getSubcategories: (slugOrId) => {
    return api.get(`/categories/${slugOrId}/subcategories`);
  },
};

// Servicios de órdenes
export const orderService = {
  createOrder: (orderData) => {
    return api.post('/orders', orderData);
  },
  
  getMyOrders: () => {
    return api.get('/orders/my-orders');
  },
  
  getOrder: (id) => {
    return api.get(`/orders/${id}`);
  },
  
  cancelOrder: (id, reason = '') => {
    return api.put(`/orders/${id}/cancel`, { reason });
  },
  
  getOrders: () => {
    return api.get('/orders');
  },
  
  getDistributorOrders: () => {
    return api.get('/orders/distributor-orders');
  },
  
  updateOrderStatus: (id, statusData) => {
    return api.put(`/orders/${id}/status`, statusData);
  },

  // Obtener historial de estados de una orden
  getOrderHistory: (orderId) => {
    return api.get(`/orders/${orderId}/history`);
  },

  // Solicitar reembolso
  requestRefund: (orderId, refundData) => {
    return api.post(`/orders/${orderId}/refund`, refundData);
  }
};

// Servicios de pago
export const paymentService = {
  // Crear transacción de pago
  createPaymentTransaction: (orderId) => {
    return api.post(`/payment/create-transaction/${orderId}`);
  },

  // Obtener estado de pago
  getPaymentStatus: (orderId) => {
    return api.get(`/payment/status/${orderId}`);
  },

  // Procesar reembolso (admin)
  processRefund: (orderId, refundData) => {
    return api.post(`/payment/refund/${orderId}`, refundData);
  },

  // Obtener configuración de pago (admin)
  getPaymentConfig: () => {
    return api.get('/payment/config');
  }
};

// Servicios de estadísticas
export const statsService = {
  getAdminStats: () => {
    return api.get('/stats/admin');
  },
  
  getDistributorStats: () => {
    return api.get('/stats/distributor');
  },
  
  getPublicStats: () => {
    return api.get('/stats/public');
  }
};

// Servicios de usuarios (admin)
export const userService = {
  getUsers: () => {
    return api.get('/users');
  },
  
  getUser: (id) => {
    return api.get(`/users/${id}`);
  },
  
  updateUser: (id, userData) => {
    return api.put(`/users/${id}`, userData);
  },
  
  deleteUser: (id) => {
    return api.delete(`/users/${id}`);
  }
};

// Servicio de configuración del sistema
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

// Servicio de notificaciones
export const notificationService = {
  // Obtener notificaciones del usuario
  getNotifications: () => {
    return api.get('/notifications');
  },

  // Marcar notificación como leída
  markAsRead: (notificationId) => {
    return api.put(`/notifications/${notificationId}/read`);
  },

  // Marcar todas las notificaciones como leídas
  markAllAsRead: () => {
    return api.put('/notifications/mark-all-read');
  },

  // Eliminar notificación
  deleteNotification: (notificationId) => {
    return api.delete(`/notifications/${notificationId}`);
  },

  // Obtener número de notificaciones no leídas
  getUnreadCount: () => {
    return api.get('/notifications/unread-count');
  }
};

// Servicio de favoritos/wishlist
export const wishlistService = {
  // Obtener lista de favoritos
  getWishlist: () => {
    return api.get('/wishlist');
  },

  // Agregar producto a favoritos
  addToWishlist: (productId) => {
    return api.post(`/wishlist/${productId}`);
  },

  // Remover producto de favoritos
  removeFromWishlist: (productId) => {
    return api.delete(`/wishlist/${productId}`);
  },

  // Verificar si un producto está en favoritos
  isInWishlist: (productId) => {
    return api.get(`/wishlist/check/${productId}`);
  },

  // Limpiar lista de favoritos
  clearWishlist: () => {
    return api.delete('/wishlist/clear');
  }
};

// Servicio de direcciones
export const addressService = {
  // Obtener direcciones del usuario
  getAddresses: () => {
    return api.get('/addresses');
  },

  // Crear nueva dirección
  createAddress: (addressData) => {
    return api.post('/addresses', addressData);
  },

  // Actualizar dirección
  updateAddress: (addressId, addressData) => {
    return api.put(`/addresses/${addressId}`, addressData);
  },

  // Eliminar dirección
  deleteAddress: (addressId) => {
    return api.delete(`/addresses/${addressId}`);
  },

  // Establecer dirección como predeterminada
  setDefaultAddress: (addressId) => {
    return api.put(`/addresses/${addressId}/set-default`);
  }
};

// Servicio de soporte/tickets
export const supportService = {
  // Crear ticket de soporte
  createTicket: (ticketData) => {
    return api.post('/support/tickets', ticketData);
  },

  // Obtener tickets del usuario
  getMyTickets: () => {
    return api.get('/support/my-tickets');
  },

  // Obtener ticket específico
  getTicket: (ticketId) => {
    return api.get(`/support/tickets/${ticketId}`);
  },

  // Responder a ticket
  replyToTicket: (ticketId, replyData) => {
    return api.post(`/support/tickets/${ticketId}/reply`, replyData);
  },

  // Cerrar ticket
  closeTicket: (ticketId) => {
    return api.put(`/support/tickets/${ticketId}/close`);
  }
};

// Servicio de reportes
export const reportService = {
  // Generar reporte de ventas
  getSalesReport: (params) => {
    return api.get('/reports/sales', { params });
  },

  // Generar reporte de productos
  getProductsReport: (params) => {
    return api.get('/reports/products', { params });
  },

  // Generar reporte de usuarios
  getUsersReport: (params) => {
    return api.get('/reports/users', { params });
  },

  // Exportar reporte
  exportReport: (reportType, format, params) => {
    return api.get(`/reports/${reportType}/export`, {
      params: { ...params, format },
      responseType: 'blob'
    });
  }
};

// Servicio de búsqueda avanzada
export const searchService = {
  // Búsqueda global
  globalSearch: (query, filters = {}) => {
    return api.get('/search/global', {
      params: { q: query, ...filters }
    });
  },

  // Búsqueda de productos avanzada
  searchProducts: (query, filters = {}) => {
    return api.get('/search/products', {
      params: { q: query, ...filters }
    });
  },

  // Sugerencias de búsqueda
  getSearchSuggestions: (query) => {
    return api.get('/search/suggestions', {
      params: { q: query }
    });
  },

  // Búsquedas populares
  getPopularSearches: () => {
    return api.get('/search/popular');
  }
};

// Servicio de configuración de usuario
export const userConfigService = {
  // Obtener configuraciones del usuario
  getUserConfig: () => {
    return api.get('/user-config');
  },

  // Actualizar configuración específica
  updateUserConfig: (key, value) => {
    return api.put('/user-config', { key, value });
  },

  // Resetear configuraciones a valores por defecto
  resetUserConfig: () => {
    return api.post('/user-config/reset');
  }
};

export default api;