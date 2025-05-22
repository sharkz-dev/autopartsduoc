import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { categoryService } from '../../services/api';
import AdminCategoryForm from '../../components/admin/AdminCategoryForm';

const AdminEditCategoryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        const response = await categoryService.getCategory(id);
        setCategory(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar categoría:', err);
        setError('Error al cargar categoría. Por favor, intente de nuevo más tarde.');
        setLoading(false);
      }
    };
    
    fetchCategory();
  }, [id]);
  
  const handleSubmit = () => {
    // Redireccionar a la página de categorías después de la edición exitosa
    navigate('/admin/categories');
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar Categoría</h1>
        <p className="mt-1 text-sm text-gray-500">
          Modifique la información de la categoría a continuación.
        </p>
      </div>
      
      {category && (
        <AdminCategoryForm 
          category={category} 
          onSubmit={handleSubmit} 
          isEditing={true} 
        />
      )}
    </div>
  );
};

export default AdminEditCategoryPage;