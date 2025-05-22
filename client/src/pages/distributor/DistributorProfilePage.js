import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { getImageUrl } from '../../utils/imageHelpers';
import toast from 'react-hot-toast';

const DistributorProfilePage = () => {
  const { user, updateProfile, refreshUser } = useAuth(); // Añadir refreshUser
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    companyName: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Chile'
    }
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [passwordError, setPasswordError] = useState('');
  
  // CORREGIDO: Cargar datos del usuario con validación
  useEffect(() => {
    if (user) {
      console.log('👤 Cargando datos del usuario en perfil:', user);
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        companyName: user.companyName || '',
        phone: user.phone || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          postalCode: user.address?.postalCode || '',
          country: user.address?.country || 'Chile'
        }
      });
    }
  }, [user]);
  
  // Manejar cambios en formulario de perfil
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('address.')) {
      const addressField = name.split('.')[1];
      setProfileForm(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setProfileForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Manejar cambios en formulario de contraseña
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validar contraseñas
    if (name === 'confirmPassword' || (name === 'newPassword' && passwordForm.confirmPassword)) {
      if (passwordForm.newPassword !== value && name === 'confirmPassword') {
        setPasswordError('Las contraseñas no coinciden');
      } else if (passwordForm.confirmPassword !== value && name === 'newPassword') {
        setPasswordError('Las contraseñas no coinciden');
      } else {
        setPasswordError('');
      }
    }
  };
  
  // Manejar cambio de imagen
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };
  
  // CORREGIDO: Actualizar perfil con refresh automático
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      console.log('🔄 Actualizando perfil del distribuidor...');
      
      // Actualizar datos de perfil
      await updateProfile(profileForm);
      
      // Subir logo si se seleccionó una nueva imagen
      if (selectedImage && user) {
        console.log('📸 Subiendo nueva imagen de logo...');
        const formData = new FormData();
        formData.append('file', selectedImage);
        
        await authService.uploadCompanyLogo(user._id, formData, {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        });
        
        console.log('✅ Logo subido exitosamente');
        
        // CRÍTICO: Refrescar los datos del usuario después de subir la imagen
        await refreshUser();
      }
      
      // Limpiar el estado de la imagen seleccionada
      setSelectedImage(null);
      setUploadProgress(0);
      
      toast.success('Perfil actualizado correctamente');
      
    } catch (err) {
      console.error('❌ Error al actualizar perfil:', err);
      toast.error(err.response?.data?.error || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };
  
  // Actualizar contraseña
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    // Validar contraseñas
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    try {
      setLoading(true);
      
      // Actualizar contraseña
      await authService.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      // Limpiar formulario
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      toast.success('Contraseña actualizada correctamente');
      setLoading(false);
    } catch (err) {
      console.error('Error al actualizar contraseña:', err);
      toast.error(err.response?.data?.error || 'Error al actualizar contraseña');
      setLoading(false);
    }
  };

  // NUEVO: Mostrar indicador de carga si no hay usuario
  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
      
      {/* Información Personal y de Empresa */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">Información Personal y de Empresa</h2>
          <p className="mt-1 text-sm text-gray-600">Actualiza tu información personal y de la empresa.</p>
        </div>
        
        <form onSubmit={handleUpdateProfile}>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-6 gap-6">
              {/* Logo de empresa */}
              <div className="col-span-6 sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Logo de la Empresa</label>
                <div className="mt-2 flex items-center">
                  {selectedImage ? (
                    <div className="mr-4">
                      <img
                        src={URL.createObjectURL(selectedImage)}
                        alt="Preview"
                        className="h-24 w-24 object-cover rounded-full"
                      />
                    </div>
                  ) : user?.companyLogo ? (
                    <div className="mr-4">
                      <img
                        src={getImageUrl(user.companyLogo)}
                        alt={user.companyName || user.name}
                        className="h-24 w-24 object-cover rounded-full"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder-logo.png';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                      <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  />
                </div>
                
                {/* Barra de progreso */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  name="companyName"
                  id="companyName"
                  value={profileForm.companyName}
                  onChange={handleProfileChange}
                  required
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Teléfono
                </label>
                <input
                  type="text"
                  name="phone"
                  id="phone"
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              <div className="col-span-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Dirección</h3>
              </div>
              
              <div className="col-span-6">
                <label htmlFor="address.street" className="block text-sm font-medium text-gray-700">
                  Calle y Número
                </label>
                <input
                  type="text"
                  name="address.street"
                  id="address.street"
                  value={profileForm.address.street}
                  onChange={handleProfileChange}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              <div className="col-span-6 sm:col-span-2">
                <label htmlFor="address.city" className="block text-sm font-medium text-gray-700">
                  Ciudad
                </label>
                <input
                  type="text"
                  name="address.city"
                  id="address.city"
                  value={profileForm.address.city}
                  onChange={handleProfileChange}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              <div className="col-span-6 sm:col-span-2">
                <label htmlFor="address.state" className="block text-sm font-medium text-gray-700">
                  Región
                </label>
                <input
                  type="text"
                  name="address.state"
                  id="address.state"
                  value={profileForm.address.state}
                  onChange={handleProfileChange}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              <div className="col-span-6 sm:col-span-2">
                <label htmlFor="address.postalCode" className="block text-sm font-medium text-gray-700">
                  Código Postal
                </label>
                <input
                  type="text"
                  name="address.postalCode"
                  id="address.postalCode"
                  value={profileForm.address.postalCode}
                  onChange={handleProfileChange}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
          
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Cambiar Contraseña */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">Cambiar Contraseña</h2>
          <p className="mt-1 text-sm text-gray-600">Actualiza tu contraseña para mantener tu cuenta segura.</p>
        </div>
        
        <form onSubmit={handleUpdatePassword}>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6 sm:col-span-4">
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  id="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              <div className="col-span-6 sm:col-span-4">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  name="newPassword"
                  id="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              <div className="col-span-6 sm:col-span-4">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  className={`mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                    passwordError ? 'border-red-300' : ''
                  }`}
                />
                {passwordError && (
                  <p className="mt-2 text-sm text-red-600">{passwordError}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <button
              type="submit"
              disabled={loading || passwordError}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                loading || passwordError ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DistributorProfilePage;