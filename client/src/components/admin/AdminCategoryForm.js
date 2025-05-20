import React, { useState, useEffect } from 'react';
import { categoryService } from '../../services/api';
import { XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AdminCategoryForm = ({ category, onSubmit, isEditing = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent: ''
  });
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Cargar categorías
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getCategories();
        setCategories(response.data.data);
      } catch (err) {
        console.error('Error al cargar categorías:', err);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Si es modo edición, cargar datos de la categoría
  useEffect(() => {
    if (isEditing && category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        parent: category.parent?._id || ''
      });
    }
  }, [isEditing, category]);
  
  // Manejar cambios en formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Manejar cambio de imagen
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };
  
  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      let categoryId;
      
      // Crear o actualizar categoría
      if (isEditing) {
        const response = await categoryService.updateCategory(category._id, formData);
        categoryId = response.data.data._id;
        toast.success('Categoría actualizada correctamente');
      } else {
        const response = await categoryService.createCategory(formData);
        categoryId = response.data.data._id;
        toast.success('Categoría creada correctamente');
      }
      
      // Subir imagen si se seleccionó una
      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        
        await categoryService.uploadCategoryImage(categoryId, formData, {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        });
      }
      
      // Llamar al callback con los datos de la categoría
      if (onSubmit) {
        onSubmit();
      }
    } catch (err) {
      console.error('Error al enviar formulario:', err);
      setError(err.response?.data?.error || `Error al ${isEditing ? 'actualizar' : 'crear'} la categoría`);
      toast.error(err.response?.data?.error || `Error al ${isEditing ? 'actualizar' : 'crear'} la categoría`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                id="description"
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              ></textarea>
            </div>
            
            <div>
              <label htmlFor="parent" className="block text-sm font-medium text-gray-700">
                Categoría Padre
              </label>
              <select
                id="parent"
                name="parent"
                value={formData.parent}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">Ninguna (nivel superior)</option>
                {categories
                  .filter(cat => !isEditing || cat._id !== category?._id) // Evitar que la categoría sea su propio padre
                  .map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))
                }
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Imagen
              </label>
              <div className="mt-1 flex items-center">
                {isEditing && category?.image && !selectedImage ? (
                  <div className="mr-4">
                    <img
                      src={`/uploads/${category.image}`}
                      alt={category.name}
                      className="h-20 w-20 object-cover rounded"
                    />
                  </div>
                ) : selectedImage ? (
                  <div className="mr-4">
                    <img
                      src={URL.createObjectURL(selectedImage)}
                      alt="Preview"
                      className="h-20 w-20 object-cover rounded"
                    />
                  </div>
                ) : null}
                
                <label className="py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer">
                  <span>Seleccionar imagen</span>
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
                {selectedImage && (
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
              
              {/* Barra de progreso */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
                  <div className="bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
              loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </>
            ) : (
              `${isEditing ? 'Actualizar' : 'Crear'} Categoría`
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default AdminCategoryForm;