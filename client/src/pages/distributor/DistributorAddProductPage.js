import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductForm from '../../components/distributor/ProductForm';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const DistributorAddProductPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (product) => {
    setIsSubmitting(true);
    
    // Mostrar mensaje de éxito
    toast.success('Producto creado correctamente');
    
    // Redireccionar a la página de productos después de la creación exitosa
    setTimeout(() => {
      navigate('/distributor/products');
    }, 1000);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agregar Nuevo Producto</h1>
          <p className="mt-1 text-sm text-gray-500">
            Completa los detalles de tu nuevo producto para publicarlo en el catálogo.
          </p>
        </div>
        <button
          onClick={() => navigate('/distributor/products')}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Volver a Productos
        </button>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Información del Producto
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Todos los campos marcados con * son obligatorios.
          </p>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          <ProductForm 
            onSubmit={handleSubmit} 
            isEditing={false}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default DistributorAddProductPage;