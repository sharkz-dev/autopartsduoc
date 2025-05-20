import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminCategoryForm from '../../components/admin/AdminCategoryForm';

const AdminAddCategoryPage = () => {
  const navigate = useNavigate();

  const handleSubmit = () => {
    // Redireccionar a la página de categorías después de la creación exitosa
    navigate('/admin/categories');
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agregar Nueva Categoría</h1>
        <p className="mt-1 text-sm text-gray-500">
          Complete el formulario a continuación para crear una nueva categoría.
        </p>
      </div>

      <AdminCategoryForm onSubmit={handleSubmit} isEditing={false} />
    </div>
  );
};

export default AdminAddCategoryPage;