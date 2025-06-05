import React, { useState, useEffect } from 'react';
import { categoryService, productService } from '../../services/api';
import { 
  AdjustmentsHorizontalIcon, 
  XMarkIcon,
  ChevronDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { TagIcon } from '@heroicons/react/24/solid';

const CatalogFilter = ({ filters, onFilterChange, isMobileFiltersOpen, toggleMobileFilters }) => {
  // ===== ESTADOS =====
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [compatibleModels, setCompatibleModels] = useState({ models: [], groupedByMake: {} });
  
  // Estados de expansión de secciones
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    brands: true,
    vehicles: true,
    features: true,
    price: true
  });
  
  // Estados locales para los campos de precio
  const [tempMinPrice, setTempMinPrice] = useState(filters.minPrice || '');
  const [tempMaxPrice, setTempMaxPrice] = useState(filters.maxPrice || '');

  // Estados para filtros múltiples
  const [selectedCategories, setSelectedCategories] = useState(
    filters.categories ? filters.categories.split(',') : []
  );
  const [selectedBrands, setSelectedBrands] = useState(
    filters.brands ? filters.brands.split(',') : []
  );

  // Estados para filtros de vehículos compatibles
  const [vehicleFilters, setVehicleFilters] = useState({
    make: filters.vehicleMake || '',
    model: filters.vehicleModel || '',
    year: filters.vehicleYear || ''
  });

  // Estado para búsqueda de modelos
  const [modelSearchTerm, setModelSearchTerm] = useState('');

  // ===== EFECTOS =====
  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        // Cargar categorías
        const categoriesResponse = await categoryService.getCategories();
        setCategories(categoriesResponse.data.data);

        // Cargar marcas únicas de los productos
        const brandsResponse = await productService.getBrands();
        setBrands(brandsResponse.data.data);

        // Cargar modelos compatibles
        try {
          const modelsResponse = await productService.getCompatibleModels();
          setCompatibleModels(modelsResponse.data.data);
        } catch (modelsError) {
          console.error('Error al cargar modelos compatibles:', modelsError);
          setCompatibleModels({ models: [], groupedByMake: {} });
        }

      } catch (err) {
        console.error('Error al cargar datos de filtros:', err);
      }
    };

    fetchFiltersData();
  }, []);

  // Sincronizar los valores cuando cambien los filtros externos
  useEffect(() => {
    setTempMinPrice(filters.minPrice || '');
    setTempMaxPrice(filters.maxPrice || '');
    setSelectedCategories(filters.categories ? filters.categories.split(',') : []);
    setSelectedBrands(filters.brands ? filters.brands.split(',') : []);
    setVehicleFilters({
      make: filters.vehicleMake || '',
      model: filters.vehicleModel || '',
      year: filters.vehicleYear || ''
    });
  }, [filters]);

  // ===== FUNCIONES AUXILIARES =====
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Obtener modelos filtrados por marca seleccionada
  const getFilteredModels = () => {
    if (!vehicleFilters.make || !compatibleModels.groupedByMake[vehicleFilters.make]) {
      return [];
    }
    
    const models = compatibleModels.groupedByMake[vehicleFilters.make];
    
    if (!modelSearchTerm) {
      return models;
    }
    
    return models.filter(item => 
      item.model.toLowerCase().includes(modelSearchTerm.toLowerCase())
    );
  };

  // Obtener años únicos para el modelo seleccionado
  const getAvailableYears = () => {
    if (!vehicleFilters.make || !vehicleFilters.model) {
      return [];
    }
    
    const filteredModels = getFilteredModels();
    const modelData = filteredModels.filter(item => item.model === vehicleFilters.model);
    const years = [...new Set(modelData.map(item => item.year))].sort((a, b) => b - a);
    
    return years;
  };

  // ===== MANEJADORES DE CAMBIOS =====
  // Manejar selección múltiple de categorías
  const handleCategoryChange = (categorySlug) => {
    let newSelectedCategories;
    
    if (selectedCategories.includes(categorySlug)) {
      newSelectedCategories = selectedCategories.filter(cat => cat !== categorySlug);
    } else {
      newSelectedCategories = [...selectedCategories, categorySlug];
    }
    
    setSelectedCategories(newSelectedCategories);
    
    const newFilters = { ...filters };
    if (newSelectedCategories.length > 0) {
      newFilters.categories = newSelectedCategories.join(',');
    } else {
      delete newFilters.categories;
    }
    
    onFilterChange(newFilters);
  };

  // Manejar selección múltiple de marcas
  const handleBrandChange = (brand) => {
    let newSelectedBrands;
    
    if (selectedBrands.includes(brand)) {
      newSelectedBrands = selectedBrands.filter(b => b !== brand);
    } else {
      newSelectedBrands = [...selectedBrands, brand];
    }
    
    setSelectedBrands(newSelectedBrands);
    
    const newFilters = { ...filters };
    if (newSelectedBrands.length > 0) {
      newFilters.brands = newSelectedBrands.join(',');
    } else {
      delete newFilters.brands;
    }
    
    onFilterChange(newFilters);
  };

  // Manejar filtros de vehículos compatibles
  const handleVehicleFilterChange = (field, value) => {
    const newVehicleFilters = { ...vehicleFilters, [field]: value };
    
    // Si se cambia la marca, limpiar modelo y año
    if (field === 'make') {
      newVehicleFilters.model = '';
      newVehicleFilters.year = '';
    }
    // Si se cambia el modelo, limpiar año
    else if (field === 'model') {
      newVehicleFilters.year = '';
    }
    
    setVehicleFilters(newVehicleFilters);
    
    const newFilters = { ...filters };
    
    // Actualizar filtros
    if (newVehicleFilters.make) {
      newFilters.vehicleMake = newVehicleFilters.make;
    } else {
      delete newFilters.vehicleMake;
    }
    
    if (newVehicleFilters.model) {
      newFilters.vehicleModel = newVehicleFilters.model;
    } else {
      delete newFilters.vehicleModel;
    }
    
    if (newVehicleFilters.year) {
      newFilters.vehicleYear = newVehicleFilters.year;
    } else {
      delete newFilters.vehicleYear;
    }
    
    onFilterChange(newFilters);
  };

  const handleFeatureChange = (feature) => {
    const newFilters = { ...filters };

    if (feature === 'featured') {
      newFilters.featured = !filters.featured;
      if (!newFilters.featured) {
        delete newFilters.featured;
      }
    } else if (feature === 'onSale') {
      newFilters.onSale = !filters.onSale;
      if (!newFilters.onSale) {
        delete newFilters.onSale;
      }
    }

    onFilterChange(newFilters);
  };

  const handlePriceInputChange = (event) => {
    const { name, value } = event.target;
    
    if (value === '' || (Number(value) >= 0 && !isNaN(Number(value)))) {
      const newFilters = { ...filters };
      
      if (name === 'minPrice') {
        setTempMinPrice(value);
        if (value !== '') {
          newFilters.minPrice = value;
        } else {
          delete newFilters.minPrice;
        }
      } else if (name === 'maxPrice') {
        setTempMaxPrice(value);
        if (value !== '') {
          newFilters.maxPrice = value;
        } else {
          delete newFilters.maxPrice;
        }
      }
      
      onFilterChange(newFilters);
    }
  };

  // ===== FUNCIONES DE LIMPIEZA =====
  const clearCategories = () => {
    setSelectedCategories([]);
    const newFilters = { ...filters };
    delete newFilters.categories;
    onFilterChange(newFilters);
  };

  const clearBrands = () => {
    setSelectedBrands([]);
    const newFilters = { ...filters };
    delete newFilters.brands;
    onFilterChange(newFilters);
  };

  const clearVehicleFilters = () => {
    setVehicleFilters({ make: '', model: '', year: '' });
    setModelSearchTerm('');
    const newFilters = { ...filters };
    delete newFilters.vehicleMake;
    delete newFilters.vehicleModel;
    delete newFilters.vehicleYear;
    onFilterChange(newFilters);
  };

  const clearPriceFilter = () => {
    setTempMinPrice('');
    setTempMaxPrice('');
    
    const newFilters = { ...filters };
    delete newFilters.minPrice;
    delete newFilters.maxPrice;
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setTempMinPrice('');
    setTempMaxPrice('');
    setSelectedCategories([]);
    setSelectedBrands([]);
    setVehicleFilters({ make: '', model: '', year: '' });
    setModelSearchTerm('');
    onFilterChange({});
  };

  // ===== VARIABLES CALCULADAS =====
  const hasActiveFilters = Object.keys(filters).length > 0;
  const hasPriceFilter = filters.minPrice || filters.maxPrice;
  const hasVehicleFilters = vehicleFilters.make || vehicleFilters.model || vehicleFilters.year;

  // ===== COMPONENTES AUXILIARES =====
  // Componente de sección de filtros reutilizable
  const FilterSection = ({ 
    title, 
    sectionKey, 
    children, 
    hasItems = true, 
    itemCount = 0,
    onClear = null 
  }) => (
    <div className={`${sectionKey !== 'price' ? 'border-b border-gray-200 pb-4 mb-4' : ''}`}>
      <div 
        className="flex justify-between items-center mb-3 cursor-pointer"
        onClick={() => toggleSection(sectionKey)}
      >
        <div className="flex items-center">
          <h3 className="text-md font-medium text-gray-900">{title}</h3>
          {itemCount > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
              {itemCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center">
          {onClear && itemCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="mr-2 text-xs text-red-600 hover:text-red-800"
            >
              Limpiar
            </button>
          )}
          <ChevronDownIcon 
            className={`h-5 w-5 text-gray-500 transition-transform ${
              expandedSections[sectionKey] ? 'transform rotate-180' : ''
            }`}
          />
        </div>
      </div>
      
      {expandedSections[sectionKey] && (
        <div className="ml-2">
          {hasItems ? children : (
            <p className="text-sm text-gray-500">No hay opciones disponibles</p>
          )}
        </div>
      )}
    </div>
  );

  // ===== COMPONENTES DE FILTRO =====
  const CategoriesFilter = ({ isMobile = false }) => (
    <FilterSection
      title="Categorías"
      sectionKey="categories"
      hasItems={categories.length > 0}
      itemCount={selectedCategories.length}
      onClear={clearCategories}
    >
      <div className={`space-y-3 ${isMobile ? 'max-h-48' : 'max-h-64'} overflow-y-auto`}>
        {categories.map(category => (
          <div key={category._id} className="flex items-center hover:bg-gray-50 p-1 rounded">
            <input
              id={`${isMobile ? 'mobile-' : ''}category-${category._id}`}
              name="categories"
              type="checkbox"
              checked={selectedCategories.includes(category.slug)}
              onChange={() => handleCategoryChange(category.slug)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor={`${isMobile ? 'mobile-' : ''}category-${category._id}`}
              className="ml-3 text-sm text-gray-600 cursor-pointer flex-1"
            >
              {category.name}
            </label>
          </div>
        ))}
      </div>
    </FilterSection>
  );

  const BrandsFilter = ({ isMobile = false }) => (
    <FilterSection
      title="Marcas"
      sectionKey="brands"
      hasItems={brands.length > 0}
      itemCount={selectedBrands.length}
      onClear={clearBrands}
    >
      <div className={`space-y-3 ${isMobile ? 'max-h-48' : 'max-h-64'} overflow-y-auto`}>
        {brands.map(brand => (
          <div key={brand} className="flex items-center hover:bg-gray-50 p-1 rounded">
            <input
              id={`${isMobile ? 'mobile-' : ''}brand-${brand}`}
              name="brands"
              type="checkbox"
              checked={selectedBrands.includes(brand)}
              onChange={() => handleBrandChange(brand)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor={`${isMobile ? 'mobile-' : ''}brand-${brand}`}
              className="ml-3 text-sm text-gray-600 cursor-pointer flex-1"
            >
              {brand}
            </label>
          </div>
        ))}
      </div>
    </FilterSection>
  );

  const VehiclesFilter = ({ isMobile = false }) => (
    <FilterSection
      title="Vehículos Compatibles"
      sectionKey="vehicles"
      hasItems={Object.keys(compatibleModels.groupedByMake || {}).length > 0}
      itemCount={hasVehicleFilters ? 1 : 0}
      onClear={clearVehicleFilters}
    >
      <div className="space-y-4">
        {/* Marca de vehículo */}
        <div>
          <label className="text-sm text-gray-600 block mb-2">
            {isMobile ? 'Marca' : 'Marca del Vehículo'}
          </label>
          <select
            value={vehicleFilters.make}
            onChange={(e) => handleVehicleFilterChange('make', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="">{isMobile ? 'Todas las marcas' : 'Seleccionar marca'}</option>
            {Object.keys(compatibleModels.groupedByMake || {}).map(make => (
              <option key={make} value={make}>{make}</option>
            ))}
          </select>
        </div>

        {/* Modelo de vehículo */}
        {vehicleFilters.make && (
          <div>
            <label className="text-sm text-gray-600 block mb-2">
              {isMobile ? 'Modelo' : 'Modelo del Vehículo'}
            </label>
            
            {/* Campo de búsqueda para modelos (solo desktop) */}
            {!isMobile && (
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Buscar modelo..."
                  value={modelSearchTerm}
                  onChange={(e) => setModelSearchTerm(e.target.value)}
                  className="block w-full pl-8 pr-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
                <MagnifyingGlassIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            )}
            
            <select
              value={vehicleFilters.model}
              onChange={(e) => handleVehicleFilterChange('model', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">{isMobile ? 'Todos los modelos' : 'Seleccionar modelo'}</option>
              {[...new Set(getFilteredModels().map(item => item.model))].map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            
            {!isMobile && modelSearchTerm && getFilteredModels().length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No se encontraron modelos que coincidan</p>
            )}
          </div>
        )}

        {/* Año de vehículo */}
        {vehicleFilters.model && (
          <div>
            <label className="text-sm text-gray-600 block mb-2">
              {isMobile ? 'Año' : 'Año del Vehículo'}
            </label>
            <select
              value={vehicleFilters.year}
              onChange={(e) => handleVehicleFilterChange('year', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">{isMobile ? 'Todos los años' : 'Seleccionar año'}</option>
              {getAvailableYears().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        )}

        {/* Mostrar filtro activo (solo desktop) */}
        {!isMobile && hasVehicleFilters && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Filtro activo:</h4>
            <div className="text-sm text-blue-800">
              {vehicleFilters.make && (
                <div>Marca: <span className="font-medium">{vehicleFilters.make}</span></div>
              )}
              {vehicleFilters.model && (
                <div>Modelo: <span className="font-medium">{vehicleFilters.model}</span></div>
              )}
              {vehicleFilters.year && (
                <div>Año: <span className="font-medium">{vehicleFilters.year}</span></div>
              )}
            </div>
          </div>
        )}
      </div>
    </FilterSection>
  );

  const FeaturesFilter = ({ isMobile = false }) => (
    <FilterSection
      title="Características"
      sectionKey="features"
    >
      <div className="space-y-3">
        <div className="flex items-center hover:bg-gray-50 p-1 rounded">
          <input
            id={`${isMobile ? 'mobile-' : ''}featured`}
            name="featured"
            type="checkbox"
            checked={!!filters.featured}
            onChange={() => handleFeatureChange('featured')}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor={`${isMobile ? 'mobile-' : ''}featured`}
            className="ml-3 flex items-center text-sm text-gray-600 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-500 mr-1">
              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
            </svg>
            Productos destacados
          </label>
        </div>
        
        <div className="flex items-center hover:bg-gray-50 p-1 rounded">
          <input
            id={`${isMobile ? 'mobile-' : ''}onSale`}
            name="onSale"
            type="checkbox"
            checked={!!filters.onSale}
            onChange={() => handleFeatureChange('onSale')}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor={`${isMobile ? 'mobile-' : ''}onSale`}
            className="ml-3 flex items-center text-sm text-gray-600 cursor-pointer"
          >
            <TagIcon className="h-4 w-4 text-red-500 mr-1" />
            En oferta
          </label>
        </div>
      </div>
    </FilterSection>
  );

  const PriceFilter = () => (
    <FilterSection
      title="Rango de precio"
      sectionKey="price"
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-600 block mb-1">
            Precio mínimo (CLP)
          </label>
          <input
            type="number"
            name="minPrice"
            value={tempMinPrice}
            onChange={handlePriceInputChange}
            min="0"
            placeholder="0"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          />
        </div>
        
        <div>
          <label className="text-sm text-gray-600 block mb-1">
            Precio máximo (CLP)
          </label>
          <input
            type="number"
            name="maxPrice"
            value={tempMaxPrice}
            onChange={handlePriceInputChange}
            min="0"
            placeholder="Sin límite"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          />
        </div>
        
        {hasPriceFilter && (
          <button
            type="button"
            onClick={clearPriceFilter}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Limpiar precios
          </button>
        )}
        
        {hasPriceFilter && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            Filtro activo: {filters.minPrice && `Desde ${filters.minPrice}`} {filters.minPrice && filters.maxPrice && '-'} {filters.maxPrice && `Hasta ${filters.maxPrice}`}
          </div>
        )}
      </div>
    </FilterSection>
  );

  // ===== RENDER PRINCIPAL =====
  return (
    <>
      {/* Filtros para móvil */}
      <div className="lg:hidden">
        <div className="flex justify-between items-center mb-4">
          <button
            type="button"
            className="flex items-center text-gray-700 hover:text-blue-600 bg-white rounded-lg border border-gray-300 px-4 py-2 shadow-sm"
            onClick={toggleMobileFilters}
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {Object.keys(filters).length}
              </span>
            )}
          </button>
          
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-800 bg-red-50 px-3 py-1 rounded-lg"
            >
              Limpiar todo
            </button>
          )}
        </div>

        {/* Panel de filtros móvil */}
        {isMobileFiltersOpen && (
          <div className="fixed inset-0 flex z-40 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={toggleMobileFilters}></div>
            
            <div className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white py-4 pb-12 shadow-xl">
              <div className="flex items-center justify-between px-4 mb-4">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <FunnelIcon className="h-5 w-5 mr-2" />
                  Filtros
                </h2>
                <button
                  type="button"
                  className="-mr-2 flex h-10 w-10 items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100"
                  onClick={toggleMobileFilters}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="px-4 space-y-6">
                <CategoriesFilter isMobile={true} />
                <BrandsFilter isMobile={true} />
                <VehiclesFilter isMobile={true} />
                <FeaturesFilter isMobile={true} />
                <PriceFilter />
                
                {/* Botón para limpiar todos los filtros móvil */}
                {hasActiveFilters && (
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="w-full rounded-md border border-red-600 px-4 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50"
                    >
                      <XMarkIcon className="h-4 w-4 inline mr-2" />
                      Limpiar todos los filtros
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtros para escritorio */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2 text-blue-600" />
            Filtros
          </h2>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-800 bg-red-50 px-3 py-1 rounded-lg flex items-center"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Limpiar todo
            </button>
          )}
        </div>

        <div className="space-y-6">
          <CategoriesFilter />
          <BrandsFilter />
          <VehiclesFilter />
          <FeaturesFilter />
          <PriceFilter />
        </div>
      </div>
    </>
  );
};

export default CatalogFilter;