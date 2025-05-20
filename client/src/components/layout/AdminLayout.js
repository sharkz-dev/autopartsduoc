import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-20 w-64 bg-gray-800 hidden md:block">
        <AdminSidebar />
      </div>
      
      {/* Contenido principal */}
      <div className="flex-1 md:ml-64">
        {/* Header */}
        <AdminHeader />
        
        {/* Contenido principal */}
        <main className="p-6 overflow-x-auto">
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;