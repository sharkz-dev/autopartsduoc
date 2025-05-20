import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const AdminHeader = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
      <div className="flex-1 flex justify-between px-4 md:px-6">
        <div className="flex-1 flex items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Panel de Administración</h1>
        </div>
        <div className="ml-4 flex items-center md:ml-6">
          <div className="ml-3 relative flex items-center">
            <div className="text-sm font-medium text-gray-700 mr-4">
              <span className="hidden md:inline-block">{user?.name}</span>
              <div className="md:hidden h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-gray-500" />
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-50 text-red-600 px-3 py-1.5 rounded-md text-sm flex items-center hover:bg-red-100 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1" />
              <span className="hidden md:inline-block">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;