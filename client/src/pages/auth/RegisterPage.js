import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  UserIcon, 
  BuildingOfficeIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'client', // ✅ NUEVO: Por defecto cliente
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Chile'
    },
    phone: '',
    // ✅ NUEVO: Campos específicos para distribuidores
    distributorInfo: {
      companyName: '',
      companyRUT: '',
      businessLicense: ''
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested address fields
    if (name.includes('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value
        }
      });
    } 
    // ✅ NUEVO: Handle nested distributorInfo fields
    else if (name.includes('distributorInfo.')) {
      const distributorField = name.split('.')[1];
      setFormData({
        ...formData,
        distributorInfo: {
          ...formData.distributorInfo,
          [distributorField]: value
        }
      });
    } 
    else {
      setFormData({
        ...formData,
        [name]: value
      });
      
      // Check password match when changing either password field
      if (name === 'password' || name === 'confirmPassword') {
        if (name === 'password' && formData.confirmPassword && value !== formData.confirmPassword) {
          setPasswordError('Las contraseñas no coinciden');
        } else if (name === 'confirmPassword' && formData.password && value !== formData.password) {
          setPasswordError('Las contraseñas no coinciden');
        } else {
          setPasswordError('');
        }
      }
    }
  };
  
  const validateForm = () => {
    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    
    // Check password length
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    // ✅ NUEVO: Validaciones específicas para distribuidores
    if (formData.role === 'distributor') {
      if (!formData.distributorInfo.companyName.trim()) {
        setError('El nombre de la empresa es requerido para distribuidores');
        return false;
      }
      
      if (!formData.distributorInfo.companyRUT.trim()) {
        setError('El RUT de la empresa es requerido para distribuidores');
        return false;
      }
      
      // Validación básica de RUT chileno
      const rutPattern = /^\d{7,8}-[\dkK]$/;
      if (!rutPattern.test(formData.distributorInfo.companyRUT)) {
        setError('Formato de RUT inválido. Use el formato: 12345678-9');
        return false;
      }
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Validate form data
    if (!validateForm()) {
      setLoading(false);
      return;
    }
    
    try {
      // Prepare data for API (remove confirmPassword)
      const { confirmPassword, ...registerData } = formData;
      
      // ✅ NUEVO: Solo incluir distributorInfo si es distribuidor
      if (registerData.role !== 'distributor') {
        delete registerData.distributorInfo;
      }
      
      console.log('📝 Datos de registro:', registerData);
      
      // Register user
      await register(registerData);
      
      // ✅ NUEVO: Mensaje específico según el rol
      if (registerData.role === 'distributor') {
        // Redirigir a página de confirmación o perfil para distribuidores
        navigate('/profile?welcome=distributor');
      } else {
        // Redirect to home page para clientes normales
        navigate('/');
      }
    } catch (error) {
      console.error('Error en registro:', error);
      setError(error.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-8 shadow-2xl rounded-2xl border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Crear una cuenta
          </h2>
          <p className="mt-2 text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg" role="alert">
            <div className="flex">
              <InformationCircleIcon className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* ✅ NUEVO: Selector de tipo de cuenta */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Tipo de cuenta</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                formData.role === 'client' 
                  ? 'border-green-500 bg-green-50 shadow-md' 
                  : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
              }`}>
                <input
                  type="radio"
                  name="role"
                  value="client"
                  checked={formData.role === 'client'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    formData.role === 'client' ? 'bg-green-500' : 'bg-gray-200'
                  }`}>
                    <UserIcon className={`h-5 w-5 ${formData.role === 'client' ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Cliente</p>
                    <p className="text-sm text-gray-600">Compras personales</p>
                  </div>
                </div>
                {formData.role === 'client' && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </label>

              <label className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                formData.role === 'distributor' 
                  ? 'border-purple-500 bg-purple-50 shadow-md' 
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
              }`}>
                <input
                  type="radio"
                  name="role"
                  value="distributor"
                  checked={formData.role === 'distributor'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    formData.role === 'distributor' ? 'bg-purple-500' : 'bg-gray-200'
                  }`}>
                    <BuildingOfficeIcon className={`h-5 w-5 ${formData.role === 'distributor' ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Distribuidor</p>
                    <p className="text-sm text-gray-600">Ventas al por mayor</p>
                  </div>
                </div>
                {formData.role === 'distributor' && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </label>
            </div>

            {/* ✅ AVISO PARA DISTRIBUIDORES */}
            {formData.role === 'distributor' && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex">
                  <InformationCircleIcon className="h-5 w-5 text-purple-400 mr-2 mt-0.5" />
                  <div className="text-sm text-purple-700">
                    <p className="font-medium">Cuenta de Distribuidor</p>
                    <p>Tu cuenta deberá ser aprobada por un administrador antes de acceder a precios mayoristas.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Información personal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Información personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="form-input-modern"
                  placeholder="Tu nombre completo"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="form-input-modern"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="form-input-modern"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar contraseña *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="form-input-modern"
                  placeholder="Repite tu contraseña"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                {passwordError && (
                  <p className="form-error-modern">
                    <InformationCircleIcon className="h-4 w-4 mr-1" />
                    {passwordError}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="form-input-modern"
                  placeholder="+56 9 1234 5678"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* ✅ NUEVO: Información de empresa (solo para distribuidores) */}
          {formData.role === 'distributor' && (
            <div className="space-y-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 text-purple-600 mr-2" />
                Información de empresa
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="distributorInfo.companyName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la empresa *
                  </label>
                  <input
                    id="distributorInfo.companyName"
                    name="distributorInfo.companyName"
                    type="text"
                    required={formData.role === 'distributor'}
                    className="form-input-modern"
                    placeholder="Nombre de tu empresa"
                    value={formData.distributorInfo.companyName}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="distributorInfo.companyRUT" className="block text-sm font-medium text-gray-700 mb-1">
                    RUT de la empresa *
                  </label>
                  <input
                    id="distributorInfo.companyRUT"
                    name="distributorInfo.companyRUT"
                    type="text"
                    required={formData.role === 'distributor'}
                    className="form-input-modern"
                    placeholder="12345678-9"
                    value={formData.distributorInfo.companyRUT}
                    onChange={handleChange}
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="distributorInfo.businessLicense" className="block text-sm font-medium text-gray-700 mb-1">
                    Licencia comercial (opcional)
                  </label>
                  <input
                    id="distributorInfo.businessLicense"
                    name="distributorInfo.businessLicense"
                    type="text"
                    className="form-input-modern"
                    placeholder="Número de licencia comercial"
                    value={formData.distributorInfo.businessLicense}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Información de dirección */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Dirección</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  id="address.street"
                  name="address.street"
                  type="text"
                  className="form-input-modern"
                  placeholder="Calle y número"
                  value={formData.address.street}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 mb-1">
                  Ciudad
                </label>
                <input
                  id="address.city"
                  name="address.city"
                  type="text"
                  className="form-input-modern"
                  placeholder="Tu ciudad"
                  value={formData.address.city}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="address.state" className="block text-sm font-medium text-gray-700 mb-1">
                  Región/Estado
                </label>
                <input
                  id="address.state"
                  name="address.state"
                  type="text"
                  className="form-input-modern"
                  placeholder="Región Metropolitana"
                  value={formData.address.state}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="address.postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Código postal
                </label>
                <input
                  id="address.postalCode"
                  name="address.postalCode"
                  type="text"
                  className="form-input-modern"
                  placeholder="1234567"
                  value={formData.address.postalCode}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Botón de registro */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || passwordError}
              className={`w-full btn-modern ${
                formData.role === 'distributor' 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800' 
                  : 'btn-primary'
              } ${(loading || passwordError) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </div>
              ) : (
                <>
                  {formData.role === 'distributor' ? (
                    <>
                      <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                      Registrarse como Distribuidor
                    </>
                  ) : (
                    <>
                      <UserIcon className="h-5 w-5 mr-2" />
                      Registrarse como Cliente
                    </>
                  )}
                </>
              )}
            </button>
          </div>

          {/* Términos y condiciones */}
          <div className="text-center text-sm text-gray-600">
            Al registrarte, aceptas nuestros{' '}
            <Link to="/terms" className="text-blue-600 hover:text-blue-500">
              Términos y Condiciones
            </Link>{' '}
            y{' '}
            <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
              Política de Privacidad
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;