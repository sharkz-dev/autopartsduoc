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
 * Genera un buyOrder válido para Transbank (máximo 26 caracteres)
 * @param {string} orderId - ID de la orden
 * @returns {string} - buyOrder válido
 */
const generateBuyOrder = (orderId) => {
  // Tomar solo los últimos 12 caracteres del orderId (suficiente para MongoDB ObjectId)
  const shortOrderId = orderId.toString().slice(-12);
  
  // Generar timestamp corto (últimos 8 dígitos del timestamp)
  const shortTimestamp = Date.now().toString().slice(-8);
  
  // Formato: O + shortOrderId + T + shortTimestamp = máximo 23 caracteres
  const buyOrder = `O${shortOrderId}T${shortTimestamp}`;
  
  // Verificar que no exceda 26 caracteres
  if (buyOrder.length > 26) {
    console.warn(`⚠️ buyOrder muy largo (${buyOrder.length}): ${buyOrder}`);
    // Si aún es muy largo, usar solo timestamp
    return `ORDER${Date.now().toString().slice(-18)}`;
  }
  
  console.log(`📋 buyOrder generado: ${buyOrder} (${buyOrder.length} caracteres)`);
  return buyOrder;
};

/**
 * Genera un sessionId válido para Transbank
 * @param {string} userId - ID del usuario
 * @returns {string} - sessionId válido
 */
const generateSessionId = (userId) => {
  // Tomar solo los últimos 12 caracteres del userId
  const shortUserId = userId.toString().slice(-12);
  
  // Generar timestamp corto
  const shortTimestamp = Date.now().toString().slice(-10);
  
  // Formato: S + shortUserId + T + shortTimestamp
  const sessionId = `S${shortUserId}T${shortTimestamp}`;
  
  console.log(`🔑 sessionId generado: ${sessionId} (${sessionId.length} caracteres)`);
  return sessionId;
};

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

    // ✅ CORREGIDO: Generar buyOrder con longitud válida
    const buyOrder = generateBuyOrder(orderData._id);
    const sessionId = generateSessionId(orderData.user._id);
    const amount = Math.round(orderData.totalPrice); // Transbank requiere enteros
    const returnUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/payment/webpay/return`;

    console.log('📊 Datos de transacción Webpay:', {
      buyOrder,
      sessionId,
      amount,
      returnUrl,
      buyOrderLength: buyOrder.length,
      sessionIdLength: sessionId.length
    });

    // Validar longitudes antes de enviar a Transbank
    if (buyOrder.length > 26) {
      throw new Error(`buyOrder muy largo: ${buyOrder.length} caracteres (máximo 26)`);
    }

    if (sessionId.length > 61) {
      throw new Error(`sessionId muy largo: ${sessionId.length} caracteres (máximo 61)`);
    }

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
      console.error('📋 Detalles del error de Transbank:', error.response.data || error.response);
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
      console.error('📋 Detalles del error de confirmación:', error.response.data || error.response);
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

/**
 * Función de utilidad para extraer orderId de buyOrder
 * @param {string} buyOrder - buyOrder generado
 * @returns {string} - orderId extraído
 */
exports.extractOrderIdFromBuyOrder = (buyOrder) => {
  try {
    // Formato: O{orderId}T{timestamp}
    if (buyOrder.startsWith('O') && buyOrder.includes('T')) {
      const parts = buyOrder.split('T');
      return parts[0].substring(1); // Remover la 'O' inicial
    }
    
    // Formato legacy: ORDER_{orderId}_{timestamp}
    if (buyOrder.includes('_')) {
      const parts = buyOrder.split('_');
      return parts[1];
    }
    
    return null;
  } catch (error) {
    console.error('Error extrayendo orderId de buyOrder:', error);
    return null;
  }
};

module.exports = exports;