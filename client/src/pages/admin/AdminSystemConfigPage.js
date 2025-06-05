import React, { useState, useEffect } from 'react';
import { 
  CogIcon, 
  CurrencyDollarIcon,
  TruckIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { systemConfigService } from '../../services/api';
import toast from 'react-hot-toast';

const AdminSystemConfigPage = () => {
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [error, setError] = useState('');

  // Estados para formularios específicos
  const [taxRate, setTaxRate] = useState('');
  const [shippingThreshold, setShippingThreshold] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [siteName, setSiteName] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      const response = await systemConfigService.getConfigurations();
      
      if (response.data.success) {
        setConfigs(response.data.data);
        
        // Llenar formularios con valores actuales
        const configMap = {};
        response.data.raw.forEach(config => {
          configMap[config.key] = config.value;
        });
        
        setTaxRate(configMap.tax_rate || 19);
        setShippingThreshold(configMap.free_shipping_threshold || 100000);
        setShippingCost(configMap.default_shipping_cost || 5000);
        setSiteName(configMap.site_name || 'AutoParts');
        setContactEmail(configMap.contact_email || 'info@AutoParts.com');
      }
    } catch (err) {
      setError('Error al cargar configuraciones');
      toast.error('Error al cargar configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const updateTaxRate = async (e) => {
    e.preventDefault();
    
    if (!taxRate || taxRate < 0 || taxRate > 100) {
      toast.error('El IVA debe estar entre 0% y 100%');
      return;
    }

    try {
      setUpdating(prev => ({ ...prev, tax_rate: true }));
      
      const response = await systemConfigService.updateTaxRate({ rate: parseFloat(taxRate) });
      
      if (response.data.success) {
        toast.success(`IVA actualizado a ${taxRate}%`);
        await fetchConfigurations(); // Refrescar datos
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar IVA');
    } finally {
      setUpdating(prev => ({ ...prev, tax_rate: false }));
    }
  };

  const updateConfiguration = async (key, value, successMessage) => {
    try {
      setUpdating(prev => ({ ...prev, [key]: true }));
      
      const response = await systemConfigService.updateConfiguration(key, { value });
      
      if (response.data.success) {
        toast.success(successMessage);
        await fetchConfigurations();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || `Error al actualizar configuración`);
    } finally {
      setUpdating(prev => ({ ...prev, [key]: false }));
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const resetConfigurations = async () => {
    if (!window.confirm('¿Estás seguro de que deseas resetear todas las configuraciones a sus valores por defecto? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await systemConfigService.resetConfigurations();
      
      if (response.data.success) {
        toast.success('Configuraciones reseteadas correctamente');
        await fetchConfigurations();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al resetear configuraciones');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <CogIcon className="h-8 w-8 mr-3 text-indigo-600" />
            Configuración del Sistema
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra las configuraciones generales del sistema
          </p>
        </div>
        
        <button
          onClick={resetConfigurations}
          className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Resetear Todo
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuración de Impuestos */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 mr-2 text-green-600" />
              Configuración de Impuestos
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Configura el porcentaje de IVA aplicado a todas las ventas
            </p>
          </div>
          
          <form onSubmit={updateTaxRate} className="p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700">
                  Porcentaje de IVA (%)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    id="taxRate"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    min="0"
                    max="100"
                    step="0.1"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="19"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">%</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Actualmente: {configs.tax?.[0]?.value || 19}% - Este cambio afectará a todos los cálculos futuros
                </p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Importante</h4>
                    <p className="mt-1 text-sm text-yellow-700">
                      Este cambio se aplicará inmediatamente a todos los cálculos de precios, carritos y órdenes nuevas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                type="submit"
                disabled={updating.tax_rate}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {updating.tax_rate ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Actualizando...
                  </>
                ) : (
                  'Actualizar IVA'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Configuración de Envíos */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <TruckIcon className="h-5 w-5 mr-2 text-blue-600" />
              Configuración de Envíos
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Configura los costos y umbrales de envío
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Umbral de envío gratuito */}
            <div>
              <label htmlFor="shippingThreshold" className="block text-sm font-medium text-gray-700">
                Umbral para Envío Gratuito
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="shippingThreshold"
                  value={shippingThreshold}
                  onChange={(e) => setShippingThreshold(e.target.value)}
                  min="0"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="100000"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">CLP</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Actual: {formatCurrency(configs.shipping?.[1]?.value || 100000)}
              </p>
              <button
                onClick={() => updateConfiguration('free_shipping_threshold', parseInt(shippingThreshold), 'Umbral de envío gratuito actualizado')}
                disabled={updating.free_shipping_threshold}
                className="mt-2 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {updating.free_shipping_threshold ? 'Actualizando...' : 'Actualizar Umbral'}
              </button>
            </div>

            {/* Costo de envío por defecto */}
            <div>
              <label htmlFor="shippingCost" className="block text-sm font-medium text-gray-700">
                Costo de Envío por Defecto
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="shippingCost"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  min="0"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="5000"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">CLP</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Actual: {formatCurrency(configs.shipping?.[0]?.value || 5000)}
              </p>
              <button
                onClick={() => updateConfiguration('default_shipping_cost', parseInt(shippingCost), 'Costo de envío actualizado')}
                disabled={updating.default_shipping_cost}
                className="mt-2 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {updating.default_shipping_cost ? 'Actualizando...' : 'Actualizar Costo'}
              </button>
            </div>
          </div>
        </div>

        {/* Configuración General */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <GlobeAltIcon className="h-5 w-5 mr-2 text-purple-600" />
              Configuración General
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Información básica del sitio web
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Nombre del sitio */}
            <div>
              <label htmlFor="siteName" className="block text-sm font-medium text-gray-700">
                Nombre del Sitio
              </label>
              <input
                type="text"
                id="siteName"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                placeholder="AutoParts"
              />
              <p className="mt-1 text-xs text-gray-500">
                Actual: {configs.general?.[4]?.value || 'AutoParts'}
              </p>
              <button
                onClick={() => updateConfiguration('site_name', siteName, 'Nombre del sitio actualizado')}
                disabled={updating.site_name}
                className="mt-2 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {updating.site_name ? 'Actualizando...' : 'Actualizar Nombre'}
              </button>
            </div>

            {/* Email de contacto */}
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                Email de Contacto
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="contactEmail"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="info@autoparts.com"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Actual: {configs.general?.[0]?.value || 'info@autoparts.com'}
              </p>
              <button
                onClick={() => updateConfiguration('contact_email', contactEmail, 'Email de contacto actualizado')}
                disabled={updating.contact_email}
                className="mt-2 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {updating.contact_email ? 'Actualizando...' : 'Actualizar Email'}
              </button>
            </div>
          </div>
        </div>

        {/* Estado del Sistema */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
              Estado del Sistema
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Resumen de configuraciones actuales
            </p>
          </div>
          
          <div className="p-6">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">IVA Actual</dt>
                <dd className="mt-1 text-lg text-gray-900 font-semibold">
                  {configs.tax?.[0]?.value || 19}%
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Envío Gratuito a partir de</dt>
                <dd className="mt-1 text-lg text-gray-900 font-semibold">
                  {formatCurrency(configs.shipping?.[1]?.value || 100000)}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Costo de Envío Estándar</dt>
                <dd className="mt-1 text-lg text-gray-900 font-semibold">
                  {formatCurrency(configs.shipping?.[0]?.value || 5000)}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Última Actualización</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {configs.tax?.[0]?.updatedAt 
                    ? new Date(configs.tax[0].updatedAt).toLocaleString('es-CL')
                    : 'No disponible'
                  }
                </dd>
              </div>
              
              {configs.tax?.[0]?.lastModifiedBy && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Modificado por</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {configs.tax[0].lastModifiedBy.name}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSystemConfigPage;