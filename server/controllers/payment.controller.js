const Order = require('../models/Order');
const User = require('../models/User');
const transbankService = require('../services/transbank.service');
const emailService = require('../services/email.service');

// @desc    Crear transacción de pago para una orden (Webpay)
// @route   POST /api/payment/create-transaction/:orderId
// @access  Private
exports.createPaymentTransaction = async (req, res, next) => {
  try {
    console.log(`🚀 Iniciando creación de transacción Webpay para orden: ${req.params.orderId}`);
    
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
      console.log(`❌ Orden no encontrada: ${req.params.orderId}`);
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    // Verificar que el usuario es el propietario de la orden
    if (order.user._id.toString() !== req.user.id) {
      console.log(`⛔ Usuario ${req.user.id} no autorizado para orden ${order._id}`);
      return res.status(401).json({
        success: false,
        error: 'No autorizado para realizar esta acción'
      });
    }

    // Verificar que la orden no esté pagada
    if (order.isPaid) {
      console.log(`💰 Orden ${order._id} ya ha sido pagada`);
      return res.status(400).json({
        success: false,
        error: 'Esta orden ya ha sido pagada'
      });
    }

    // Verificar que el método de pago sea webpay
    if (order.paymentMethod !== 'webpay') {
      console.log(`💳 Método de pago incorrecto: ${order.paymentMethod}`);
      return res.status(400).json({
        success: false,
        error: 'Esta orden no está configurada para pago con Webpay'
      });
    }

    // Crear transacción con Transbank
    try {
      console.log(`💻 Enviando orden ${order._id} al servicio de Transbank`);
      const transaction = await transbankService.createPaymentTransaction(order);
      
      console.log(`✅ Transacción Webpay creada con éxito: ${transaction.token}`);
      
      // Guardar información de la transacción en la orden
      order.paymentResult = {
        id: transaction.token,
        buyOrder: transaction.buyOrder,
        sessionId: transaction.sessionId,
        status: 'pending',
        paymentMethod: 'webpay',
        updateTime: new Date()
      };
      
      await order.save();
      
      return res.status(200).json({
        success: true,
        data: {
          token: transaction.token,
          url: transaction.url,
          orderId: order._id,
          amount: transaction.amount
        }
      });
    } catch (transbankError) {
      console.error(`❌ Error de Transbank para orden ${order._id}:`, transbankError);
      return res.status(500).json({
        success: false,
        error: `Error al crear transacción de pago: ${transbankError.message}`
      });
    }
  } catch (err) {
    console.error('💥 Error en createPaymentTransaction:', err);
    next(err);
  }
};

