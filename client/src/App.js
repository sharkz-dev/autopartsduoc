import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Contextos
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import DistributorLayout from './layouts/DistributorLayout';

// Rutas protegidas
import PrivateRoute from './components/routing/PrivateRoute';

// Páginas públicas
import HomePage from './pages/public/HomePage';
import CatalogPage from './pages/public/CatalogPage';
import ProductDetailsPage from './pages/public/ProductDetailsPage';
import CartPage from './pages/public/CartPage';
import CheckoutPage from './pages/public/CheckoutPage';
import DistributorListPage from './pages/public/DistributorListPage';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';
import NotFoundPage from './pages/public/NotFoundPage';
import UnauthorizedPage from './pages/public/UnauthorizedPage';

// Páginas de autenticación
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import RegisterDistributorPage from './pages/auth/RegisterDistributorPage';

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
import AdminDistributorsPage from './pages/admin/AdminDistributorsPage';

// Páginas de distribuidor
import DistributorDashboardPage from './pages/distributor/DistributorDashboardPage';
import DistributorProductsPage from './pages/distributor/DistributorProductsPage';
import DistributorAddProductPage from './pages/distributor/DistributorAddProductPage';
import DistributorEditProductPage from './pages/distributor/DistributorEditProductPage';
import DistributorOrdersPage from './pages/distributor/DistributorOrdersPage';
import DistributorProfilePage from './pages/distributor/DistributorProfilePage';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="catalog" element={<CatalogPage />} />
            <Route path="product/:id" element={<ProductDetailsPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="distributors" element={<DistributorListPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="unauthorized" element={<UnauthorizedPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="register-distributor" element={<RegisterDistributorPage />} />
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
            <Route path="distributors" element={<AdminDistributorsPage />} />
          </Route>

          {/* Rutas de distribuidor */}
          <Route path="/distributor" element={
            <PrivateRoute allowedRoles={['distributor']}>
              <DistributorLayout />
            </PrivateRoute>
          }>
            <Route index element={<DistributorDashboardPage />} />
            <Route path="products" element={<DistributorProductsPage />} />
            <Route path="product/add" element={<DistributorAddProductPage />} />
            <Route path="product/edit/:id" element={<DistributorEditProductPage />} />
            <Route path="orders" element={<DistributorOrdersPage />} />
            <Route path="profile" element={<DistributorProfilePage />} />
          </Route>
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;