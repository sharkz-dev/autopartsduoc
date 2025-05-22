const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const dotenv = require('dotenv');

dotenv.config();

// Verificar que las credenciales estén disponibles
if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  console.error('ERROR: MERCADOPAGO_ACCESS_TOKEN no está definido en el archivo .env');
}

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
    console.log('Creando preferencia de pago para orden:', orderData._id);
    const preferenceClient = new Preference(client);
    
    // Validar datos esenciales
    if (!orderData || !orderData._id || !orderData.items || orderData.items.length === 0) {
      throw new Error('Datos de orden incompletos o inválidos');
    }
    
    // Crear estructura de items para Mercado Pago con validación
    const items = orderData.items.map(item => {
      // Asegurar que todos los campos requeridos existan
      const title = item.product?.name || 'Producto';
      const description = item.product?.description 
        ? item.product.description.substring(0, 100) 
        : 'Sin descripción';
      
      // Asegurar que la URL de la imagen sea válida
      let pictureUrl = '';
      if (item.product?.images && item.product.images.length > 0) {
        pictureUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${item.product.images[0]}`;
      }
      
      return {
        id: item.product?._id?.toString() || `item-${Date.now()}`,
        title,
        description,
        picture_url: pictureUrl,
        category_id: item.product?.category?._id?.toString() || "general",
        quantity: item.quantity || 1,
        unit_price: Number(item.price) || 0
      };
    });

    // Configurar datos del comprador con validaciones
    const payer = {
      name: orderData.user?.name?.split(' ')[0] || 'Usuario',
      surname: orderData.user?.name?.split(' ').slice(1).join(' ') || 'Apellido',
      email: orderData.user?.email || 'test@example.com',
      phone: {
        area_code: '',
        number: orderData.user?.phone || ''
      },
      address: {
        street_name: orderData.shippingAddress?.street || '',
        street_number: '',
        zip_code: orderData.shippingAddress?.postalCode || ''
      }
    };

    // URLs de redirección asegurando que son URLs completas
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Crear preferencia de pago con mayor detalle de log
    console.log('Datos de preferencia preparados, enviando a MercadoPago...');
    
    // CAMBIO PRINCIPAL: Reestructurar el objeto preferenceData para cumplir con la API
    const preferenceData = {
      items,
      payer,
      // back_urls en lugar de backUrls y directamente incluimos las URLs
      back_urls: {
        success: `${frontendUrl}/payment/success`,
        failure: `${frontendUrl}/payment/failure`,
        pending: `${frontendUrl}/payment/pending`
      },
      // Quitamos auto_return que está causando el error
      notification_url: `${process.env.BASE_URL || 'http://localhost:5000'}/api/payment/webhook`,
      external_reference: orderData._id.toString(),
      statement_descriptor: 'AutoRepuestos',
      shipments: {
        cost: Number(orderData.shippingPrice) || 0,
        mode: 'not_specified'  // Simplificamos para evitar errores
      }
    };

    // Log para ayudar a depurar
    console.log('Enviando datos a MercadoPago:', JSON.stringify(preferenceData, null, 2));
    
    const response = await preferenceClient.create({ body: preferenceData });
    console.log('Preferencia de MercadoPago creada con éxito:', response.id);
    return response;
  } catch (error) {
    console.error('Error al crear preferencia de pago:', error);
    // Agregamos más detalles al error para facilitar depuración
    if (error.response) {
      console.error('Detalles de error de MercadoPago:', JSON.stringify(error.response, null, 2));
    }
    throw new Error(`No se pudo crear la preferencia de pago: ${error.message}`);
  }
};

/**
 * Verifica el estado de un pago
 * @param {string} paymentId - ID del pago en Mercado Pago
 * @returns {Promise<Object>} - Información del pago
 */
exports.getPaymentInfo = async (paymentId) => {
  try {
    const paymentClient = new Payment(client);
    const response = await paymentClient.get({ id: paymentId });
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