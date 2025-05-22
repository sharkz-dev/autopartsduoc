import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { 
  ShoppingCartIcon, 
  UserIcon, 
  Bars3Icon, 
  XMarkIcon,
  ChevronDownIcon,
  BuildingStorefrontIcon,
  CogIcon,
  PhoneIcon,
  EnvelopeIcon,
  TruckIcon,
  TagIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

const Header = () => {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const { cartCount, cartType, toggleCartType } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // NUEVO: Estados para manejar la validación del usuario
  const [userValidated, setUserValidated] = useState(false);
  const [userError, setUserError] = useState(false);

  // NUEVO: Efecto para validar usuario y manejar casos edge
  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user) {
        // Usuario válido
        setUserValidated(true);
        setUserError(false);
      } else if (isAuthenticated && !user) {
        // Estado inconsistente - autenticado pero sin datos de usuario
        console.warn('⚠️ Estado inconsistente: autenticado pero sin datos de usuario');
        setUserError(true);
        setUserValidated(false);
        
        // Intentar limpiar el estado inconsistente después de un delay
        setTimeout(() => {
          console.log('🔄 Limpiando estado inconsistente...');
          logout();
        }, 1000);
      } else {
        // No autenticado - estado normal
        setUserValidated(false);
        setUserError(false);
      }
    }
  }, [user, isAuthenticated, loading, logout]);

  // Controlar scroll para efectos del header
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

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
    // VALIDACIÓN MEJORADA: Verificar que user existe antes de acceder a role
    if (!user) {
      console.error('❌ No se puede redirigir: usuario no disponible');
      return;
    }

    if (user.role === 'admin') {
      navigate('/admin');
    } else if (user.role === 'distributor') {
      navigate('/distributor');
    }
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
  };

  // Verificar si la ruta actual coincide con la del link
  const isActive = (path) => location.pathname === path;

  // NUEVO: Función para obtener el nombre del usuario de forma segura
  const getUserName = () => {
    if (!user || !user.name) return 'Usuario';
    return user.name.split(' ')[0] || 'Usuario';
  };

  // NUEVO: Función para obtener el rol del usuario de forma segura
  const getUserRole = () => {
    if (!user || !user.role) return 'Cliente';
    
    switch (user.role) {
      case 'admin':
        return 'Administrador';
      case 'distributor':
        return 'Distribuidor';
      case 'client':
      default:
        return 'Cliente';
    }
  };

  // NUEVO: Si hay un error de usuario, mostrar un mensaje de carga o error
  if (userError) {
    return (
      <header className="bg-red-600 text-white py-2">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            🔄 Problema con la sesión, reestableciendo...
          </p>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className={`${scrolled ? 'bg-blue-700 shadow-lg' : 'bg-blue-600 shadow-md'} text-white transition-all duration-300 fixed top-0 left-0 right-0 z-50`}>
        {/* Barra superior con información de contacto */}
        <div className="bg-blue-800 py-1.5 text-xs text-blue-100">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <PhoneIcon className="h-3 w-3 mr-1" />
                <span>+56 2 2345 6789</span>
              </div>
              <div className="hidden sm:flex items-center">
                <EnvelopeIcon className="h-3 w-3 mr-1" />
                <span>ventas@autorepuestos.com</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {userValidated ? (
                <span className="text-blue-200">¡Bienvenido, {getUserName()}!</span>
              ) : (
                <>
                  <Link to="/login" className="hover:text-white transition-colors">Iniciar Sesión</Link>
                  <span className="text-blue-400">|</span>
                  <Link to="/register" className="hover:text-white transition-colors">Registrarse</Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Header principal */}
        <div className={`${scrolled ? 'py-2' : 'py-3'} container mx-auto px-4 transition-all duration-300`}>
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <div className="mr-2 bg-white rounded-full p-1.5">
                <TruckIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className={`${scrolled ? 'text-xl' : 'text-2xl'} font-bold tracking-tight transition-all duration-300`}>
                  Auto<span className="text-yellow-400">Parts</span>
                </h1>
                <span className={`text-xs text-blue-200 hidden sm:block -mt-1 ${scrolled ? 'opacity-0 h-0' : 'opacity-100'} transition-all duration-300`}>
                  Todo para tu vehículo
                </span>
              </div>
            </Link>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex space-x-1">
              {[
                { path: '/', label: 'Inicio', icon: <HomeIcon className="h-4 w-4 mr-1" /> },
                { path: '/catalog', label: 'Catálogo', icon: <TagIcon className="h-4 w-4 mr-1" /> },
                { path: '/distributors', label: 'Distribuidores', icon: <BuildingStorefrontIcon className="h-4 w-4 mr-1" /> },
                { path: '/about', label: 'Nosotros' },
                { path: '/contact', label: 'Contacto' }
              ].map(item => (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  className={`px-3 py-2 rounded-full flex items-center transition-colors text-sm ${
                    isActive(item.path) 
                      ? 'bg-blue-500 text-white font-medium' 
                      : 'hover:bg-blue-500/30'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* User actions - Desktop */}
            <div className="hidden md:flex items-center space-x-3">
              {/* Toggle B2B/B2C */}
              <div className="bg-blue-700/50 border border-blue-400 rounded-md overflow-hidden flex text-xs">
                <button 
                  className={`px-2.5 py-1.5 transition-colors ${cartType === 'B2C' ? 'bg-white text-blue-600 font-medium' : 'hover:bg-blue-500/30'}`}
                  onClick={() => toggleCartType('B2C')}
                >
                  Cliente
                </button>
                <button 
                  className={`px-2.5 py-1.5 transition-colors ${cartType === 'B2B' ? 'bg-white text-blue-600 font-medium' : 'hover:bg-blue-500/30'}`}
                  onClick={() => toggleCartType('B2B')}
                >
                  Mayorista
                </button>
              </div>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2 rounded-full hover:bg-blue-500/30 transition-colors"
              >
                <ShoppingCartIcon className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center border border-white">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {userValidated ? (
                <div className="relative">
                  <button 
                    onClick={toggleUserMenu}
                    className={`flex items-center rounded-full pl-2 pr-3 py-1.5 ${isUserMenuOpen ? 'bg-blue-500' : 'hover:bg-blue-500/30'} transition-colors`}
                  >
                    <div className="bg-blue-500 rounded-full p-1 mr-2">
                      <UserIcon className="h-3 w-3" />
                    </div>
                    <span className="mr-1 text-sm hidden sm:block">{getUserName()}</span>
                    <ChevronDownIcon className="h-3 w-3" />
                  </button>
                  
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-lg py-1 z-10 border border-gray-200">
                      <div className="px-4 py-3 text-sm text-gray-700 border-b">
                        <p className="font-semibold">{user?.name || 'Usuario'}</p>
                        <p className="text-gray-500 text-xs">{user?.email || 'Sin email'}</p>
                        <div className="mt-1 pt-1 border-t border-gray-100">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            {getUserRole()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                          Mi Perfil
                        </Link>
                        
                        <Link
                          to="/orders"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <TruckIcon className="h-4 w-4 mr-2 text-gray-500" />
                          Mis Pedidos
                        </Link>
                      </div>
                      
                      {user && (user.role === 'admin' || user.role === 'distributor') && (
                        <div className="py-1 border-t border-gray-100">
                          <button
                            onClick={redirectToDashboard}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            {user.role === 'admin' ? (
                              <>
                                <CogIcon className="h-4 w-4 mr-2 text-blue-600" />
                                Panel de Administración
                              </>
                            ) : (
                              <>
                                <BuildingStorefrontIcon className="h-4 w-4 mr-2 text-blue-600" />
                                Panel de Distribuidor
                              </>
                            )}
                          </button>
                        </div>
                      )}
                      
                      <div className="py-1 border-t border-gray-100">
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="bg-yellow-500 hover:bg-yellow-400 text-white px-3 py-1.5 rounded-full font-medium text-sm transition-colors"
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-3">
              <Link
                to="/cart"
                className="relative p-2"
              >
                <ShoppingCartIcon className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              
              <button
                onClick={toggleMenu}
                className="text-white p-1"
              >
                {isMenuOpen ? (
                  <XMarkIcon className="h-5 w-5" />
                ) : (
                  <Bars3Icon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-gradient-to-b from-blue-700 to-blue-800 pb-3">
            <nav className="flex flex-col px-4 py-2">
              {[
                { path: '/', label: 'Inicio', icon: <HomeIcon className="h-5 w-5 mr-2" /> },
                { path: '/catalog', label: 'Catálogo', icon: <TagIcon className="h-5 w-5 mr-2" /> },
                { path: '/distributors', label: 'Distribuidores', icon: <BuildingStorefrontIcon className="h-5 w-5 mr-2" /> },
                { path: '/about', label: 'Nosotros', icon: <UserIcon className="h-5 w-5 mr-2" /> },
                { path: '/contact', label: 'Contacto', icon: <EnvelopeIcon className="h-5 w-5 mr-2" /> }
              ].map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center py-2.5 px-2 ${
                    isActive(item.path) 
                      ? 'bg-blue-600 rounded-md font-medium' 
                      : 'border-b border-blue-600/40'
                  }`}
                  onClick={toggleMenu}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
              
              {/* Toggle B2B/B2C Mobile */}
              <div className="pt-3 mt-2">
                <p className="text-sm text-blue-200 mb-2 font-medium">Modo de Compra:</p>
                <div className="border border-blue-400 rounded-md overflow-hidden flex w-full">
                  <button 
                    className={`flex-1 py-2 text-sm ${cartType === 'B2C' ? 'bg-white text-blue-600 font-medium' : 'bg-transparent'}`}
                    onClick={() => toggleCartType('B2C')}
                  >
                    Cliente (B2C)
                  </button>
                  <button 
                    className={`flex-1 py-2 text-sm ${cartType === 'B2B' ? 'bg-white text-blue-600 font-medium' : 'bg-transparent'}`}
                    onClick={() => toggleCartType('B2B')}
                  >
                    Mayorista (B2B)
                  </button>
                </div>
              </div>
              
              <div className="border-t border-blue-600/40 pt-3 mt-3">
                {userValidated ? (
                  <>
                    <div className="bg-blue-600/40 rounded-lg p-3 mb-3">
                      <p className="text-white font-semibold">{user?.name || 'Usuario'}</p>
                      <p className="text-blue-200 text-sm">{user?.email || 'Sin email'}</p>
                      <div className="mt-2">
                        <span className="text-xs px-2 py-0.5 bg-blue-800 text-blue-200 rounded-full">
                          {getUserRole()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Link
                        to="/profile"
                        className="flex items-center py-2 px-3 rounded-md hover:bg-blue-600/40 transition-colors"
                        onClick={toggleMenu}
                      >
                        <UserIcon className="h-5 w-5 mr-2" />
                        Mi Perfil
                      </Link>
                      <Link
                        to="/orders"
                        className="flex items-center py-2 px-3 rounded-md hover:bg-blue-600/40 transition-colors"
                        onClick={toggleMenu}
                      >
                        <TruckIcon className="h-5 w-5 mr-2" />
                        Mis Pedidos
                      </Link>
                      
                      {user && (user.role === 'admin' || user.role === 'distributor') && (
                        <button
                          onClick={redirectToDashboard}
                          className="w-full text-left flex items-center py-2 px-3 rounded-md hover:bg-blue-600/40 transition-colors"
                        >
                          {user.role === 'admin' ? (
                            <>
                              <CogIcon className="h-5 w-5 mr-2" />
                              Panel de Administración
                            </>
                          ) : (
                            <>
                              <BuildingStorefrontIcon className="h-5 w-5 mr-2" />
                              Panel de Distribuidor
                            </>
                          )}
                        </button>
                      )}
                      
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center py-2 px-3 rounded-md bg-red-500/20 text-red-100 hover:bg-red-500/30 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Cerrar Sesión
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <Link
                      to="/login"
                      className="flex items-center justify-center py-2 px-3 bg-blue-600/40 rounded-md hover:bg-blue-600/60 transition-colors"
                      onClick={toggleMenu}
                    >
                      <UserIcon className="h-5 w-5 mr-2" />
                      Iniciar Sesión
                    </Link>
                    <Link
                      to="/register"
                      className="flex items-center justify-center py-2 px-3 bg-yellow-500 text-white rounded-md hover:bg-yellow-400 transition-colors"
                      onClick={toggleMenu}
                    >
                      Registrarse
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>
      
      {/* Espacio para compensar el header fijo */}
      <div className={`${scrolled ? 'h-14' : 'h-16'} transition-all duration-300`}></div>
    </>
  );
};

export default Header;