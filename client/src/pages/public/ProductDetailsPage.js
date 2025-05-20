import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const ProductDetailsPage = () => {
  // eslint-disable-next-line no-unused-vars
  const { id } = useParams();
  
  // Estado simulado para un producto de muestra
  const [product] = useState({
    name: 'Producto de Ejemplo',
    description: 'Este es un producto de ejemplo para la página de detalles.',
    price: 19990,
    brand: 'Marca Ejemplo',
    category: { name: 'Categoría Ejemplo' },
    stockQuantity: 25,
    images: []
  });

  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6">
      {/* Migas de pan */}
      <div className="px-4 py-2 bg-gray-50 text-sm text-gray-500">
        <Link to="/" className="hover:text-blue-600">Inicio</Link>
        <span className="mx-2">/</span>
        <Link to="/catalog" className="hover:text-blue-600">Catálogo</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.name}</span>
      </div>
      
      <div className="md:flex">
        {/* Imagen de producto */}
        <div className="md:w-1/2 p-4">
          <div className="mb-4 h-80 overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
            <div className="text-gray-400">Imagen no disponible</div>
          </div>
        </div>
        
        {/* Información del producto */}
        <div className="md:w-1/2 p-6 flex flex-col">
          <div className="flex-grow">
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            
            <div className="mt-4">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</span>
              </div>
              
              {/* Indicador de stock */}
              <div className="mt-2 flex items-center">
                <span className="text-sm text-green-700">En stock</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({product.stockQuantity} unidades disponibles)
                </span>
              </div>
            </div>
            
            {/* Características principales */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Información del producto</h3>
              <div className="mt-2 space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Marca:</span> {product.brand}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Categoría:</span> {product.category.name}
                </p>
              </div>
            </div>
            
            {/* Descripción */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Descripción</h3>
              <div className="mt-2 text-sm text-gray-600 space-y-4">
                <p>{product.description}</p>
              </div>
            </div>
          </div>
          
          {/* Acciones */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <button
              type="button"
              className="w-full flex items-center justify-center px-8 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;