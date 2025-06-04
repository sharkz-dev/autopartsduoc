import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { orderService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import OrderStatusTracker from '../../components/common/OrderStatusTracker'; // Importar el nuevo componente
import api from '../../services/api'; // ✅ AGREGADO: Para manejar pagos
import { 
  ArrowLeftIcon,
  ShoppingBagIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MapPinIcon,
  CreditCardIcon,
  DocumentTextIcon,
  PrinterIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const OrderDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false); // ✅ NUEVO: Estado para procesar pago
  
  useEffect(() => {
    fetchOrderDetails();
  }, [id]);
  
  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await orderService.getOrder(id);
      console.log('Detalles de orden cargados:', response.data);
      setOrder(response.data.data);
    } catch (err) {
      console.error('Error al cargar detalles de orden:', err);
      if (err.response?.status === 404) {
        setError('Pedido no encontrado');
      } else if (err.response?.status === 401) {
        setError('No tienes permiso para ver este pedido');
      } else {
        setError('Error al cargar los detalles del pedido');
      }
      toast.error('Error al cargar el pedido');
    } finally {
      setLoading(false);
    }
  };
  
  // ✅ NUEVA FUNCIÓN: Procesar pago pendiente
  const handlePayNow = async () => {
    if (!order || order.paymentMethod !== 'webpay') {
      console.error('❌ No se puede procesar pago para esta orden');
      return;
    }

    setProcessingPayment(true);
    
    try {
      console.log('💳 Iniciando pago para orden:', order._id);
      
      // Crear nueva transacción de pago
      const response = await api.post(`/payment/create-transaction/${order._id}`);
      const transactionData = response.data.data;
      
      console.log('✅ Transacción creada:', transactionData);
      
      // Guardar ID de orden en localStorage para recuperarla después del pago
      localStorage.setItem('currentOrderId', order._id);
      
      // Redirigir a Webpay
      window.location.href = `${transactionData.url}?token_ws=${transactionData.token}`;
      
    } catch (error) {
      console.error('❌ Error al procesar pago:', error);
      
      const errorMessage = error.response?.data?.error || 'Error al procesar el pago';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessingPayment(false);
    }
  };
  
  // Función para imprimir el pedido
  const handlePrint = () => {
    window.print();
  };
  
  // Obtener icono según el estado
  const getStatusIcon = (status, size = 'h-6 w-6') => {
    const iconClass = `${size}`;
    switch (status) {
      case 'pending':
        return <ClockIcon className={`${iconClass} text-yellow-500`} />;
      case 'processing':
        return <DocumentTextIcon className={`${iconClass} text-blue-500`} />;
      case 'shipped':
        return <TruckIcon className={`${iconClass} text-purple-500`} />;
      case 'delivered':
        return <CheckCircleIcon className={`${iconClass} text-green-500`} />;
      case 'cancelled':
        return <XCircleIcon className={`${iconClass} text-red-500`} />;
      case 'ready_for_pickup':
        return <ShoppingBagIcon className={`${iconClass} text-green-500`} />;
      default:
        return <ClockIcon className={`${iconClass} text-gray-500`} />;
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
  
  // Obtener descripción del estado
  const getStatusDescription = (status) => {
    switch (status) {
      case 'pending':
        return 'Tu pedido ha sido recibido y está siendo verificado';
      case 'processing':
        return 'Tu pedido está siendo preparado';
      case 'shipped':
        return 'Tu pedido ha sido enviado y está en camino';
      case 'delivered':
        return 'Tu pedido ha sido entregado exitosamente';
      case 'cancelled':
        return 'Este pedido ha sido cancelado';
      case 'ready_for_pickup':
        return 'Tu pedido está listo para ser retirado en tienda';
      default:
        return '';
    }
  };
  
  // Obtener color del estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ready_for_pickup':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
      month: 'long',
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
          <p className="text-gray-600">Cargando detalles del pedido...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{error}</h2>
          <div className="space-x-4">
            <button
              onClick={() => navigate('/orders')}
              className="btn-modern btn-secondary"
            >
              Volver a Mis Pedidos
            </button>
            <button
              onClick={fetchOrderDetails}
              className="btn-modern btn-primary"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Pedido no encontrado</h2>
          <button
            onClick={() => navigate('/orders')}
            className="btn-modern btn-primary"
          >
            Volver a Mis Pedidos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header con navegación */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Volver a Mis Pedidos
        </button>
        
        <div className="flex space-x-3">
          <button
            onClick={handlePrint}
            className="btn-modern btn-secondary flex items-center"
          >
            <PrinterIcon className="h-4 w-4 mr-2" />
            Imprimir
          </button>
          <Link
            to="/contact"
            className="btn-modern btn-secondary flex items-center"
          >
            <EnvelopeIcon className="h-4 w-4 mr-2" />
            Contactar Soporte
          </Link>
        </div>
      </div>

      {/* Información principal del pedido */}
      <div className="card-modern">
        <div className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Pedido #{order._id.slice(-8).toUpperCase()}
              </h1>
              <p className="text-gray-600 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Realizado el {formatDate(order.createdAt)}
              </p>
            </div>
            
            <div className="mt-4 lg:mt-0">
              <div className={`inline-flex items-center px-6 py-3 rounded-xl border-2 ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <div className="ml-3">
                  <div className="font-semibold">{getStatusText(order.status)}</div>
                  <div className="text-sm opacity-75">{getStatusDescription(order.status)}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Resumen del pedido */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center mb-2">
                <ShoppingBagIcon className="h-5 w-5 text-gray-600 mr-2" />
                <span className="font-medium text-gray-900">Productos</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{order.items.length}</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center mb-2">
                <CurrencyDollarIcon className="h-5 w-5 text-gray-600 mr-2" />
                <span className="font-medium text-gray-900">Total</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(order.totalPrice)}</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center mb-2">
                <CreditCardIcon className="h-5 w-5 text-gray-600 mr-2" />
                <span className="font-medium text-gray-900">Pago</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {order.isPaid ? (
                  <span className="text-green-600 flex items-center">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Pagado
                  </span>
                ) : (
                  <span className="text-yellow-600 flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    Pendiente
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {/* Información de envío/retiro */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              {order.shipmentMethod === 'delivery' ? (
                <>
                  <TruckIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Información de Envío
                </>
              ) : (
                <>
                  <ShoppingBagIcon className="h-5 w-5 mr-2 text-green-600" />
                  Información de Retiro
                </>
              )}
            </h3>
            
            {order.shipmentMethod === 'delivery' && order.shippingAddress ? (
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Dirección de entrega:</p>
                    <p className="text-gray-600 mt-1">
                      {order.shippingAddress.street}<br />
                      {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                      {order.shippingAddress.country} {order.shippingAddress.postalCode}
                    </p>
                    {order.shippingAddress.notes && (
                      <p className="text-gray-600 mt-2">
                        <span className="font-medium">Notas:</span> {order.shippingAddress.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : order.pickupLocation && (
              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-start">
                  <ShoppingBagIcon className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Lugar de retiro:</p>
                    <p className="text-gray-600 mt-1">
                      <span className="font-medium">{order.pickupLocation.name}</span><br />
                      {order.pickupLocation.address}
                    </p>
                    {order.pickupLocation.notes && (
                      <p className="text-gray-600 mt-2">
                        <span className="font-medium">Notas:</span> {order.pickupLocation.notes}
                      </p>
                    )}
                    {order.status === 'ready_for_pickup' && (
                      <div className="mt-3 p-3 bg-green-100 rounded-lg">
                        <p className="text-green-800 font-medium flex items-center">
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          ¡Tu pedido está listo para retiro!
                        </p>
                        <p className="text-green-700 text-sm mt-1">
                          Puedes retirar tu pedido en el horario de atención de la tienda.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Productos del pedido */}
      <div className="card-modern">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Productos del Pedido</h2>
          
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                {/* Imagen del producto */}
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  {item.product?.images?.[0] ? (
                    <img
                      src={`/uploads/${item.product.images[0]}`}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <ShoppingBagIcon className="h-8 w-8 text-gray-400" style={{display: item.product?.images?.[0] ? 'none' : 'block'}} />
                </div>
                
                {/* Información del producto */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {item.product?.name || 'Producto no disponible'}
                  </h3>
                  {item.product?.brand && (
                    <p className="text-sm text-gray-600">Marca: {item.product.brand}</p>
                  )}
                  {item.product?.sku && (
                    <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                  )}
                  {item.product?.category?.name && (
                    <p className="text-sm text-gray-500">Categoría: {item.product.category.name}</p>
                  )}
                </div>
                
                {/* Cantidad y precio */}
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {item.quantity} × {formatPrice(item.price)}
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatPrice(item.quantity * item.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen de costos */}
      <div className="card-modern">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Resumen de Costos</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({order.items.length} productos)</span>
              <span>{formatPrice(order.itemsPrice)}</span>
            </div>
            
            <div className="flex justify-between text-gray-600">
              <span>IVA ({order.taxRate || 19}%)</span>
              <span>{formatPrice(order.taxPrice)}</span>
            </div>
            
            <div className="flex justify-between text-gray-600">
              <span>Envío</span>
              <span>
                {order.shippingPrice === 0 ? (
                  <span className="text-green-600 font-medium">Gratis</span>
                ) : (
                  formatPrice(order.shippingPrice)
                )}
              </span>
            </div>
            
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(order.totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información de pago */}
      <div className="card-modern">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <CreditCardIcon className="h-6 w-6 mr-2 text-green-600" />
            Información de Pago
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Método de pago */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Método de Pago</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {order.paymentMethod === 'webpay' && (
                  <div className="flex items-center">
                    <CreditCardIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <span>Webpay Plus (Tarjeta)</span>
                  </div>
                )}
                {order.paymentMethod === 'bankTransfer' && (
                  <div className="flex items-center">
                    <CreditCardIcon className="h-5 w-5 text-green-600 mr-2" />
                    <span>Transferencia Bancaria</span>
                  </div>
                )}
                {order.paymentMethod === 'cash' && (
                  <div className="flex items-center">
                    <CreditCardIcon className="h-5 w-5 text-yellow-600 mr-2" />
                    <span>Efectivo (Retiro en tienda)</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Estado del pago */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Estado del Pago</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {order.isPaid ? (
                  <div>
                    <div className="flex items-center text-green-600 font-medium mb-2">
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      <span>Pago Confirmado</span>
                    </div>
                    {order.paidAt && (
                      <p className="text-sm text-gray-600">
                        Pagado el {formatDate(order.paidAt)}
                      </p>
                    )}
                    {order.paymentResult?.authorizationCode && (
                      <p className="text-xs text-gray-500 mt-1">
                        Código de autorización: {order.paymentResult.authorizationCode}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center text-yellow-600 font-medium mb-2">
                      <ClockIcon className="h-5 w-5 mr-2" />
                      <span>Pago Pendiente</span>
                    </div>
                    {order.paymentMethod === 'bankTransfer' && (
                      <p className="text-sm text-gray-600">
                        Esperando confirmación de transferencia
                      </p>
                    )}
                    {order.paymentMethod === 'cash' && (
                      <p className="text-sm text-gray-600">
                        Se pagará al momento del retiro
                      </p>
                    )}
                    {order.paymentMethod === 'webpay' && (
                      <p className="text-sm text-gray-600">
                        El pago con Webpay no se ha completado
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* ✅ NUEVA SECCIÓN: Botón de pago para órdenes pendientes con Webpay */}
          {!order.isPaid && order.paymentMethod === 'webpay' && order.status === 'pending' && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                <CreditCardIcon className="h-5 w-5 mr-2" />
                Completar Pago Pendiente
              </h4>
              <p className="text-yellow-700 text-sm mb-4">
                Tu pedido está esperando el pago. Puedes completar el pago ahora con Webpay para que procesemos tu orden.
              </p>
              <button
                onClick={handlePayNow}
                disabled={processingPayment}
                className={`w-full flex items-center justify-center px-4 py-3 rounded-md font-medium transition-colors ${
                  processingPayment
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {processingPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                    Procesando pago...
                  </>
                ) : (
                  <>
                    <CreditCardIcon className="h-4 w-4 mr-2" />
                    Pagar Ahora con Webpay
                  </>
                )}
              </button>
            </div>
          )}
          
          {/* Información adicional de pago */}
          {order.paymentResult && order.paymentResult.cardDetail && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Detalles de la Transacción</h4>
              <div className="text-sm text-gray-600 space-y-1">
                {order.paymentResult.cardDetail.card_number && (
                  <p>Tarjeta terminada en: ****{order.paymentResult.cardDetail.card_number}</p>
                )}
                {order.paymentResult.installments && (
                  <p>Cuotas: {order.paymentResult.installments}</p>
                )}
                {order.paymentResult.id && (
                  <p>ID de transacción: {order.paymentResult.id}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Seguimiento del pedido - NUEVO COMPONENTE */}
      <OrderStatusTracker 
        currentStatus={order.status}
        shipmentMethod={order.shipmentMethod}
        createdAt={order.createdAt}
        paidAt={order.paidAt}
        deliveredAt={order.deliveredAt}
      />

      {/* Historial de estados (si está disponible) - SIMPLIFICADO */}
      <div className="card-modern">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Información Adicional</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fechas importantes */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Fechas Importantes</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pedido realizado:</span>
                  <span className="font-medium">{formatDate(order.createdAt)}</span>
                </div>
                {order.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pago confirmado:</span>
                    <span className="font-medium">{formatDate(order.paidAt)}</span>
                  </div>
                )}
                {order.deliveredAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {order.shipmentMethod === 'delivery' ? 'Entregado:' : 'Retirado:'}
                    </span>
                    <span className="font-medium">{formatDate(order.deliveredAt)}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Información del pedido */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Detalles del Pedido</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID del pedido:</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {order._id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo de pedido:</span>
                  <span className="font-medium">
                    {order.orderType === 'B2B' ? 'Mayorista' : 'Minorista'}
                  </span>
                </div>
                {order.taxRate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">IVA aplicado:</span>
                    <span className="font-medium">{order.taxRate}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información de contacto */}
      {(order.status === 'shipped' || order.status === 'ready_for_pickup') && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start">
            <InformationCircleIcon className="h-6 w-6 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">¿Necesitas ayuda?</h3>
              <p className="text-blue-800 mb-3">
                Si tienes alguna pregunta sobre tu pedido o necesitas asistencia, no dudes en contactarnos.
              </p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <Link
                  to="/contact"
                  className="inline-flex items-center text-blue-700 hover:text-blue-900 font-medium"
                >
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  Enviar mensaje
                </Link>
                <a
                  href="tel:+56223456789"
                  className="inline-flex items-center text-blue-700 hover:text-blue-900 font-medium"
                >
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  Llamar soporte
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Acciones del pedido */}
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 print:hidden">
        <Link
          to="/orders"
          className="btn-modern btn-secondary flex items-center"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Volver a Mis Pedidos
        </Link>
        
        <div className="flex space-x-3">
          {order.status === 'delivered' && (
            <Link
              to={`/catalog`}
              className="btn-modern btn-primary"
            >
              Comprar de nuevo
            </Link>
          )}
          
          {/* ✅ BOTÓN ACTUALIZADO: Solo para Webpay y estado pendiente */}
          {order.status === 'pending' && !order.isPaid && order.paymentMethod === 'webpay' && (
            <button 
              onClick={handlePayNow}
              disabled={processingPayment}
              className={`btn-modern ${processingPayment ? 'btn-disabled' : 'btn-accent'}`}
            >
              {processingPayment ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <CreditCardIcon className="h-4 w-4 mr-2" />
                  Completar Pago
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;