import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

// Esta página maneja el retorno de Mercado Pago después de un pago
const PaymentReturnPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  
  const [status, setStatus] = useState('processing'); // 'success', 'failure', 'pending', 'processing'
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Obtener parámetros de la URL
    const queryParams = new URLSearchParams(location.search);
    const paymentStatus = queryParams.get('status') || '';
    const paymentId = queryParams.get('payment_id') || '';
    const externalReference = queryParams.get('external_reference') || '';
    
    // Recuperar orderId del localStorage si está disponible
    const storedOrderId = localStorage.getItem('currentOrderId');
    const orderToUse = externalReference || storedOrderId;
    
    if (orderToUse) {
      setOrderId(orderToUse);
      
      // Validar el estado del pago con nuestro backend
      const validatePayment = async () => {
        try {
          // Intentar actualizar el estado de la orden
          await axios.get(`/api/payment/status/${orderToUse}`);
          
          // Determinar estado según la respuesta de Mercado Pago
          if (paymentStatus === 'approved') {
            setStatus('success');
            // Limpiar carrito después de un pago exitoso
            clearCart();
          } else if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
            setStatus('failure');
          } else if (paymentStatus === 'pending' || paymentStatus === 'in_process') {
            setStatus('pending');
          } else {
            setStatus('processing');
          }
          
        } catch (err) {
          console.error('Error al validar el pago:', err);
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
  }, [location.search, navigate, clearCart]);
  
  const renderContent = () => {
    switch (status) {
      case 'success':
        return (
          <div className="text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="mt-3 text-2xl font-bold text-gray-900">¡Pago exitoso!</h2>
            <p className="mt-2 text-gray-600">Tu pago ha sido procesado correctamente.</p>
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
            <h2 className="mt-3 text-2xl font-bold text-gray-900">Pago fallido</h2>
            <p className="mt-2 text-gray-600">
              {error || 'Hubo un problema con tu pago. Por favor, intenta nuevamente.'}
            </p>
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
            <p className="mt-2 text-gray-600">Por favor espera mientras verificamos el estado de tu pago...</p>
          </div>
        );
    }
  };
  
  return (
    <div className="py-12 max-w-3xl mx-auto">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default PaymentReturnPage;