import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationCircleIcon,
  TruckIcon,
  HomeIcon,
  CreditCardIcon,
  BanknotesIcon,
  BuildingLibraryIcon
} from '@heroicons/react/24/outline';

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(value);
  };
  
  // Obtener orden
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/orders/${orderId}`);
        setOrder(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error al obtener la orden:', err);
        setError('No se pudo cargar la información de la orden');
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [orderId, isAuthenticated, navigate]);
  
  // Renderizar el ícono y texto según el estado
  const renderStatusInfo = () => {
    if (!order) return null;
    
    switch (order.status) {
      case 'pending':
        return {
          icon: <ClockIcon className="h-12 w-12 text-yellow-500" />,
          title: 'Pendiente',
          message: order.paymentMethod === 'mercadopago' 
            ? 'Tu pedido está pendiente de pago' 
            : 'Tu pedido ha sido recibido y está pendiente de confirmación'
        };
      case 'processing':
        return {
          icon: <CheckCircleIcon className="h-12 w-12 text-blue-500" />,
          title: 'En Proceso',
          message: 'Tu pedido ha sido confirmado y está siendo procesado'
        };
      case 'shipped':
        return {
          icon: <TruckIcon className="h-12 w-12 text-green-500" />,
          title: 'Enviado',
          message: 'Tu pedido ha sido enviado y está en camino'
        };
      case 'ready_for_pickup':
        return {
          icon: <HomeIcon className="h-12 w-12 text-green-500" />,
          title: 'Listo para Retiro',
          message: 'Tu pedido está listo para ser retirado en la tienda seleccionada'
        };
      case 'delivered':
        return {
          icon: <CheckCircleIcon className="h-12 w-12 text-green-600" />,
          title: 'Entregado',
          message: 'Tu pedido ha sido entregado con éxito'
        };
      case 'cancelled':
        return {
          icon: <ExclamationCircleIcon className="h-12 w-12 text-red-500" />,
          title: 'Cancelado',
          message: 'Tu pedido ha sido cancelado'
        };
      default:
        return {
          icon: <ClockIcon className="h-12 w-12 text-gray-500" />,
          title: 'Pendiente',
          message: 'Tu pedido está pendiente de confirmación'
        };
    }
  };
  
  // Renderizar ícono de método de pago
  const renderPaymentMethodIcon = () => {
    if (!order) return null;
    
    switch (order.paymentMethod) {
      case 'mercadopago':
        return <CreditCardIcon className="h-5 w-5 text-blue-500" />;
      case 'bankTransfer':
        return <BuildingLibraryIcon className="h-5 w-5 text-green-500" />;
      case 'cash':
        return <BanknotesIcon className="h-5 w-5 text-green-600" />;
      default:
        return <CreditCardIcon className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Renderizar texto de método de pago
  const renderPaymentMethodText = () => {
    if (!order) return '';
    
    switch (order.paymentMethod) {
      case 'mercadopago':
        return 'Mercado Pago';
      case 'bankTransfer':
        return 'Transferencia Bancaria';
      case 'cash':
        return 'Efectivo (al retirar)';
      default:
        return 'Desconocido';
    }
  };
  
  // Renderizar estado de pago
  const renderPaymentStatus = () => {
    if (!order) return null;
    
    if (order.isPaid) {
      return (
        <div className="flex items-center text-green-600">
          <CheckCircleIcon className="h-5 w-5 mr-1" />
          <span>Pagado</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-yellow-600">
          <ClockIcon className="h-5 w-5 mr-1" />
          <span>Pendiente</span>
        </div>
      );
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
        <p>{error}</p>
        <Link to="/profile" className="text-red-700 font-medium underline mt-2 inline-block">
          Volver a mi perfil
        </Link>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
        <p>No se pudo encontrar la orden especificada.</p>
        <Link to="/profile" className="text-yellow-700 font-medium underline mt-2 inline-block">
          Volver a mi perfil
        </Link>
      </div>
    );
  }
  
  const statusInfo = renderStatusInfo();
  
  return (
    <div className="py-8 max-w-4xl mx-auto">
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        {/* Cabecera de estado */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="flex flex-col md:flex-row items-center">
            {statusInfo.icon}
            <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left">
              <h1 className="text-2xl font-bold text-gray-900">
                ¡Gracias por tu compra!
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Tu pedido #{orderId.slice(-8)} está <span className="font-medium">{statusInfo.title}</span>
              </p>
              <p className="text-gray-500 mt-1">
                {statusInfo.message}
              </p>
            </div>
          </div>
        </div>
        
        {/* Resumen de la orden */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Detalles de envío */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-3">Información de Envío</h2>
              
              {order.shipmentMethod === 'delivery' ? (
                <div className="bg-gray-50 rounded-md p-4">
                  <div className="flex items-center mb-3">
                    <TruckIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="font-medium">Envío a Domicilio</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="mb-1">{order.shippingAddress.street}</p>
                    <p className="mb-1">{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                    <p className="mb-1">{order.shippingAddress.postalCode}</p>
                    <p>{order.shippingAddress.country}</p>
                    {order.shippingAddress.notes && (
                      <p className="mt-2 text-gray-500 italic">{order.shippingAddress.notes}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-md p-4">
                  <div className="flex items-center mb-3">
                    <HomeIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="font-medium">Retiro en Tienda</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="mb-1 font-medium">{order.pickupLocation.name}</p>
                    <p className="mb-1">{order.pickupLocation.address}</p>
                    {order.pickupLocation.notes && (
                      <p className="mt-2 text-gray-500 italic">{order.pickupLocation.notes}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Detalles de pago */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-3">Información de Pago</h2>
              
              <div className="bg-gray-50 rounded-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    {renderPaymentMethodIcon()}
                    <span className="font-medium ml-2">{renderPaymentMethodText()}</span>
                  </div>
                  {renderPaymentStatus()}
                </div>
                
                <div className="text-sm text-gray-600">
                  <div className="flex justify-between py-1">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(order.itemsPrice)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Impuestos (19%):</span>
                    <span>{formatCurrency(order.taxPrice)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Envío:</span>
                    <span>
                      {order.shippingPrice === 0 ? 'Gratis' : formatCurrency(order.shippingPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 mt-2 border-t border-gray-200 font-medium">
                    <span>Total:</span>
                    <span className="text-blue-600">{formatCurrency(order.totalPrice)}</span>
                  </div>
                </div>
                
                {!order.isPaid && order.paymentMethod === 'bankTransfer' && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm">
                    <h4 className="font-semibold text-blue-800 mb-2">Datos para transferencia:</h4>
                    <p className="mb-1"><span className="font-medium">Banco:</span> Banco Estado</p>
                    <p className="mb-1"><span className="font-medium">Titular:</span> AutoRepuestos SpA</p>
                    <p className="mb-1"><span className="font-medium">RUT:</span> 76.XXX.XXX-X</p>
                    <p className="mb-1"><span className="font-medium">Cuenta Corriente:</span> 123456789</p>
                    <p className="mb-1">
                      <span className="font-medium">Email:</span> pagos@autorepuestos.com
                    </p>
                    <p className="mt-2 text-xs text-blue-800">
                      Incluye el número de orden #{orderId.slice(-8)} en el comentario de la transferencia
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Productos en la orden */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Productos</h2>
            
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {item.product.images && item.product.images.length > 0 ? (
                            <img 
                              src={`/uploads/${item.product.images[0]}`} 
                              alt={item.product.name}
                              className="h-10 w-10 object-cover rounded mr-3"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/100";
                              }}
                            />
                          ) : (
                            <div className="h-10 w-10 bg-gray-200 rounded mr-3 flex items-center justify-center text-gray-500 text-xs">
                              Sin img
                            </div>
                          )}
                          <span className="text-sm text-gray-900 line-clamp-1">
                            {item.product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Acciones */}
        <div className="px-6 py-4 bg-gray-50 border-t text-center">
          <div className="space-x-4">
            <Link
              to="/profile/orders"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Ver mis pedidos
            </Link>
            <Link
              to="/catalog"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;