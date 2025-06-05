import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  HomeIcon, 
  CubeIcon, 
  UserGroupIcon, 
  TagIcon, 
  ShoppingBagIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  CogIcon
} from '@heroicons/react/24/outline';

const AdminSidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
    { name: 'Productos', href: '/admin/products', icon: CubeIcon },
    { name: 'Categorías', href: '/admin/categories', icon: TagIcon },
    { name: 'Pedidos', href: '/admin/orders', icon: ShoppingBagIcon },
    { name: 'Usuarios', href: '/admin/users', icon: UserGroupIcon },
    { name: 'Configuración', href: '/admin/system-config', icon: CogIcon },
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Sidebar para escritorio */}
      <div className="hidden md:flex md:flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100">
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Logo y nombre */}
          <div className="flex items-center justify-center flex-shrink-0 px-4 py-6 bg-gray-900">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-white tracking-wide">AutoParts</span>
            </Link>
          </div>
          
          {/* Línea divisora */}
          <div className="mx-6 my-1 h-px bg-gray-700"></div>
          
          {/* Menú de navegación */}
          <nav className="mt-8 flex-1 px-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                  ${isActive(item.href)
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                `}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors ${
                    isActive(item.href)
                      ? 'text-white'
                      : 'text-gray-400 group-hover:text-gray-300'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
              </Link>
            ))}
            
            {/* Enlace al catálogo público */}
            <Link
              to="/catalog"
              className="group flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200"
            >
              <ChartBarIcon className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-300" />
              <span className="truncate">Ver Catálogo</span>
            </Link>
          </nav>
        </div>
        
        {/* Footer con botón de logout */}
        <div className="flex-shrink-0 p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200"
          >
            <ArrowRightOnRectangleIcon className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-white" />
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
        <div className="fixed inset-y-0 left-0 flex flex-col max-w-xs w-full bg-gradient-to-b from-gray-900 to-gray-800 shadow-xl">
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
                <span className="text-xl font-bold text-white tracking-wide">AutoParts</span>
              </Link>
            </div>
            
            {/* Línea divisora */}
            <div className="mx-6 my-2 h-px bg-gray-700"></div>
            
            {/* Información del administrador */}
            <div className="mt-3 px-4">
              <div className="bg-blue-800 bg-opacity-20 p-3 rounded-lg border border-blue-700 border-opacity-40">
                <p className="text-sm font-medium text-white">
                  Panel de Administración
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Gestión completa del sistema
                </p>
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
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                  `}
                  onClick={toggleMobileMenu}
                >
                  <item.icon
                    className={`mr-4 flex-shrink-0 h-5 w-5 ${
                      isActive(item.href)
                        ? 'text-white'
                        : 'text-gray-400 group-hover:text-gray-300'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
              
              {/* Enlace al catálogo público */}
              <Link
                to="/catalog"
                className="group flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200"
                onClick={toggleMobileMenu}
              >
                <ChartBarIcon className="mr-4 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-300" />
                Ver Catálogo
              </Link>
            </nav>
          </div>
          
          {/* Footer con botón de logout */}
          <div className="flex-shrink-0 flex border-t border-gray-700 p-4">
            <button
              onClick={handleLogout}
              className="flex-shrink-0 w-full group flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200"
            >
              <ArrowRightOnRectangleIcon className="mr-4 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-white" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;