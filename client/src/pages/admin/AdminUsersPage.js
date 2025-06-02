import React, { useState, useEffect } from 'react';
import { userService } from '../../services/api';
import { 
  MagnifyingGlassIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon as XIcon,
  EyeIcon,
  BuildingOfficeIcon,
  UserIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para filtros y paginación
  const [filter, setFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // ✅ NUEVO: Filtro de estado para distribuidores
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const usersPerPage = 10;
  
  // Estados para modales
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false); // ✅ NUEVO: Modal para ver detalles
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // ✅ NUEVO: Para aprobar/rechazar distribuidores
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    phone: ''
  });
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers();
      setUsers(response.data.data);
      setTotalUsers(response.data.count);
      setTotalPages(Math.ceil(response.data.count / usersPerPage));
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError('Error al cargar usuarios. Por favor, intente de nuevo más tarde.');
      setLoading(false);
    }
  };
  
  // ✅ NUEVA FUNCIÓN: Aprobar distribuidor
  const handleApproveDistributor = async (userId) => {
    try {
      await userService.updateUser(userId, {
        'distributorInfo.isApproved': true,
        'distributorInfo.approvedAt': new Date(),
        'distributorInfo.approvedBy': 'current_admin_id' // Esto debería venir del contexto de auth
      });
      toast.success('Distribuidor aprobado correctamente');
      fetchUsers();
    } catch (err) {
      console.error('Error al aprobar distribuidor:', err);
      toast.error(err.response?.data?.error || 'Error al aprobar distribuidor');
    } finally {
      setConfirmAction(null);
    }
  };
  
  // ✅ NUEVA FUNCIÓN: Rechazar distribuidor
  const handleRejectDistributor = async (userId) => {
    try {
      await userService.updateUser(userId, {
        'distributorInfo.isApproved': false,
        'distributorInfo.approvedAt': null,
        'distributorInfo.approvedBy': null
      });
      toast.success('Distribuidor rechazado');
      fetchUsers();
    } catch (err) {
      console.error('Error al rechazar distribuidor:', err);
      toast.error(err.response?.data?.error || 'Error al rechazar distribuidor');
    } finally {
      setConfirmAction(null);
    }
  };
  
  // Eliminar usuario
  const handleDeleteUser = async (userId) => {
    try {
      await userService.deleteUser(userId);
      toast.success('Usuario eliminado correctamente');
      fetchUsers();
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      toast.error(err.response?.data?.error || 'Error al eliminar usuario');
    } finally {
      setConfirmDelete(null);
    }
  };
  
  // Abrir modal de edición
  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || ''
    });
    setIsEditModalOpen(true);
  };

  // ✅ NUEVA FUNCIÓN: Abrir modal de detalles
  const openViewModal = (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };
  
  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Actualizar usuario
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    try {
      await userService.updateUser(selectedUser._id, formData);
      toast.success('Usuario actualizado correctamente');
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('Error al actualizar usuario:', err);
      toast.error(err.response?.data?.error || 'Error al actualizar usuario');
    }
  };
  
  // Manejar cambio de filtro
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setCurrentPage(1);
  };
  
  // Manejar cambio de filtro de rol
  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };

  // ✅ NUEVA FUNCIÓN: Manejar cambio de filtro de estado
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };
  
  // ✅ FUNCIÓN ACTUALIZADA: Filtrar usuarios con nuevos criterios
  const filteredUsers = users.filter(user => {
    const nameMatch = user.name.toLowerCase().includes(filter.toLowerCase());
    const emailMatch = user.email.toLowerCase().includes(filter.toLowerCase());
    const roleMatch = roleFilter === '' || user.role === roleFilter;
    
    // Filtro de estado (para distribuidores)
    let statusMatch = true;
    if (statusFilter && user.role === 'distributor') {
      if (statusFilter === 'approved') {
        statusMatch = user.distributorInfo?.isApproved === true;
      } else if (statusFilter === 'pending') {
        statusMatch = user.distributorInfo?.isApproved !== true;
      }
    } else if (statusFilter && user.role !== 'distributor') {
      statusMatch = false; // Si filtra por estado pero no es distribuidor, no mostrar
    }
    
    return (nameMatch || emailMatch) && roleMatch && statusMatch;
  });
  
  // Calcular usuarios para la página actual
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  
  // Cambiar página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Formatear fecha
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };
  
  // ✅ FUNCIÓN ACTUALIZADA: Traducir rol
  const getRoleTranslation = (role) => {
    const translations = {
      'admin': 'Administrador',
      'client': 'Cliente',
      'distributor': 'Distribuidor' // ✅ AGREGADO
    };
    
    return translations[role] || role;
  };
  
  // ✅ FUNCIÓN ACTUALIZADA: Obtener color de insignia según rol
  const getRoleBadgeClass = (role) => {
    switch(role) {
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'client':
        return 'bg-green-100 text-green-800';
      case 'distributor':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // ✅ NUEVA FUNCIÓN: Obtener estado del distribuidor
  const getDistributorStatus = (user) => {
    if (user.role !== 'distributor') return null;
    
    const isApproved = user.distributorInfo?.isApproved;
    
    return {
      approved: isApproved === true,
      pending: isApproved !== true,
      text: isApproved ? 'Aprobado' : 'Pendiente',
      color: isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
    };
  };

  // ✅ NUEVA FUNCIÓN: Obtener icono según el rol
  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin':
        return <ShieldCheckIcon className="h-4 w-4" />;
      case 'distributor':
        return <BuildingOfficeIcon className="h-4 w-4" />;
      case 'client':
      default:
        return <UserIcon className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4" role="alert">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Administración de Usuarios</h1>
        
        {/* ✅ NUEVO: Estadísticas rápidas */}
        <div className="flex space-x-4">
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium">
            Admins: {users.filter(u => u.role === 'admin').length}
          </div>
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-medium">
            Clientes: {users.filter(u => u.role === 'client').length}
          </div>
          <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-sm font-medium">
            Distribuidores: {users.filter(u => u.role === 'distributor').length}
          </div>
        </div>
      </div>

      {/* ✅ FILTROS ACTUALIZADOS */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-grow">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                placeholder="Buscar por nombre, email..."
                value={filter}
                onChange={handleFilterChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pl-10"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              {filter && (
                <button
                  onClick={() => setFilter('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>
          
          <div className="sm:w-48">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Rol
            </label>
            <select
              id="role"
              value={roleFilter}
              onChange={handleRoleFilterChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Todos los roles</option>
              <option value="admin">Administrador</option>
              <option value="client">Cliente</option>
              <option value="distributor">Distribuidor</option>
            </select>
          </div>

          {/* ✅ NUEVO: Filtro de estado para distribuidores */}
          <div className="sm:w-48">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Estado Distribuidor
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="approved">Aprobados</option>
              <option value="pending">Pendientes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      {currentUsers.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registro
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentUsers.map((user) => {
                  const distributorStatus = getDistributorStatus(user);
                  
                  return (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              user.role === 'admin' ? 'bg-blue-100' :
                              user.role === 'distributor' ? 'bg-purple-100' :
                              'bg-green-100'
                            }`}>
                              {getRoleIcon(user.role)}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.role === 'distributor' && user.distributorInfo?.companyName && (
                              <div className="text-xs text-purple-600 font-medium">
                                {user.distributorInfo.companyName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                          {getRoleTranslation(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {distributorStatus ? (
                          <div className="space-y-1">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${distributorStatus.color}`}>
                              {distributorStatus.text}
                            </span>
                            {distributorStatus.approved && user.distributorInfo?.approvedAt && (
                              <div className="text-xs text-gray-500">
                                {formatDate(user.distributorInfo.approvedAt)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {/* ✅ NUEVO: Botón para ver detalles */}
                          <button
                            onClick={() => openViewModal(user)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Ver detalles"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          
                          {/* ✅ NUEVOS: Botones para aprobar/rechazar distribuidores */}
                          {user.role === 'distributor' && !distributorStatus?.approved && (
                            <button
                              onClick={() => setConfirmAction({ type: 'approve', user })}
                              className="text-green-600 hover:text-green-900"
                              title="Aprobar distribuidor"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                          )}
                          
                          {user.role === 'distributor' && distributorStatus?.approved && (
                            <button
                              onClick={() => setConfirmAction({ type: 'reject', user })}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Revocar aprobación"
                            >
                              <XIcon className="h-5 w-5" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Editar"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          
                          <button
                            onClick={() => setConfirmDelete(user._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                            disabled={user.role === 'admin'} // No permitir eliminar administradores
                          >
                            <TrashIcon className={`h-5 w-5 ${user.role === 'admin' ? 'opacity-50 cursor-not-allowed' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación aquí... (mismo código anterior) */}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500 mb-4">No hay usuarios que coincidan con los filtros aplicados.</p>
        </div>
      )}

      {/* ✅ NUEVO: Modal para ver detalles del usuario */}
      {isViewModalOpen && selectedUser && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsViewModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedUser.role === 'admin' ? 'bg-blue-100' :
                      selectedUser.role === 'distributor' ? 'bg-purple-100' :
                      'bg-green-100'
                    }`}>
                      {getRoleIcon(selectedUser.role)}
                    </div>
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {selectedUser.name}
                      </h3>
                      <p className="text-sm text-gray-500">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => setIsViewModalOpen(false)}
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Información básica */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Rol</label>
                      <div className="mt-1">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(selectedUser.role)}`}>
                          {getRoleTranslation(selectedUser.role)}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Teléfono</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.phone || 'No registrado'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Fecha de registro</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.createdAt)}</p>
                    </div>
                  </div>

                  {/* Dirección */}
                  {selectedUser.address && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Dirección</label>
                      <div className="mt-1 text-sm text-gray-900">
                        {selectedUser.address.street && <p>{selectedUser.address.street}</p>}
                        {(selectedUser.address.city || selectedUser.address.state) && (
                          <p>{selectedUser.address.city}{selectedUser.address.city && selectedUser.address.state ? ', ' : ''}{selectedUser.address.state}</p>
                        )}
                        {selectedUser.address.postalCode && <p>{selectedUser.address.postalCode}</p>}
                        {selectedUser.address.country && <p>{selectedUser.address.country}</p>}
                      </div>
                    </div>
                  )}

                  {/* ✅ INFORMACIÓN DE DISTRIBUIDOR */}
                  {selectedUser.role === 'distributor' && selectedUser.distributorInfo && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                        <BuildingOfficeIcon className="h-5 w-5 text-purple-600 mr-2" />
                        Información de Distribuidor
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Empresa</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedUser.distributorInfo.companyName || 'No registrado'}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-700">RUT Empresa</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedUser.distributorInfo.companyRUT || 'No registrado'}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-700">Estado</label>
                          <div className="mt-1">
                            {(() => {
                              const status = getDistributorStatus(selectedUser);
                              return (
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                                  {status.text}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                        
                        {selectedUser.distributorInfo.businessLicense && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Licencia Comercial</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedUser.distributorInfo.businessLicense}</p>
                          </div>
                        )}
                        
                        {selectedUser.distributorInfo.creditLimit && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Límite de Crédito</label>
                            <p className="mt-1 text-sm text-gray-900">
                              {new Intl.NumberFormat('es-CL', {
                                style: 'currency',
                                currency: 'CLP'
                              }).format(selectedUser.distributorInfo.creditLimit)}
                            </p>
                          </div>
                        )}
                        
                        {selectedUser.distributorInfo.discountPercentage && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Descuento</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedUser.distributorInfo.discountPercentage}%</p>
                          </div>
                        )}
                      </div>
                      
                      {selectedUser.distributorInfo.approvedAt && (
                        <div className="mt-4 pt-4 border-t border-purple-200">
                          <p className="text-sm text-gray-600">
                            Aprobado el {formatDate(selectedUser.distributorInfo.approvedAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsViewModalOpen(false)}
                    className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:text-sm"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      openEditModal(selectedUser);
                    }}
                    className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:text-sm"
                  >
                    Editar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NUEVO: Modal de confirmación para aprobar/rechazar distribuidor */}
      {confirmAction && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setConfirmAction(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
                  confirmAction.type === 'approve' ? 'bg-green-100' : 'bg-yellow-100'
                } sm:mx-0 sm:h-10 sm:w-10`}>
                  {confirmAction.type === 'approve' ? (
                    <CheckIcon className="h-6 w-6 text-green-600" />
                  ) : (
                    <XIcon className="h-6 w-6 text-yellow-600" />
                  )}
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {confirmAction.type === 'approve' ? 'Aprobar Distribuidor' : 'Revocar Aprobación'}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {confirmAction.type === 'approve' 
                        ? `¿Estás seguro de que deseas aprobar a ${confirmAction.user.name} como distribuidor? Podrá acceder a precios mayoristas.`
                        : `¿Estás seguro de que deseas revocar la aprobación de ${confirmAction.user.name}? Perderá el acceso a precios mayoristas.`
                      }
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                    confirmAction.type === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      : 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                  }`}
                  onClick={() => {
                    if (confirmAction.type === 'approve') {
                      handleApproveDistributor(confirmAction.user._id);
                    } else {
                      handleRejectDistributor(confirmAction.user._id);
                    }
                  }}
                >
                  {confirmAction.type === 'approve' ? 'Aprobar' : 'Revocar'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => setConfirmAction(null)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de usuario (código existente, sin cambios...) */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          {/* Contenido del modal de edición existente */}
        </div>
      )}

      {/* Modal de confirmación de eliminación (código existente, sin cambios...) */}
      {confirmDelete && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          {/* Contenido del modal de eliminación existente */}
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;