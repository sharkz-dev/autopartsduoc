import React, { useState, useEffect } from 'react';
import { categoryService, productService } from '../../services/api';
import { 
  AdjustmentsHorizontalIcon, 
  XMarkIcon,
  ChevronDownIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { TagIcon } from '@heroicons/react/24/solid';

const CatalogFilter = ({ filters, onFilterChange, isMobileFiltersOpen, toggleMobileFilters }) => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    brands: true,
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

  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        // Cargar categorías
        const categoriesResponse = await categoryService.getCategories();
        setCategories(categoriesResponse.data.data);

        // Cargar marcas únicas de los productos
        const productsResponse = await productService.getProducts({ limit: 1000 });
        const uniqueBrands = [...new Set(
          productsResponse.data.data
            .map(product => product.brand)
            .filter(brand => brand && brand.trim() !== '')
        )].sort();
        setBrands(uniqueBrands);
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
  }, [filters]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Manejar selección múltiple de categorías
  const handleCategoryChange = (categorySlug) => {
    let newSelectedCategories;
    
    if (selectedCategories.includes(categorySlug)) {
      // Remover categoría si ya está seleccionada
      newSelectedCategories = selectedCategories.filter(cat => cat !== categorySlug);
    } else {
      // Agregar categoría si no está seleccionada
      newSelectedCategories = [...selectedCategories, categorySlug];
    }
    
    setSelectedCategories(newSelectedCategories);
    
    // Actualizar filtros
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
      // Remover marca si ya está seleccionada
      newSelectedBrands = selectedBrands.filter(b => b !== brand);
    } else {
      // Agregar marca si no está seleccionada
      newSelectedBrands = [...selectedBrands, brand];
    }
    
    setSelectedBrands(newSelectedBrands);
    
    // Actualizar filtros
    const newFilters = { ...filters };
    if (newSelectedBrands.length > 0) {
      newFilters.brands = newSelectedBrands.join(',');
    } else {
      delete newFilters.brands;
    }
    
    onFilterChange(newFilters);
  };

  // Limpiar categorías seleccionadas
  const clearCategories = () => {
    setSelectedCategories([]);
    const newFilters = { ...filters };
    delete newFilters.categories;
    onFilterChange(newFilters);
  };

  // Limpiar marcas seleccionadas
  const clearBrands = () => {
    setSelectedBrands([]);
    const newFilters = { ...filters };
    delete newFilters.brands;
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
    
    // Solo aceptamos números positivos o vacío
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
    onFilterChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;
  const hasPriceFilter = filters.minPrice || filters.maxPrice;

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
                {/* Categorías móvil */}
                <FilterSection
                  title="Categorías"
                  sectionKey="categories"
                  hasItems={categories.length > 0}
                  itemCount={selectedCategories.length}
                  onClear={clearCategories}
                >
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {categories.map(category => (
                      <div key={category._id} className="flex items-center">
                        <input
                          id={`mobile-category-${category._id}`}
                          name="categories"
                          type="checkbox"
                          checked={selectedCategories.includes(category.slug)}
                          onChange={() => handleCategoryChange(category.slug)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`mobile-category-${category._id}`}
                          className="ml-3 text-sm text-gray-600 cursor-pointer"
                        >
                          {category.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </FilterSection>

                {/* Marcas móvil */}
                <FilterSection
                  title="Marcas"
                  sectionKey="brands"
                  hasItems={brands.length > 0}
                  itemCount={selectedBrands.length}
                  onClear={clearBrands}
                >
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {brands.map(brand => (
                      <div key={brand} className="flex items-center">
                        <input
                          id={`mobile-brand-${brand}`}
                          name="brands"
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => handleBrandChange(brand)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`mobile-brand-${brand}`}
                          className="ml-3 text-sm text-gray-600 cursor-pointer"
                        >
                          {brand}
                        </label>
                      </div>
                    ))}
                  </div>
                </FilterSection>
                
                {/* Características móvil */}
                <FilterSection
                  title="Características"
                  sectionKey="features"
                >
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        id="mobile-featured"
                        name="featured"
                        type="checkbox"
                        checked={!!filters.featured}
                        onChange={() => handleFeatureChange('featured')}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="mobile-featured"
                        className="ml-3 flex items-center text-sm text-gray-600 cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-500 mr-1">
                          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                        </svg>
                        Productos destacados
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="mobile-onSale"
                        name="onSale"
                        type="checkbox"
                        checked={!!filters.onSale}
                        onChange={() => handleFeatureChange('onSale')}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="mobile-onSale"
                        className="ml-3 flex items-center text-sm text-gray-600 cursor-pointer"
                      >
                        <TagIcon className="h-4 w-4 text-red-500 mr-1" />
                        En oferta
                      </label>
                    </div>
                  </div>
                </FilterSection>
                
                {/* Precio móvil */}
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
                  </div>
                </FilterSection>
                
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
        
        {/* Categorías escritorio */}
        <FilterSection
          title="Categorías"
          sectionKey="categories"
          hasItems={categories.length > 0}
          itemCount={selectedCategories.length}
          onClear={clearCategories}
        >
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {categories.map(category => (
              <div key={category._id} className="flex items-center hover:bg-gray-50 p-1 rounded">
                <input
                  id={`category-${category._id}`}
                  name="categories"
                  type="checkbox"
                  checked={selectedCategories.includes(category.slug)}
                  onChange={() => handleCategoryChange(category.slug)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor={`category-${category._id}`}
                  className="ml-3 text-sm text-gray-600 cursor-pointer flex-1"
                >
                  {category.name}
                </label>
              </div>
            ))}
          </div>
        </FilterSection>

        {/* Marcas escritorio */}
        <FilterSection
          title="Marcas"
          sectionKey="brands"
          hasItems={brands.length > 0}
          itemCount={selectedBrands.length}
          onClear={clearBrands}
        >
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {brands.map(brand => (
              <div key={brand} className="flex items-center hover:bg-gray-50 p-1 rounded">
                <input
                  id={`brand-${brand}`}
                  name="brands"
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => handleBrandChange(brand)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor={`brand-${brand}`}
                  className="ml-3 text-sm text-gray-600 cursor-pointer flex-1"
                >
                  {brand}
                </label>
              </div>
            ))}
          </div>
        </FilterSection>
        
        {/* Características escritorio */}
        <FilterSection
          title="Características"
          sectionKey="features"
        >
          <div className="space-y-3">
            <div className="flex items-center hover:bg-gray-50 p-1 rounded">
              <input
                id="featured"
                name="featured"
                type="checkbox"
                checked={!!filters.featured}
                onChange={() => handleFeatureChange('featured')}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="featured"
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
                id="onSale"
                name="onSale"
                type="checkbox"
                checked={!!filters.onSale}
                onChange={() => handleFeatureChange('onSale')}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="onSale"
                className="ml-3 flex items-center text-sm text-gray-600 cursor-pointer"
              >
                <TagIcon className="h-4 w-4 text-red-500 mr-1" />
                En oferta
              </label>
            </div>
          </div>
        </FilterSection>
        
        {/* Precio escritorio */}
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
                Filtro activo: {filters.minPrice && `Desde $${filters.minPrice}`} {filters.minPrice && filters.maxPrice && '-'} {filters.maxPrice && `Hasta $${filters.maxPrice}`}
              </div>
            )}
          </div>
        </FilterSection>
      </div>
    </>
  );
};

export default CatalogFilter;