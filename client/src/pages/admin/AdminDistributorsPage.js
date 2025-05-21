import React, { useState, useEffect } from 'react';
import { userService, productService } from '../../services/api';
import { getImageUrl } from '../../utils/imageHelpers';
import { 
  MagnifyingGlassIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AdminDistributorsPage = () => {
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para filtros y paginación
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalDistributors, setTotalDistributors] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const distributorsPerPage = 10;
  
  // Estados para modal de detalles y eliminación
  const [selectedDistributor, setSelectedDistributor] = useState(null);
  const [showDistributorDetails, setShowDistributorDetails] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [distributorProducts, setDistributorProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  useEffect(() => {
    fetchDistributors();
  }, []);
  
  const fetchDistributors = async () => {
    try {
      setLoading(true);
      // Filtrar usuarios con rol "distributor"
      const response = await userService.getUsers();
      const distributorsList = response.data.data.filter(user => user.role === 'distributor');
      
      setDistributors(distributorsList);
      setTotalDistributors(distributorsList.length);
      setTotalPages(Math.ceil(distributorsList.length / distributorsPerPage));
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar distribuidores:', err);
      setError('Error al cargar distribuidores. Por favor, intente de nuevo más tarde.');
      setLoading(false);
    }
  };
  
  // Eliminar distribuidor
  const handleDeleteDistributor = async (distributorId) => {
    try {
      await userService.deleteUser(distributorId);
      toast.success('Distribuidor eliminado correctamente');
      fetchDistributors();
    } catch (err) {
      console.error('Error al eliminar distribuidor:', err);
      toast.error(err.response?.data?.error || 'Error al eliminar distribuidor');
    } finally {
      setConfirmDelete(null);
    }
  };
  
  // Abrir modal de detalles del distribuidor
  const openDistributorDetails = async (distributor) => {
    setSelectedDistributor(distributor);
    setShowDistributorDetails(true);
    
    try {
      setLoadingProducts(true);
      const response = await productService.getProductsByDistributor(distributor._id);
      setDistributorProducts(response.data.data);
      setLoadingProducts(false);
    } catch (err) {
      console.error('Error al cargar productos del distribuidor:', err);
      setDistributorProducts([]);
      setLoadingProducts(false);
    }
  };
  
  // Manejar cambio de filtro
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setCurrentPage(1);
  };
  
  // Filtrar distribuidores
  const filteredDistributors = distributors.filter(distributor => {
    const nameMatch = distributor.name.toLowerCase().includes(filter.toLowerCase());
    const emailMatch = distributor.email.toLowerCase().includes(filter.toLowerCase());
    const companyMatch = distributor.companyName?.toLowerCase().includes(filter.toLowerCase()) || false;
    
    return nameMatch || emailMatch || companyMatch;
  });
  
  // Calcular distribuidores para la página actual
  const indexOfLastDistributor = currentPage * distributorsPerPage;
  const indexOfFirstDistributor = indexOfLastDistributor - distributorsPerPage;
  const currentDistributors = filteredDistributors.slice(indexOfFirstDistributor, indexOfLastDistributor);
  
  // Cambiar página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Formatear fecha
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };
  
  // Formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(value);
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
        <h1 className="text-2xl font-bold text-gray-900">Administración de Distribuidores</h1>
      </div>

      {/* Filtros */}
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
                placeholder="Buscar por nombre, email, empresa..."
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
        </div>
      </div>

      {/* Tabla de distribuidores */}
      {currentDistributors.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Distribuidor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
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
                {currentDistributors.map((distributor) => (
                  <tr key={distributor._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
{distributor.companyLogo ? (
  <img 
    className="h-10 w-10 rounded-full object-cover" 
    src={getImageUrl(distributor.companyLogo)}
    alt={distributor.companyName || distributor.name} 
  />
) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{distributor.name}</div>
                          <div className="text-sm text-gray-500">{distributor.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{distributor.companyName || 'No especificada'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {distributor.phone || 'Sin teléfono'}
                      </div>
                      {distributor.address && distributor.address.city && (
                        <div className="text-sm text-gray-500">
                          {distributor.address.city}, {distributor.address.state}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(distributor.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => openDistributorDetails(distributor)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(distributor._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => paginate(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`${
                    currentPage === 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-indigo-600 hover:bg-gray-50'
                  } relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md`}
                >
                  Anterior
                </button>
                <button
                  onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`${
                    currentPage === totalPages 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-indigo-600 hover:bg-gray-50'
                  } ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md`}
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{indexOfFirstDistributor + 1}</span> a{' '}
                    <span className="font-medium">
                      {Math.min(indexOfLastDistributor, filteredDistributors.length)}
                    </span>{' '}
                    de <span className="font-medium">{filteredDistributors.length}</span> distribuidores
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => paginate(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className={`${
                        currentPage === 1 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-white text-indigo-600 hover:bg-gray-50'
                      } relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium`}
                    >
                      <span className="sr-only">Anterior</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Números de página */}
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => paginate(pageNumber)}
                          className={`${
                            currentPage === pageNumber
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          } relative inline-flex items-center px-4 py-2 border text-sm font-medium`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className={`${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-indigo-600 hover:bg-gray-50'
                      } relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium`}
                    >
                      <span className="sr-only">Siguiente</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500 mb-4">No hay distribuidores que coincidan con los filtros aplicados.</p>
        </div>
      )}

      {/* Modal de detalles del distribuidor */}
      {showDistributorDetails && selectedDistributor && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowDistributorDetails(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl leading-6 font-medium text-gray-900" id="modal-title">
                    Detalles del Distribuidor
                  </h3>
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => setShowDistributorDetails(false)}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="flex items-center mb-4">
{selectedDistributor.companyLogo ? (
  <img 
    className="h-20 w-20 rounded-full object-cover mr-4" 
    src={getImageUrl(selectedDistributor.companyLogo)}
    alt={selectedDistributor.companyName || selectedDistributor.name} 
  />
) : (
                      <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                        <svg className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <h4 className="text-lg font-bold">{selectedDistributor.companyName || 'Empresa'}</h4>
                      <p className="text-gray-600">{selectedDistributor.name} - {selectedDistributor.email}</p>
                      <p className="text-gray-600">{selectedDistributor.phone || 'Sin teléfono de contacto'}</p>
                    </div>
                  </div>
                  
                  {selectedDistributor.address && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Dirección</h5>
                        <p className="text-gray-600">{selectedDistributor.address.street || 'No disponible'}</p>
                        <p className="text-gray-600">
                          {selectedDistributor.address.city || ''}{selectedDistributor.address.city && selectedDistributor.address.state ? ', ' : ''}
                          {selectedDistributor.address.state || ''}
                        </p>
                        <p className="text-gray-600">{selectedDistributor.address.postalCode || ''}</p>
                        <p className="text-gray-600">{selectedDistributor.address.country || ''}</p>
                      </div>
                      <div>
<h5 className="font-medium text-gray-700 mb-2">Información Adicional</h5>
                        <p className="text-gray-600">Fecha de registro: {formatDate(selectedDistributor.createdAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Productos del Distribuidor</h4>
                  
                  {loadingProducts ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                  ) : distributorProducts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {distributorProducts.map((product) => (
                            <tr key={product._id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 flex-shrink-0">
<img 
  className="h-10 w-10 rounded-full object-cover" 
  src={product.images && product.images.length > 0 
    ? getImageUrl(product.images[0])
    : "https://via.placeholder.com/40"
  } 
  alt={product.name} 
/>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                    <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {product.category ? product.category.name : 'Sin categoría'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                <div>{formatCurrency(product.price)}</div>
                                {product.wholesalePrice && (
                                  <div className="text-xs">Mayorista: {formatCurrency(product.wholesalePrice)}</div>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  product.stockQuantity > 10
                                    ? 'bg-green-100 text-green-800'
                                    : product.stockQuantity > 0
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {product.stockQuantity} unidades
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <ShoppingBagIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Este distribuidor no tiene productos registrados.</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                  onClick={() => setShowDistributorDetails(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {confirmDelete && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setConfirmDelete(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Eliminar distribuidor
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      ¿Estás seguro de que deseas eliminar este distribuidor? Esta acción no se puede deshacer.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Nota: No se puede eliminar un distribuidor si tiene productos asociados.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => handleDeleteDistributor(confirmDelete)}
                >
                  Eliminar
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => setConfirmDelete(null)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDistributorsPage;