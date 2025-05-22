import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { categoryService, productService } from '../../services/api';
import { 
  XMarkIcon, 
  ArrowUpTrayIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ProductForm = ({ product, onSubmit, isEditing = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    wholesalePrice: '',
    stockQuantity: '',
    category: '',
    brand: '',
    sku: '',
    partNumber: '',
    featured: false,
    // Otros campos
    compatibleModels: [],
    images: []
  });
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [tempCompatibleModel, setTempCompatibleModel] = useState({ make: '', model: '', year: '' });
  
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
  
  // Si es modo edición, cargar datos del producto
  useEffect(() => {
    if (isEditing && product) {
      const { 
        name, description, price, wholesalePrice, stockQuantity, 
        category, brand, sku, partNumber, featured, compatibleModels, images 
      } = product;
      
      setFormData({
        name: name || '',
        description: description || '',
        price: price || '',
        wholesalePrice: wholesalePrice || '',
        stockQuantity: stockQuantity || '',
        category: category?._id || category || '',
        brand: brand || '',
        sku: sku || '',
        partNumber: partNumber || '',
        featured: featured || false,
        compatibleModels: compatibleModels || [],
        images: images || []
      });
      
      // Mostrar imágenes existentes
      if (images && images.length > 0) {
        setUploadedImages(
          images.map((image, index) => ({
            id: `existing-${index}`,
            name: image,
            preview: `/uploads/${image}`,
            existing: true
          }))
        );
      }
    }
  }, [isEditing, product]);
  
  // Manejar cambios en formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Manejar correctamente campos numéricos y booleanos
    const val = type === 'checkbox' ? checked : (
      type === 'number' ? (value === '' ? '' : parseFloat(value)) : value
    );
    
    setFormData(prev => ({
      ...prev,
      [name]: val
    }));
  };
  
  // Manejar cambios en modelo compatible temporal
  const handleCompatibleModelChange = (e) => {
    const { name, value } = e.target;
    setTempCompatibleModel(prev => ({
      ...prev,
      [name]: name === 'year' ? (value === '' ? '' : parseInt(value)) : value
    }));
  };
  
  // Agregar modelo compatible
  const addCompatibleModel = () => {
    const { make, model, year } = tempCompatibleModel;
    if (!make || !model || !year) {
      toast.error('Por favor completa todos los campos del modelo compatible');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      compatibleModels: [...prev.compatibleModels, tempCompatibleModel]
    }));
    
    // Resetear formulario temporal
    setTempCompatibleModel({ make: '', model: '', year: '' });
  };
  
  // Eliminar modelo compatible
  const removeCompatibleModel = (index) => {
    setFormData(prev => ({
      ...prev,
      compatibleModels: prev.compatibleModels.filter((_, i) => i !== index)
    }));
  };
  
  // Configuración de Dropzone para carga de imágenes
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 5,
    maxSize: 5242880, // 5MB
    onDrop: acceptedFiles => {
      // Agregar las nuevas imágenes al estado
      const newImages = acceptedFiles.map(file => 
        Object.assign(file, {
          id: `new-${Date.now()}-${file.name}`,
          preview: URL.createObjectURL(file)
        })
      );
      
      setUploadedImages(prev => [...prev, ...newImages]);
    },
    onDropRejected: rejectedFiles => {
      const errorMessages = rejectedFiles.map(file => {
        if (file.errors[0].code === 'file-too-large') {
          return `El archivo ${file.file.name} es demasiado grande. Tamaño máximo: 5MB.`;
        }
        return `Error al cargar ${file.file.name}: ${file.errors[0].message}`;
      });
      
      errorMessages.forEach(msg => toast.error(msg));
    }
  });
  
  // Eliminar imagen cargada
  const removeImage = (id) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
    
    // Limpiar URL creada para previsualizaciones
    const imgToRemove = uploadedImages.find(img => img.id === id);
    if (imgToRemove && !imgToRemove.existing) {
      URL.revokeObjectURL(imgToRemove.preview);
    }
  };
  
  // Subir imágenes al servidor
  const uploadImages = async (productId) => {
    const newImagesToUpload = uploadedImages.filter(img => !img.existing);
    const existingImages = uploadedImages.filter(img => img.existing).map(img => img.name);
    
    // Si no hay imágenes nuevas, devolver solo las existentes
    if (newImagesToUpload.length === 0) {
      return existingImages;
    }
    
    const uploadedImageNames = [...existingImages];
    
    // Subir cada imagen nueva
    for (const image of newImagesToUpload) {
      try {
        setUploadProgress(prev => ({ ...prev, [image.id]: 0 }));
        
        const formData = new FormData();
        formData.append('file', image);
        
        const response = await productService.uploadProductImage(productId, formData, {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(prev => ({ ...prev, [image.id]: progress }));
          }
        });
        
        uploadedImageNames.push(response.data.data);
        
      } catch (err) {
        console.error(`Error al subir imagen ${image.name}:`, err);
        toast.error(`Error al subir imagen ${image.name}`);
      }
    }
    
    return uploadedImageNames;
  };
  
  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      let responseData;
      
      // Crear o actualizar producto básico sin imágenes primero
      if (isEditing) {
        const response = await productService.updateProduct(product._id, formData);
        responseData = response.data.data;
      } else {
        const response = await productService.createProduct(formData);
        responseData = response.data.data;
      }
      
      // Subir las imágenes si hay alguna
      if (uploadedImages.length > 0) {
        const imageNames = await uploadImages(responseData._id);
        
        // Actualizar el producto con las imágenes
        await productService.updateProduct(responseData._id, { images: imageNames });
      }
      
      toast.success(`Producto ${isEditing ? 'actualizado' : 'creado'} correctamente`);
      
      // Llamar al callback con los datos del producto
      if (onSubmit) {
        onSubmit(responseData);
      }
    } catch (err) {
      console.error('Error al enviar formulario:', err);
      setError(err.response?.data?.error || `Error al ${isEditing ? 'actualizar' : 'crear'} el producto`);
      toast.error(err.response?.data?.error || `Error al ${isEditing ? 'actualizar' : 'crear'} el producto`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {/* Sección de información básica */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Información básica del producto</h2>
        
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          {/* Nombre del producto */}
          <div className="sm:col-span-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nombre del producto *
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          
          {/* Descripción */}
          <div className="sm:col-span-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descripción *
            </label>
            <textarea
              id="description"
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              required
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            ></textarea>
          </div>
          
          {/* Categoría */}
          <div className="sm:col-span-3">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Categoría *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Seleccionar categoría</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Marca */}
          <div className="sm:col-span-3">
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
              Marca *
            </label>
            <input
              type="text"
              name="brand"
              id="brand"
              value={formData.brand}
              onChange={handleChange}
              required
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          
          {/* Precio */}
          <div className="sm:col-span-2">
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Precio (CLP) *
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="price"
                id="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="1"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                placeholder="0"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">CLP</span>
              </div>
            </div>
          </div>
          
          {/* Precio mayorista */}
          <div className="sm:col-span-2">
            <label htmlFor="wholesalePrice" className="block text-sm font-medium text-gray-700">
              Precio Mayorista (B2B)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="wholesalePrice"
                id="wholesalePrice"
                value={formData.wholesalePrice}
                onChange={handleChange}
                min="0"
                step="1"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                placeholder="0"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">CLP</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">Dejar en blanco para usar el precio regular en B2B</p>
          </div>
          
          {/* Stock */}
          <div className="sm:col-span-2">
            <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700">
              Cantidad en Stock *
            </label>
            <input
              type="number"
              name="stockQuantity"
              id="stockQuantity"
              value={formData.stockQuantity}
              onChange={handleChange}
              required
              min="0"
              step="1"
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          
          {/* SKU */}
          <div className="sm:col-span-3">
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
              SKU (Código de producto) *
            </label>
            <input
              type="text"
              name="sku"
              id="sku"
              value={formData.sku}
              onChange={handleChange}
              required
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          
          {/* Número de parte */}
          <div className="sm:col-span-3">
            <label htmlFor="partNumber" className="block text-sm font-medium text-gray-700">
              Número de parte
            </label>
            <input
              type="text"
              name="partNumber"
              id="partNumber"
              value={formData.partNumber}
              onChange={handleChange}
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          
          {/* Producto destacado */}
          <div className="sm:col-span-6">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="featured"
                  name="featured"
                  type="checkbox"
                  checked={formData.featured}
                  onChange={handleChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="featured" className="font-medium text-gray-700">
                  Producto destacado
                </label>
                <p className="text-gray-500">
                  Los productos destacados aparecen en la página principal y en secciones promocionales.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sección de modelos compatibles */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Modelos Compatibles</h2>
        <p className="text-sm text-gray-500 mb-4">
          Agrega los modelos de vehículos compatibles con este producto.
        </p>
        
        {/* Formulario para agregar modelo compatible */}
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 mb-4">
          <div className="sm:col-span-2">
            <label htmlFor="make" className="block text-sm font-medium text-gray-700">
              Marca
            </label>
            <input
              type="text"
              name="make"
              id="make"
              value={tempCompatibleModel.make}
              onChange={handleCompatibleModelChange}
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          
          <div className="sm:col-span-2">
            <label htmlFor="model" className="block text-sm font-medium text-gray-700">
              Modelo
            </label>
            <input
              type="text"
              name="model"
              id="model"
              value={tempCompatibleModel.model}
              onChange={handleCompatibleModelChange}
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          
          <div className="sm:col-span-1">
            <label htmlFor="year" className="block text-sm font-medium text-gray-700">
              Año
            </label>
            <input
              type="number"
              name="year"
              id="year"
              value={tempCompatibleModel.year}
              onChange={handleCompatibleModelChange}
              min="1900"
              max="2100"
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          
          <div className="sm:col-span-1 flex items-end">
            <button
              type="button"
              onClick={addCompatibleModel}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              Agregar
            </button>
          </div>
        </div>
        
        {/* Lista de modelos compatibles */}
        {formData.compatibleModels.length > 0 ? (
          <div className="mt-6 border rounded-md divide-y">
            {formData.compatibleModels.map((model, index) => (
              <div key={index} className="flex justify-between items-center p-3 hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {model.make} {model.model} ({model.year})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeCompatibleModel(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 p-4 text-center rounded-md">
            <p className="text-sm text-gray-500">No hay modelos compatibles agregados</p>
          </div>
        )}
      </div>
      
      {/* Sección de imágenes */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Imágenes del Producto</h2>
        
        {/* Dropzone para carga de imágenes */}
        <div 
          {...getRootProps()} 
          className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:bg-gray-50"
        >
          <div className="space-y-1 text-center">
            <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                <span>Sube imágenes</span>
                <input {...getInputProps()} />
              </label>
              <p className="pl-1">o arrastra y suelta</p>
            </div>
            <p className="text-xs text-gray-500">
              PNG, JPG, JPEG hasta 5MB. Máximo 5 imágenes.
            </p>
          </div>
        </div>
        
        {/* Vista previa de imágenes */}
        {uploadedImages.length > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {uploadedImages.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-w-1 aspect-h-1 rounded-md overflow-hidden bg-gray-100">
                  <img
                    src={image.preview}
                    alt={image.name}
                    className="object-cover w-full h-32"
                  />
                  
                  {/* Barra de progreso */}
                  {uploadProgress[image.id] !== undefined && uploadProgress[image.id] < 100 && (
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                      <div className="bg-white w-3/4 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full rounded-full" 
                          style={{ width: `${uploadProgress[image.id]}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Botón para eliminar imagen */}
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  className="absolute top-1 right-1 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
                
                {/* Etiqueta de imagen principal */}
                {uploadedImages.indexOf(image) === 0 && (
                  <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    Principal
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Botones de acción */}
      <div className="flex justify-end space-x-3 pt-5">
        <button
          type="button"
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={() => window.history.back()}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
            loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
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
            `${isEditing ? 'Actualizar' : 'Crear'} producto`
          )}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;