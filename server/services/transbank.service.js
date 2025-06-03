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
 * ✅ FUNCIÓN CORREGIDA: Genera un buyOrder válido para Transbank
 * Ahora usa un formato más simple y confiable
 * @param {string} orderId - ID de la orden
 * @returns {string} - buyOrder válido
 */
const generateBuyOrder = (orderId) => {
  // Convertir orderId a string y limpiar
  const cleanOrderId = orderId.toString().trim();
  
  // Para MongoDB ObjectIds (24 chars), usar directamente
  // Para otros IDs, truncar si es necesario
  let shortOrderId = cleanOrderId;
  if (cleanOrderId.length > 20) {
    // Tomar los últimos 20 caracteres para mantener unicidad
    shortOrderId = cleanOrderId.slice(-20);
  }
  
  // Formato simple: {orderId} + timestamp corto
  const timestamp = Date.now().toString().slice(-6); // Últimos 6 dígitos
  const buyOrder = `${shortOrderId}_${timestamp}`;
  
  // Verificar longitud máxima (26 caracteres para Transbank)
  if (buyOrder.length > 26) {
    // Si aún es muy largo, usar hash más corto
    const hash = require('crypto').createHash('md5').update(cleanOrderId).digest('hex').slice(0, 16);
    const finalBuyOrder = `${hash}_${timestamp}`;
    console.log(`📋 buyOrder generado (hash): ${finalBuyOrder} (${finalBuyOrder.length} chars)`);
    return finalBuyOrder;
  }
  
  console.log(`📋 buyOrder generado: ${buyOrder} (${buyOrder.length} chars) para orden: ${cleanOrderId}`);
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

    // ✅ CORREGIDO: Generar buyOrder con el nuevo formato
    const buyOrder = generateBuyOrder(orderData._id);
    const sessionId = generateSessionId(orderData.user._id);
    const amount = Math.round(orderData.totalPrice); // Transbank requiere enteros
    const returnUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/payment/webpay/return`;

    console.log('📊 Datos de transacción Webpay:', {
      orderId: orderData._id,
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

    // ✅ IMPORTANTE: Guardar la relación buyOrder -> orderId en memoria temporalmente
    // En producción, esto debería guardarse en Redis o base de datos
    if (!global.buyOrderMap) {
      global.buyOrderMap = new Map();
    }
    global.buyOrderMap.set(buyOrder, orderData._id.toString());
    console.log(`🗺️ Guardando mapeo: ${buyOrder} -> ${orderData._id}`);

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
 * ✅ FUNCIÓN COMPLETAMENTE REESCRITA: Extraer orderId de buyOrder
 * Ahora maneja múltiples formatos y usa el mapa de buyOrder
 * @param {string} buyOrder - buyOrder generado
 * @returns {string} - orderId extraído
 */
exports.extractOrderIdFromBuyOrder = (buyOrder) => {
  try {
    console.log(`🔍 Extrayendo orderId de buyOrder: "${buyOrder}"`);
    
    // Método 1: Usar el mapa global (más confiable)
    if (global.buyOrderMap && global.buyOrderMap.has(buyOrder)) {
      const orderId = global.buyOrderMap.get(buyOrder);
      console.log(`✅ OrderId encontrado en mapa: ${orderId}`);
      
      // Limpiar el mapa después de usar (opcional, para liberar memoria)
      global.buyOrderMap.delete(buyOrder);
      
      return orderId;
    }
    
    // Método 2: Parsing del formato {orderId}_{timestamp}
    if (buyOrder.includes('_')) {
      const parts = buyOrder.split('_');
      if (parts.length >= 2) {
        const extractedOrderId = parts.slice(0, -1).join('_'); // Todo excepto el último elemento (timestamp)
        console.log(`✅ OrderId extraído por parsing: ${extractedOrderId}`);
        return extractedOrderId;
      }
    }
    
    // Método 3: Formato legacy O{orderId}T{timestamp}
    if (buyOrder.startsWith('O') && buyOrder.includes('T')) {
      const match = buyOrder.match(/^O(.+)T\d+$/);
      if (match && match[1]) {
        const extractedOrderId = match[1];
        console.log(`✅ OrderId extraído (formato legacy): ${extractedOrderId}`);
        return extractedOrderId;
      }
    }
    
    // Método 4: Si es un hash MD5 (16 chars) + timestamp, buscar en base de datos
    if (buyOrder.length <= 26 && buyOrder.includes('_')) {
      const parts = buyOrder.split('_');
      const possibleHash = parts[0];
      
      if (possibleHash.length === 16) {
        console.log(`⚠️ BuyOrder parece ser un hash: ${possibleHash}`);
        console.log(`⚠️ Se requiere búsqueda en base de datos por hash`);
        // Aquí podrías implementar una búsqueda en la base de datos
        // por el momento, retornamos null para que el código de arriba maneje el error
      }
    }
    
    console.error(`❌ No se pudo extraer orderId de buyOrder: "${buyOrder}"`);
    return null;
    
  } catch (error) {
    console.error('❌ Error extrayendo orderId de buyOrder:', error);
    return null;
  }
};

/**
 * ✅ NUEVA FUNCIÓN: Buscar orderId por buyOrder en la base de datos
 * Para casos donde el mapa en memoria no esté disponible
 * @param {string} buyOrder - buyOrder a buscar
 * @returns {Promise<string|null>} - orderId encontrado o null
 */
exports.findOrderIdByBuyOrder = async (buyOrder) => {
  try {
    // Importar modelo de Order
    const Order = require('../models/Order');
    
    console.log(`🔍 Buscando orderId en base de datos para buyOrder: ${buyOrder}`);
    
    // Buscar orden que tenga este buyOrder en su paymentResult
    const order = await Order.findOne({
      'paymentResult.buyOrder': buyOrder
    }).select('_id');
    
    if (order) {
      console.log(`✅ OrderId encontrado en base de datos: ${order._id}`);
      return order._id.toString();
    }
    
    console.log(`❌ No se encontró orden con buyOrder: ${buyOrder}`);
    return null;
    
  } catch (error) {
    console.error('❌ Error buscando orderId en base de datos:', error);
    return null;
  }
};

module.exports = exports;