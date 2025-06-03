import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

// Esta página maneja el retorno de Webpay después de un pago
const PaymentReturnPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  
  const [status, setStatus] = useState('processing'); // 'success', 'failure', 'pending', 'processing'
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(null);
  
  useEffect(() => {
    // Obtener parámetros de la URL
    const queryParams = new URLSearchParams(location.search);
    const orderIdParam = queryParams.get('order') || '';
    const tokenParam = queryParams.get('token') || '';
    const errorParam = queryParams.get('error') || '';
    const codeParam = queryParams.get('code') || '';
    
    // Recuperar orderId del localStorage si está disponible
    const storedOrderId = localStorage.getItem('currentOrderId');
    const orderToUse = orderIdParam || storedOrderId;
    
    console.log('🔄 Procesando retorno de Webpay:', {
      orderIdParam,
      tokenParam,
      errorParam,
      codeParam,
      storedOrderId
    });
    
    if (orderToUse) {
      setOrderId(orderToUse);
      
      // Validar el estado del pago con nuestro backend
      const validatePayment = async () => {
        try {
          // Obtener el estado actual de la orden
          const response = await axios.get(`/api/payment/status/${orderToUse}`);
          const paymentData = response.data.data;
          
          console.log('📊 Estado del pago:', paymentData);
          setPaymentDetails(paymentData);
          
          // Determinar estado según la respuesta
          if (paymentData.isPaid && paymentData.paymentResult?.status === 'approved') {
            setStatus('success');
            // Limpiar carrito después de un pago exitoso
            clearCart();
          } else if (paymentData.paymentResult?.status === 'rejected') {
            setStatus('failure');
            // Mostrar código de error si está disponible
            if (paymentData.paymentResult.responseCode) {
              setError(`Pago rechazado. Código: ${paymentData.paymentResult.responseCode}`);
            }
          } else if (paymentData.paymentResult?.status === 'pending') {
            setStatus('pending');
          } else if (errorParam) {
            // Manejar errores específicos desde la URL
            setStatus('failure');
            switch (errorParam) {
              case 'no_token':
                setError('No se recibió el token de transacción desde Webpay');
                break;
              case 'order_not_found':
                setError('No se pudo encontrar la orden asociada al pago');
                break;
              case 'processing_error':
                setError('Error al procesar la respuesta de Webpay');
                break;
              case 'system_error':
                setError('Error del sistema. Por favor contacte soporte');
                break;
              default:
                setError('Error desconocido en el procesamiento del pago');
            }
          } else {
            setStatus('processing');
          }
          
        } catch (err) {
          console.error('❌ Error al validar el pago:', err);
          setError('Hubo un problema al verificar el estado del pago.');
          setStatus('failure');
        } finally {
          // Limpiar orden del localStorage
          localStorage.removeItem('currentOrderId');
        }
      };
      
      validatePayment();
    } else {
      setError('No se pudo identificar la orden');
      setStatus('failure');
    }
  }, [location.search, clearCart]);
  
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
            <p className="mt-2 text-gray-600">
              {error || 'Hubo un problema con tu pago. Por favor, intenta nuevamente.'}
            </p>
            
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
            
            <div className="mt-6 space-x-4">
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
            </div>
            
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
            </div>
          </div>
        );
    }
  };
  
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