import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { productService } from '../../services/api';
import ProductCard from '../../components/catalog/ProductCard';
import CatalogFilter from '../../components/catalog/CatalogFilter';
import { XMarkIcon } from '@heroicons/react/24/outline';

const CatalogPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  
  // Estados para productos y UI
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(parseInt(queryParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  // Estado para filtros
  const [filters, setFilters] = useState({
    category: queryParams.get('category') || '',
    brand: queryParams.get('brand') || '',
    minPrice: queryParams.get('minPrice') || '',
    maxPrice: queryParams.get('maxPrice') || '',
    search: queryParams.get('search') || '',
    sort: queryParams.get('sort') || '-createdAt',
    featured: queryParams.get('featured') || '',
    onSale: queryParams.get('onSale') || ''
  });

  // Opciones de ordenamiento
  const sortOptions = [
    { value: '-createdAt', label: 'Más recientes primero' },
    { value: 'createdAt', label: 'Más antiguos primero' },
    { value: 'price', label: 'Precio: menor a mayor' },
    { value: '-price', label: 'Precio: mayor a menor' },
    { value: 'name', label: 'Nombre: A-Z' },
    { value: '-name', label: 'Nombre: Z-A' },
    { value: '-avgRating', label: 'Mejor valorados' }
  ];

  // Función para actualizar la URL con los filtros actuales
  const updateURLWithFilters = (newFilters, page = currentPage) => {
    const params = new URLSearchParams();
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== '-createdAt') { // No incluir valores por defecto
        params.append(key, value);
      }
    });
    
    if (page > 1) params.append('page', page);
    
    navigate({
      pathname: location.pathname,
      search: params.toString()
    }, { replace: true });
  };

  // Cargar productos cuando cambien los filtros o la página
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Construir parámetros de consulta
        const params = {
          limit: 12,
          page: currentPage,
          ...filters // Incluir todos los filtros
        };
        
        // Limpiar parámetros vacíos
        Object.keys(params).forEach(key => {
          if (!params[key] || params[key] === '') {
            delete params[key];
          }
        });
        
        // Log para debugging
        console.log('Parámetros enviados al backend:', params);
        
        const response = await productService.getProducts(params);
        
        setProducts(response.data.data);
        setTotalProducts(response.data.total);
        setTotalPages(Math.ceil(response.data.total / 12));
        
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar productos:', error);
        setError('Error al cargar productos. Por favor, intente de nuevo más tarde.');
        setLoading(false);
      }
    };

    fetchProducts();
    updateURLWithFilters(filters, currentPage);
  }, [filters, currentPage]);

  // Manejar cambios en los filtros
  const handleFilterChange = (newFilters) => {
    setCurrentPage(1); // Restablecer a la página 1 al cambiar filtros
    setFilters(newFilters);
  };

  // Manejar cambio de ordenamiento
  const handleSortChange = (e) => {
    handleFilterChange({ ...filters, sort: e.target.value });
  };

  // Manejar cambio de búsqueda
  const handleSearchChange = (e) => {
    const value = e.target.value;
    if (e.key === 'Enter' || value === '') {
      handleFilterChange({ ...filters, search: value });
    }
  };

  // Manejar cambio de página
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Renderizar paginación
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    // Botón de página anterior
    pages.push(
      <button
        key="prev"
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded-md ${
          currentPage === 1 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-blue-600 hover:bg-blue-50'
        }`}
      >
        Anterior
      </button>
    );
    
    // Primera página
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="px-3 py-1 rounded-md text-blue-600 hover:bg-blue-50"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="ellipsis1" className="px-2">...</span>);
      }
    }
    
    // Páginas numeradas
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded-md ${
            currentPage === i
              ? 'bg-blue-600 text-white'
              : 'text-blue-600 hover:bg-blue-50'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // Última página
    if (endIndex < totalPages) {
      if (endIndex < totalPages - 1) {
        pages.push(<span key="ellipsis2" className="px-2">...</span>);
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="px-3 py-1 rounded-md text-blue-600 hover:bg-blue-50"
        >
          {totalPages}
        </button>
      );
    }
    
    // Botón de página siguiente
    pages.push(
      <button
        key="next"
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 rounded-md ${
          currentPage === totalPages 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-blue-600 hover:bg-blue-50'
        }`}
      >
        Siguiente
      </button>
    );
    
    return (
      <div className="flex justify-center items-center space-x-2 mt-8">
        {pages}
      </div>
    );
  };

  // Obtener nombre de categoría
  const getCategoryName = (categoryId) => {
    // Esta función se actualizará cuando se carguen las categorías desde CatalogFilter
    return 'Categoría seleccionada';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Encabezado y búsqueda */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Catálogo de Repuestos</h1>
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-grow">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar productos..."
                defaultValue={filters.search}
                onKeyPress={handleSearchChange}
                onBlur={(e) => handleFilterChange({ ...filters, search: e.target.value })}
                className="w-full py-2 px-4 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {filters.search && (
                <button
                  onClick={() => handleFilterChange({ ...filters, search: '' })}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
          
          <select
            value={filters.sort}
            onChange={handleSortChange}
            className="bg-white border border-gray-300 rounded-lg py-2 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Etiquetas de filtros activos */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.category && (
          <div className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm flex items-center">
            <span>Categoría: {getCategoryName(filters.category)}</span>
            <button
              onClick={() => handleFilterChange({ ...filters, category: '' })}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {filters.brand && (
          <div className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm flex items-center">
            <span>Marca: {filters.brand}</span>
            <button
              onClick={() => handleFilterChange({ ...filters, brand: '' })}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {(filters.minPrice || filters.maxPrice) && (
          <div className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm flex items-center">
            <span>
              Precio: 
              {filters.minPrice ? ` Desde $${filters.minPrice}` : ''}
              {filters.minPrice && filters.maxPrice ? ' - ' : ''}
              {filters.maxPrice ? ` Hasta $${filters.maxPrice}` : ''}
            </span>
            <button
              onClick={() => handleFilterChange({ ...filters, minPrice: '', maxPrice: '' })}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {filters.featured === 'true' && (
          <div className="bg-yellow-100 text-yellow-800 rounded-full px-3 py-1 text-sm flex items-center">
            <span>Productos destacados</span>
            <button
              onClick={() => handleFilterChange({ ...filters, featured: '' })}
              className="ml-2 text-yellow-600 hover:text-yellow-800"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {filters.onSale === 'true' && (
          <div className="bg-red-100 text-red-800 rounded-full px-3 py-1 text-sm flex items-center">
            <span>En oferta</span>
            <button
              onClick={() => handleFilterChange({ ...filters, onSale: '' })}
              className="ml-2 text-red-600 hover:text-red-800"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {filters.search && (
          <div className="bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-sm flex items-center">
            <span>Búsqueda: {filters.search}</span>
            <button
              onClick={() => handleFilterChange({ ...filters, search: '' })}
              className="ml-2 text-gray-600 hover:text-gray-800"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filtros laterales */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="sticky top-4">
            <CatalogFilter 
              filters={filters}
              onFilterChange={handleFilterChange}
              isMobileFiltersOpen={isMobileFilterOpen}
              toggleMobileFilters={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            />
          </div>
        </div>
        
        {/* Contenido principal */}
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
              <p>{error}</p>
            </div>
          ) : products.length > 0 ? (
            <div>
              <p className="text-gray-600 mb-4">
                Mostrando {(currentPage - 1) * 12 + 1} - {Math.min(currentPage * 12, totalProducts)} de {totalProducts} productos
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
              
              {renderPagination()}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-xl mb-4">No se encontraron productos que coincidan con los filtros.</p>
              <button
                onClick={() => handleFilterChange({
                  category: '',
                  brand: '',
                  minPrice: '',
                  maxPrice: '',
                  search: '',
                  sort: '-createdAt',
                  featured: '',
                  onSale: ''
                })}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Limpiar todos los filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CatalogPage;