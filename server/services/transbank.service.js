const dotenv = require('dotenv');
dotenv.config();

const isProduction = process.env.TRANSBANK_ENVIRONMENT === 'production';

let transbank = null;

if (isProduction) {
  transbank = require('transbank-sdk'); // SDK real en producción
} else {
  try {
    transbank = require('transbank-sdk'); // SDK real en integración si está instalado
  } catch (error) {
    // Mock para desarrollo
    transbank = {
      WebpayPlus: {
        Transaction: function () {
          return {
            create: async () => ({
              token: 'mock_token_123',
              url: 'https://mock.transbank.cl'
            }),
            commit: async () => ({
              buy_order: 'MOCK_ORDER_123',
              session_id: 'MOCK_SESSION_123',
              amount: 100000,
              authorization_code: '123456',
              response_code: 0,
              transaction_date: new Date().toISOString(),
              payment_type_code: 'VN',
              card_detail: { card_number: '****1234' },
              installments_number: 0
            })
          };
        }
      },
      Environment: {
        Integration: 'integration',
        Production: 'production'
      },
      IntegrationCommerceCodes: {
        WEBPAY_PLUS: 'test_commerce_code'
      },
      IntegrationApiKeys: {
        WEBPAY: 'test_api_key'
      }
    };
  }
}

// Configuración de Transbank
const getTransbankConfig = () => {
  if (isProduction) {
    return {
      commerceCode: process.env.TRANSBANK_COMMERCE_CODE,
      apiKey: process.env.TRANSBANK_API_KEY,
      environment: transbank.Environment.Production
    };
  } else {
    return {
      commerceCode: transbank.IntegrationCommerceCodes.WEBPAY_PLUS,
      apiKey: transbank.IntegrationApiKeys.WEBPAY,
      environment: transbank.Environment.Integration
    };
  }
};

let tx = null;

function initializeTransaction() {
  if (!tx) {
    const config = getTransbankConfig();
    tx = new transbank.WebpayPlus.Transaction({
      commerceCode: config.commerceCode,
      apiKey: config.apiKey,
      environment: config.environment
    });
  }
  return tx;
}

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
    return `${hash}_${timestamp}`;
  }

  return buyOrder;
};

const generateSessionId = (userId) => {
  const shortUserId = userId.toString().slice(-12);
  const shortTimestamp = Date.now().toString().slice(-10);
  return `S${shortUserId}T${shortTimestamp}`;
};

exports.createPaymentTransaction = async (orderData) => {
  try {
    if (!orderData || !orderData._id || !orderData.totalPrice) {
      throw new Error('Datos de orden incompletos para crear transacción');
    }

    const transaction = initializeTransaction();
    const buyOrder = generateBuyOrder(orderData._id);
    const sessionId = generateSessionId(orderData.user._id || orderData.user);
    const amount = Math.round(orderData.totalPrice);

    const returnUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/payment/webpay/return`;

    if (buyOrder.length > 26) {
      throw new Error(`buyOrder muy largo: ${buyOrder.length} caracteres (máximo 26)`);
    }

    if (sessionId.length > 61) {
      throw new Error(`sessionId muy largo: ${sessionId.length} caracteres (máximo 61)`);
    }

    if (!global.buyOrderMap) {
      global.buyOrderMap = new Map();
    }
    global.buyOrderMap.set(buyOrder, orderData._id.toString());

    const Order = require('../models/Order');
    await Order.findByIdAndUpdate(orderData._id, {
      'paymentResult.buyOrder': buyOrder,
      'paymentResult.sessionId': sessionId,
      'paymentResult.status': 'pending'
    });

    const response = await transaction.create(buyOrder, sessionId, amount, returnUrl);

    if (!response || !response.token) {
      throw new Error('Respuesta inválida de Transbank: token no recibido');
    }

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

exports.confirmPaymentTransaction = async (token) => {
  try {
    if (!token) {
      throw new Error('Token de transacción requerido');
    }

    const transaction = initializeTransaction();
    const response = await transaction.commit(token);

    if (!response) {
      throw new Error('Respuesta inválida de Transbank: sin datos de confirmación');
    }

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

exports.extractOrderIdFromBuyOrder = (buyOrder) => {
  try {
    if (global.buyOrderMap && global.buyOrderMap.has(buyOrder)) {
      const orderId = global.buyOrderMap.get(buyOrder);
      global.buyOrderMap.delete(buyOrder);
      return orderId;
    }

    if (buyOrder && buyOrder.includes('_')) {
      const parts = buyOrder.split('_');
      if (parts.length >= 2) {
        return parts.slice(0, -1).join('_');
      }
    }

    return null;
  } catch (error) {
    console.error('Error extrayendo orderId de buyOrder:', error);
    return null;
  }
};

exports.findOrderIdByBuyOrder = async (buyOrder) => {
  try {
    const Order = require('../models/Order');
    const order = await Order.findOne({
      'paymentResult.buyOrder': buyOrder
    }).select('_id');

    return order ? order._id.toString() : null;
  } catch (error) {
    console.error('Error buscando orderId en base de datos:', error);
    return null;
  }
};

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

exports.refundTransaction = async (token, amount) => {
  try {
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

exports.validateConfiguration = () => {
  const config = getTransbankConfig();
  return {
    environment: process.env.TRANSBANK_ENVIRONMENT || 'integration',
    commerceCode: config.commerceCode,
    hasApiKey: !!config.apiKey,
    isProduction: isProduction,
    timestamp: new Date()
  };
};

exports.generateBuyOrder = generateBuyOrder;
exports.generateSessionId = generateSessionId;

module.exports = exports;