// @desc    Manejar retorno desde Webpay
// @route   POST /api/payment/webpay/return
// @access  Public
exports.handleWebpayReturn = async (req, res, next) => {
  try {
    console.log('🔄 Procesando retorno de Webpay...');
    console.log('📋 Datos recibidos:', req.body);
    
    const { token_ws } = req.body;
    
    if (!token_ws) {
      console.log('❌ Token no recibido desde Webpay');
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?error=no_token`);
    }

    try {
      // Confirmar transacción con Transbank
      console.log(`🔍 Confirmando transacción con token: ${token_ws}`);
      const transactionResult = await transbankService.confirmPaymentTransaction(token_ws);
      
      console.log('📊 Resultado de transacción:', transactionResult);
      
      // ✅ CORREGIDO: Usar nueva función para extraer orderId
      const orderId = transbankService.extractOrderIdFromBuyOrder(transactionResult.buyOrder);
      
      if (!orderId) {
        console.error(`❌ No se pudo extraer orderId de buyOrder: ${transactionResult.buyOrder}`);
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?error=invalid_buyorder`);
      }
      
      console.log(`🔍 OrderId extraído: ${orderId}`);
      
      const order = await Order.findById(orderId);
      
      if (!order) {
        console.error(`❌ Orden no encontrada para ID: ${orderId}`);
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?error=order_not_found`);
      }

      // Actualizar estado de la orden según resultado
      if (transactionResult.isApproved) {
        console.log(`✅ Pago aprobado para orden ${order._id}`);
        
        order.isPaid = true;
        order.paidAt = new Date();
        order.status = 'processing';
        order.paymentResult = {
          id: token_ws,
          buyOrder: transactionResult.buyOrder,
          authorizationCode: transactionResult.authorizationCode,
          status: 'approved',
          updateTime: new Date(),
          paymentMethod: 'webpay',
          amount: transactionResult.amount,
          cardDetail: transactionResult.cardDetail,
          installments: transactionResult.installmentsNumber
        };

        await order.save();

        // Enviar email de confirmación al usuario
        try {
          const user = await User.findById(order.user);
          if (user) {
            await emailService.sendOrderConfirmationEmail(order, user);
            console.log(`📧 Email de confirmación enviado a ${user.email}`);
          }
        } catch (emailError) {
          console.error('⚠️ Error al enviar email de confirmación:', emailError);
        }

        // Redirigir a página de éxito
        return res.redirect(`${process.env.FRONTEND_URL}/payment/success?order=${order._id}&token=${token_ws}`);
      } else {
        console.log(`❌ Pago rechazado para orden ${order._id}. Código: ${transactionResult.responseCode}`);
        
        // Actualizar información de pago rechazado
        order.paymentResult = {
          id: token_ws,
          buyOrder: transactionResult.buyOrder,
          status: 'rejected',
          responseCode: transactionResult.responseCode,
          updateTime: new Date(),
          paymentMethod: 'webpay'
        };
        
        await order.save();
        
        // Redirigir a página de fallo
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?order=${order._id}&code=${transactionResult.responseCode}`);
      }
    } catch (transbankError) {
      console.error('❌ Error al procesar respuesta de Transbank:', transbankError);
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?error=processing_error`);
    }
  } catch (err) {
    console.error('💥 Error en handleWebpayReturn:', err);
    return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?error=system_error`);
  }
};

// @desc    Obtener estado de pago de una orden
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

    // Verificar que el usuario es el propietario de la orden o es admin
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
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
        paymentResult: order.paymentResult,
        paymentMethod: order.paymentMethod
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Procesar anulación de pago
// @route   POST /api/payment/refund/:orderId
// @access  Private (admin)
exports.processRefund = async (req, res, next) => {
  try {
    console.log(`🔄 Iniciando proceso de anulación para orden: ${req.params.orderId}`);
    
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    // Verificar que la orden esté pagada
    if (!order.isPaid) {
      return res.status(400).json({
        success: false,
        error: 'No se puede anular una orden que no ha sido pagada'
      });
    }

    // Verificar que tenga información de pago de Webpay
    if (!order.paymentResult || !order.paymentResult.id) {
      return res.status(400).json({
        success: false,
        error: 'No se encontró información de pago para anular'
      });
    }

    try {
      // Procesar anulación con Transbank
      const refundResult = await transbankService.refundTransaction(
        order.paymentResult.id,
        order.totalPrice
      );

      if (refundResult.success) {
        // Actualizar estado de la orden
        order.status = 'cancelled';
        order.paymentResult.refund = {
          id: refundResult.refundId,
          amount: refundResult.amount,
          status: 'completed',
          processedAt: new Date()
        };

        await order.save();

        console.log(`✅ Anulación procesada para orden ${order._id}`);

        res.status(200).json({
          success: true,
          data: {
            orderId: order._id,
            refundId: refundResult.refundId,
            amount: refundResult.amount,
            status: 'completed'
          }
        });
      } else {
        throw new Error(refundResult.error || 'Error en proceso de anulación');
      }
    } catch (refundError) {
      console.error(`❌ Error en anulación para orden ${order._id}:`, refundError);
      
      res.status(500).json({
        success: false,
        error: `Error al procesar anulación: ${refundError.message}`
      });
    }
  } catch (err) {
    console.error('💥 Error en processRefund:', err);
    next(err);
  }
};

// @desc    Validar configuración de Transbank
// @route   GET /api/payment/config
// @access  Private (admin)
exports.getPaymentConfig = async (req, res, next) => {
  try {
    const config = transbankService.validateConfiguration();
    
    res.status(200).json({
      success: true,
      data: config
    });
  } catch (err) {
    next(err);
  }
};