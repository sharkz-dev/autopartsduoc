import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  UserIcon, 
  ArrowRightOnRectangleIcon, 
  BellIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
  ChevronDownIcon 
} from '@heroicons/react/24/outline';

const AdminHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Notificaciones simuladas para el ejemplo
  const notifications = [
    {
      id: 1,
      title: 'Nueva orden recibida',
      message: 'Se ha recibido un nuevo pedido (#12345)',
      time: '10 minutos atrás',
      read: false,
      type: 'order'
    },
    {
      id: 2,
      title: 'Nuevo distribuidor registrado',
      message: 'Autopartes XYZ se ha registrado como distribuidor',
      time: '2 horas atrás',
      read: false,
      type: 'distributor'
    },
    {
      id: 3,
      title: 'Stock bajo',
      message: 'Varios productos tienen stock bajo',
      time: 'ayer',
      read: true,
      type: 'stock'
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
      <div className="flex-1 flex justify-between px-4 md:px-6">
        <div className="flex-1 flex items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Panel de Administración</h1>
        </div>
        <div className="ml-4 flex items-center md:ml-6">
          {/* Botón de notificaciones */}
          <div className="relative">
            <button
              type="button"
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
            >
              <span className="sr-only">Ver notificaciones</span>
              <BellIcon className="h-6 w-6" />
              {/* Badge de notificaciones no leídas */}
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              )}
            </button>
            
            {/* Panel de notificaciones */}
            {showNotifications && (
              <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="p-2" role="menu" aria-orientation="vertical" aria-labelledby="notifications-menu">
                  <div className="border-b border-gray-200 p-2">
                    <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
                  </div>
                  
                  {notifications.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 hover:bg-gray-50 flex ${!notification.read ? 'bg-blue-50' : ''}`}
                        >
                          <div className="flex-shrink-0">
                            {notification.type === 'order' ? (
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <EnvelopeIcon className="h-4 w-4 text-blue-600" />
                              </div>
                            ) : notification.type === 'stock' ? (
                              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                <Cog6ToothIcon className="h-4 w-4 text-yellow-600" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                <UserIcon className="h-4 w-4 text-green-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            <p className="text-sm text-gray-500">{notification.message}</p>
                            <p className="mt-1 text-xs text-gray-400">{notification.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-sm text-gray-500">No tienes notificaciones</p>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 p-2 text-center">
                    <button
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      Ver todas las notificaciones
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Botón de perfil */}
          <div className="relative ml-3">
            <button
              type="button"
              className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:bg-gray-100 p-2 hover:bg-gray-100"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
            >
              <span className="sr-only">Abrir menú de usuario</span>
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-gray-500" />
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">
                {user?.name}
              </span>
              <ChevronDownIcon className="h-4 w-4 ml-1 text-gray-500 hidden md:block" />
            </button>
            
            {/* Panel de menú de usuario */}
            {showUserMenu && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="user-menu">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <p className="text-xs font-medium text-gray-500 mt-1">Administrador</p>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;