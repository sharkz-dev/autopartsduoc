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
      console.log('Enviando solicitud con token:', token);
      config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.log('No hay token disponible');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si recibimos un error 401 (no autorizado), podemos redirigir al login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Opcional: redirigir al login si no estamos ya en la página de login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authService = {
  uploadCompanyLogo: (userId, formData) => {
    return api.put(`/users/${userId}/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/updatedetails', userData),
  updatePassword: (passwords) => api.put('/auth/updatepassword', passwords)
};

// Servicios de productos - VERSIÓN CORREGIDA
export const productService = {
  getProducts: (params) => api.get('/products', { params }),
  
  // ✅ CORREGIDO: Usar slug o ID para obtener producto individual
  getProduct: (slugOrId) => api.get(`/products/${slugOrId}`),
  
  createProduct: (productData) => api.post('/products', productData),
  
  // ✅ CORREGIDO: Usar slug o ID para actualizar
  updateProduct: (slugOrId, productData) => api.put(`/products/${slugOrId}`, productData),
  
  // ✅ CORREGIDO: Usar slug o ID para eliminar
  deleteProduct: (slugOrId) => api.delete(`/products/${slugOrId}`),
  
  // ✅ CORREGIDO: Usar slug o ID para subir imágenes
  uploadProductImage: (slugOrId, formData, config = {}) => 
    api.put(`/products/${slugOrId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      ...config
    }),
  
  getMyProducts: () => api.get('/products/my/products'),
  getProductsByDistributor: (id) => api.get(`/products/distributor/${id}`),
  
  // ✅ CORREGIDO: Usar slug o ID para ratings
  addProductRating: (slugOrId, ratingData) => api.post(`/products/${slugOrId}/ratings`, ratingData),
  getProductsOnSale: (params) => api.get('/products/on-sale', { params }),
  
  // Nuevas funciones para valoraciones - CORREGIDAS
  getProductReviews: (slugOrId) => api.get(`/products/${slugOrId}/ratings`),
  addProductReview: (slugOrId, reviewData) => api.post(`/products/${slugOrId}/ratings`, reviewData)
};

// Servicios de categorías - VERSIÓN CORREGIDA
export const categoryService = {
  // Obtener todas las categorías
  getCategories: () => api.get('/categories'),
  
  // ✅ CORREGIDO: Usar slug o ID para obtener categoría individual
  getCategory: (slugOrId) => api.get(`/categories/${slugOrId}`),
  
  // Crear nueva categoría
  createCategory: (data) => api.post('/categories', data),
  
  // ✅ CORREGIDO: Usar slug o ID para actualizar
  updateCategory: (slugOrId, data) => api.put(`/categories/${slugOrId}`, data),
  
  // ✅ CORREGIDO: Usar slug o ID para eliminar
  deleteCategory: (slugOrId) => api.delete(`/categories/${slugOrId}`),
  
  // ✅ CORREGIDO: Subir imagen de categoría usando slug o ID
  uploadCategoryImage: (slugOrId, formData) => {
    return api.put(`/categories/${slugOrId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // ✅ CORREGIDO: Obtener subcategorías usando slug o ID
  getSubcategories: (slugOrId) => api.get(`/categories/${slugOrId}/subcategories`),
};

// Servicios de órdenes
export const orderService = {
  createOrder: (orderData) => api.post('/orders', orderData),
  getMyOrders: () => api.get('/orders/my-orders'),
  getOrder: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
  getOrders: () => api.get('/orders'), // solo admin
  getDistributorOrders: () => api.get('/orders/distributor-orders'), // solo distribuidor
  updateOrderStatus: (id, statusData) => api.put(`/orders/${id}/status`, statusData)
};

// Servicios de estadísticas
export const statsService = {
  getAdminStats: () => api.get('/stats/admin'),
  getDistributorStats: () => api.get('/stats/distributor'),
  getPublicStats: () => api.get('/stats/public')
};

// Servicios de usuarios (admin)
export const userService = {
  getUsers: () => api.get('/users'),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`)
};

export default api;