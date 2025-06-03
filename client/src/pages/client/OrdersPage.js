import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  ShoppingBagIcon, 
  TruckIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const OrdersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  // Cargar pedidos al montar el componente
  useEffect(() => {
    fetchOrders();
  }, []);
  
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await orderService.getMyOrders();
      console.log('Órdenes cargadas:', response.data);
      setOrders(response.data.data || []);
    } catch (err) {
      console.error('Error al cargar órdenes:', err);
      setError('Error al cargar tus pedidos. Por favor, intenta de nuevo.');
      toast.error('Error al cargar tus pedidos');
    } finally {
      setLoading(false);
    }
  };
  
  // Filtrar y ordenar órdenes
  const filteredOrders = orders
    .filter(order => {
      // Filtro por término de búsqueda
      const matchesSearch = searchTerm === '' || 
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => 
          item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      // Filtro por estado
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'total_high':
          return b.totalPrice - a.totalPrice;
        case 'total_low':
          return a.totalPrice - b.totalPrice;
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  
  // Obtener icono según el estado
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500" />;
      case 'shipped':
        return <TruckIcon className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'ready_for_pickup':
        return <ShoppingBagIcon className="h-5 w-5 text-green-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Obtener texto del estado
  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'processing':
        return 'Procesando';
      case 'shipped':
        return 'Enviado';
      case 'delivered':
        return 'Entregado';
      case 'cancelled':
        return 'Cancelado';
      case 'ready_for_pickup':
        return 'Listo para Retiro';
      default:
        return status;
    }
  };
  
  // Obtener color del estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'ready_for_pickup':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };
  
  // Formatear fecha
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tus pedidos...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar pedidos</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchOrders}
            className="btn-modern btn-primary"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mis Pedidos</h1>
            <p className="text-blue-100">
              {orders.length === 0 ? 'No tienes pedidos aún' : 
               orders.length === 1 ? '1 pedido realizado' : 
               `${orders.length} pedidos realizados`}
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {orders.filter(o => o.status === 'delivered').length}
              </div>
              <div className="text-blue-100 text-sm">Entregados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status)).length}
              </div>
              <div className="text-blue-100 text-sm">En Proceso</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatPrice(orders.reduce((sum, order) => sum + order.totalPrice, 0))}
              </div>
              <div className="text-blue-100 text-sm">Total Gastado</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card-modern">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Búsqueda */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por ID de pedido o producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Filtros */}
            <div className="flex space-x-3">
              {/* Filtro por estado */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="processing">Procesando</option>
                <option value="shipped">Enviado</option>
                <option value="delivered">Entregado</option>
                <option value="cancelled">Cancelado</option>
                <option value="ready_for_pickup">Listo para Retiro</option>
              </select>
              
              {/* Ordenamiento */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Más recientes</option>
                <option value="oldest">Más antiguos</option>
                <option value="total_high">Mayor valor</option>
                <option value="total_low">Menor valor</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de pedidos */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBagIcon className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm || statusFilter !== 'all' ? 'No se encontraron pedidos' : 'No tienes pedidos aún'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'all' 
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Cuando realices tu primer pedido, aparecerá aquí'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Link to="/catalog" className="btn-modern btn-primary">
              Explorar Productos
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order._id} className="card-modern hover-lift">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  {/* Información principal */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Pedido #{order._id.slice(-8).toUpperCase()}
                      </h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{getStatusText(order.status)}</span>
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {formatDate(order.createdAt)}
                      </div>
                      <div className="flex items-center">
                        <ShoppingBagIcon className="h-4 w-4 mr-2" />
                        {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
                      </div>
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                        {formatPrice(order.totalPrice)}
                      </div>
                    </div>
                    
                    {/* Información de envío */}
                    <div className="mt-3 text-sm text-gray-600">
                      {order.shipmentMethod === 'delivery' ? (
                        <div className="flex items-center">
                          <TruckIcon className="h-4 w-4 mr-2" />
                          Envío a domicilio
                          {order.shippingAddress && (
                            <span className="ml-2">
                              - {order.shippingAddress.city}, {order.shippingAddress.state}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <ShoppingBagIcon className="h-4 w-4 mr-2" />
                          Retiro en tienda
                          {order.pickupLocation && (
                            <span className="ml-2">- {order.pickupLocation.name}</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Método de pago */}
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Método de pago:</span>
                      {order.paymentMethod === 'webpay' && ' Webpay (Tarjeta)'}
                      {order.paymentMethod === 'bankTransfer' && ' Transferencia Bancaria'}
                      {order.paymentMethod === 'cash' && ' Efectivo (Retiro en tienda)'}
                      {order.isPaid && (
                        <span className="ml-2 inline-flex items-center text-green-600">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Pagado
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Productos */}
                  <div className="lg:w-80">
                    <div className="space-y-2">
                      {order.items.slice(0, 2).map((item, index) => (
                        <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                            {item.product?.images?.[0] ? (
                              <img
                                src={`/uploads/${item.product.images[0]}`}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <ShoppingBagIcon className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.product?.name || 'Producto no disponible'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Cantidad: {item.quantity} | {formatPrice(item.price)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-sm text-gray-500 text-center">
                          +{order.items.length - 2} producto{order.items.length - 2 > 1 ? 's' : ''} más
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex flex-col space-y-2 lg:w-32">
                    <Link
                      to={`/order/${order._id}`}
                      className="btn-modern btn-primary text-center"
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Link>
                    
                    {/* Botón de seguimiento para pedidos enviados */}
                    {order.status === 'shipped' && order.trackingNumber && (
                      <button className="btn-modern btn-secondary text-center text-xs">
                        <TruckIcon className="h-3 w-3 mr-1" />
                        Seguir Envío
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Paginación (si hay muchos pedidos en el futuro) */}
      {filteredOrders.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Mostrando {filteredOrders.length} de {orders.length} pedidos
        </div>
      )}
    </div>
  );
};

export default OrdersPage;