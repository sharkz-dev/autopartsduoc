import React from 'react';
import { Outlet } from 'react-router-dom';
import DistributorSidebar from '../components/distributor/DistributorSidebar';
import DistributorHeader from '../components/distributor/DistributorHeader';

const DistributorLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar (fijo para escritorio, flotante para móvil) */}
      <div className="hidden md:block md:w-64 md:flex-shrink-0">
        <div className="h-full">
          <DistributorSidebar />
        </div>
      </div>
      
      {/* Mobile sidebar - se muestra como un overlay */}
      <div className="md:hidden">
        <DistributorSidebar />
      </div>
      
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DistributorHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <div className="container mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DistributorLayout;