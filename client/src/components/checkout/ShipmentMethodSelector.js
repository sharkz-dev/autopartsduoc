import React from 'react';
import { TruckIcon, HomeIcon } from '@heroicons/react/24/outline';

const ShipmentMethodSelector = ({ selectedMethod, setSelectedMethod, pickupLocations, onPickupLocationChange }) => {
  
  // Manejar cambio de ubicación de retiro
  const handlePickupLocationChange = (e) => {
    const locationId = parseInt(e.target.value);
    const selectedLocation = pickupLocations.find(loc => loc.id === locationId);
    
    // Llamar al callback del componente padre si existe
    if (onPickupLocationChange) {
      onPickupLocationChange(selectedLocation);
    }
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Método de Envío</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Opción de Delivery */}
        <div 
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedMethod === 'delivery' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-300'
          }`}
          onClick={() => setSelectedMethod('delivery')}
        >
          <div className="flex items-center mb-2">
            <div className={`p-2 rounded-full mr-3 ${
              selectedMethod === 'delivery' ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <TruckIcon className={`h-6 w-6 ${
                selectedMethod === 'delivery' ? 'text-blue-600' : 'text-gray-500'
              }`} />
            </div>
            <div>
              <h3 className="font-medium">Envío a Domicilio</h3>
              <p className="text-sm text-gray-500">Recibe tu pedido en tu dirección</p>
            </div>
          </div>
          
          <ul className="ml-12 text-sm text-gray-600 list-disc space-y-1">
            <li>Envío estándar: 3-5 días hábiles</li>
            <li>Gratis en compras sobre $100.000</li>
          </ul>
        </div>
        
        {/* Opción de Retiro en Tienda */}
        <div 
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedMethod === 'pickup' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-300'
          }`}
          onClick={() => setSelectedMethod('pickup')}
        >
          <div className="flex items-center mb-2">
            <div className={`p-2 rounded-full mr-3 ${
              selectedMethod === 'pickup' ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <HomeIcon className={`h-6 w-6 ${
                selectedMethod === 'pickup' ? 'text-blue-600' : 'text-gray-500'
              }`} />
            </div>
            <div>
              <h3 className="font-medium">Retiro en Tienda</h3>
              <p className="text-sm text-gray-500">Retira tu pedido en nuestras tiendas</p>
            </div>
          </div>
          
          <ul className="ml-12 text-sm text-gray-600 list-disc space-y-1">
            <li>Disponible en 24 horas</li>
            <li>Ahorra costos de envío</li>
          </ul>
        </div>
      </div>
      
      {/* Detalles adicionales según el método seleccionado */}
      {selectedMethod === 'pickup' && (
        <div className="mt-4 border rounded-lg p-4 bg-gray-50">
          <h3 className="text-md font-medium text-gray-900 mb-3">Selecciona una tienda para retiro</h3>
          
          <div className="space-y-3">
            {pickupLocations.map((location, index) => (
              <div 
                key={location.id} 
                className="flex items-start"
              >
                <input 
                  type="radio" 
                  id={`location-${location.id}`} 
                  name="pickupLocation" 
                  value={location.id} 
                  onChange={handlePickupLocationChange}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor={`location-${location.id}`} className="ml-3 flex-1 cursor-pointer">
                  <span className="block font-medium text-gray-700">{location.name}</span>
                  <span className="block text-sm text-gray-500">{location.address}</span>
                  <span className="block text-xs text-gray-500 mt-1">{location.hours}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentMethodSelector;