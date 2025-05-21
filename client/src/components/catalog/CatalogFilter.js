import React, { useState, useEffect } from 'react';
import { categoryService } from '../../services/api';
import { 
  AdjustmentsHorizontalIcon, 
  XMarkIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { TagIcon } from '@heroicons/react/24/solid';

const CatalogFilter = ({ filters, onFilterChange, isMobileFiltersOpen, toggleMobileFilters }) => {
  const [categories, setCategories] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    features: true,
    price: true
  });
  
  // Estados locales para los campos de precio
  const [tempMinPrice, setTempMinPrice] = useState(filters.minPrice || '');
  const [tempMaxPrice, setTempMaxPrice] = useState(filters.maxPrice || '');

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

  // Sincronizar los valores temporales cuando cambien los filtros externos
  useEffect(() => {
    setTempMinPrice(filters.minPrice || '');
    setTempMaxPrice(filters.maxPrice || '');
  }, [filters.minPrice, filters.maxPrice]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCategoryChange = (categoryId) => {
    const newFilters = { ...filters };

    if (categoryId === filters.category) {
      // Si ya está seleccionada, la deseleccionamos
      delete newFilters.category;
    } else {
      // Si no está seleccionada, la seleccionamos
      newFilters.category = categoryId;
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
    
    // Solo aceptamos números positivos o vacío
    if (value === '' || (Number(value) >= 0 && !isNaN(Number(value)))) {
      if (name === 'minPrice') {
        setTempMinPrice(value);
      } else if (name === 'maxPrice') {
        setTempMaxPrice(value);
      }
    }
  };

  const applyPriceFilter = () => {
    const newFilters = { ...filters };
    
    // Aplicar precio mínimo
    if (tempMinPrice !== '') {
      newFilters.minPrice = tempMinPrice;
    } else {
      delete newFilters.minPrice;
    }
    
    // Aplicar precio máximo
    if (tempMaxPrice !== '') {
      newFilters.maxPrice = tempMaxPrice;
    } else {
      delete newFilters.maxPrice;
    }
    
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
    onFilterChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;
  const hasPriceFilter = filters.minPrice || filters.maxPrice;

  return (
    <>
      {/* Filtros para móvil */}
      <div className="lg:hidden">
        <div className="flex justify-between items-center mb-4">
          <button
            type="button"
            className="flex items-center text-gray-700 hover:text-blue-600"
            onClick={toggleMobileFilters}
          >
            <AdjustmentsHorizontalIcon className="h-6 w-6 mr-2" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {Object.keys(filters).length}
              </span>
            )}
          </button>
          
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Panel de filtros móvil */}
        {isMobileFiltersOpen && (
          <div className="fixed inset-0 flex z-40 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={toggleMobileFilters}></div>
            
            <div className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white py-4 pb-12 shadow-xl">
              <div className="flex items-center justify-between px-4">
                <h2 className="text-lg font-medium text-gray-900">Filtros</h2>
                <button
                  type="button"
                  className="-mr-2 flex h-10 w-10 items-center justify-center rounded-md bg-white p-2 text-gray-400"
                  onClick={toggleMobileFilters}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Contenido de filtros */}
              <div className="p-4">
                {/* Categorías */}
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <div 
                    className="flex justify-between items-center mb-2 cursor-pointer"
                    onClick={() => toggleSection('categories')}
                  >
                    <h3 className="text-md font-medium text-gray-900">Categorías</h3>
                    <ChevronDownIcon 
                      className={`h-5 w-5 text-gray-500 transition-transform ${
                        expandedSections.categories ? 'transform rotate-180' : ''
                      }`}
                    />
                  </div>
                  
                  {expandedSections.categories && (
                    <div className="space-y-2 ml-2">
                      {categories.map(category => (
                        <div key={category._id} className="flex items-center">
                          <input
                            id={`mobile-category-${category._id}`}
                            name="category"
                            type="checkbox"
                            checked={filters.category === category._id}
                            onChange={() => handleCategoryChange(category._id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label
                            htmlFor={`mobile-category-${category._id}`}
                            className="ml-3 text-sm text-gray-600"
                          >
                            {category.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Características */}
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <div 
                    className="flex justify-between items-center mb-2 cursor-pointer"
                    onClick={() => toggleSection('features')}
                  >
                    <h3 className="text-md font-medium text-gray-900">Características</h3>
                    <ChevronDownIcon 
                      className={`h-5 w-5 text-gray-500 transition-transform ${
                        expandedSections.features ? 'transform rotate-180' : ''
                      }`}
                    />
                  </div>
                  
                  {expandedSections.features && (
                    <div className="space-y-2 ml-2">
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
                          className="ml-3 text-sm text-gray-600"
                        >
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
                          className="ml-3 flex items-center text-sm text-gray-600"
                        >
                          <TagIcon className="h-4 w-4 text-red-500 mr-1" />
                          En oferta
                        </label>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Rango de precio */}
                <div>
                  <div 
                    className="flex justify-between items-center mb-2 cursor-pointer"
                    onClick={() => toggleSection('price')}
                  >
                    <h3 className="text-md font-medium text-gray-900">Rango de precio</h3>
                    <ChevronDownIcon 
                      className={`h-5 w-5 text-gray-500 transition-transform ${
                        expandedSections.price ? 'transform rotate-180' : ''
                      }`}
                    />
                  </div>
                  
                  {expandedSections.price && (
                    <div className="space-y-3 ml-2">
                      <div>
                        <label htmlFor="mobile-min-price" className="text-sm text-gray-600">
                          Precio mínimo (CLP)
                        </label>
                        <input
                          type="number"
                          id="mobile-min-price"
                          name="minPrice"
                          value={tempMinPrice}
                          onChange={handlePriceInputChange}
                          min="0"
                          placeholder="0"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="mobile-max-price" className="text-sm text-gray-600">
                          Precio máximo (CLP)
                        </label>
                        <input
                          type="number"
                          id="mobile-max-price"
                          name="maxPrice"
                          value={tempMaxPrice}
                          onChange={handlePriceInputChange}
                          min="0"
                          placeholder="Sin límite"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={applyPriceFilter}
                          className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Aplicar
                        </button>
                        {hasPriceFilter && (
                          <button
                            type="button"
                            onClick={clearPriceFilter}
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          >
                            Limpiar
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Botón para limpiar filtros */}
                {hasActiveFilters && (
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="w-full rounded-md border border-red-600 px-3 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
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
      <div className="hidden lg:block">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Filtros</h2>
        
        {/* Botón para limpiar filtros */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-red-600 hover:text-red-800 mb-4 flex items-center"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Limpiar filtros
          </button>
        )}
        
        {/* Categorías */}
        <div className="border-b border-gray-200 pb-4 mb-4">
          <div 
            className="flex justify-between items-center mb-2 cursor-pointer"
            onClick={() => toggleSection('categories')}
          >
            <h3 className="text-md font-medium text-gray-900">Categorías</h3>
            <ChevronDownIcon 
              className={`h-5 w-5 text-gray-500 transition-transform ${
                expandedSections.categories ? 'transform rotate-180' : ''
              }`}
            />
          </div>
          
          {expandedSections.categories && (
            <div className="space-y-2 ml-2">
              {categories.map(category => (
                <div key={category._id} className="flex items-center">
                  <input
                    id={`category-${category._id}`}
                    name="category"
                    type="checkbox"
                    checked={filters.category === category._id}
                    onChange={() => handleCategoryChange(category._id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`category-${category._id}`}
                    className="ml-3 text-sm text-gray-600"
                  >
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Características */}
        <div className="border-b border-gray-200 pb-4 mb-4">
          <div 
            className="flex justify-between items-center mb-2 cursor-pointer"
            onClick={() => toggleSection('features')}
          >
            <h3 className="text-md font-medium text-gray-900">Características</h3>
            <ChevronDownIcon 
              className={`h-5 w-5 text-gray-500 transition-transform ${
                expandedSections.features ? 'transform rotate-180' : ''
              }`}
            />
          </div>
          
          {expandedSections.features && (
            <div className="space-y-2 ml-2">
              <div className="flex items-center">
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
                  className="ml-3 text-sm text-gray-600"
                >
                  Productos destacados
                </label>
              </div>
              
              <div className="flex items-center">
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
                  className="ml-3 flex items-center text-sm text-gray-600"
                >
                  <TagIcon className="h-4 w-4 text-red-500 mr-1" />
                  En oferta
                </label>
              </div>
            </div>
          )}
        </div>
        
        {/* Rango de precio */}
        <div>
          <div 
            className="flex justify-between items-center mb-2 cursor-pointer"
            onClick={() => toggleSection('price')}
          >
            <h3 className="text-md font-medium text-gray-900">Rango de precio</h3>
            <ChevronDownIcon 
              className={`h-5 w-5 text-gray-500 transition-transform ${
                expandedSections.price ? 'transform rotate-180' : ''
              }`}
            />
          </div>
          
          {expandedSections.price && (
            <div className="space-y-3 ml-2">
              <div>
                <label htmlFor="min-price" className="text-sm text-gray-600">
                  Precio mínimo (CLP)
                </label>
                <input
                  type="number"
                  id="min-price"
                  name="minPrice"
                  value={tempMinPrice}
                  onChange={handlePriceInputChange}
                  min="0"
                  placeholder="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="max-price" className="text-sm text-gray-600">
                  Precio máximo (CLP)
                </label>
                <input
                  type="number"
                  id="max-price"
                  name="maxPrice"
                  value={tempMaxPrice}
                  onChange={handlePriceInputChange}
                  min="0"
                  placeholder="Sin límite"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={applyPriceFilter}
                  className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Aplicar
                </button>
                {hasPriceFilter && (
                  <button
                    type="button"
                    onClick={clearPriceFilter}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Limpiar
                  </button>
                )}
              </div>
              
              {hasPriceFilter && (
                <div className="mt-2 text-xs text-gray-500">
                  Filtro activo: {filters.minPrice && `Desde $${filters.minPrice}`} {filters.minPrice && filters.maxPrice && '-'} {filters.maxPrice && `Hasta $${filters.maxPrice}`}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CatalogFilter;