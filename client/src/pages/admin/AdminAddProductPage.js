import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminProductForm from '../../components/admin/AdminProductForm';

const AdminAddProductPage = () => {
  const navigate = useNavigate();

  const handleSubmit = () => {
    // Redireccionar a la página de productos después de la creación exitosa
    navigate('/admin/products');
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agregar Nuevo Producto</h1>
        <p className="mt-1 text-sm text-gray-500">
          Complete el formulario a continuación para crear un nuevo producto.
        </p>
      </div>

      <AdminProductForm onSubmit={handleSubmit} isEditing={false} />
    </div>
  );
};

export default AdminAddProductPage;