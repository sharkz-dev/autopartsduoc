import React from 'react';
import { Outlet } from 'react-router-dom';
import DistributorSidebar from '../components/distributor/DistributorSidebar';
import DistributorHeader from '../components/distributor/DistributorHeader';

const DistributorLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <DistributorSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DistributorHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DistributorLayout;