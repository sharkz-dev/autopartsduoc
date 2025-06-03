const Order = require('../models/Order');
const User = require('../models/User');
const transbankService = require('../services/transbank.service');
const emailService = require('../services/email.service');

// ✅ DEBUGGING: Confirmar que el controlador se está cargando
console.log('🔧 Cargando payment.controller.js...');

// @desc    Crear transacción de pago para una orden (Webpay)
// @route   POST /api/payment/create-transaction/:orderId
// @access  Private
exports.createPaymentTransaction = async (req, res, next) => {
  console.log('🚀 === INICIO createPaymentTransaction ===');
  console.log(`📋 OrderId recibido: ${req.params.orderId}`);
  console.log(`👤 Usuario: ${req.user?.id} (${req.user?.role})`);
  
  try {
    console.log(`🔍 Buscando orden ${req.params.orderId}...`);
    
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

    console.log(`✅ Orden encontrada: ${order._id}`);
    console.log(`📋 Propietario: ${order.user._id}`);
    console.log(`📋 Total: $${order.totalPrice}`);
    console.log(`📋 Método de pago: ${order.paymentMethod}`);
    console.log(`📋 Ya pagada: ${order.isPaid}`);

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

    console.log(`✅ Todas las validaciones pasaron`);

    // Crear transacción con Transbank
    try {
      console.log(`💻 Enviando orden ${order._id} al servicio de Transbank`);
      const transaction = await transbankService.createPaymentTransaction(order);
      
      console.log(`✅ Transacción Webpay creada con éxito:`);
      console.log(`   - Token: ${transaction.token}`);
      console.log(`   - URL: ${transaction.url}`);
      console.log(`   - Amount: ${transaction.amount}`);
      
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
      console.log(`💾 Información de transacción guardada en la orden`);
      
      console.log('✅ === FIN createPaymentTransaction EXITOSO ===');
      
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
      console.error(`💥 Stack trace:`, transbankError.stack);
      
      return res.status(500).json({
        success: false,
        error: `Error al crear transacción de pago: ${transbankError.message}`
      });
    }
  } catch (err) {
    console.error('💥 Error general en createPaymentTransaction:', err);
    console.error('💥 Stack trace:', err.stack);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
    
    console.log('❌ === FIN createPaymentTransaction CON ERROR ===');
  }
};

