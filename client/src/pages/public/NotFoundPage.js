import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="py-12 text-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <h2 className="text-2xl mb-4">Página no encontrada</h2>
      <p className="mb-6">La página que estás buscando no existe o ha sido movida.</p>
      <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium">
        Volver a la página principal
      </Link>
    </div>
  );
};

export default NotFoundPage;