import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../../services/api';
import ProductForm from '../../components/distributor/ProductForm';
import toast from 'react-hot-toast';

const DistributorEditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await productService.getProduct(id);
        setProduct(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar producto:', err);
        setError('Error al cargar producto. Por favor, intente de nuevo más tarde.');
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);
  
  const handleSubmit = () => {
    // Mostrar mensaje de éxito
    toast.success('Producto actualizado correctamente');
    
    // Redireccionar a la página de productos
    setTimeout(() => {
      navigate('/distributor/products');
    }, 1000);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4" role="alert">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar Producto</h1>
      
      {product && (
        <ProductForm 
          product={product} 
          onSubmit={handleSubmit} 
          isEditing={true} 
        />
      )}
    </div>
  );
};

export default DistributorEditProductPage;