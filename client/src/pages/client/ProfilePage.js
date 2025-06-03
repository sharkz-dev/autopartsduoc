import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon,
  KeyIcon,
  BuildingOfficeIcon,
  CameraIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateProfile, updatePassword, refreshUser } = useAuth();
  
  // Estados para formularios
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Chile'
    }
  });
  
  const [distributorData, setDistributorData] = useState({
    companyName: '',
    companyRUT: '',
    businessLicense: '',
    companyLogo: null
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Estados de UI
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingDistributor, setIsEditingDistributor] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          postalCode: user.address?.postalCode || '',
          country: user.address?.country || 'Chile'
        }
      });
      
      if (user.role === 'distributor' && user.distributorInfo) {
        setDistributorData({
          companyName: user.distributorInfo.companyName || '',
          companyRUT: user.distributorInfo.companyRUT || '',
          businessLicense: user.distributorInfo.businessLicense || '',
          companyLogo: null
        });
      }
    }
  }, [user]);
  
  // Manejar cambios en formulario de perfil
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Manejar cambios en formulario de distribuidor
  const handleDistributorChange = (e) => {
    const { name, value } = e.target;
    setDistributorData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Manejar cambios en formulario de contraseña
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Guardar perfil
  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const updateData = {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address
      };
      
      if (user.role === 'distributor') {
        updateData.distributorInfo = {
          companyName: distributorData.companyName,
          companyRUT: distributorData.companyRUT,
          businessLicense: distributorData.businessLicense
        };
      }
      
      await updateProfile(updateData);
      setIsEditingProfile(false);
      setIsEditingDistributor(false);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      toast.error('Error al actualizar el perfil');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Cambiar contraseña
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    try {
      await updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsChangingPassword(false);
      toast.success('Contraseña actualizada correctamente');
    } catch (error) {
      toast.error('Error al cambiar la contraseña');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Subir logo de empresa
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error('La imagen no debe superar los 5MB');
      return;
    }
    
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      await authService.uploadCompanyLogo(user.id, formData);
      await refreshUser(); // Recargar datos del usuario
      toast.success('Logo actualizado correctamente');
    } catch (error) {
      toast.error('Error al subir el logo');
      console.error('Error:', error);
    } finally {
      setUploadingLogo(false);
    }
  };
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
              {user.role === 'distributor' && user.distributorInfo?.companyLogo ? (
                <img 
                  src={`/uploads/${user.distributorInfo.companyLogo}`}
                  alt="Logo de empresa"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <UserIcon className="h-12 w-12 text-white" />
              )}
            </div>
            
            {user.role === 'distributor' && (
              <label className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 rounded-full p-2 cursor-pointer transition-colors">
                <CameraIcon className="h-4 w-4 text-white" />
                <input
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                />
              </label>
            )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-blue-100 text-lg">{user.email}</p>
            
            <div className="flex items-center space-x-4 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                user.role === 'admin' ? 'bg-red-500/20 text-red-100' :
                user.role === 'distributor' ? 'bg-purple-500/20 text-purple-100' :
                'bg-green-500/20 text-green-100'
              }`}>
                {user.role === 'admin' ? 'Administrador' :
                 user.role === 'distributor' ? 'Distribuidor' : 'Cliente'}
              </span>
              
              {user.role === 'distributor' && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user.distributorInfo?.isApproved 
                    ? 'bg-green-500/20 text-green-100' 
                    : 'bg-yellow-500/20 text-yellow-100'
                }`}>
                  {user.distributorInfo?.isApproved ? (
                    <>
                      <ShieldCheckIcon className="h-4 w-4 inline mr-1" />
                      Aprobado
                    </>
                  ) : (
                    <>
                      <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
                      Pendiente de Aprobación
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Información Personal */}
      <div className="card-modern">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <UserIcon className="h-6 w-6 mr-2 text-blue-600" />
              Información Personal
            </h2>
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="btn-modern btn-secondary flex items-center"
            >
              {isEditingProfile ? (
                <>
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Cancelar
                </>
              ) : (
                <>
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Editar
                </>
              )}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div>
              <label className="form-label-modern">Nombre Completo</label>
              {isEditingProfile ? (
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  className="form-input-modern"
                />
              ) : (
                <p className="p-3 bg-gray-50 rounded-xl">{user.name}</p>
              )}
            </div>
            
            {/* Email */}
            <div>
              <label className="form-label-modern">Email</label>
              {isEditingProfile ? (
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="form-input-modern"
                />
              ) : (
                <p className="p-3 bg-gray-50 rounded-xl flex items-center">
                  <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-500" />
                  {user.email}
                </p>
              )}
            </div>
            
            {/* Teléfono */}
            <div>
              <label className="form-label-modern">Teléfono</label>
              {isEditingProfile ? (
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  className="form-input-modern"
                  placeholder="+56 9 XXXX XXXX"
                />
              ) : (
                <p className="p-3 bg-gray-50 rounded-xl flex items-center">
                  <PhoneIcon className="h-4 w-4 mr-2 text-gray-500" />
                  {user.phone || 'No especificado'}
                </p>
              )}
            </div>
            
            {/* País */}
            <div>
              <label className="form-label-modern">País</label>
              {isEditingProfile ? (
                <select
                  name="address.country"
                  value={profileData.address.country}
                  onChange={handleProfileChange}
                  className="form-input-modern"
                >
                  <option value="Chile">Chile</option>
                  <option value="Argentina">Argentina</option>
                  <option value="Perú">Perú</option>
                  <option value="Colombia">Colombia</option>
                </select>
              ) : (
                <p className="p-3 bg-gray-50 rounded-xl">{user.address?.country || 'Chile'}</p>
              )}
            </div>
            
            {/* Dirección */}
            <div className="md:col-span-2">
              <label className="form-label-modern">Dirección</label>
              {isEditingProfile ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    name="address.street"
                    value={profileData.address.street}
                    onChange={handleProfileChange}
                    className="form-input-modern"
                    placeholder="Calle y número"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      name="address.city"
                      value={profileData.address.city}
                      onChange={handleProfileChange}
                      className="form-input-modern"
                      placeholder="Ciudad"
                    />
                    <input
                      type="text"
                      name="address.state"
                      value={profileData.address.state}
                      onChange={handleProfileChange}
                      className="form-input-modern"
                      placeholder="Región"
                    />
                    <input
                      type="text"
                      name="address.postalCode"
                      value={profileData.address.postalCode}
                      onChange={handleProfileChange}
                      className="form-input-modern"
                      placeholder="Código postal"
                    />
                  </div>
                </div>
              ) : (
                <p className="p-3 bg-gray-50 rounded-xl flex items-start">
                  <MapPinIcon className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                  {user.address ? (
                    <>
                      {user.address.street && `${user.address.street}, `}
                      {user.address.city && `${user.address.city}, `}
                      {user.address.state && `${user.address.state}, `}
                      {user.address.country}
                      {user.address.postalCode && ` ${user.address.postalCode}`}
                    </>
                  ) : (
                    'No especificada'
                  )}
                </p>
              )}
            </div>
          </div>
          
          {isEditingProfile && (
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
              <button
                onClick={() => setIsEditingProfile(false)}
                className="btn-modern btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="btn-modern btn-primary"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Información de Distribuidor */}
      {user.role === 'distributor' && (
        <div className="card-modern">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <BuildingOfficeIcon className="h-6 w-6 mr-2 text-purple-600" />
                Información de Empresa
              </h2>
              <button
                onClick={() => setIsEditingDistributor(!isEditingDistributor)}
                className="btn-modern btn-secondary flex items-center"
              >
                {isEditingDistributor ? (
                  <>
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Cancelar
                  </>
                ) : (
                  <>
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Editar
                  </>
                )}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre de la empresa */}
              <div>
                <label className="form-label-modern">Nombre de la Empresa</label>
                {isEditingDistributor ? (
                  <input
                    type="text"
                    name="companyName"
                    value={distributorData.companyName}
                    onChange={handleDistributorChange}
                    className="form-input-modern"
                  />
                ) : (
                  <p className="p-3 bg-gray-50 rounded-xl">{user.distributorInfo?.companyName}</p>
                )}
              </div>
              
              {/* RUT de la empresa */}
              <div>
                <label className="form-label-modern">RUT de la Empresa</label>
                {isEditingDistributor ? (
                  <input
                    type="text"
                    name="companyRUT"
                    value={distributorData.companyRUT}
                    onChange={handleDistributorChange}
                    className="form-input-modern"
                    placeholder="XX.XXX.XXX-X"
                  />
                ) : (
                  <p className="p-3 bg-gray-50 rounded-xl">{user.distributorInfo?.companyRUT}</p>
                )}
              </div>
              
              {/* Licencia comercial */}
              <div className="md:col-span-2">
                <label className="form-label-modern">Licencia Comercial (Opcional)</label>
                {isEditingDistributor ? (
                  <input
                    type="text"
                    name="businessLicense"
                    value={distributorData.businessLicense}
                    onChange={handleDistributorChange}
                    className="form-input-modern"
                  />
                ) : (
                  <p className="p-3 bg-gray-50 rounded-xl">
                    {user.distributorInfo?.businessLicense || 'No especificada'}
                  </p>
                )}
              </div>
              
              {/* Estado de aprobación */}
              <div className="md:col-span-2">
                <label className="form-label-modern">Estado de Aprobación</label>
                <div className="p-3 bg-gray-50 rounded-xl">
                  {user.distributorInfo?.isApproved ? (
                    <div className="flex items-center text-green-700">
                      <ShieldCheckIcon className="h-5 w-5 mr-2" />
                      <span className="font-medium">Distribuidor Aprobado</span>
                      {user.distributorInfo.approvedAt && (
                        <span className="ml-2 text-sm text-gray-600">
                          (Aprobado el {new Date(user.distributorInfo.approvedAt).toLocaleDateString()})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center text-yellow-700">
                      <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                      <span className="font-medium">Pendiente de Aprobación</span>
                      <p className="ml-2 text-sm text-gray-600">
                        Tu solicitud está siendo revisada por nuestro equipo
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {isEditingDistributor && (
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setIsEditingDistributor(false)}
                  className="btn-modern btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="btn-modern btn-primary"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cambiar Contraseña */}
      <div className="card-modern">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <KeyIcon className="h-6 w-6 mr-2 text-red-600" />
              Seguridad
            </h2>
            <button
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              className="btn-modern btn-secondary flex items-center"
            >
              {isChangingPassword ? (
                <>
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Cancelar
                </>
              ) : (
                <>
                  <KeyIcon className="h-4 w-4 mr-2" />
                  Cambiar Contraseña
                </>
              )}
            </button>
          </div>
          
          {isChangingPassword ? (
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <label className="form-label-modern">Contraseña Actual</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="form-input-modern"
                  required
                />
              </div>
              
              <div>
                <label className="form-label-modern">Nueva Contraseña</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="form-input-modern"
                  minLength="6"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Mínimo 6 caracteres</p>
              </div>
              
              <div>
                <label className="form-label-modern">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="form-input-modern"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="btn-modern btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-modern btn-primary"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                      Cambiando...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Cambiar Contraseña
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-gray-600">
              <p>Tu contraseña fue actualizada por última vez hace tiempo.</p>
              <p className="text-sm mt-2">Para tu seguridad, te recomendamos cambiar tu contraseña periódicamente.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;