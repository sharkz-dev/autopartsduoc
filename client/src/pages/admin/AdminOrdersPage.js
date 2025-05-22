import React, { useState, useEffect } from 'react';
import { getProductImageUrl } from '../../utils/imageHelpers';
import { Link } from 'react-router-dom';
import { orderService } from '../../services/api';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  EyeIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para filtros y paginación
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const ordersPerPage = 10;
  
  // Estado para modal de detalles y actualización
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(null); // Cambiar a null para controlar cuál menú está abierto
  const [updatingStatus, setUpdatingStatus] = useState(null); // Cambiar a null para controlar cuál orden se está actualizando

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      // Si el clic no fue en un botón de menú o en el menú mismo, cerrar todos los menús
      if (!event.target.closest('.status-menu-container')) {
        setShowStatusMenu(null);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);
  
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrders();
      setOrders(response.data.data);
      setTotalOrders(response.data.count);
      setTotalPages(Math.ceil(response.data.count / ordersPerPage));
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar órdenes:', err);
      setError('Error al cargar órdenes. Por favor, intente de nuevo más tarde.');
      setLoading(false);
    }
  };
  
  // Actualizar estado de una orden - VERSIÓN CORREGIDA
  const updateOrderStatus = async (orderId, status) => {
    try {
      console.log(`🔄 Iniciando actualización de estado:`);
      console.log(`   - Orden ID: ${orderId}`);
      console.log(`   - Nuevo estado: ${status}`);
      
      // Mostrar estado de carga para esta orden específica
      setUpdatingStatus(orderId);
      
      // Mostrar toast de carga
      const loadingToast = toast.loading('Actualizando estado...');
      
      // Llamar a la API
      const response = await orderService.updateOrderStatus(orderId, { status });
      
      console.log(`✅ Respuesta de la API:`, response.data);
      
      // Verificar que la respuesta sea exitosa
      if (response.data.success) {
        // Actualizar el estado local de la orden seleccionada (si está abierto el modal)
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({
            ...selectedOrder,
            status: status
          });
          console.log(`✅ Orden seleccionada actualizada en modal`);
        }
        
        // Actualizar la lista de órdenes
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId ? { ...order, status } : order
          )
        );
        console.log(`✅ Lista de órdenes actualizada`);
        
        // Mostrar mensaje de éxito
        toast.dismiss(loadingToast);
        toast.success(`Estado actualizado a: ${getStatusTranslation(status)}`);
      } else {
        // Manejar respuesta no exitosa
        console.error(`❌ Error en respuesta:`, response.data);
        toast.dismiss(loadingToast);
        toast.error('Error al actualizar estado: ' + (response.data.error || 'Error desconocido'));
      }
    } catch (err) {
      // Manejar errores
      console.error('💥 Error al actualizar estado:', err);
      console.error('   - Error completo:', err.response || err);
      
      toast.dismiss();
      const errorMessage = err.response?.data?.error || err.message || 'Error al actualizar estado';
      toast.error(errorMessage);
    } finally {
      // Siempre finalizar el estado de carga y cerrar menú
      setUpdatingStatus(null);
      setShowStatusMenu(null);
    }
  };
  
  // Manejar cambio de filtro
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setCurrentPage(1);
  };
  
  // Manejar cambio de filtro de estado
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };
  
  // Abrir modal de detalles de orden
  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };
  
  // Filtrar órdenes
  const filteredOrders = orders.filter(order => {
    const orderIdMatch = order._id.toLowerCase().includes(filter.toLowerCase());
    const userMatch = order.user && (
      order.user.name.toLowerCase().includes(filter.toLowerCase()) ||
      order.user.email.toLowerCase().includes(filter.toLowerCase())
    );
    
    const statusMatch = statusFilter === '' || order.status === statusFilter;
    
    return (orderIdMatch || userMatch) && statusMatch;
  });
  
  // Calcular órdenes para la página actual
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  
  // Cambiar página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Formatear fecha
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };
  
  // Formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(value);
  };
  
  // Obtener color de insignia según estado
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'ready_for_pickup':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Traducir estado
  const getStatusTranslation = (status) => {
    const translations = {
      'pending': 'Pendiente',
      'processing': 'Procesando',
      'shipped': 'Enviado',
      'ready_for_pickup': 'Listo para Retiro',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado'
    };
    
    return translations[status] || status;
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
        <h1 className="text-2xl font-bold text-gray-900">Administración de Pedidos</h1>
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
                placeholder="Buscar por ID, cliente..."
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
          
          <div className="sm:w-64">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="processing">Procesando</option>
              <option value="shipped">Enviado</option>
              <option value="ready_for_pickup">Listo para Retiro</option>
              <option value="delivered">Entregado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de órdenes */}
      {currentOrders.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order._id.substring(order._id.length - 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.user ? order.user.name : 'Usuario Eliminado'}</div>
                      <div className="text-sm text-gray-500">{order.user ? order.user.email : 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(order.totalPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.status)}`}>
                          {getStatusTranslation(order.status)}
                        </span>
                        
                        {/* Menú desplegable de estado - VERSIÓN CORREGIDA */}
                        <div className="relative status-menu-container">
                          <button
                            onClick={() => {
                              console.log(`🔘 Toggle menú para orden: ${order._id}`);
                              setShowStatusMenu(showStatusMenu === order._id ? null : order._id);
                            }}
                            disabled={updatingStatus === order._id}
                            className="inline-flex items-center p-1 text-gray-400 hover:text-gray-600 focus:outline-none disabled:opacity-50"
                            title="Cambiar estado"
                          >
                            {updatingStatus === order._id ? (
                              <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-indigo-600 rounded-full"></div>
                            ) : (
                              <ChevronDownIcon className="h-4 w-4" />
                            )}
                          </button>
                          
                          {/* Menú desplegable */}
                          {showStatusMenu === order._id && (
                            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    console.log(`🔄 Cambiar a: pending`);
                                    updateOrderStatus(order._id, 'pending');
                                  }}
                                  disabled={order.status === 'pending' || updatingStatus === order._id}
                                  className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Pendiente
                                </button>
                                <button
                                  onClick={() => {
                                    console.log(`🔄 Cambiar a: processing`);
                                    updateOrderStatus(order._id, 'processing');
                                  }}
                                  disabled={order.status === 'processing' || updatingStatus === order._id}
                                  className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Procesando
                                </button>
                                <button
                                  onClick={() => {
                                    console.log(`🔄 Cambiar a: shipped`);
                                    updateOrderStatus(order._id, 'shipped');
                                  }}
                                  disabled={order.status === 'shipped' || updatingStatus === order._id}
                                  className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Enviado
                                </button>
                                <button
                                  onClick={() => {
                                    console.log(`🔄 Cambiar a: ready_for_pickup`);
                                    updateOrderStatus(order._id, 'ready_for_pickup');
                                  }}
                                  disabled={order.status === 'ready_for_pickup' || updatingStatus === order._id}
                                  className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Listo para Retiro
                                </button>
                                <button
                                  onClick={() => {
                                    console.log(`🔄 Cambiar a: delivered`);
                                    updateOrderStatus(order._id, 'delivered');
                                  }}
                                  disabled={order.status === 'delivered' || updatingStatus === order._id}
                                  className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Entregado
                                </button>
                                <button
                                  onClick={() => {
                                    console.log(`🔄 Cambiar a: cancelled`);
                                    updateOrderStatus(order._id, 'cancelled');
                                  }}
                                  disabled={order.status === 'cancelled' || updatingStatus === order._id}
                                  className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Cancelado
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openOrderDetails(order)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
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
                    Mostrando <span className="font-medium">{indexOfFirstOrder + 1}</span> a{' '}
                    <span className="font-medium">
                      {Math.min(indexOfLastOrder, filteredOrders.length)}
                    </span>{' '}
                    de <span className="font-medium">{filteredOrders.length}</span> órdenes
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
                      const isVisible = Math.abs(pageNumber - currentPage) <= 1 || pageNumber === 1 || pageNumber === totalPages;
                      const isGap = (pageNumber === 2 && currentPage > 3) || (pageNumber === totalPages - 1 && currentPage < totalPages - 2);
                      
                      if (!isVisible && !isGap) return null;
                      
                      if (isGap) {
                        return (
                          <span key={`gap-${pageNumber}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>
                        );
                      }
                      
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
          <p className="text-gray-500 mb-4">No hay órdenes que coincidan con los filtros aplicados.</p>
        </div>
      )}

      {/* Modal de detalles de orden */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowOrderDetails(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Detalles de la Orden #{selectedOrder._id.substring(selectedOrder._id.length - 8).toUpperCase()}
                  </h3>
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => setShowOrderDetails(false)}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Información del cliente */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-medium text-gray-900 mb-2">Información del Cliente</h4>
                      <p><span className="font-medium">Nombre:</span> {selectedOrder.user ? selectedOrder.user.name : 'Usuario Eliminado'}</p>
                      <p><span className="font-medium">Email:</span> {selectedOrder.user ? selectedOrder.user.email : 'N/A'}</p>
                      <p><span className="font-medium">Fecha de Orden:</span> {formatDate(selectedOrder.createdAt)}</p>
                    </div>
                    
                    {/* Dirección de envío */}
<div className="bg-gray-50 p-4 rounded-lg">
  <h4 className="text-md font-medium text-gray-900 mb-2">Dirección de Envío</h4>
  {selectedOrder.shippingAddress ? (
    <>
      <p>{selectedOrder.shippingAddress.street}</p>
      <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</p>
      <p>{selectedOrder.shippingAddress.postalCode}</p>
      <p>{selectedOrder.shippingAddress.country}</p>
    </>
  ) : (
    <p className="text-gray-500">No hay dirección de envío</p>
  )}
</div>
                  </div>
                  
                  {/* Lista de productos */}
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-2">Productos</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distribuidor</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedOrder.items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 flex-shrink-0">
                                    <img 
                                      className="h-10 w-10 rounded-full object-cover" 
                                      src={item.product?.images && item.product.images.length > 0 
                                        ? getProductImageUrl(item.product)
                                        : "https://via.placeholder.com/40"
                                      } 
                                      alt={item.product?.name || 'Producto'} 
                                    />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{item.product?.name || 'Producto Eliminado'}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {item.distributor ? (
                                  item.distributor.companyName || item.distributor.name || 'Distribuidor'
                                ) : 'Distribuidor Eliminado'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {formatCurrency(item.price)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(item.price * item.quantity)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Resumen de costos */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="col-span-2"></div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">Subtotal:</span>
                        <span className="text-sm font-medium">{formatCurrency(selectedOrder.itemsPrice)}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">Impuestos:</span>
                        <span className="text-sm font-medium">{formatCurrency(selectedOrder.taxPrice)}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">Envío:</span>
                        <span className="text-sm font-medium">{formatCurrency(selectedOrder.shippingPrice)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="font-medium">Total:</span>
                        <span className="font-bold text-lg">{formatCurrency(selectedOrder.totalPrice)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Estados y actualización */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h4 className="text-md font-medium text-gray-900 mb-2">Estado de la Orden</h4>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="mb-4 sm:mb-0">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(selectedOrder.status)}`}>
                          {getStatusTranslation(selectedOrder.status)}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          Método de pago: {selectedOrder.paymentMethod}
                        </p>
                        <p className="text-sm text-gray-500">
                          {selectedOrder.isPaid ? (
                            <span className="text-green-600">Pagado el {formatDate(selectedOrder.paidAt)}</span>
                          ) : (
                            <span className="text-red-600">No pagado</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          {selectedOrder.isDelivered ? (
                            <span className="text-green-600">Entregado el {formatDate(selectedOrder.deliveredAt)}</span>
                          ) : (
                            <span className="text-orange-600">No entregado</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                  onClick={() => setShowOrderDetails(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;