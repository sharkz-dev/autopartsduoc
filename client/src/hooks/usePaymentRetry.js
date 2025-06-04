import { useState, useCallback } from 'react';
import { paymentService } from '../services/api';
import toast from 'react-hot-toast';

/**
 * Hook personalizado para manejar reintentos de pago
 * @param {string} orderId - ID de la orden
 * @returns {Object} Estado y funciones para manejar reintentos
 */
export const usePaymentRetry = (orderId) => {
  const [retryLoading, setRetryLoading] = useState(false);
  const [canRetry, setCanRetry] = useState(false);
  const [retryInfo, setRetryInfo] = useState(null);
  const [checkingRetry, setCheckingRetry] = useState(false);

  // Verificar si se puede reintentar el pago
  const checkCanRetry = useCallback(async () => {
    if (!orderId) return;

    setCheckingRetry(true);
    try {
      const response = await paymentService.canRetryPayment(orderId);
      
      if (response.data.success) {
        setCanRetry(response.data.data.canRetry);
        setRetryInfo(response.data.data);
        
        console.log('🔍 Información de reintento:', response.data.data);
      }
    } catch (error) {
      console.error('Error al verificar reintento:', error);
      setCanRetry(false);
    } finally {
      setCheckingRetry(false);
    }
  }, [orderId]);

  // Reintentar pago
  const retryPayment = useCallback(async () => {
    if (!orderId) {
      toast.error('No se puede reintentar el pago sin información de la orden');
      return false;
    }

    setRetryLoading(true);
    try {
      console.log('🔄 Iniciando reintento de pago para orden:', orderId);
      
      // Intentar crear nueva transacción usando el endpoint de reintento
      const response = await paymentService.retryPayment(orderId);
      
      if (response.data.success) {
        console.log('✅ Nueva transacción creada:', response.data.data);
        
        // Redirigir a Webpay con el nuevo token
        const webpayUrl = `${response.data.data.url}?token_ws=${response.data.data.token}`;
        
        // Guardar ID de orden en localStorage para recuperarla después del pago
        localStorage.setItem('currentOrderId', orderId);
        
        // Mostrar mensaje de éxito antes de redirigir
        toast.success('Redirigiendo a Webpay...');
        
        // Redirigir después de un breve delay
        setTimeout(() => {
          window.location.href = webpayUrl;
        }, 1000);
        
        return true;
      } else {
        throw new Error('No se pudo crear la nueva transacción de pago');
      }
    } catch (error) {
      console.error('Error al reintentar pago:', error);
      
      let errorMessage = 'Error al reintentar el pago. Intenta de nuevo más tarde.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 400) {
        errorMessage = 'No se puede reintentar este pago en este momento';
      } else if (error.response?.status === 401) {
        errorMessage = 'No tienes permisos para realizar esta acción';
      } else if (error.response?.status === 404) {
        errorMessage = 'Orden no encontrada';
      }
      
      toast.error(errorMessage);
      return false;
    } finally {
      setRetryLoading(false);
    }
  }, [orderId]);

  // Cancelar pago pendiente
  const cancelPendingPayment = useCallback(async () => {
    if (!orderId) {
      toast.error('No se puede cancelar sin información de la orden');
      return false;
    }

    try {
      console.log('❌ Cancelando pago pendiente para orden:', orderId);
      
      const response = await paymentService.cancelPendingPayment(orderId);
      
      if (response.data.success) {
        toast.success('Pago pendiente cancelado exitosamente');
        setCanRetry(false);
        return true;
      } else {
        throw new Error('No se pudo cancelar el pago pendiente');
      }
    } catch (error) {
      console.error('Error al cancelar pago pendiente:', error);
      
      const errorMessage = error.response?.data?.error || 
                          'Error al cancelar el pago pendiente';
      toast.error(errorMessage);
      return false;
    }
  }, [orderId]);

  // Obtener historial de pagos
  const getPaymentHistory = useCallback(async () => {
    if (!orderId) return null;

    try {
      console.log('📋 Obteniendo historial de pagos para orden:', orderId);
      
      const response = await paymentService.getPaymentHistory(orderId);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error al obtener historial de pagos:', error);
      return null;
    }
  }, [orderId]);

  return {
    // Estados
    retryLoading,
    canRetry,
    retryInfo,
    checkingRetry,
    
    // Funciones
    checkCanRetry,
    retryPayment,
    cancelPendingPayment,
    getPaymentHistory,
    
    // Información útil
    retryCount: retryInfo?.retryCount || 0,
    maxRetries: retryInfo?.maxRetries || 5,
    remainingRetries: retryInfo?.remainingRetries || 0,
    isPaid: retryInfo?.isPaid || false,
    orderStatus: retryInfo?.status,
    paymentMethod: retryInfo?.paymentMethod
  };
};

export default usePaymentRetry;