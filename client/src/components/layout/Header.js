import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { 
  ShoppingCartIcon, 
  UserIcon, 
  Bars3Icon, 
  XMarkIcon,
  ChevronDownIcon,
  BuildingStorefrontIcon,
  CogIcon
} from '@heroicons/react/24/outline';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount, cartType, toggleCartType } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (isUserMenuOpen) setIsUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const redirectToDashboard = () => {
    if (user.role === 'admin') {
      navigate('/admin');
    } else if (user.role === 'distributor') {
      navigate('/distributor');
    }
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold">
            AutoRepuestos
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex space-x-6">
            <Link to="/" className="hover:text-blue-200 transition">
              Inicio
            </Link>
            <Link to="/catalog" className="hover:text-blue-200 transition">
              Catálogo
            </Link>
            <Link to="/distributors" className="hover:text-blue-200 transition">
              Distribuidores
            </Link>
            <Link to="/about" className="hover:text-blue-200 transition">
              Nosotros
            </Link>
            <Link to="/contact" className="hover:text-blue-200 transition">
              Contacto
            </Link>
          </nav>

          {/* User actions - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && (
              <div className="relative">
                <button 
                  onClick={toggleUserMenu}
                  className="flex items-center hover:text-blue-200 transition"
                >
                  <UserIcon className="h-6 w-6 mr-1" />
                  <span className="mr-1">{user.name}</span>
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-gray-500">{user.email}</p>
                    </div>
                    
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Mi Perfil
                    </Link>
                    
                    <Link
                      to="/orders"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Mis Pedidos
                    </Link>
                    
                    {(user.role === 'admin' || user.role === 'distributor') && (
                      <button
                        onClick={redirectToDashboard}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {user.role === 'admin' ? (
                          <span className="flex items-center">
                            <CogIcon className="h-5 w-5 mr-2" />
                            Panel Admin
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <BuildingStorefrontIcon className="h-5 w-5 mr-2" />
                            Panel Distribuidor
                          </span>
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {!isAuthenticated && (
              <>
                <Link
                  to="/login"
                  className="hover:text-blue-200 transition"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition"
                >
                  Registrarse
                </Link>
              </>
            )}

            {/* Cart */}
            <Link
              to="/cart"
              className="relative hover:text-blue-200 transition"
            >
              <ShoppingCartIcon className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Toggle B2B/B2C */}
            <div className="border border-white rounded-md overflow-hidden flex">
              <button 
                className={`px-2 py-1 text-sm ${cartType === 'B2C' ? 'bg-white text-blue-600' : 'bg-transparent'}`}
                onClick={() => toggleCartType('B2C')}
              >
                B2C
              </button>
              <button 
                className={`px-2 py-1 text-sm ${cartType === 'B2B' ? 'bg-white text-blue-600' : 'bg-transparent'}`}
                onClick={() => toggleCartType('B2B')}
              >
                B2B
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <Link
              to="/cart"
              className="relative hover:text-blue-200 transition"
            >
              <ShoppingCartIcon className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            
            <button
              onClick={toggleMenu}
              className="text-white hover:text-blue-200 focus:outline-none"
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-blue-700 px-4 py-2">
          <nav className="flex flex-col space-y-3 py-3">
            <Link
              to="/"
              className="hover:text-blue-200 transition"
              onClick={toggleMenu}
            >
              Inicio
            </Link>
            <Link
              to="/catalog"
              className="hover:text-blue-200 transition"
              onClick={toggleMenu}
            >
              Catálogo
            </Link>
            <Link
              to="/distributors"
              className="hover:text-blue-200 transition"
              onClick={toggleMenu}
            >
              Distribuidores
            </Link>
            <Link
              to="/about"
              className="hover:text-blue-200 transition"
              onClick={toggleMenu}
            >
              Nosotros
            </Link>
            <Link
              to="/contact"
              className="hover:text-blue-200 transition"
              onClick={toggleMenu}
            >
              Contacto
            </Link>
            
            <div className="border-t border-blue-600 pt-3">
              {isAuthenticated ? (
                <>
                  <p className="text-blue-200 font-semibold">{user.name}</p>
                  <div className="flex flex-col space-y-3 mt-2">
                    <Link
                      to="/profile"
                      className="hover:text-blue-200 transition"
                      onClick={toggleMenu}
                    >
                      Mi Perfil
                    </Link>
                    <Link
                      to="/orders"
                      className="hover:text-blue-200 transition"
                      onClick={toggleMenu}
                    >
                      Mis Pedidos
                    </Link>
                    
                    {(user.role === 'admin' || user.role === 'distributor') && (
                      <button
                        onClick={redirectToDashboard}
                        className="text-left hover:text-blue-200 transition"
                      >
                        {user.role === 'admin' ? 'Panel Admin' : 'Panel Distribuidor'}
                      </button>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      className="text-left text-red-300 hover:text-red-400 transition"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col space-y-3">
                  <Link
                    to="/login"
                    className="hover:text-blue-200 transition"
                    onClick={toggleMenu}
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/register"
                    className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition text-center"
                    onClick={toggleMenu}
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
            
            {/* Toggle B2B/B2C */}
            <div className="pt-3">
              <p className="text-sm text-blue-200 mb-2">Modo de Compra:</p>
              <div className="border border-white rounded-md overflow-hidden flex w-full">
                <button 
                  className={`flex-1 py-2 text-sm ${cartType === 'B2C' ? 'bg-white text-blue-600' : 'bg-transparent'}`}
                  onClick={() => toggleCartType('B2C')}
                >
                  B2C
                </button>
                <button 
                  className={`flex-1 py-2 text-sm ${cartType === 'B2B' ? 'bg-white text-blue-600' : 'bg-transparent'}`}
                  onClick={() => toggleCartType('B2B')}
                >
                  B2B
                </button>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;