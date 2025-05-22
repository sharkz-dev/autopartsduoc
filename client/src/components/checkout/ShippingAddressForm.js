import React from 'react';

const ShippingAddressForm = ({ shippingAddress, setShippingAddress, hidden = false }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (hidden) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Dirección de Envío</h2>
      
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div className="sm:col-span-6">
          <label htmlFor="street" className="block text-sm font-medium text-gray-700">
            Dirección *
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="street"
              name="street"
              value={shippingAddress.street || ''}
              onChange={handleChange}
              required
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            Ciudad *
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="city"
              name="city"
              value={shippingAddress.city || ''}
              onChange={handleChange}
              required
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>
        
        <div className="sm:col-span-3">
          <label htmlFor="state" className="block text-sm font-medium text-gray-700">
            Región *
          </label>
          <div className="mt-1">
            <select
              id="state"
              name="state"
              value={shippingAddress.state || ''}
              onChange={handleChange}
              required
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="">Selecciona una región</option>
              <option value="Metropolitana">Región Metropolitana</option>
              <option value="Valparaíso">Valparaíso</option>
              <option value="Biobío">Biobío</option>
              <option value="La Araucanía">La Araucanía</option>
              <option value="Antofagasta">Antofagasta</option>
              <option value="Coquimbo">Coquimbo</option>
              <option value="O'Higgins">O'Higgins</option>
              <option value="Maule">Maule</option>
              <option value="Los Lagos">Los Lagos</option>
              <option value="Tarapacá">Tarapacá</option>
              <option value="Atacama">Atacama</option>
              <option value="Arica y Parinacota">Arica y Parinacota</option>
              <option value="Los Ríos">Los Ríos</option>
              <option value="Aysén">Aysén</option>
              <option value="Magallanes">Magallanes</option>
              <option value="Ñuble">Ñuble</option>
            </select>
          </div>
        </div>
        
        <div className="sm:col-span-3">
          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
            Código Postal *
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="postalCode"
              name="postalCode"
              value={shippingAddress.postalCode || ''}
              onChange={handleChange}
              required
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>
        
        <div className="sm:col-span-3">
          <label htmlFor="country" className="block text-sm font-medium text-gray-700">
            País *
          </label>
          <div className="mt-1">
            <select
              id="country"
              name="country"
              value={shippingAddress.country || ''}
              onChange={handleChange}
              required
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="">Selecciona un país</option>
              <option value="Chile">Chile</option>
            </select>
          </div>
        </div>
        
        <div className="sm:col-span-6">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notas de entrega (opcional)
          </label>
          <div className="mt-1">
            <textarea
              id="notes"
              name="notes"
              rows="2"
              value={shippingAddress.notes || ''}
              onChange={handleChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Instrucciones para la entrega, referencias, etc."
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingAddressForm;