import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { categoryService, productService, userService } from '../../services/api';
import { 
  XMarkIcon, 
  ArrowUpTrayIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AdminProductForm = ({ product, onSubmit, isEditing = false }) => {
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
    distributor: '',
    compatibleModels: [],
    images: [],
    onSale: false,
  discountPercentage: '',
  salePrice: '',
  saleEndDate: ''
  });
  
  const [categories, setCategories] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [tempCompatibleModel, setTempCompatibleModel] = useState({ make: '', model: '', year: '' });
  
  // Cargar categorías y distribuidores
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar categorías
        const categoriesResponse = await categoryService.getCategories();
        setCategories(categoriesResponse.data.data);
        
        // Cargar distribuidores
        const usersResponse = await userService.getUsers();
        const distributorsList = usersResponse.data.data.filter(user => user.role === 'distributor');
        setDistributors(distributorsList);
      } catch (err) {
        console.error('Error al cargar datos iniciales:', err);
        setError('Error al cargar categorías o distribuidores. Por favor, intente de nuevo más tarde.');
      }
    };
    
    fetchData();
  }, []);
  
  // Si es modo edición, cargar datos del producto
  useEffect(() => {
    if (isEditing && product) {
      const { 
        name, description, price, wholesalePrice, stockQuantity, 
        category, brand, sku, partNumber, featured, distributor, 
        compatibleModels, images 
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
        distributor: distributor?._id || distributor || '',
        compatibleModels: compatibleModels || [],
        images: images || [],
              onSale: product.onSale || false,
      discountPercentage: product.discountPercentage || '',
      salePrice: product.salePrice || '',
      saleEndDate: product.saleEndDate ? product.saleEndDate.split('T')[0] : ''
      });
      
      // Mostrar imágenes existentes
if (images && images.length > 0) {
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      setUploadedImages(
        images.map((image, index) => {
          // Construir la URL correcta para la imagen
          let imageUrl = '';
          if (image.startsWith('http://') || image.startsWith('https://')) {
            imageUrl = image;
          } else if (image.startsWith('/uploads/')) {
            imageUrl = `${baseURL}${image}`;
          } else {
            imageUrl = `${baseURL}/uploads/${image}`;
          }
          
          return {
            id: `existing-${index}`,
            name: image,
            preview: imageUrl,
            existing: true
          };
        })
      );
    }
  }
}, [isEditing, product]);
  
  // Manejar cambios en formulario
  const handleChange = (e) => {
  const { name, value, type, checked } = e.target;
  
  let newFormData = {
    ...formData,
    [name]: type === 'checkbox' ? checked : value
  };
  
  // Calcular precio de oferta automáticamente
  if ((name === 'price' || name === 'discountPercentage') && newFormData.onSale) {
    const price = parseFloat(newFormData.price) || 0;
    const discount = parseFloat(newFormData.discountPercentage) || 0;
    if (price > 0 && discount > 0) {
      newFormData.salePrice = Math.round(price * (1 - discount / 100));
    }
  }
  
  // Si se desmarca la oferta, limpiar campos relacionados
  if (name === 'onSale' && !checked) {
    newFormData.discountPercentage = '';
    newFormData.salePrice = '';
    newFormData.saleEndDate = '';
  }
  
  setFormData(newFormData);
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
  
  // Validar formulario
  const validateForm = () => {
    if (!formData.distributor) {
      setError('Debe seleccionar un distribuidor para el producto');
      return false;
    }
    return true;
  };
  
  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar formulario
    if (!validateForm()) {
      return;
    }
    
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
          {/* Seleccionar distribuidor */}
          <div className="sm:col-span-3">
            <label htmlFor="distributor" className="block text-sm font-medium text-gray-700">
              Distribuidor *
            </label>
            <select
              id="distributor"
              name="distributor"
              value={formData.distributor}
              onChange={handleChange}
              required
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Seleccionar distribuidor</option>
              {distributors.map((distributor) => (
                <option key={distributor._id} value={distributor._id}>
                  {distributor.companyName || distributor.name}
                </option>
              ))}
            </select>
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
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Seleccionar categoría</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
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
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
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
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            ></textarea>
          </div>
          
          {/* Marca */}
          <div className="sm:col-span-2">
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
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          
          {/* SKU */}
          <div className="sm:col-span-2">
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
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          
          {/* Número de parte */}
          <div className="sm:col-span-2">
            <label htmlFor="partNumber" className="block text-sm font-medium text-gray-700">
              Número de parte
            </label>
            <input
              type="text"
              name="partNumber"
              id="partNumber"
              value={formData.partNumber}
              onChange={handleChange}
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
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
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
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
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
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
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          
{/* Producto en oferta */}
<div className="sm:col-span-6">
  <div className="flex items-start">
    <div className="flex items-center h-5">
      <input
        id="onSale"
        name="onSale"
        type="checkbox"
        checked={formData.onSale}
        onChange={handleChange}
        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
      />
    </div>
    <div className="ml-3 text-sm">
      <label htmlFor="onSale" className="font-medium text-gray-700">
        Producto en oferta
      </label>
      <p className="text-gray-500">
        Marque esta opción si el producto está en oferta con descuento.
      </p>
    </div>
  </div>
</div>

{/* Porcentaje de descuento - Solo mostrar si está en oferta */}
{formData.onSale && (
  <div className="sm:col-span-2">
    <label htmlFor="discountPercentage" className="block text-sm font-medium text-gray-700">
      Porcentaje de Descuento *
    </label>
    <div className="mt-1 relative rounded-md shadow-sm">
      <input
        type="number"
        name="discountPercentage"
        id="discountPercentage"
        value={formData.discountPercentage}
        onChange={handleChange}
        required={formData.onSale}
        min="1"
        max="100"
        step="1"
        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
        placeholder="0"
      />
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <span className="text-gray-500 sm:text-sm">%</span>
      </div>
    </div>
  </div>
)}

{/* Precio de oferta - Solo mostrar si está en oferta */}
{formData.onSale && (
  <div className="sm:col-span-2">
    <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700">
      Precio de Oferta
    </label>
    <div className="mt-1 relative rounded-md shadow-sm">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="text-gray-500 sm:text-sm">$</span>
      </div>
      <input
        type="number"
        name="salePrice"
        id="salePrice"
        value={formData.salePrice}
        onChange={handleChange}
        min="0"
        step="1"
        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
        placeholder="0"
        readOnly
      />
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <span className="text-gray-500 sm:text-sm">CLP</span>
      </div>
    </div>
    <p className="mt-1 text-xs text-gray-500">
      Se calcula automáticamente basado en el precio y porcentaje de descuento
    </p>
  </div>
)}

{/* Fecha de fin de oferta - Solo mostrar si está en oferta */}
{formData.onSale && (
  <div className="sm:col-span-2">
    <label htmlFor="saleEndDate" className="block text-sm font-medium text-gray-700">
      Fecha de Fin de Oferta
    </label>
    <input
      type="date"
      name="saleEndDate"
      id="saleEndDate"
      value={formData.saleEndDate}
      onChange={handleChange}
      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
    />
    <p className="mt-1 text-xs text-gray-500">Opcional. Dejar vacío para oferta sin fecha límite</p>
  </div>
)}

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
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
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
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
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
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
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
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          
          <div className="sm:col-span-1 flex items-end">
            <button
              type="button"
              onClick={addCompatibleModel}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
              <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
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
            onError={(e) => {
              console.error('Error cargando imagen:', e.target.src);
              // Intentar con diferentes rutas
              if (!e.target.dataset.retried) {
                e.target.dataset.retried = 'true';
                // Si la imagen no carga, intentar con /uploads/
                if (!e.target.src.includes('/uploads/')) {
                  e.target.src = `/uploads/${image.name}`;
                } else {
                  // Si aún falla, mostrar placeholder
                  e.target.src = 'https://via.placeholder.com/150?text=Error';
                }
              }
            }}
          />
          
          {/* Barra de progreso */}
          {uploadProgress[image.id] !== undefined && uploadProgress[image.id] < 100 && (
            <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
              <div className="bg-white w-3/4 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300" 
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
          className="absolute top-1 right-1 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
        
        {/* Etiqueta de imagen principal */}
        {uploadedImages.indexOf(image) === 0 && (
          <div className="absolute top-1 left-1 bg-indigo-600 text-white text-xs px-2 py-1 rounded">
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
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => window.history.back()}
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
            `${isEditing ? 'Actualizar' : 'Crear'} producto`
          )}
        </button>
      </div>
    </form>
  );
};

export default AdminProductForm;