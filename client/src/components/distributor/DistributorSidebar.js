import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
  
  return (
    <>
      {/* Sidebar para desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-gray-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <Link to="/" className="text-xl font-bold text-white">
                AutoRepuestos
              </Link>
            </div>
            
            {/* Información del distribuidor */}
            <div className="mt-5 px-4">
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="text-sm font-medium text-white">
                  {user?.companyName || 'Mi Tienda'}
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  Panel de Distribuidor
                </p>
              </div>
            </div>
            
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md
                    ${isActive(item.href)
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                  `}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-6 w-6 ${
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
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <ChartBarIcon className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-300" />
                Ver Catálogo
              </Link>
            </nav>
          </div>
          
          {/* Footer con botón de logout */}
          <div className="flex-shrink-0 flex border-t border-gray-700 p-4">
            <button
              onClick={handleLogout}
              className="flex-shrink-0 w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <ArrowRightOnRectangleIcon className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-300" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
      
      {/* Botón de menú para móvil */}
      <div className="md:hidden fixed top-0 left-0 z-30 m-4">
        <button
          type="button"
          className="flex items-center justify-center p-2 rounded-md text-gray-700 bg-white shadow-md hover:bg-gray-100 focus:outline-none"
          onClick={toggleMobileMenu}
        >
          <span className="sr-only">Abrir menú principal</span>
          <Bars3Icon className="h-6 w-6" />
        </button>
      </div>
      
      {/* Panel lateral para móvil */}
      <div className={`md:hidden fixed inset-0 z-40 ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        {/* Overlay de fondo */}
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={toggleMobileMenu}></div>
        
        {/* Panel lateral */}
        <div className="fixed inset-y-0 left-0 flex flex-col max-w-xs w-full bg-gray-800 shadow-xl">
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
            <div className="flex-shrink-0 flex items-center px-4">
              <Link to="/" className="text-xl font-bold text-white">
                AutoRepuestos
              </Link>
            </div>
            
            {/* Información del distribuidor */}
            <div className="mt-5 px-4">
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="text-sm font-medium text-white">
                  {user?.companyName || 'Mi Tienda'}
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  Panel de Distribuidor
                </p>
              </div>
            </div>
            
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center px-2 py-2 text-base font-medium rounded-md
                    ${isActive(item.href)
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                  `}
                  onClick={toggleMobileMenu}
                >
                  <item.icon
                    className={`mr-4 flex-shrink-0 h-6 w-6 ${
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
                className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
                onClick={toggleMobileMenu}
              >
                <ChartBarIcon className="mr-4 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-300" />
                Ver Catálogo
              </Link>
            </nav>
          </div>
          
          {/* Footer con botón de logout */}
          <div className="flex-shrink-0 flex border-t border-gray-700 p-4">
            <button
              onClick={handleLogout}
              className="flex-shrink-0 w-full group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <ArrowRightOnRectangleIcon className="mr-4 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-300" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DistributorSidebar;