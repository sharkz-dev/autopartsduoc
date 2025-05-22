// server/controllers/payment.controller.js
const Order = require('../models/Order');
const User = require('../models/User');
const mercadopagoService = require('../services/mercadopago.service');
const emailService = require('../services/email.service');

// @desc    Crear preferencia de pago para una orden
// @route   POST /api/payment/create-preference/:orderId
// @access  Private
exports.createPaymentPreference = async (req, res, next) => {
  try {
    console.log(`Iniciando creación de preferencia para orden: ${req.params.orderId}`);
    
    const order = await Order.findById(req.params.orderId)
      .populate({
        path: 'user',
        select: 'name email phone'
      })
      .populate({
        path: 'items.product',
        select: 'name description images category'
      })
      .populate({
        path: 'items.product.category',
        select: 'name'
      });

    if (!order) {
      console.log(`Orden no encontrada: ${req.params.orderId}`);
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    // Verificar que el usuario es el propietario de la orden
    if (order.user._id.toString() !== req.user.id) {
      console.log(`Usuario ${req.user.id} no autorizado para orden ${order._id}`);
      return res.status(401).json({
        success: false,
        error: 'No autorizado para realizar esta acción'
      });
    }

    // Verificar que la orden no esté pagada
    if (order.isPaid) {
      console.log(`Orden ${order._id} ya ha sido pagada`);
      return res.status(400).json({
        success: false,
        error: 'Esta orden ya ha sido pagada'
      });
    }

    // Crear preferencia de pago con mejor manejo de errores
    try {
      console.log(`Enviando orden ${order._id} al servicio de MercadoPago`);
      const preference = await mercadopagoService.createPaymentPreference(order);
      
      console.log(`Preferencia creada con éxito: ${preference.id}`);
      return res.status(200).json({
        success: true,
        data: preference
      });
    } catch (mpError) {
      console.error(`Error de MercadoPago para orden ${order._id}:`, mpError);
      return res.status(500).json({
        success: false,
        error: `Error al crear preferencia de pago: ${mpError.message}`
      });
    }
  } catch (err) {
    console.error('Error en createPaymentPreference:', err);
    next(err);
  }
};

// @desc    Recibir notificaciones de webhook de Mercado Pago
// @route   POST /api/payment/webhook
// @access  Public
exports.handleWebhook = async (req, res, next) => {
  try {
    // Imprime el cuerpo de la solicitud para depuración (en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('Webhook recibido:', JSON.stringify(req.body, null, 2));
    }

    // Verificar que hay datos en la notificación
    if (!req.body || !req.body.data) {
      return res.status(400).json({
        success: false,
        error: 'Datos de notificación inválidos'
      });
    }

    // Procesar la notificación según el tipo
    if (req.body.type === 'payment') {
      const paymentId = req.body.data.id;
      
      // Obtener información del pago desde Mercado Pago
      const paymentInfo = await mercadopagoService.getPaymentInfo(paymentId);
      
      // Buscar la orden por ID externo
      const orderId = paymentInfo.external_reference;
      const order = await Order.findById(orderId);
      
      if (!order) {
        console.error(`Orden no encontrada para el pago: ${paymentId}`);
        return res.status(404).json({
          success: false,
          error: 'Orden no encontrada'
        });
      }

      // Actualizar estado de pago según respuesta de Mercado Pago
      if (paymentInfo.status === 'approved') {
        order.isPaid = true;
        order.paidAt = new Date();
        order.status = 'processing'; // Actualizar estado a "procesando"
        order.paymentResult = {
          id: paymentId,
          status: paymentInfo.status,
          updateTime: new Date(),
          paymentMethod: 'mercadopago'
        };

        await order.save();

        // Enviar email de confirmación al usuario
        const user = await User.findById(order.user);
        if (user) {
          await emailService.sendOrderConfirmationEmail(order, user);
        }
      } else if (paymentInfo.status === 'pending' || paymentInfo.status === 'in_process') {
        // Actualizar información de pago pendiente
        order.paymentResult = {
          id: paymentId,
          status: paymentInfo.status,
          updateTime: new Date(),
          paymentMethod: 'mercadopago'
        };
        
        await order.save();
      } else if (['rejected', 'cancelled', 'refunded'].includes(paymentInfo.status)) {
        // Manejar pago rechazado/cancelado
        order.paymentResult = {
          id: paymentId,
          status: paymentInfo.status,
          updateTime: new Date(),
          paymentMethod: 'mercadopago'
        };
        
        await order.save();
      }
    }

    // Siempre devuelve un 200 OK a Mercado Pago, incluso si hay errores internos
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error procesando webhook:', err);
    
    // Mercado Pago espera una respuesta 200 incluso si hay errores
    res.status(200).json({ success: true });
  }
};

// @desc    Manejar retorno de Mercado Pago (éxito, fracaso o pendiente)
// @route   GET /api/payment/status/:orderId
// @access  Private
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    // Verificar que el usuario es el propietario de la orden
    if (order.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado para realizar esta acción'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        isPaid: order.isPaid,
        paidAt: order.paidAt,
        status: order.status,
        paymentResult: order.paymentResult
      }
    });
  } catch (err) {
    next(err);
  }
};