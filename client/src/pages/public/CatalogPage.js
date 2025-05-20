import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { productService, categoryService } from '../../services/api';
import ProductCard from '../../components/catalog/ProductCard';
import { 
  FunnelIcon, 
  XMarkIcon, 
  ChevronDownIcon, 
  ChevronUpIcon
} from '@heroicons/react/24/outline';

const CatalogPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  
  // Estados para filtros y productos
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(parseInt(queryParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Estados para controlar la UI de filtros
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    brand: true
  });
  
  // Estados para los filtros
  const [filters, setFilters] = useState({
    category: queryParams.get('category') || '',
    brand: queryParams.get('brand') || '',
    minPrice: queryParams.get('minPrice') || '',
    maxPrice: queryParams.get('maxPrice') || '',
    search: queryParams.get('search') || '',
    sort: queryParams.get('sort') || '-createdAt'
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

  // Cargar marcas únicas de los productos
  const [brands, setBrands] = useState([]);

  // Función para actualizar la URL con los filtros actuales
  const updateURLWithFilters = (newFilters) => {
    const params = new URLSearchParams();
    
    if (newFilters.category) params.append('category', newFilters.category);
    if (newFilters.brand) params.append('brand', newFilters.brand);
    if (newFilters.minPrice) params.append('minPrice', newFilters.minPrice);
    if (newFilters.maxPrice) params.append('maxPrice', newFilters.maxPrice);
    if (newFilters.search) params.append('search', newFilters.search);
    if (newFilters.sort) params.append('sort', newFilters.sort);
    if (currentPage > 1) params.append('page', currentPage);
    
    navigate({
      pathname: location.pathname,
      search: params.toString()
    });
  };

  // Cargar categorías
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getCategories();
        setCategories(response.data.data);
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      }
    };

    fetchCategories();
  }, []);

  // Cargar productos cuando cambien los filtros o la página
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Construir parámetros de consulta
        const params = {
          limit: 12,
          page: currentPage
        };
        
        // Añadir filtros si existen
        if (filters.category) params.category = filters.category;
        if (filters.brand) params.brand = filters.brand;
        if (filters.minPrice) params.price_gte = filters.minPrice;
        if (filters.maxPrice) params.price_lte = filters.maxPrice;
        if (filters.search) params.search = filters.search;
        if (filters.sort) params.sort = filters.sort;
        
        const response = await productService.getProducts(params);
        
        setProducts(response.data.data);
        setTotalProducts(response.data.total);
        setTotalPages(Math.ceil(response.data.total / 12));
        
        // Si es la primera carga, extraer todas las marcas únicas
        if (brands.length === 0) {
          const brandsSet = new Set(response.data.data.map(product => product.brand));
          setBrands(Array.from(brandsSet).sort());
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar productos:', error);
        setError('Error al cargar productos. Por favor, intente de nuevo más tarde.');
        setLoading(false);
      }
    };

    fetchProducts();
    // Actualizar URL con filtros actuales
    updateURLWithFilters(filters);
  }, [filters, currentPage]);

  // Manejar cambios en los filtros
  const handleFilterChange = (name, value) => {
    // Restablecer a la página 1 al cambiar filtros
    setCurrentPage(1);
    
    // Actualizar estado de filtros
    setFilters({
      ...filters,
      [name]: value
    });
  };

  // Manejar cambio de página
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Desplazar hacia arriba al cambiar de página
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Limpiar todos los filtros
  const handleClearFilters = () => {
    setFilters({
      category: '',
      brand: '',
      minPrice: '',
      maxPrice: '',
      search: '',
      sort: '-createdAt'
    });
    setCurrentPage(1);
  };

  // Alternar secciones desplegables en filtros
  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
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
    
    // Mostrar primera página si no está en el rango
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
    
    // Mostrar última página si no está en el rango
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
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

  // Renderizar filtros para escritorio
  const renderDesktopFilters = () => (
    <div className="hidden md:block w-64 bg-white p-6 rounded-lg shadow-sm sticky top-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Filtros</h2>
        <button
          onClick={handleClearFilters}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Limpiar filtros
        </button>
      </div>
      
      {/* Filtro de Categorías */}
      <div className="mb-6">
        <div 
          className="flex justify-between items-center mb-3 cursor-pointer"
          onClick={() => toggleSection('categories')}
        >
          <h3 className="font-medium text-gray-700">Categorías</h3>
          {expandedSections.categories ? (
            <ChevronUpIcon className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          )}
        </div>
        
        {expandedSections.categories && (
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="radio"
                id="category-all"
                name="category"
                value=""
                checked={filters.category === ''}
                onChange={() => handleFilterChange('category', '')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="category-all" className="ml-2 text-sm text-gray-700">
                Todas las categorías
              </label>
            </div>
            
            {categories.map((category) => (
              <div key={category._id} className="flex items-center">
                <input
                  type="radio"
                  id={`category-${category._id}`}
                  name="category"
                  value={category._id}
                  checked={filters.category === category._id}
                  onChange={() => handleFilterChange('category', category._id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={`category-${category._id}`} className="ml-2 text-sm text-gray-700">
                  {category.name}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Filtro de Precio */}
      <div className="mb-6">
        <div 
          className="flex justify-between items-center mb-3 cursor-pointer"
          onClick={() => toggleSection('price')}
        >
          <h3 className="font-medium text-gray-700">Precio</h3>
          {expandedSections.price ? (
            <ChevronUpIcon className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          )}
        </div>
        
        {expandedSections.price && (
          <div className="space-y-3">
            <div className="flex space-x-2">
              <div>
                <label htmlFor="minPrice" className="text-xs text-gray-500">
                  Mínimo
                </label>
                <input
                  type="number"
                  id="minPrice"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label htmlFor="maxPrice" className="text-xs text-gray-500">
                  Máximo
                </label>
                <input
                  type="number"
                  id="maxPrice"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Máx."
                />
              </div>
            </div>
            <button
              onClick={() => {
                handleFilterChange('minPrice', filters.minPrice);
                handleFilterChange('maxPrice', filters.maxPrice);
              }}
              className="w-full bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition"
            >
              Aplicar
            </button>
          </div>
        )}
      </div>
      
      {/* Filtro de Marca */}
      <div className="mb-6">
        <div 
          className="flex justify-between items-center mb-3 cursor-pointer"
          onClick={() => toggleSection('brand')}
        >
          <h3 className="font-medium text-gray-700">Marca</h3>
          {expandedSections.brand ? (
            <ChevronUpIcon className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          )}
        </div>
        
        {expandedSections.brand && (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            <div className="flex items-center">
              <input
                type="radio"
                id="brand-all"
                name="brand"
                value=""
                checked={filters.brand === ''}
                onChange={() => handleFilterChange('brand', '')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="brand-all" className="ml-2 text-sm text-gray-700">
                Todas las marcas
              </label>
            </div>
            
            {brands.map((brand) => (
              <div key={brand} className="flex items-center">
                <input
                  type="radio"
                  id={`brand-${brand}`}
                  name="brand"
                  value={brand}
                  checked={filters.brand === brand}
                  onChange={() => handleFilterChange('brand', brand)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={`brand-${brand}`} className="ml-2 text-sm text-gray-700">
                  {brand}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Renderizar filtros para móvil
  const renderMobileFilters = () => (
    <div className={`fixed inset-0 bg-gray-600 bg-opacity-75 z-50 transition-opacity ${isMobileFilterOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="relative w-screen max-w-md">
          <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
            <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
              <h2 className="text-lg font-semibold">Filtros</h2>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="rounded-md p-1 inline-flex items-center justify-center hover:bg-blue-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="py-6 px-4 bg-gray-50 space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Limpiar filtros
                </button>
              </div>
              
              {/* Categorías */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Categorías</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="mobile-category-all"
                      name="mobile-category"
                      value=""
                      checked={filters.category === ''}
                      onChange={() => handleFilterChange('category', '')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="mobile-category-all" className="ml-2 text-sm text-gray-700">
                      Todas las categorías
                    </label>
                  </div>
                  
                  {categories.map((category) => (
                    <div key={`mobile-${category._id}`} className="flex items-center">
                      <input
                        type="radio"
                        id={`mobile-category-${category._id}`}
                        name="mobile-category"
                        value={category._id}
                        checked={filters.category === category._id}
                        onChange={() => handleFilterChange('category', category._id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`mobile-category-${category._id}`} className="ml-2 text-sm text-gray-700">
                        {category.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Precio */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Precio</h3>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <div>
                      <label htmlFor="mobile-minPrice" className="text-xs text-gray-500">
                        Mínimo
                      </label>
                      <input
                        type="number"
                        id="mobile-minPrice"
                        name="minPrice"
                        value={filters.minPrice}
                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label htmlFor="mobile-maxPrice" className="text-xs text-gray-500">
                        Máximo
                      </label>
                      <input
                        type="number"
                        id="mobile-maxPrice"
                        name="maxPrice"
                        value={filters.maxPrice}
                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Máx."
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Marca */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Marca</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="mobile-brand-all"
                      name="mobile-brand"
                      value=""
                      checked={filters.brand === ''}
                      onChange={() => handleFilterChange('brand', '')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="mobile-brand-all" className="ml-2 text-sm text-gray-700">
                      Todas las marcas
                    </label>
                  </div>
                  
                  {brands.map((brand) => (
                    <div key={`mobile-${brand}`} className="flex items-center">
                      <input
                        type="radio"
                        id={`mobile-brand-${brand}`}
                        name="mobile-brand"
                        value={brand}
                        checked={filters.brand === brand}
                        onChange={() => handleFilterChange('brand', brand)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`mobile-brand-${brand}`} className="ml-2 text-sm text-gray-700">
                        {brand}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="px-4 py-4 bg-gray-100 border-t border-gray-200">
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition"
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mb-12">
      {/* Encabezado y búsqueda */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Catálogo de Repuestos</h1>
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-grow">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full py-2 px-4 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {filters.search && (
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="flex-shrink-0 bg-white border border-gray-300 rounded-lg py-2 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="md:hidden bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <FunnelIcon className="h-5 w-5 mr-1" />
              Filtrar
            </button>
          </div>
        </div>
      </div>
      
      {/* Etiquetas de filtros activos */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.category && (
          <div className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm flex items-center">
            <span>
              Categoría: {categories.find(c => c._id === filters.category)?.name || 'Seleccionada'}
            </span>
            <button
              onClick={() => handleFilterChange('category', '')}
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
              onClick={() => handleFilterChange('brand', '')}
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
              {filters.maxPrice ? `Hasta $${filters.maxPrice}` : ''}
            </span>
            <button
              onClick={() => {
                handleFilterChange('minPrice', '');
                handleFilterChange('maxPrice', '');
              }}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {filters.search && (
          <div className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm flex items-center">
            <span>Búsqueda: {filters.search}</span>
            <button
              onClick={() => handleFilterChange('search', '')}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      
      <div className="flex">
        {/* Filtros para escritorio */}
        {renderDesktopFilters()}
        
        {/* Contenido principal */}
        <div className="flex-1 md:ml-8">
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
                onClick={handleClearFilters}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Limpiar todos los filtros
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Filtros para móvil (panel lateral) */}
      {renderMobileFilters()}
    </div>
  );
};

export default CatalogPage;