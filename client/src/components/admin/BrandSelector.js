// client/src/components/admin/BrandSelector.js
import React, { useState, useEffect, useRef } from 'react';
import { productService } from '../../services/api';
import { 
  ChevronDownIcon, 
  MagnifyingGlassIcon,
  PlusIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const BrandSelector = ({ value, onChange, required = false, className = "" }) => {
  const [brands, setBrands] = useState([]);
  const [filteredBrands, setFilteredBrands] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [error, setError] = useState('');
  
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Cargar marcas al montar el componente
  useEffect(() => {
    console.log('🔄 BrandSelector montado, cargando marcas...');
    loadBrands();
  }, []);

  // Filtrar marcas cuando cambie el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredBrands(brands);
      setShowAddNew(false);
    } else {
      const filtered = brands.filter(brand =>
        brand.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBrands(filtered);
      
      // Mostrar opción "Agregar nueva" si no hay coincidencias exactas
      const exactMatch = brands.some(brand => 
        brand.toLowerCase() === searchTerm.toLowerCase()
      );
      setShowAddNew(!exactMatch && searchTerm.trim().length > 0);
    }
  }, [searchTerm, brands]);

  // Cargar marcas desde la API
  const loadBrands = async () => {
    try {
      console.log('📡 Llamando a productService.getBrands()...');
      setLoading(true);
      setError('');
      
      const response = await productService.getBrands();
      console.log('✅ Respuesta de marcas:', response);
      
      const brandsData = response.data.data || [];
      console.log('🏷️ Marcas obtenidas:', brandsData);
      
      setBrands(brandsData);
      setFilteredBrands(brandsData);
      
      if (brandsData.length === 0) {
        console.log('⚠️ No se encontraron marcas');
        setError('No se encontraron marcas en la base de datos');
      }
    } catch (error) {
      console.error('❌ Error al cargar marcas:', error);
      setBrands([]);
      setFilteredBrands([]);
      setError(`Error al cargar marcas: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Manejar clic fuera del dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Seleccionar una marca
  const selectBrand = (brand) => {
    console.log('✅ Marca seleccionada:', brand);
    onChange(brand);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Agregar nueva marca
  const addNewBrand = () => {
    const newBrand = searchTerm.trim();
    if (newBrand) {
      console.log('➕ Agregando nueva marca:', newBrand);
      // Agregar a la lista local
      const updatedBrands = [...brands, newBrand].sort();
      setBrands(updatedBrands);
      setFilteredBrands(updatedBrands);
      
      // Seleccionar la nueva marca
      selectBrand(newBrand);
    }
  };

  // Limpiar selección
  const clearSelection = () => {
    console.log('🗑️ Limpiando selección de marca');
    onChange('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Debug info - TEMPORAL */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-2 p-2 bg-gray-100 text-xs rounded">
          <strong>🔍 Debug:</strong> 
          Marcas: {brands.length} | 
          Cargando: {loading ? 'Sí' : 'No'} | 
          Error: {error || 'No'}
        </div>
      )}

      {/* Campo de entrada principal */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : value}
          onChange={(e) => {
            if (!isOpen) {
              setIsOpen(true);
            }
            setSearchTerm(e.target.value);
          }}
          onFocus={() => {
            console.log('🎯 Input enfocado, abriendo dropdown');
            setIsOpen(true);
          }}
          placeholder={loading ? "Cargando marcas..." : "Buscar o seleccionar marca..."}
          required={required}
          disabled={loading}
          className={`
            w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-md
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${className}
          `}
        />
        
        {/* Iconos del lado derecho */}
        <div className="absolute inset-y-0 right-0 flex items-center">
          {value && !isOpen && (
            <button
              type="button"
              onClick={clearSelection}
              className="p-1 text-gray-400 hover:text-gray-600 mr-1"
              title="Limpiar selección"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          <button
            type="button"
            onClick={() => {
              console.log('🔄 Toggle dropdown, estado actual:', isOpen);
              setIsOpen(!isOpen);
            }}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            {isOpen ? (
              <MagnifyingGlassIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            )}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-1 text-xs text-red-600 bg-red-50 p-2 rounded">
          ❌ {error}
          <button
            type="button"
            onClick={loadBrands}
            className="ml-2 underline hover:no-underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Dropdown de opciones */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500 mr-2"></div>
                Cargando marcas...
              </div>
            </div>
          ) : error ? (
            <div className="px-3 py-4 text-sm text-red-600 text-center">
              <div className="mb-2">❌ {error}</div>
              <button
                type="button"
                onClick={loadBrands}
                className="text-indigo-600 hover:text-indigo-800 underline"
              >
                🔄 Reintentar
              </button>
            </div>
          ) : (
            <>
              {/* Opción para agregar nueva marca */}
              {showAddNew && (
                <button
                  type="button"
                  onClick={addNewBrand}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-blue-50 border-b border-gray-100 flex items-center text-blue-600 font-medium"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Agregar "{searchTerm}"
                </button>
              )}
              
              {/* Lista de marcas filtradas */}
              {filteredBrands.length > 0 ? (
                filteredBrands.map((brand, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectBrand(brand)}
                    className={`
                      w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center justify-between
                      ${value === brand ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                    `}
                  >
                    <span>{brand}</span>
                    {value === brand && (
                      <CheckIcon className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                ))
              ) : !showAddNew ? (
                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                  {searchTerm ? `No se encontraron marcas con "${searchTerm}"` : 'No hay marcas disponibles'}
                </div>
              ) : null}
              
              {/* Mensaje cuando no hay marcas y no hay búsqueda */}
              {brands.length === 0 && !loading && !error && (
                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                  <p>📦 No hay marcas registradas</p>
                  <p className="text-xs mt-1">La primera marca se agregará automáticamente</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
      
      {/* Ayuda visual */}
      <div className="mt-1 text-xs text-gray-500">
        {value ? (
          <span className="text-green-600">✅ Marca seleccionada: <strong>{value}</strong></span>
        ) : (
          <span>💡 Escribe para buscar o agregar una nueva marca</span>
        )}
      </div>
    </div>
  );
};

export default BrandSelector;