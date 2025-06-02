import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { 
  UserIcon, 
  ArrowRightOnRectangleIcon, 
  BellIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  ShoppingCartIcon,
  PhoneIcon,
  TruckIcon,
  HomeIcon,
  TagIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const Header = () => {
  const { 
    user, 
    isAuthenticated, 
    logout, 
    loading, 
    getRoleDisplayName,
    isDistributor,
    isApprovedDistributor,
    canAccessWholesalePrices 
  } = useAuth();
  const { cartCount, cartType, toggleCartType, isCartTypeAutomatic } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados para validación del usuario
  const [userValidated, setUserValidated] = useState(false);
  const [userError, setUserError] = useState(false);

  // Efecto para validar usuario
  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user) {
        setUserValidated(true);
        setUserError(false);
      } else if (isAuthenticated && !user) {
        setUserError(true);
        setUserValidated(false);
        setTimeout(() => logout(), 1000);
      } else {
        setUserValidated(false);
        setUserError(false);
      }
    }
  }, [user, isAuthenticated, loading, logout]);

  // Controlar scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const redirectToDashboard = () => {
    if (!user) return;
    if (user.role === 'admin') navigate('/admin');
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const getUserName = () => user?.name?.split(' ')[0] || 'Usuario';

  // Obtener icono según el rol
  const getUserRoleIcon = () => {
    if (!user) return <UserIcon className="h-4 w-4" />;
    
    switch (user.role) {
      case 'admin':
        return <ShieldCheckIcon className="h-4 w-4 text-blue-600" />;
      case 'distributor':
        return <BuildingOfficeIcon className="h-4 w-4 text-purple-600" />;
      case 'client':
      default:
        return <UserIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  // Obtener color de badge según rol
  const getRoleBadgeColor = () => {
    if (!user) return 'bg-gray-100 text-gray-700';
    
    switch (user.role) {
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'distributor':
        return isApprovedDistributor() 
          ? 'bg-purple-100 text-purple-800' 
          : 'bg-yellow-100 text-yellow-800';
      case 'client':
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  // Obtener descripción del estado del distribuidor
  const getDistributorStatus = () => {
    if (!isDistributor()) return '';
    
    return isApprovedDistributor() 
      ? 'Distribuidor Aprobado' 
      : 'Distribuidor Pendiente';
  };

  if (userError) {
    return (
      <header className="bg-gradient-to-r from-red-500 to-red-600 text-white py-2">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">🔄 Reestableciendo sesión...</p>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'glass-card shadow-xl backdrop-blur-xl bg-white/80' 
          : 'bg-transparent'
      }`}>
        {/* Barra superior moderna */}
        <div className={`transition-all duration-300 ${scrolled ? 'h-0 overflow-hidden' : 'h-auto'}`}>
          <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white py-2">
            <div className="container mx-auto px-4 flex justify-between items-center text-sm">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <PhoneIcon className="h-4 w-4" />
                  <span>+56 2 2345 6789</span>
                </div>
                <div className="hidden md:flex items-center space-x-2">
                  <EnvelopeIcon className="h-4 w-4" />
                  <span>ventas@autoparts.com</span>
                </div>
                <div className="hidden lg:block text-xs opacity-80">
                  ✨ Envío gratis en compras sobre $100.000
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {userValidated ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-200">¡Hola, {getUserName()}!</span>
                    {/* MOSTRAR TIPO DE CUENTA */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor()}`}>
                      {isDistributor() ? getDistributorStatus() : getRoleDisplayName()}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Link to="/login" className="hover:text-purple-200 transition-colors">
                      Iniciar Sesión
                    </Link>
                    <span className="text-purple-400">|</span>
                    <Link to="/register" className="hover:text-purple-200 transition-colors">
                      Registrarse
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Header principal con diseño innovador */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo innovador */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <TruckIcon className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  AutoParts
                </h1>
                <span className="text-xs text-gray-500 -mt-1 block">Innovación Automotriz</span>
              </div>
            </Link>

            {/* Barra de búsqueda moderna */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative flex">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Busca repuestos, marcas, modelos..."
                    className="flex-1 pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-transparent rounded-l-2xl focus:border-purple-500 focus:outline-none transition-all duration-300 text-gray-800 placeholder-gray-500"
                  />
                  <button
                    type="submit"
                    className="px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-r-2xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 group"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </form>

            {/* Navegación desktop */}
            <nav className="hidden lg:flex items-center space-x-1">
              {[
                { path: '/', label: 'Inicio', icon: HomeIcon },
                { path: '/catalog', label: 'Catálogo', icon: TagIcon },
                { path: '/about', label: 'Nosotros', icon: UserIcon },
                { path: '/contact', label: 'Contacto', icon: EnvelopeIcon }
              ].map(item => (
                <Link 
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-xl transition-all duration-300 group ${
                    isActive(item.path)
                      ? 'text-purple-600 bg-purple-50'
                      : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50/50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {isActive(item.path) && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"></div>
                  )}
                </Link>
              ))}
            </nav>

            {/* Acciones del usuario */}
            <div className="flex items-center space-x-3">
              {/* INDICADOR DE TIPO DE CARRITO MODIFICADO - SOLO INFORMATIVO */}
              <div className="hidden md:flex bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl p-1 shadow-lg relative">
                <div 
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                    cartType === 'B2C' 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md' 
                      : 'text-gray-600'
                  } ${!isCartTypeAutomatic ? 'cursor-pointer hover:text-purple-600' : 'cursor-default'}`}
                  onClick={!isCartTypeAutomatic ? () => toggleCartType('B2C') : undefined}
                  title={isCartTypeAutomatic ? 'Automático según tu tipo de cuenta' : 'Cambiar a modo Cliente'}
                >
                  <div className="flex items-center space-x-1">
                    <span>Cliente</span>
                    {cartType === 'B2C' && isCartTypeAutomatic && (
                      <span className="text-xs opacity-75">●</span>
                    )}
                  </div>
                </div>
                <div 
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                    cartType === 'B2B' 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md' 
                      : 'text-gray-600'
                  } ${!isCartTypeAutomatic ? 'cursor-pointer hover:text-purple-600' : 'cursor-default'}`}
                  onClick={!isCartTypeAutomatic ? () => toggleCartType('B2B') : undefined}
                  title={isCartTypeAutomatic ? 'Automático según tu tipo de cuenta' : 'Cambiar a modo Mayorista'}
                >
                  <div className="flex items-center space-x-1">
                    <span>Mayorista</span>
                    {cartType === 'B2B' && isCartTypeAutomatic && (
                      <span className="text-xs opacity-75">●</span>
                    )}
                  </div>
                </div>
                
                {/* INDICADOR DE MODO AUTOMÁTICO */}
              </div>

              {/* Carrito moderno */}
              <Link to="/cart" className="relative group">
                <div className="p-3 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white/80 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                  <ShoppingCartIcon className="h-5 w-5 text-gray-700 group-hover:text-purple-600 transition-colors" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
                      {cartCount}
                    </span>
                  )}
                </div>
              </Link>

              {/* Menú de usuario */}
              {userValidated ? (
                <div className="relative">
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 p-2 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white/80 transition-all duration-300 shadow-lg"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      user.role === 'admin' ? 'bg-gradient-to-br from-blue-600 to-blue-700' :
                      user.role === 'distributor' ? 'bg-gradient-to-br from-purple-600 to-purple-700' :
                      'bg-gradient-to-br from-green-600 to-green-700'
                    }`}>
                      {getUserRoleIcon()}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-gray-700">{getUserName()}</span>
                    <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                  </button>
                  
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 glass-card shadow-2xl border border-white/20 rounded-2xl overflow-hidden animate-scale-in">
                      <div className={`p-4 ${
                        user.role === 'admin' ? 'bg-gradient-to-r from-blue-600 to-blue-700' :
                        user.role === 'distributor' ? 'bg-gradient-to-r from-purple-600 to-purple-700' :
                        'bg-gradient-to-r from-green-600 to-green-700'
                      } text-white`}>
                        <div className="flex items-center space-x-3">
                          {getUserRoleIcon()}
                          <div>
                            <p className="font-semibold">{user?.name}</p>
                            <p className="text-sm opacity-90">{user?.email}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className={`inline-block px-2 py-1 bg-white/20 rounded-lg text-xs ${getRoleBadgeColor()}`}>
                            {getRoleDisplayName()}
                          </span>
                          {isDistributor() && (
                            <span className={`inline-block px-2 py-1 rounded-lg text-xs ${
                              isApprovedDistributor() ? 'bg-green-500/20 text-green-100' : 'bg-yellow-500/20 text-yellow-100'
                            }`}>
                              {isApprovedDistributor() ? '✓ Aprobado' : '⏳ Pendiente'}
                            </span>
                          )}
                          {canAccessWholesalePrices() && (
                            <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-100 rounded-lg text-xs">
                              💰 Precios Mayorista
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="py-2">
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <UserIcon className="h-5 w-5 mr-3 text-purple-600" />
                          Mi Perfil
                        </Link>
                        
                        <Link
                          to="/orders"
                          className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <TruckIcon className="h-5 w-5 mr-3 text-purple-600" />
                          Mis Pedidos
                        </Link>
                      </div>
                      
                      {user?.role === 'admin' && (
                        <div className="border-t border-gray-100">
                          <button
                            onClick={redirectToDashboard}
                            className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 transition-colors"
                          >
                            <Cog6ToothIcon className="h-5 w-5 mr-3 text-blue-600" />
                            Panel Admin
                          </button>
                        </div>
                      )}
                      
                      <div className="border-t border-gray-100">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="btn-modern btn-primary"
                >
                  Iniciar Sesión
                </Link>
              )}

              {/* Botón menú móvil */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white/80 transition-all duration-300 shadow-lg"
              >
                {isMenuOpen ? (
                  <XMarkIcon className="h-6 w-6 text-gray-700" />
                ) : (
                  <Bars3Icon className="h-6 w-6 text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Menú móvil innovador */}
        {isMenuOpen && (
          <div className="lg:hidden glass-card mt-2 mx-4 rounded-2xl shadow-2xl border border-white/20 animate-slide-in-up">
            {/* Búsqueda móvil */}
            <div className="p-4 border-b border-gray-100">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </form>
            </div>

            {/* Navegación móvil */}
            <nav className="py-2">
              {[
                { path: '/', label: 'Inicio', icon: HomeIcon },
                { path: '/catalog', label: 'Catálogo', icon: TagIcon },
                { path: '/about', label: 'Nosotros', icon: UserIcon },
                { path: '/contact', label: 'Contacto', icon: EnvelopeIcon }
              ].map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 transition-colors ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-600 border-r-4 border-purple-500'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
            
            {/* INDICADOR DE TIPO DE CARRITO MÓVIL - SOLO INFORMATIVO */}
            <div className="p-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-3">Modo de Compra:</p>
              <div className="bg-gray-100 rounded-xl p-1 flex relative">
                <div 
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-300 text-center ${
                    cartType === 'B2C' 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md' 
                      : 'text-gray-600'
                  }`}
                >
                  Cliente (B2C)
                  {cartType === 'B2C' && isCartTypeAutomatic && (
                    <span className="ml-1 text-xs opacity-75">●</span>
                  )}
                </div>
                <div 
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-300 text-center ${
                    cartType === 'B2B' 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md' 
                      : 'text-gray-600'
                  }`}
                >
                  Mayorista (B2B)
                  {cartType === 'B2B' && isCartTypeAutomatic && (
                    <span className="ml-1 text-xs opacity-75">●</span>
                  )}
                </div>
              </div>
              {isCartTypeAutomatic && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  🤖 Modo automático según tu tipo de cuenta
                </p>
              )}
            </div>
            
            {/* Usuario móvil */}
            <div className="border-t border-gray-100 p-4">
              {userValidated ? (
                <div className="space-y-3">
                  <div className={`flex items-center space-x-3 p-3 rounded-xl ${
                    user.role === 'admin' ? 'bg-gradient-to-r from-blue-50 to-blue-100' :
                    user.role === 'distributor' ? 'bg-gradient-to-r from-purple-50 to-purple-100' :
                    'bg-gradient-to-r from-green-50 to-green-100'
                  }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      user.role === 'admin' ? 'bg-gradient-to-br from-blue-600 to-blue-700' :
                      user.role === 'distributor' ? 'bg-gradient-to-br from-purple-600 to-purple-700' :
                      'bg-gradient-to-br from-green-600 to-green-700'
                    }`}>
                      {getUserRoleIcon()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{user?.name}</p>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-xs font-medium ${getRoleBadgeColor()}`}>
                          {getRoleDisplayName()}
                        </span>
                        {isDistributor() && (
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-xs font-medium ${
                            isApprovedDistributor() ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {isApprovedDistributor() ? '✓ Aprobado' : '⏳ Pendiente'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Link
                      to="/profile"
                      className="flex items-center p-3 text-gray-700 hover:bg-purple-50 rounded-xl transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <UserIcon className="h-5 w-5 mr-3 text-purple-600" />
                      Mi Perfil
                    </Link>
                    <Link
                      to="/orders"
                      className="flex items-center p-3 text-gray-700 hover:bg-purple-50 rounded-xl transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <TruckIcon className="h-5 w-5 mr-3 text-purple-600" />
                      Mis Pedidos
                    </Link>
                    
                    {user?.role === 'admin' && (
                      <button
                        onClick={redirectToDashboard}
                        className="w-full flex items-center p-3 text-gray-700 hover:bg-blue-50 rounded-xl transition-colors"
                      >
                        <Cog6ToothIcon className="h-5 w-5 mr-3 text-blue-600" />
                        Panel Admin
                      </button>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    to="/login"
                    className="btn-modern btn-primary w-full text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/register"
                    className="btn-modern btn-ghost w-full text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
      
      {/* Espaciado para compensar header fijo */}
      <div className={`transition-all duration-300 ${scrolled ? 'h-20' : 'h-32'}`}></div>
    </>
  );
};

export default Header;