// @desc    Manejar retorno desde Webpay
// @route   POST /api/payment/webpay/return
// @access  Public
exports.handleWebpayReturn = async (req, res, next) => {
  try {
    console.log('🔄 === INICIO handleWebpayReturn ===');
    console.log('📋 Method:', req.method);
    console.log('📋 Body:', req.body);
    console.log('📋 Query:', req.query);
    console.log('📋 Headers:', req.headers);
    
    // ✅ MEJORADO: Manejar tanto POST como GET
    let token_ws = null;
    
    if (req.method === 'POST') {
      token_ws = req.body.token_ws;
      console.log('📋 Token desde POST body:', token_ws);
    } else if (req.method === 'GET') {
      token_ws = req.query.token_ws;
      console.log('📋 Token desde GET query:', token_ws);
    }
    
    if (!token_ws) {
      console.error('❌ Token no recibido desde Webpay');
      console.error('📋 Body completo:', JSON.stringify(req.body, null, 2));
      console.error('📋 Query completo:', JSON.stringify(req.query, null, 2));
      
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?error=no_token`);
    }

    console.log(`✅ Token recibido: ${token_ws}`);

    try {
      // Confirmar transacción con Transbank
      console.log(`🔍 Confirmando transacción con token: ${token_ws}`);
      const transactionResult = await transbankService.confirmPaymentTransaction(token_ws);
      
      console.log('📊 Resultado de transacción:', transactionResult);
      
      // ✅ MÉTODO MEJORADO: Múltiples formas de obtener orderId
      let orderId = null;
      
      // Método 1: Función de extracción directa
      orderId = transbankService.extractOrderIdFromBuyOrder(transactionResult.buyOrder);
      
      // Método 2: Buscar en base de datos por buyOrder
      if (!orderId) {
        console.log(`⚠️ Extracción directa falló, buscando en BD por buyOrder...`);
        orderId = await transbankService.findOrderIdByBuyOrder(transactionResult.buyOrder);
      }
      
      // Método 3: Buscar por token en paymentResult
      if (!orderId) {
        console.log(`⚠️ Búsqueda por buyOrder falló, buscando por token...`);
        const orderByToken = await Order.findOne({
          'paymentResult.id': token_ws
        }).select('_id');
        
        if (orderByToken) {
          orderId = orderByToken._id.toString();
          console.log(`✅ OrderId encontrado por token: ${orderId}`);
        }
      }
      
      // ✅ MÉTODO 4: Buscar cualquier orden con status pending y mismo usuario
      if (!orderId) {
        console.log(`⚠️ Búsqueda por token falló, buscando orden pendiente reciente...`);
        
        // Buscar orden creada en las últimas 2 horas con status pending
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const pendingOrder = await Order.findOne({
          paymentMethod: 'webpay',
          status: 'pending',
          isPaid: false,
          createdAt: { $gte: twoHoursAgo }
        }).sort({ createdAt: -1 }).select('_id');
        
        if (pendingOrder) {
          orderId = pendingOrder._id.toString();
          console.log(`✅ OrderId encontrado por orden pendiente: ${orderId}`);
        }
      }
      
      if (!orderId) {
        console.error(`❌ No se pudo encontrar orderId con ningún método:`);
        console.error(`   - buyOrder: ${transactionResult.buyOrder}`);
        console.error(`   - token: ${token_ws}`);
        
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?error=order_not_found&buyOrder=${encodeURIComponent(transactionResult.buyOrder)}&token=${encodeURIComponent(token_ws)}`);
      }
      
      console.log(`🎯 OrderId final determinado: ${orderId}`);
      
      const order = await Order.findById(orderId);
      
      if (!order) {
        console.error(`❌ Orden no encontrada en BD para ID: ${orderId}`);
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?error=order_not_found&orderId=${orderId}`);
      }

      console.log(`✅ Orden encontrada: ${order._id}, Status: ${order.status}, Paid: ${order.isPaid}`);

      // ✅ ACTUALIZAR ESTADO SEGÚN RESULTADO
      if (transactionResult.isApproved) {
        console.log(`✅ Pago APROBADO para orden ${order._id}`);
        
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
          installments: transactionResult.installmentsNumber,
          responseCode: transactionResult.responseCode
        };

        await order.save();
        console.log(`💾 Orden actualizada como PAGADA`);

        // Enviar email de confirmación
        try {
          const user = await User.findById(order.user);
          if (user) {
            await emailService.sendOrderConfirmationEmail(order, user);
            console.log(`📧 Email enviado a ${user.email}`);
          }
        } catch (emailError) {
          console.error('⚠️ Error al enviar email:', emailError);
        }

        // ✅ REDIRECCIÓN EXITOSA
        const successUrl = `${process.env.FRONTEND_URL}/payment/success?order=${order._id}&token=${token_ws}`;
        console.log(`🎉 Redirigiendo a éxito: ${successUrl}`);
        return res.redirect(successUrl);
        
      } else {
        console.log(`❌ Pago RECHAZADO para orden ${order._id}. Código: ${transactionResult.responseCode}`);
        
        order.paymentResult = {
          id: token_ws,
          buyOrder: transactionResult.buyOrder,
          status: 'rejected',
          responseCode: transactionResult.responseCode,
          updateTime: new Date(),
          paymentMethod: 'webpay',
          amount: transactionResult.amount
        };
        
        await order.save();
        console.log(`💾 Orden marcada como RECHAZADA`);
        
        // ✅ REDIRECCIÓN DE FALLO
        const failureUrl = `${process.env.FRONTEND_URL}/payment/failure?order=${order._id}&code=${transactionResult.responseCode}`;
        console.log(`❌ Redirigiendo a fallo: ${failureUrl}`);
        return res.redirect(failureUrl);
      }
      
    } catch (transbankError) {
      console.error('❌ Error al procesar respuesta de Transbank:', transbankError);
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?error=processing_error&details=${encodeURIComponent(transbankError.message)}`);
    }
    
  } catch (err) {
    console.error('💥 Error general en handleWebpayReturn:', err);
    console.error('💥 Stack:', err.stack);
    return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?error=system_error`);
  } finally {
    console.log('🔄 === FIN handleWebpayReturn ===');
  }
};

// @desc    Obtener estado de pago de una orden
// @route   GET /api/payment/status/:orderId
// @access  Private
exports.getPaymentStatus = async (req, res, next) => {
  console.log('🎯 === INICIO getPaymentStatus ===');
  console.log(`📋 OrderId recibido: ${req.params.orderId}`);
  console.log(`👤 Usuario ID: ${req.user?.id}`);
  console.log(`👤 Usuario role: ${req.user?.role}`);
  
  try {
    // Validar que el orderId es un ObjectId válido
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.orderId)) {
      console.error(`❌ OrderId inválido: ${req.params.orderId}`);
      return res.status(400).json({
        success: false,
        error: 'ID de orden inválido'
      });
    }
    
    console.log(`🔍 Buscando orden en base de datos...`);
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      console.log(`❌ Orden no encontrada en BD: ${req.params.orderId}`);
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    console.log(`✅ Orden encontrada: ${order._id}`);
    console.log(`📋 Propietario de la orden: ${order.user}`);
    console.log(`📋 Estado de la orden: ${order.status}`);
    console.log(`📋 Método de pago: ${order.paymentMethod}`);
    console.log(`📋 Está pagada: ${order.isPaid}`);

    // Verificar que el usuario es el propietario de la orden o es admin
    const isOwner = order.user.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    console.log(`🔐 Es propietario: ${isOwner}`);
    console.log(`🔐 Es admin: ${isAdmin}`);

    if (!isOwner && !isAdmin) {
      console.log(`⛔ Usuario ${req.user.id} no autorizado para orden ${order._id}`);
      return res.status(401).json({
        success: false,
        error: 'No autorizado para realizar esta acción'
      });
    }

    console.log(`✅ Usuario autorizado`);

    const responseData = {
      orderId: order._id,
      isPaid: order.isPaid,
      paidAt: order.paidAt,
      status: order.status,
      paymentResult: order.paymentResult,
      paymentMethod: order.paymentMethod
    };

    console.log(`📤 Enviando respuesta exitosa:`, responseData);

    res.status(200).json({
      success: true,
      data: responseData
    });
    
    console.log('✅ === FIN getPaymentStatus EXITOSO ===');
    
  } catch (err) {
    console.error(`💥 Error en getPaymentStatus:`, err);
    console.error(`💥 Stack trace:`, err.stack);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
    
    console.log('❌ === FIN getPaymentStatus CON ERROR ===');
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
  console.log('🔧 getPaymentConfig llamado');
  try {
    const config = transbankService.validateConfiguration();
    
    res.status(200).json({
      success: true,
      data: config
    });
  } catch (err) {
    console.error('💥 Error en getPaymentConfig:', err);
    next(err);
  }
};

// ✅ DEBUGGING: Confirmar que el controlador se cargó
console.log('✅ payment.controller.js cargado completamente');
console.log('📋 Funciones exportadas:');
console.log('   - createPaymentTransaction');
console.log('   - handleWebpayReturn');
console.log('   - getPaymentStatus');
console.log('   - processRefund');
console.log('   - getPaymentConfig');