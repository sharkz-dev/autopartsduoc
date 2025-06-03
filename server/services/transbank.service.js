const { WebpayPlus, Environment, IntegrationCommerceCodes, IntegrationApiKeys } = require('transbank-sdk');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Configuración de Transbank según el entorno
 */
const getTransbankConfig = () => {
  const environment = process.env.TRANSBANK_ENVIRONMENT || 'integration';
  
  if (environment === 'production') {
    return {
      commerceCode: process.env.TRANSBANK_COMMERCE_CODE,
      apiKey: process.env.TRANSBANK_API_KEY,
      environment: Environment.Production
    };
  } else {
    // Configuración de integración/testing
    return {
      commerceCode: IntegrationCommerceCodes.WEBPAY_PLUS,
      apiKey: IntegrationApiKeys.WEBPAY,
      environment: Environment.Integration
    };
  }
};

// Configurar cliente de Webpay
const config = getTransbankConfig();
const tx = new WebpayPlus.Transaction({
  commerceCode: config.commerceCode,
  apiKey: config.apiKey,
  environment: config.environment
});

console.log(`🏪 Transbank configurado en modo: ${process.env.TRANSBANK_ENVIRONMENT || 'integration'}`);

/**
 * Crea una transacción de pago en Webpay
 * @param {Object} orderData - Datos de la orden
 * @returns {Promise<Object>} - Respuesta de Webpay con token y URL
 */
exports.createPaymentTransaction = async (orderData) => {
  try {
    console.log('💳 Creando transacción Webpay para orden:', orderData._id);
    
    // Validar datos esenciales
    if (!orderData || !orderData._id || !orderData.totalPrice) {
      throw new Error('Datos de orden incompletos para crear transacción');
    }

    // Preparar datos para Transbank
    const buyOrder = `ORDER_${orderData._id}_${Date.now()}`;
    const sessionId = `SESSION_${orderData.user._id}_${Date.now()}`;
    const amount = Math.round(orderData.totalPrice); // Transbank requiere enteros
    const returnUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/payment/webpay/return`;

    console.log('📊 Datos de transacción Webpay:', {
      buyOrder,
      sessionId,
      amount,
      returnUrl
    });

    // Crear transacción en Transbank
    const response = await tx.create(buyOrder, sessionId, amount, returnUrl);
    
    console.log('✅ Transacción Webpay creada:', {
      token: response.token,
      url: response.url
    });

    return {
      token: response.token,
      url: response.url,
      buyOrder,
      sessionId,
      amount
    };
  } catch (error) {
    console.error('❌ Error al crear transacción Webpay:', error);
    
    // Proporcionar más detalles del error si está disponible
    if (error.response) {
      console.error('📋 Detalles del error de Transbank:', error.response);
    }
    
    throw new Error(`No se pudo crear la transacción de pago: ${error.message}`);
  }
};

/**
 * Confirma una transacción de pago en Webpay
 * @param {string} token - Token de la transacción
 * @returns {Promise<Object>} - Información de la transacción confirmada
 */
exports.confirmPaymentTransaction = async (token) => {
  try {
    console.log('🔍 Confirmando transacción Webpay con token:', token);
    
    if (!token) {
      throw new Error('Token de transacción requerido');
    }

    // Confirmar transacción en Transbank
    const response = await tx.commit(token);
    
    console.log('✅ Transacción Webpay confirmada:', {
      buyOrder: response.buy_order,
      authorizationCode: response.authorization_code,
      responseCode: response.response_code,
      amount: response.amount
    });

    // Mapear estados de Transbank a nuestro sistema
    const isApproved = response.response_code === 0; // 0 = aprobada
    const status = isApproved ? 'approved' : 'rejected';

    return {
      buyOrder: response.buy_order,
      sessionId: response.session_id,
      amount: response.amount,
      authorizationCode: response.authorization_code,
      responseCode: response.response_code,
      status,
      isApproved,
      transactionDate: response.transaction_date,
      paymentTypeCode: response.payment_type_code,
      cardDetail: response.card_detail || {},
      installmentsNumber: response.installments_number || 0,
      raw: response // Guardar respuesta completa para auditoría
    };
  } catch (error) {
    console.error('❌ Error al confirmar transacción Webpay:', error);
    
    if (error.response) {
      console.error('📋 Detalles del error de confirmación:', error.response);
    }
    
    throw new Error(`No se pudo confirmar la transacción: ${error.message}`);
  }
};

/**
 * Obtiene el estado de una transacción
 * @param {string} token - Token de la transacción
 * @returns {Promise<Object>} - Estado de la transacción
 */
exports.getTransactionStatus = async (token) => {
  try {
    console.log('📊 Obteniendo estado de transacción Webpay:', token);
    
    // En Webpay, el estado se obtiene al confirmar
    // Esta función es principalmente para compatibilidad
    const transactionInfo = await exports.confirmPaymentTransaction(token);
    
    return {
      token,
      status: transactionInfo.status,
      isApproved: transactionInfo.isApproved,
      amount: transactionInfo.amount,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('❌ Error al obtener estado de transacción:', error);
    
    return {
      token,
      status: 'error',
      isApproved: false,
      error: error.message,
      timestamp: new Date()
    };
  }
};

/**
 * Maneja la respuesta de anulación (refund)
 * @param {string} token - Token de la transacción original
 * @param {number} amount - Monto a anular
 * @returns {Promise<Object>} - Resultado de la anulación
 */
exports.refundTransaction = async (token, amount) => {
  try {
    console.log('🔄 Iniciando anulación Webpay:', { token, amount });
    
    // Nota: Para anulaciones en Webpay, generalmente se usa WebpayPlus.Refund
    // pero requiere configuración adicional y autorización especial
    
    // Por ahora, simulamos el proceso para desarrollo
    console.log('⚠️ Anulación simulada - En producción implementar WebpayPlus.Refund');
    
    return {
      success: true,
      token,
      amount,
      refundId: `REFUND_${Date.now()}`,
      status: 'completed',
      timestamp: new Date(),
      note: 'Anulación simulada - Implementar WebpayPlus.Refund para producción'
    };
  } catch (error) {
    console.error('❌ Error en anulación Webpay:', error);
    
    return {
      success: false,
      token,
      amount,
      error: error.message,
      timestamp: new Date()
    };
  }
};

/**
 * Valida configuración de Transbank
 * @returns {Object} - Estado de la configuración
 */
exports.validateConfiguration = () => {
  const config = getTransbankConfig();
  
  return {
    environment: process.env.TRANSBANK_ENVIRONMENT || 'integration',
    commerceCode: config.commerceCode,
    hasApiKey: !!config.apiKey,
    isProduction: process.env.TRANSBANK_ENVIRONMENT === 'production',
    timestamp: new Date()
  };
};

module.exports = exports;