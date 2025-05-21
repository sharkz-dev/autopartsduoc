import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
      // Log para debugging
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

// Servicios de productos
export const productService = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  uploadProductImage: (id, formData) => 
    api.put(`/products/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),
  getMyProducts: () => api.get('/products/my/products'),
  getProductsByDistributor: (id) => api.get(`/products/distributor/${id}`),
  addProductRating: (id, ratingData) => api.post(`/products/${id}/ratings`, ratingData),
  getProductsOnSale: (params) => api.get('/products/on-sale', { params })
};

// Servicios de categorías
export const categoryService = {
  // Obtener todas las categorías
  getCategories: () => api.get('/categories'),
  
  // Obtener una categoría por ID
  getCategory: (id) => api.get(`/categories/${id}`),
  
  // Crear nueva categoría
  createCategory: (data) => api.post('/categories', data),
  
  // Actualizar categoría
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  
  // Eliminar categoría
  deleteCategory: (id) => api.delete(`/categories/${id}`),
  
  // Subir imagen de categoría - ESTA ES LA FUNCIÓN QUE NECESITAS
  uploadCategoryImage: (categoryId, formData) => {
    return api.put(`/categories/${categoryId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Obtener subcategorías
  getSubcategories: (parentId) => api.get(`/categories/${parentId}/subcategories`),
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