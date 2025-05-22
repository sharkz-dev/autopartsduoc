// client/src/pages/admin/AdminCategoriesPage.js - VERSIÓN CORREGIDA
import React, { useState, useEffect } from 'react';
import { categoryService } from '../../services/api';
import { getImageUrl } from '../../utils/imageHelpers';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ChevronUpIcon, 
  ChevronDownIcon 
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  // Estado para modal de creación/edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent: ''
  });
  
  // Estado para imagen
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Cargar categorías
  useEffect(() => {
    fetchCategories();
  }, []);
  
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryService.getCategories();
      setCategories(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
      setError('Error al cargar categorías. Por favor, intente de nuevo más tarde.');
      setLoading(false);
    }
  };
  
  // ✅ CORREGIDO: Usar ID para eliminar categoría
  const handleDeleteCategory = async (categoryId) => {
    try {
      await categoryService.deleteCategory(categoryId);
      toast.success('Categoría eliminada correctamente');
      fetchCategories();
    } catch (err) {
      console.error('Error al eliminar categoría:', err);
      toast.error(err.response?.data?.error || 'Error al eliminar categoría');
    } finally {
      setConfirmDelete(null);
    }
  };
  
  // Abrir modal para crear nueva categoría
  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      parent: ''
    });
    setSelectedImage(null);
    setIsModalOpen(true);
  };
  
  // Abrir modal para editar categoría
  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parent: category.parent ? category.parent._id : ''
    });
    setSelectedImage(null);
    setIsModalOpen(true);
  };
  
  // Manejar cambios en el formulario
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
  
  // ✅ CORREGIDO: Usar ID para actualizar categoría
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let savedCategory;
      const isEditing = editingCategory !== null;
      
      if (isEditing) {
        // Actualizar categoría existente usando ID
        const categoryData = {
          name: formData.name,
          description: formData.description,
          parent: formData.parent || null
        };
        
        const response = await categoryService.updateCategory(editingCategory._id, categoryData);
        savedCategory = response.data.data;
        
        toast.success('Categoría actualizada correctamente');
      } else {
        // Crear nueva categoría
        const categoryData = {
          name: formData.name,
          description: formData.description,
          parent: formData.parent || null
        };
        
        const response = await categoryService.createCategory(categoryData);
        savedCategory = response.data.data;
        
        toast.success('Categoría creada correctamente');
      }
      
      // Si hay una imagen seleccionada, subirla por separado usando ID
      if (selectedImage) {
        const imageFormData = new FormData();
        imageFormData.append('file', selectedImage);
        
        try {
          await categoryService.uploadCategoryImage(savedCategory._id, imageFormData);
          toast.success('Imagen subida correctamente');
        } catch (imageError) {
          console.error('Error al subir imagen:', imageError);
          toast.error('La categoría se guardó pero hubo un error al subir la imagen');
        }
      }
      
      // Recargar categorías y cerrar modal
      fetchCategories();
      handleCancel();
      
    } catch (err) {
      console.error('Error al guardar categoría:', err);
      toast.error(err.response?.data?.error || 'Error al guardar categoría');
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      parent: ''
    });
    setSelectedImage(null);
    setUploadProgress(0);
  };
  
  // Renderizar árbol de categorías
  const renderCategoryTree = () => {
    // Obtener categorías de nivel superior (sin padre)
    const topLevelCategories = categories.filter(cat => !cat.parent);
    
    // Renderizar cada categoría de nivel superior y sus hijos
    return topLevelCategories.map(category => (
      <CategoryItem 
        key={category._id} 
        category={category} 
        categories={categories}
        onEdit={openEditModal}
        onDelete={setConfirmDelete}
      />
    ));
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
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Administración de Categorías</h1>
        <button
          onClick={openCreateModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Categoría
        </button>
      </div>

      {/* Lista de categorías */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          {categories.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {renderCategoryTree()}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-4">No hay categorías disponibles.</p>
          )}
        </div>
      </div>

      {/* Modal para crear/editar categoría */}
      {isModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </h3>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
                      {categories.map(category => {
                        // Evitar que una categoría sea su propio padre
                        if (editingCategory && category._id === editingCategory._id) return null;
                        return (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Imagen
                    </label>
                    <div className="mt-1 flex items-center">
                      {(editingCategory && editingCategory.image && !selectedImage) ? (
                        <div className="mr-4">
                          <img
                            src={getImageUrl(editingCategory.image)}
                            alt={editingCategory.name}
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
                      
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      />
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
                  
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                    >
                      {editingCategory ? 'Actualizar' : 'Crear'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {confirmDelete && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setConfirmDelete(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Eliminar categoría
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      ¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Nota: No se puede eliminar una categoría si tiene productos o subcategorías asociadas.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => handleDeleteCategory(confirmDelete)}
                >
                  Eliminar
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => setConfirmDelete(null)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ CORREGIDO: Componente CategoryItem usa IDs para acciones
const CategoryItem = ({ category, categories, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Obtener subcategorías
  const subcategories = categories.filter(cat => cat.parent && cat.parent._id === category._id);
  
  return (
    <li>
      <div className="py-4 flex justify-between items-center hover:bg-gray-50 px-2">
        <div className="flex items-center">
          {subcategories.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mr-2 text-gray-400 hover:text-gray-500"
            >
              {expanded ? (
                <ChevronDownIcon className="h-5 w-5" />
              ) : (
                <ChevronUpIcon className="h-5 w-5" />
              )}
            </button>
          )}
          
          <div className="flex items-center">
            {category.image && (
              <img
                src={getImageUrl(category.image)}
                alt={category.name}
                className="h-10 w-10 rounded-full mr-3 object-cover"
              />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">{category.name}</p>
              {category.description && (
                <p className="text-sm text-gray-500">{category.description}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(category)}
            className="text-indigo-600 hover:text-indigo-900"
            title="Editar"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(category._id)}
            className="text-red-600 hover:text-red-900"
            title="Eliminar"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {expanded && subcategories.length > 0 && (
        <ul className="pl-10 border-l ml-4 mt-1 mb-2">
          {subcategories.map(subcat => (
            <CategoryItem
              key={subcat._id}
              category={subcat}
              categories={categories}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export default AdminCategoriesPage;