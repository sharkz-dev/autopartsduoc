import React from 'react';
import { Routes, Route } from 'react-router-dom';
import OrderConfirmationPage from './pages/public/OrderConfirmationPage';
import PaymentReturnPage from './pages/public/PaymentReturnPage';
import ScrollToTop from './components/common/ScrollToTop';
// Contextos
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

// Rutas protegidas
import PrivateRoute from './components/routing/PrivateRoute';

// Páginas públicas
import HomePage from './pages/public/HomePage';
import CatalogPage from './pages/public/CatalogPage';
import ProductDetailsPage from './pages/public/ProductDetailsPage';
import CartPage from './pages/public/CartPage';
import CheckoutPage from './pages/public/CheckoutPage';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';
import NotFoundPage from './pages/public/NotFoundPage';
import UnauthorizedPage from './pages/public/UnauthorizedPage';

// Páginas de autenticación
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Páginas de cliente
import ProfilePage from './pages/client/ProfilePage';
import OrdersPage from './pages/client/OrdersPage';
import OrderDetailsPage from './pages/client/OrderDetailsPage';

// Páginas de administrador
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminAddProductPage from './pages/admin/AdminAddProductPage';
import AdminEditProductPage from './pages/admin/AdminEditProductPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminAddCategoryPage from './pages/admin/AdminAddCategoryPage';
import AdminEditCategoryPage from './pages/admin/AdminEditCategoryPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminSystemConfigPage from './pages/admin/AdminSystemConfigPage'; // NUEVO

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ScrollToTop />
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="catalog" element={<CatalogPage />} />
            <Route path="product/:id" element={<ProductDetailsPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="unauthorized" element={<UnauthorizedPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
            <Route path="/order-confirmation/:orderId" element={<PrivateRoute><OrderConfirmationPage /></PrivateRoute>} />
            <Route path="/payment/success" element={<PrivateRoute><PaymentReturnPage /></PrivateRoute>} />
            <Route path="/payment/failure" element={<PrivateRoute><PaymentReturnPage /></PrivateRoute>} />
            <Route path="/payment/pending" element={<PrivateRoute><PaymentReturnPage /></PrivateRoute>} />
            <Route path="*" element={<NotFoundPage />} />
            
            {/* Rutas protegidas para cualquier usuario autenticado */}
            <Route element={<PrivateRoute />}>
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="order/:id" element={<OrderDetailsPage />} />
            </Route>
          </Route>

          {/* Rutas de administrador */}
          <Route path="/admin" element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminLayout />
            </PrivateRoute>
          }>
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="products/add" element={<AdminAddProductPage />} />
            <Route path="products/edit/:id" element={<AdminEditProductPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="categories/add" element={<AdminAddCategoryPage />} />
            <Route path="categories/edit/:id" element={<AdminEditCategoryPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="system-config" element={<AdminSystemConfigPage />} /> {/* NUEVO */}
          </Route>
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;