import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl } from '../../utils/imageHelpers';
import {
  HomeIcon,
  CubeIcon,
  ShoppingBagIcon,
  UserIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const DistributorSidebar = () => {
  const { user, logout, refreshUser } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // NUEVO: Estado local para forzar re-render
  const [userState, setUserState] = useState(user);
  const [imageKey, setImageKey] = useState(Date.now());

  // CRÍTICO: Efecto para actualizar estado local cuando cambia el usuario del contexto
  useEffect(() => {
    console.log('🔄 DistributorSidebar - Usuario del contexto cambió:', user);
    if (user) {
      setUserState(user);
      setImageKey(Date.now()); // Forzar re-render de la imagen
      console.log('✅ Estado local del sidebar actualizado');
    }
  }, [user]);

  // NUEVO: Efecto para refrescar usuario al montar el componente
  useEffect(() => {
    const refreshUserData = async () => {
      if (user && !user.companyLogo) {
        console.log('🔄 Sidebar montado - Refrescando datos del usuario...');
        try {
          await refreshUser();
        } catch (error) {
          console.error('❌ Error al refrescar usuario en sidebar:', error);
        }
      }
    };

    refreshUserData();
  }, []);

  // NUEVO: Efecto para verificar cambios en localStorage (fallback)
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('📦 Cambio detectado en localStorage');
      const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (storedUser && JSON.stringify(storedUser) !== JSON.stringify(userState)) {
        console.log('🔄 Actualizando desde localStorage:', storedUser);
        setUserState(storedUser);
        setImageKey(Date.now());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // También verificar cada 2 segundos como fallback
    const interval = setInterval(() => {
      const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (storedUser && storedUser.companyLogo !== userState?.companyLogo) {
        console.log('⏰ Verificación periódica - Usuario actualizado');
        setUserState(storedUser);
        setImageKey(Date.now());
      }
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [userState]);
  
  const navigation = [
    { name: 'Dashboard', href: '/distributor', icon: HomeIcon },
    { name: 'Mis Productos', href: '/distributor/products', icon: CubeIcon },
    { name: 'Órdenes', href: '/distributor/orders', icon: ShoppingBagIcon },
    { name: 'Mi Perfil', href: '/distributor/profile', icon: UserIcon },
  ];
  
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  // NUEVO: Función para renderizar logo con key única para forzar re-render
  const renderCompanyLogo = (className = "h-10 w-10 rounded-full object-cover bg-white p-0.5") => {
    const currentUser = userState || user;
    
    if (currentUser?.companyLogo) {
      const logoUrl = getImageUrl(currentUser.companyLogo);
      console.log('🖼️ Renderizando logo:', logoUrl, 'Key:', imageKey);
      
      return (
        <img 
          key={`logo-${imageKey}`} // CRÍTICO: Key única para forzar re-render
          src={`${logoUrl}?t=${imageKey}`} // CRÍTICO: Cache busting
          alt={currentUser.companyName || currentUser.name}
          className={className}
          onLoad={() => {
            console.log('✅ Logo cargado exitosamente');
          }}
          onError={(e) => {
            console.warn('❌ Error al cargar logo:', e.target.src);
            e.target.style.display = 'none';
            const iconContainer = e.target.parentElement;
            if (iconContainer) {
              const icon = iconContainer.querySelector('.fallback-icon');
              if (icon) icon.style.display = 'flex';
            }
          }}
        />
      );
    }
    return null;
  };

  // NUEVO: Función para renderizar icono de fallback
  const renderFallbackIcon = (className = "h-6 w-6 text-blue-200") => {
    const currentUser = userState || user;
    return (
      <div 
        className="fallback-icon h-10 w-10 rounded-full bg-blue-700 flex items-center justify-center" 
        style={{ display: currentUser?.companyLogo ? 'none' : 'flex' }}
      >
        <UserIcon className={className} />
      </div>
    );
  };

  // Usar userState en lugar de user directamente
  const currentUser = userState || user;

  // NUEVO: Mostrar indicador de carga si no hay usuario
  if (!currentUser) {
    return (
      <div className="hidden md:flex md:flex-col h-full bg-gradient-to-b from-blue-900 to-blue-800 text-gray-100">
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex items-center justify-center flex-shrink-0 px-4 py-6 bg-blue-900">
            <div className="animate-pulse">
              <div className="h-8 w-32 bg-blue-700 rounded"></div>
            </div>
          </div>
          <div className="mt-4 px-4">
            <div className="bg-blue-800 bg-opacity-40 p-4 rounded-lg">
              <div className="animate-pulse flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-blue-700"></div>
                <div className="flex-1">
                  <div className="h-4 bg-blue-700 rounded mb-2"></div>
                  <div className="h-3 bg-blue-700 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('🎨 Renderizando sidebar con usuario:', {
    name: currentUser.name,
    companyName: currentUser.companyName,
    companyLogo: currentUser.companyLogo,
    imageKey: imageKey
  });
  
  return (
    <>
      {/* Sidebar para escritorio */}
      <div className="hidden md:flex md:flex-col h-full bg-gradient-to-b from-blue-900 to-blue-800 text-gray-100">
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Logo y nombre */}
          <div className="flex items-center justify-center flex-shrink-0 px-4 py-6 bg-blue-900">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-white tracking-wide">AutoRepuestos</span>
            </Link>
          </div>
          
          {/* Línea divisora */}
          <div className="mx-6 my-1 h-px bg-blue-700"></div>
          
          {/* Información del distribuidor */}
          <div className="mt-4 px-4" key={`user-info-${imageKey}`}>
            <div className="bg-blue-800 bg-opacity-40 p-4 rounded-lg border border-blue-600 border-opacity-40">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {renderCompanyLogo()}
                  {renderFallbackIcon()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white truncate">
                    {currentUser?.companyName || 'Mi Empresa'}
                  </p>
                  <p className="text-xs text-blue-200 mt-0.5 truncate">
                    Panel de Distribuidor
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Menú de navegación */}
          <nav className="mt-8 flex-1 px-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                  ${isActive(item.href)
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'}
                `}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors ${
                    isActive(item.href)
                      ? 'text-white'
                      : 'text-blue-300 group-hover:text-blue-100'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
              </Link>
            ))}
            
            {/* Enlace al catálogo público */}
            <Link
              to="/catalog"
              className="group flex items-center px-4 py-3 text-sm font-medium rounded-lg text-blue-100 hover:bg-blue-700 hover:text-white transition-all duration-200"
            >
              <ChartBarIcon className="mr-3 flex-shrink-0 h-5 w-5 text-blue-300 group-hover:text-blue-100" />
              <span className="truncate">Ver Catálogo</span>
            </Link>
          </nav>
        </div>
        
        {/* Footer con botón de logout */}
        <div className="flex-shrink-0 p-4 border-t border-blue-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg text-blue-100 hover:bg-red-600 hover:text-white transition-all duration-200"
          >
            <ArrowRightOnRectangleIcon className="mr-3 flex-shrink-0 h-5 w-5 text-blue-300 group-hover:text-white" />
            <span className="truncate">Cerrar Sesión</span>
          </button>
        </div>
      </div>
      
      {/* Botón de menú para móvil */}
      <div className="md:hidden fixed top-0 left-0 z-30 m-4">
        <button
          type="button"
          className="flex items-center justify-center p-2 rounded-md text-gray-700 bg-white shadow-lg hover:bg-gray-100 focus:outline-none"
          onClick={toggleMobileMenu}
        >
          <span className="sr-only">Abrir menú principal</span>
          <Bars3Icon className="h-6 w-6" />
        </button>
      </div>
      
      {/* Panel lateral para móvil */}
      <div className={`md:hidden fixed inset-0 z-40 ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        {/* Overlay de fondo */}
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" onClick={toggleMobileMenu}></div>
        
        {/* Panel lateral */}
        <div className="fixed inset-y-0 left-0 flex flex-col max-w-xs w-full bg-gradient-to-b from-blue-900 to-blue-800 shadow-xl">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={toggleMobileMenu}
            >
              <span className="sr-only">Cerrar sidebar</span>
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center justify-center px-4 py-3">
              <Link to="/" className="flex items-center">
                <span className="text-xl font-bold text-white tracking-wide">AutoRepuestos</span>
              </Link>
            </div>
            
            {/* Línea divisora */}
            <div className="mx-6 my-2 h-px bg-blue-700"></div>
            
            {/* Información del distribuidor en móvil */}
            <div className="mt-3 px-4" key={`mobile-user-info-${imageKey}`}>
              <div className="bg-blue-800 bg-opacity-40 p-4 rounded-lg border border-blue-600 border-opacity-40">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {renderCompanyLogo()}
                    {renderFallbackIcon()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white truncate">
                      {currentUser?.companyName || 'Mi Empresa'}
                    </p>
                    <p className="text-xs text-blue-200 mt-0.5 truncate">
                      Panel de Distribuidor
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                    ${isActive(item.href)
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                      : 'text-blue-100 hover:bg-blue-700 hover:text-white'}
                  `}
                  onClick={toggleMobileMenu}
                >
                  <item.icon
                    className={`mr-4 flex-shrink-0 h-5 w-5 ${
                      isActive(item.href)
                        ? 'text-white'
                        : 'text-blue-300 group-hover:text-blue-100'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
              
              {/* Enlace al catálogo público */}
              <Link
                to="/catalog"
                className="group flex items-center px-4 py-3 text-sm font-medium rounded-lg text-blue-100 hover:bg-blue-700 hover:text-white transition-all duration-200"
                onClick={toggleMobileMenu}
              >
                <ChartBarIcon className="mr-4 flex-shrink-0 h-5 w-5 text-blue-300 group-hover:text-blue-100" />
                Ver Catálogo
              </Link>
            </nav>
          </div>
          
          {/* Footer con botón de logout */}
          <div className="flex-shrink-0 flex border-t border-blue-700 p-4">
            <button
              onClick={handleLogout}
              className="flex-shrink-0 w-full group flex items-center px-4 py-3 text-sm font-medium rounded-lg text-blue-100 hover:bg-red-600 hover:text-white transition-all duration-200"
            >
              <ArrowRightOnRectangleIcon className="mr-4 flex-shrink-0 h-5 w-5 text-blue-300 group-hover:text-white" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DistributorSidebar;