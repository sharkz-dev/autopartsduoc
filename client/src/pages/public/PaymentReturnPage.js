import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import api from '../../services/api'; // ✅ AGREGADO: Para consistencia con OrderDetailsPage
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

const PaymentReturnPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  
  const [status, setStatus] = useState('processing');
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [canRetry, setCanRetry] = useState(false);
  
  useEffect(() => {
    const validatePayment = async () => {
      try {
        const queryParams = new URLSearchParams(location.search);
        const orderIdParam = queryParams.get('order') || '';
        const tokenParam = queryParams.get('token') || '';
        const errorParam = queryParams.get('error') || '';
        const codeParam = queryParams.get('code') || '';
        const buyOrderParam = queryParams.get('buyOrder') || '';
        const retryParam = queryParams.get('retry') || '';
        
        const storedOrderId = localStorage.getItem('currentOrderId');
        
        // ✅ MANEJO MEJORADO DE ERRORES ESPECÍFICOS
        if (errorParam) {
  
          setStatus('failure');
          
          switch (errorParam) {
            case 'no_token':
              setError(`No se recibió el token de transacción desde Webpay. 
                ${buyOrderParam ? `BuyOrder: ${buyOrderParam}` : ''} 
                ${tokenParam ? `Token recibido: ${tokenParam}` : 'No se recibió token'}`);
              break;
            case 'order_not_found':
              setError(`No se pudo encontrar la orden asociada al pago. 
                ${buyOrderParam ? `BuyOrder: ${buyOrderParam}` : ''} 
                ${orderIdParam ? `OrderId: ${orderIdParam}` : ''}`);
              break;
            case 'processing_error':
              setError('Error al procesar la respuesta de Webpay');
              break;
            case 'system_error':
              setError('Error del sistema. Por favor contacte soporte');
              break;
            default:
              setError(`Error desconocido: ${errorParam}`);
          }
          
          // ✅ Si tenemos orderIdParam del error, intentar usarlo
          if (orderIdParam) {
            setOrderId(orderIdParam);
            setCanRetry(true); // Permitir reintento si tenemos orderId
          } else if (storedOrderId) {
            setOrderId(storedOrderId);
            setCanRetry(true);
          }
          
          localStorage.removeItem('currentOrderId');
          return;
        }
        
        // ✅ DETERMINAR ORDERID CON PRIORIDAD
        let finalOrderId = null;
        
        if (orderIdParam) {
          finalOrderId = orderIdParam;
    
        } else if (storedOrderId) {
          finalOrderId = storedOrderId;
    
        } else {
          setError('No se pudo identificar la orden. Por favor verifica tu pedido en "Mis Órdenes".');
          setStatus('failure');
          return;
        }
        
        setOrderId(finalOrderId);
        
        // ✅ CONSULTAR ESTADO DE LA ORDEN
     
        
        try {
          const response = await axios.get(`/api/payment/status/${finalOrderId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          const paymentData = response.data.data;
         
          
          setPaymentDetails(paymentData);
          setCanRetry(paymentData.canRetryPayment || false);
          
          // ✅ DETERMINAR ESTADO FINAL
          if (paymentData.isPaid && paymentData.paymentResult?.status === 'approved') {
         
            setStatus('success');
            clearCart();
          } else if (paymentData.paymentResult?.status === 'rejected') {
         
            setStatus('failure');
            setCanRetry(true); // ✅ NUEVO: Permitir reintento en caso de rechazo
            
            if (paymentData.paymentResult.responseCode) {
              setError(`Pago rechazado por el banco. Código: ${paymentData.paymentResult.responseCode}`);
            } else {
              setError('El pago fue rechazado por el banco');
            }
          } else if (paymentData.paymentResult?.status === 'pending') {
         
            setStatus('pending');
          } else {

            
            // Si tenemos código de error de la URL, usarlo
            if (codeParam && codeParam !== '0') {
              setStatus('failure');
              setCanRetry(true); // ✅ NUEVO: Permitir reintento en caso de código de error
              setError(`Pago rechazado. Código de respuesta: ${codeParam}`);
            } else {
              setStatus('processing');
            }
          }
          
        } catch (apiError) {
          
          if (apiError.response?.status === 404) {
            setError(`La orden no fue encontrada en el sistema. OrderId: ${finalOrderId}`);
          } else if (apiError.response?.status === 401) {
            setError('No autorizado para consultar esta orden. Inicia sesión nuevamente.');
          } else {
            setError(`Error al verificar el estado del pago: ${apiError.message}`);
          }
          setStatus('failure');
        }
        
      } catch (generalError) {
        setError('Error inesperado al procesar el pago');
        setStatus('failure');
      } finally {
        localStorage.removeItem('currentOrderId');
      }
    };
    
    validatePayment();
  }, [location.search, clearCart]);

  // ✅ FUNCIÓN ACTUALIZADA: Reintentar pago con la misma estructura que OrderDetailsPage
  const handleRetryPayment = async () => {
    if (!orderId || isRetrying) return;
    
    setIsRetrying(true);
    
    try {

      // ✅ USANDO API SERVICE COMO EN OrderDetailsPage
      const response = await api.post(`/payment/create-transaction/${orderId}`);
      const transactionData = response.data.data;
      
    
      
      // Guardar el orderId en localStorage para el retorno
      localStorage.setItem('currentOrderId', orderId);
      
      // ✅ REDIRIGIR IGUAL QUE EN OrderDetailsPage
      window.location.href = `${transactionData.url}?token_ws=${transactionData.token}`;
      
    } catch (retryError) {
   
      
      const errorMessage = retryError.response?.data?.error || 'Error al procesar el pago';
      setError(`Error al reintentar el pago: ${errorMessage}`);
    } finally {
      setIsRetrying(false);
    }
  };
  
  const renderContent = () => {
    switch (status) {
      case 'success':
        return (
          <div className="text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="mt-3 text-2xl font-bold text-gray-900">¡Pago exitoso!</h2>
            <p className="mt-2 text-gray-600">Tu pago ha sido procesado correctamente con Webpay.</p>
            
            {paymentDetails?.paymentResult && (
              <div className="mt-4 bg-green-50 rounded-lg p-4 text-sm text-left max-w-md mx-auto">
                <h3 className="font-semibold text-green-800 mb-2">Detalles del pago:</h3>
                <div className="space-y-1 text-green-700">
                  {paymentDetails.paymentResult.authorizationCode && (
                    <p><span className="font-medium">Código de autorización:</span> {paymentDetails.paymentResult.authorizationCode}</p>
                  )}
                  {paymentDetails.paymentResult.amount && (
                    <p><span className="font-medium">Monto:</span> ${paymentDetails.paymentResult.amount.toLocaleString()}</p>
                  )}
                  {paymentDetails.paymentResult.cardDetail && (
                    <p><span className="font-medium">Tarjeta:</span> **** {paymentDetails.paymentResult.cardDetail.card_number}</p>
                  )}
                  {paymentDetails.paymentResult.installments > 1 && (
                    <p><span className="font-medium">Cuotas:</span> {paymentDetails.paymentResult.installments}</p>
                  )}
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <Link
                to={`/order-confirmation/${orderId}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Ver detalles de la orden
              </Link>
            </div>
          </div>
        );
        
      case 'failure':
        return (
          <div className="text-center">
            <ExclamationCircleIcon className="h-16 w-16 text-red-500 mx-auto" />
            <h2 className="mt-3 text-2xl font-bold text-gray-900">Pago no procesado</h2>
            <p className="mt-2 text-gray-600 max-w-md mx-auto">
              {error || 'Hubo un problema con tu pago. Por favor, intenta nuevamente.'}
            </p>
            
            {/* Información de debugging para el usuario */}
            {orderId && (
              <div className="mt-4 bg-blue-50 rounded-lg p-4 text-sm max-w-md mx-auto">
                <p className="text-blue-700">
                  <span className="font-medium">Número de orden:</span> {orderId}
                </p>
                <p className="text-blue-600 text-xs mt-2">
                  Puedes consultar el estado de tu orden en "Mis Pedidos" usando este número.
                </p>
              </div>
            )}

            {paymentDetails?.paymentResult?.responseCode && (
              <div className="mt-4 bg-red-50 rounded-lg p-4 text-sm max-w-md mx-auto">
                <p className="text-red-700">
                  <span className="font-medium">Código de respuesta:</span> {paymentDetails.paymentResult.responseCode}
                </p>
                <p className="text-red-600 text-xs mt-2">
                  Si el problema persiste, contacta a tu banco o prueba con otra tarjeta.
                </p>
              </div>
            )}
            
            <div className="mt-6 space-y-4 flex flex-col items-center">
              {/* ✅ BOTÓN DE REINTENTO MEJORADO - Igual que en OrderDetailsPage */}
              {canRetry && (
                <button
                  onClick={handleRetryPayment}
                  disabled={isRetrying}
                  className={`w-full max-w-md flex items-center justify-center px-6 py-3 rounded-md font-medium transition-colors ${
                    isRetrying
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  {isRetrying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                      Procesando pago...
                    </>
                  ) : (
                    <>
                      <CreditCardIcon className="h-4 w-4 mr-2" />
                      Reintentar Pago
                    </>
                  )}
                </button>
              )}
              
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <Link
                  to="/cart"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Volver al carrito
                </Link>
                
                {orderId && (
                  <Link
                    to={`/order-confirmation/${orderId}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Ver detalles de la orden
                  </Link>
                )}
              </div>
              
              <Link
                to="/orders"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Ver mis pedidos
              </Link>
            </div>

            {/* ✅ INFORMACIÓN MEJORADA SOBRE EL REINTENTO - Igual que en OrderDetailsPage */}
            {canRetry && (
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center mb-3">
                  <CreditCardIcon className="h-5 w-5 text-yellow-600 mr-2" />
                  <h4 className="text-sm font-medium text-yellow-800">¿Qué puedes hacer?</h4>
                </div>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Verifica que tu tarjeta tenga fondos suficientes</li>
                  <li>• Asegúrate de que tu tarjeta esté habilitada para compras online</li>
                  <li>• Intenta con una tarjeta diferente</li>
                  <li>• Contacta a tu banco si el problema persiste</li>
                </ul>
                <div className="mt-3 p-3 bg-yellow-100 rounded-lg">
                  <p className="text-yellow-800 text-sm font-medium">
                    💡 Tu pedido se mantiene reservado. Solo necesitas completar el pago.
                  </p>
                </div>
              </div>
            )}
          </div>
        );
        
      case 'pending':
        return (
          <div className="text-center">
            <ClockIcon className="h-16 w-16 text-yellow-500 mx-auto" />
            <h2 className="mt-3 text-2xl font-bold text-gray-900">Pago pendiente</h2>
            <p className="mt-2 text-gray-600">
              Tu pago está siendo procesado. Recibirás una notificación una vez confirmado.
            </p>
            
            <div className="mt-4 bg-yellow-50 rounded-lg p-4 text-sm max-w-md mx-auto">
              <p className="text-yellow-700">
                Este estado es temporal. El pago será confirmado o rechazado en los próximos minutos.
              </p>
              {orderId && (
                <p className="text-yellow-600 text-xs mt-2">
                  Número de orden: {orderId}
                </p>
              )}
            </div>
            
            <div className="mt-6 space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
              >
                Actualizar estado
              </button>
              {orderId && (
                <Link
                  to={`/order-confirmation/${orderId}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Ver detalles de la orden
                </Link>
              )}
            </div>
          </div>
        );
        
      default: // processing
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <h2 className="mt-3 text-xl font-medium text-gray-800">Procesando tu pago</h2>
            <p className="mt-2 text-gray-600">Por favor espera mientras verificamos el estado de tu pago con Webpay...</p>
            
            <div className="mt-4 bg-blue-50 rounded-lg p-4 text-sm max-w-md mx-auto">
              <p className="text-blue-700">
                No cierres esta ventana ni presiones el botón atrás del navegador.
              </p>
              {orderId && (
                <p className="text-blue-600 text-xs mt-2">
                  Procesando orden: {orderId}
                </p>
              )}
            </div>
            
            {/* Auto-refresh después de 10 segundos */}
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-blue-600 hover:text-blue-500 underline"
              >
                Actualizar manualmente
              </button>
            </div>
          </div>
        );
    }
  };
  
  // ✅ Auto-refresh para estado de procesamiento
  useEffect(() => {
    if (status === 'processing' && orderId) {
      const timeout = setTimeout(() => {
     
        window.location.reload();
      }, 15000);
      
      return () => clearTimeout(timeout);
    }
  }, [status, orderId]);
  
  return (
    <div className="py-12 max-w-3xl mx-auto">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-8">
          {renderContent()}
          
          {/* Información adicional sobre Webpay */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <span>Pago procesado por</span>
              <div className="flex items-center space-x-2">
                <img 
                  src="/images/webpay-logo.png" 
                  alt="Webpay" 
                  className="h-6"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <span className="font-medium">Webpay Plus</span>
              </div>
              <span>•</span>
              <span>Transbank</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentReturnPage;