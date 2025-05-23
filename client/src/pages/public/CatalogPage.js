import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { productService } from '../../services/api';
import ProductCard from '../../components/catalog/ProductCard';
import CatalogFilter from '../../components/catalog/CatalogFilter';
import { 
  XMarkIcon, 
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  ListBulletIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' o 'list'
  
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

  // Opciones de ordenamiento mejoradas
  const sortOptions = [
    { value: '-createdAt', label: '✨ Más recientes primero', icon: '🆕' },
    { value: 'createdAt', label: '📅 Más antiguos primero', icon: '📅' },
    { value: 'price', label: '💰 Precio: menor a mayor', icon: '📈' },
    { value: '-price', label: '💎 Precio: mayor a menor', icon: '📉' },
    { value: 'name', label: '🔤 Nombre: A-Z', icon: '🔤' },
    { value: '-name', label: '🔠 Nombre: Z-A', icon: '🔠' },
    { value: '-avgRating', label: '⭐ Mejor valorados', icon: '⭐' },
    { value: '-discountPercentage', label: '🔥 Mayor descuento', icon: '🔥' }
  ];

  // Función para actualizar la URL con los filtros actuales
  const updateURLWithFilters = (newFilters, page = currentPage) => {
    const params = new URLSearchParams();
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== '-createdAt') {
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
        
        const params = {
          limit: 12,
          page: currentPage,
          ...filters
        };
        
        // Limpiar parámetros vacíos
        Object.keys(params).forEach(key => {
          if (!params[key] || params[key] === '') {
            delete params[key];
          }
        });
        
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
    setCurrentPage(1);
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

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    handleFilterChange({
      category: '',
      brand: '',
      minPrice: '',
      maxPrice: '',
      search: '',
      sort: '-createdAt',
      featured: '',
      onSale: ''
    });
  };

  // Renderizar paginación mejorada
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    return (
      <div className="flex justify-center items-center space-x-2 mt-12">
        <button
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
            currentPage === 1 
              ? 'text-gray-400 cursor-not-allowed bg-gray-100' 
              : 'text-blue-600 hover:bg-blue-50 bg-white shadow-md hover:shadow-lg'
          }`}
        >
          ← Anterior
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-4 py-2 rounded-xl font-medium text-blue-600 hover:bg-blue-50 bg-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              1
            </button>
            {startPage > 2 && <span className="text-gray-400">...</span>}
          </>
        )}
        
        {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
              currentPage === page
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-blue-600 hover:bg-blue-50 bg-white shadow-md hover:shadow-lg'
            }`}
          >
            {page}
          </button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-400">...</span>}
            <button
              onClick={() => handlePageChange(totalPages)}
              className="px-4 py-2 rounded-xl font-medium text-blue-600 hover:bg-blue-50 bg-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              {totalPages}
            </button>
          </>
        )}
        
        <button
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
            currentPage === totalPages 
              ? 'text-gray-400 cursor-not-allowed bg-gray-100' 
              : 'text-blue-600 hover:bg-blue-50 bg-white shadow-md hover:shadow-lg'
          }`}
        >
          Siguiente →
        </button>
      </div>
    );
  };

  // Obtener el número de filtros activos
  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value && value !== '-createdAt').length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header mejorado */}
        <div className="mb-12">
          <div className="text-center mb-8 space-y-4">
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <SparklesIcon className="h-6 w-6" />
              <span className="text-sm font-bold tracking-widest uppercase">Catálogo Premium</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Repuestos de Calidad Superior
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Descubre nuestra amplia selección de repuestos originales y de alta calidad 
              para mantener tu vehículo en perfectas condiciones.
            </p>
          </div>
          
          {/* Barra de búsqueda y controles mejorados */}
          <div className="shadow-none glass-card p-6 mb-8">
            <div className="shadow-none flex flex-col lg:flex-row gap-4 items-center">
              {/* Búsqueda principal */}
              <div className="flex-grow relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar productos, marcas, modelos..."
                  defaultValue={filters.search}
                  onKeyPress={handleSearchChange}
                  onBlur={(e) => handleFilterChange({ ...filters, search: e.target.value })}
                  className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-lg"
                />
                {filters.search && (
                  <button
                    onClick={() => handleFilterChange({ ...filters, search: '' })}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
              
              {/* Ordenamiento */}
              <div className="flex items-center gap-4">
                <select
                  value={filters.sort}
                  onChange={handleSortChange}
                  className="bg-white border border-gray-300 rounded-xl py-3 px-4 text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 min-w-[200px]"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                
                {/* Botón de filtros móvil */}
                <button
                  onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                  className="lg:hidden btn-modern btn-secondary relative"
                >
                  <FunnelIcon className="h-5 w-5 mr-2" />
                  Filtros
                  {getActiveFiltersCount() > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                      {getActiveFiltersCount()}
                    </span>
                  )}
                </button>
                
                {/* Modo de vista */}
                <div className="hidden sm:flex items-center bg-white rounded-xl border border-gray-300 p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      viewMode === 'grid'
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="Vista en cuadrícula"
                  >
                    <Squares2X2Icon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      viewMode === 'list'
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="Vista en lista"
                  >
                    <ListBulletIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Etiquetas de filtros activos mejoradas */}
          {getActiveFiltersCount() > 0 && (
            <div className="flex flex-wrap gap-3 mb-8">
              <div className="flex items-center text-sm font-medium text-gray-700">
                <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
                Filtros activos:
              </div>
              
              {Object.entries(filters).map(([key, value]) => {
                if (!value || value === '-createdAt') return null;
                
                let label = '';
                let displayValue = value;
                
                switch(key) {
                  case 'category':
                    label = 'Categoría';
                    break;
                  case 'brand':
                    label = 'Marca';
                    break;
                  case 'minPrice':
                    label = 'Precio mín.';
                    displayValue = `$${value}`;
                    break;
                  case 'maxPrice':
                    label = 'Precio máx.';
                    displayValue = `$${value}`;
                    break;
                  case 'search':
                    label = 'Búsqueda';
                    break;
                  case 'featured':
                    label = 'Destacados';
                    displayValue = '⭐';
                    break;
                  case 'onSale':
                    label = 'En oferta';
                    displayValue = '🔥';
                    break;
                  default:
                    return null;
                }
                
                return (
                  <div
                    key={key}
                    className="flex items-center bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full px-4 py-2 text-sm font-medium shadow-md"
                  >
                    <span className="mr-2">{label}: {displayValue}</span>
                    <button
                      onClick={() => handleFilterChange({ ...filters, [key]: '' })}
                      className="text-blue-600 hover:text-blue-800 ml-1"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
              
              <button
                onClick={clearAllFilters}
                className="text-sm font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-full px-4 py-2 border border-red-200 transition-all duration-300"
              >
                <XMarkIcon className="h-4 w-4 inline mr-1" />
                Limpiar todos
              </button>
            </div>
          )}
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filtros laterales */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="sticky top-6">
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
              <div className="flex flex-col items-center justify-center h-96 space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-600 rounded-full animate-ping"></div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-gray-600 font-medium text-lg">Cargando productos...</p>
                  <div className="flex justify-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h3 className="text-xl font-bold text-red-800 mb-2">Error al cargar productos</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-modern btn-danger"
                >
                  Reintentar
                </button>
              </div>
            ) : products.length > 0 ? (
              <div className="space-y-8">
                {/* Información de resultados */}
                <div className="flex justify-between items-center bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md">
                  <p className="text-gray-600 font-medium">
                    Mostrando <span className="font-bold text-blue-600">{(currentPage - 1) * 12 + 1} - {Math.min(currentPage * 12, totalProducts)}</span> de <span className="font-bold text-purple-600">{totalProducts}</span> productos
                  </p>
                  
                  {totalProducts > 0 && (
                    <div className="hidden sm:flex items-center text-sm text-gray-500">
                      <div className="flex items-center mr-4">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                        En stock
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                        Agotado
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Grid de productos mejorado */}
                <div className={`${viewMode === 'grid' ? 'products-grid' : 'space-y-6'}`}>
                  {products.map((product, index) => (
                    <div 
                      key={product._id} 
                      className="animate-slide-in-up hover-lift"
                      style={{animationDelay: `${index * 0.05}s`}}
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
                
                {/* Paginación */}
                {renderPagination()}
              </div>
            ) : (
              <div className="text-center py-20 space-y-8">
                <div className="space-y-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-4xl">🔍</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">No se encontraron productos</h3>
                  <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
                    No encontramos productos que coincidan con los filtros seleccionados. 
                    Intenta ajustar tus criterios de búsqueda.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <button
                    onClick={clearAllFilters}
                    className="btn-modern btn-primary"
                  >
                    <XMarkIcon className="h-5 w-5 mr-2" />
                    Limpiar todos los filtros
                  </button>
                  
                  <div className="flex flex-wrap justify-center gap-2 text-sm">
                    <span className="text-gray-500">Sugerencias:</span>
                    {['Motor', 'Frenos', 'Suspensión', 'Transmisión'].map(suggestion => (
                      <button
                        key={suggestion}
                        onClick={() => handleFilterChange({ ...filters, search: suggestion })}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogPage;