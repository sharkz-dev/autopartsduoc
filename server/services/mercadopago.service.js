// server/services/mercadopago.service.js
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const dotenv = require('dotenv');

dotenv.config();

// Configurar cliente de Mercado Pago con las credenciales
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
});

/**
 * Crea una preferencia de pago en Mercado Pago
 * @param {Object} orderData - Datos de la orden
 * @returns {Promise<Object>} - Preferencia de pago creada
 */
exports.createPaymentPreference = async (orderData) => {
  try {
    const preference = new Preference(client);
    
    // Crear estructura de items para Mercado Pago
    const items = orderData.items.map(item => ({
      id: item.product._id.toString(),
      title: item.product.name,
      description: item.product.description ? item.product.description.substring(0, 100) : "", // Mercado Pago limita la descripción
      picture_url: item.product.images && item.product.images.length > 0 
        ? `${process.env.BASE_URL}/uploads/${item.product.images[0]}`
        : '',
      category_id: item.product.category ? item.product.category._id.toString() : "",
      quantity: item.quantity,
      unit_price: Number(item.price)
    }));

    // Configurar datos del comprador
    const payer = {
      name: orderData.user.name.split(' ')[0] || '',
      surname: orderData.user.name.split(' ').slice(1).join(' ') || '',
      email: orderData.user.email,
      phone: {
        area_code: '',
        number: orderData.user.phone || ''
      },
      address: {
        street_name: orderData.shippingAddress ? orderData.shippingAddress.street || '' : '',
        street_number: '',
        zip_code: orderData.shippingAddress ? orderData.shippingAddress.postalCode || '' : ''
      }
    };

    // URLs de redirección
    const backUrls = {
      success: `${process.env.FRONTEND_URL}/payment/success`,
      failure: `${process.env.FRONTEND_URL}/payment/failure`,
      pending: `${process.env.FRONTEND_URL}/payment/pending`
    };

    // Referencia externa (ID de la orden)
    const externalReference = orderData._id.toString();

    // Crear preferencia de pago
    const preferenceData = {
      items,
      payer,
      back_urls: backUrls,
      auto_return: 'approved',
      external_reference: externalReference,
      statement_descriptor: 'AutoRepuestos',
      shipments: {
        cost: Number(orderData.shippingPrice),
        mode: orderData.shipmentMethod === 'pickup' ? 'not_specified' : 'custom'
      }
    };

    const response = await preference.create({ body: preferenceData });
    return response;
  } catch (error) {
    console.error('Error al crear preferencia de pago:', error);
    throw new Error('No se pudo crear la preferencia de pago');
  }
};

/**
 * Verifica el estado de un pago
 * @param {string} paymentId - ID del pago en Mercado Pago
 * @returns {Promise<Object>} - Información del pago
 */
exports.getPaymentInfo = async (paymentId) => {
  try {
    const payment = new Payment(client);
    const response = await payment.get({ id: paymentId });
    return response;
  } catch (error) {
    console.error('Error al obtener información del pago:', error);
    throw new Error('No se pudo obtener información del pago');
  }
};

/**
 * Procesa un webhook de Mercado Pago
 * @param {Object} data - Datos del webhook
 * @returns {Promise<Object>} - Información procesada
 */
exports.processWebhook = async (data) => {
  // Verificar tipo de notificación
  if (data.type === 'payment') {
    try {
      const paymentInfo = await exports.getPaymentInfo(data.data.id);
      
      return {
        orderId: paymentInfo.external_reference,
        paymentId: paymentInfo.id,
        status: paymentInfo.status,
        statusDetail: paymentInfo.status_detail,
        paymentMethod: paymentInfo.payment_method_id,
        paymentType: paymentInfo.payment_type_id,
        amount: paymentInfo.transaction_amount,
        paidAt: new Date(paymentInfo.date_approved || paymentInfo.date_created),
        processed: true
      };
    } catch (error) {
      console.error('Error al procesar webhook:', error);
      throw error;
    }
  }
  
  return { processed: false };
};

module.exports = exports;