const { WebpayPlus, Environment, IntegrationCommerceCodes, IntegrationApiKeys } = require('transbank-sdk');
const dotenv = require('dotenv');

dotenv.config();

// Configuración de Transbank según el entorno
const getTransbankConfig = () => {
  const environment = process.env.TRANSBANK_ENVIRONMENT || 'integration';
  
  if (environment === 'production') {
    return {
      commerceCode: process.env.TRANSBANK_COMMERCE_CODE,
      apiKey: process.env.TRANSBANK_API_KEY,
      environment: Environment.Production
    };
  } else {
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

// Genera un buyOrder válido para Transbank
const generateBuyOrder = (orderId) => {
  const cleanOrderId = orderId.toString().trim();
  let shortOrderId = cleanOrderId;
  if (cleanOrderId.length > 20) {
    shortOrderId = cleanOrderId.slice(-20);
  }
  
  const timestamp = Date.now().toString().slice(-6);
  const buyOrder = `${shortOrderId}_${timestamp}`;
  
  if (buyOrder.length > 26) {
    const hash = require('crypto').createHash('md5').update(cleanOrderId).digest('hex').slice(0, 16);
    const finalBuyOrder = `${hash}_${timestamp}`;
    return finalBuyOrder;
  }
  
  return buyOrder;
};

// Genera un sessionId válido para Transbank
const generateSessionId = (userId) => {
  const shortUserId = userId.toString().slice(-12);
  const shortTimestamp = Date.now().toString().slice(-10);
  const sessionId = `S${shortUserId}T${shortTimestamp}`;
  
  return sessionId;
};

// Crea una transacción de pago en Webpay
exports.createPaymentTransaction = async (orderData) => {
  try {
    if (!orderData || !orderData._id || !orderData.totalPrice) {
      throw new Error('Datos de orden incompletos para crear transacción');
    }

    const buyOrder = generateBuyOrder(orderData._id);
    const sessionId = generateSessionId(orderData.user._id);
    const amount = Math.round(orderData.totalPrice);
    
    const returnUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/payment/webpay/return`;

    // Validar longitudes
    if (buyOrder.length > 26) {
      throw new Error(`buyOrder muy largo: ${buyOrder.length} caracteres (máximo 26)`);
    }

    if (sessionId.length > 61) {
      throw new Error(`sessionId muy largo: ${sessionId.length} caracteres (máximo 61)`);
    }

    // Guardar mapeo en memoria global
    if (!global.buyOrderMap) {
      global.buyOrderMap = new Map();
    }
    global.buyOrderMap.set(buyOrder, orderData._id.toString());

    // Guardar en base de datos para mayor seguridad
    const Order = require('../models/Order');
    await Order.findByIdAndUpdate(orderData._id, {
      'paymentResult.buyOrder': buyOrder,
      'paymentResult.sessionId': sessionId,
      'paymentResult.status': 'pending'
    });

    // Crear transacción en Transbank
    const response = await tx.create(buyOrder, sessionId, amount, returnUrl);

    return {
      token: response.token,
      url: response.url,
      buyOrder,
      sessionId,
      amount
    };
  } catch (error) {
    console.error('Error al crear transacción Webpay:', error);
    
    if (error.response) {
      console.error('Detalles del error de Transbank:', error.response.data || error.response);
    }
    
    throw new Error(`No se pudo crear la transacción de pago: ${error.message}`);
  }
};

// Confirma una transacción de pago en Webpay
exports.confirmPaymentTransaction = async (token) => {
  try {
    if (!token) {
      throw new Error('Token de transacción requerido');
    }

    const response = await tx.commit(token);

    const isApproved = response.response_code === 0;
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
      raw: response
    };
  } catch (error) {
    console.error('Error al confirmar transacción Webpay:', error);
    
    if (error.response) {
      console.error('Detalles del error de confirmación:', error.response.data || error.response);
    }
    
    throw new Error(`No se pudo confirmar la transacción: ${error.message}`);
  }
};

// Extraer orderId de buyOrder
exports.extractOrderIdFromBuyOrder = (buyOrder) => {
  try {
    // Método 1: Usar el mapa global
    if (global.buyOrderMap && global.buyOrderMap.has(buyOrder)) {
      const orderId = global.buyOrderMap.get(buyOrder);
      global.buyOrderMap.delete(buyOrder);
      return orderId;
    }
    
    // Método 2: Parsing del formato {orderId}_{timestamp}
    if (buyOrder.includes('_')) {
      const parts = buyOrder.split('_');
      if (parts.length >= 2) {
        const extractedOrderId = parts.slice(0, -1).join('_');
        return extractedOrderId;
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('Error extrayendo orderId de buyOrder:', error);
    return null;
  }
};

// Buscar orderId por buyOrder en la base de datos
exports.findOrderIdByBuyOrder = async (buyOrder) => {
  try {
    const Order = require('../models/Order');
    
    const order = await Order.findOne({
      'paymentResult.buyOrder': buyOrder
    }).select('_id');
    
    if (order) {
      return order._id.toString();
    }
    
    return null;
    
  } catch (error) {
    console.error('Error buscando orderId en base de datos:', error);
    return null;
  }
};

// Obtiene el estado de una transacción
exports.getTransactionStatus = async (token) => {
  try {
    const transactionInfo = await exports.confirmPaymentTransaction(token);
    
    return {
      token,
      status: transactionInfo.status,
      isApproved: transactionInfo.isApproved,
      amount: transactionInfo.amount,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error al obtener estado de transacción:', error);
    
    return {
      token,
      status: 'error',
      isApproved: false,
      error: error.message,
      timestamp: new Date()
    };
  }
};

// Procesa anulación/reembolso
exports.refundTransaction = async (token, amount) => {
  try {
    // Anulación simulada - En producción implementar WebpayPlus.Refund
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
    console.error('Error en anulación Webpay:', error);
    
    return {
      success: false,
      token,
      amount,
      error: error.message,
      timestamp: new Date()
    };
  }
};

// Valida configuración de Transbank
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