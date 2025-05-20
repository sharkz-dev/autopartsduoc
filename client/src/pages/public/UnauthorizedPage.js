import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage = () => {
  return (
    <div className="py-12 text-center">
      <h1 className="text-4xl font-bold mb-4 text-red-600">403</h1>
      <h2 className="text-2xl mb-4">Acceso Denegado</h2>
      <p className="mb-6">No tienes permiso para acceder a esta página.</p>
      <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium">
        Volver a la página principal
      </Link>
    </div>
  );
};

export default UnauthorizedPage;