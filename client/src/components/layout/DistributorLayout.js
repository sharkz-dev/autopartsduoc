import React from 'react';
import { Outlet } from 'react-router-dom';
import DistributorSidebar from '../components/distributor/DistributorSidebar';
import DistributorHeader from '../components/distributor/DistributorHeader';

const DistributorLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-20 w-64 bg-gray-800 hidden md:block">
        <DistributorSidebar />
      </div>
      
      {/* Contenido principal */}
      <div className="flex-1 md:ml-64">
        {/* Header */}
        <DistributorHeader />
        
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

export default DistributorLayout;