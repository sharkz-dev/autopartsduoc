const Order = require('../models/Order');
const User = require('../models/User');
const transbankService = require('../services/transbank.service');
const emailService = require('../services/email.service');

// Crear transacción de pago para una orden (Webpay)
exports.createPaymentTransaction = async (req, res, next) => {
  try {
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
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    // Verificar que el usuario es el propietario de la orden
    if (order.user._id.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado para realizar esta acción'
      });
    }

    if (order.isPaid) {
      return res.status(400).json({
        success: false,
        error: 'Esta orden ya ha sido pagada'
      });
    }

    const allowedStatuses = ['pending'];
    if (!allowedStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: `No se puede procesar el pago para una orden en estado: ${order.status}`
      });
    }

    if (order.paymentMethod !== 'webpay') {
      return res.status(400).json({
        success: false,
        error: 'Esta orden no está configurada para pago con Webpay'
      });
    }

    // Limpiar transacción anterior si existe
    if (order.paymentResult && order.paymentResult.id) {
      order.paymentResult = {
        status: 'retrying',
        previousAttempt: order.paymentResult,
        updateTime: new Date()
      };
      await order.save();
    }

    // Crear transacción con Transbank
    try {
      const transaction = await transbankService.createPaymentTransaction(order);
      
      order.paymentResult = {
        id: transaction.token,
        buyOrder: transaction.buyOrder,
        sessionId: transaction.sessionId,
        status: 'pending',
        paymentMethod: 'webpay',
        updateTime: new Date(),
        isRetry: !!(order.paymentResult?.previousAttempt),
        retryCount: (order.paymentResult?.retryCount || 0) + 1
      };
      
      order.status = 'pending';
      await order.save();
      
      return res.status(200).json({
        success: true,
        data: {
          token: transaction.token,
          url: transaction.url,
          orderId: order._id,
          amount: transaction.amount,
          isRetry: order.paymentResult.isRetry,
          retryCount: order.paymentResult.retryCount
        }
      });
      
    } catch (transbankError) {
      console.error(`Error de Transbank para orden ${order._id}:`, transbankError);
      
      order.paymentResult = {
        ...(order.paymentResult || {}),
        status: 'failed',
        error: transbankError.message,
        updateTime: new Date(),
        failedAttempts: (order.paymentResult?.failedAttempts || 0) + 1
      };
      await order.save();
      
      return res.status(500).json({
        success: false,
        error: `Error al crear transacción de pago: ${transbankError.message}`
      });
    }
  } catch (err) {
    console.error('Error general en createPaymentTransaction:', err);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Manejar retorno desde Webpay
exports.handleWebpayReturn = async (req, res, next) => {
  try {
    let token_ws = null;
    
    if (req.method === 'POST') {
      token_ws = req.body.token_ws;
    } else if (req.method === 'GET') {
      token_ws = req.query.token_ws;
    }
    
    if (!token_ws) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?error=no_token`);
    }

    try {
      const transactionResult = await transbankService.confirmPaymentTransaction(token_ws);
      
      // Múltiples formas de obtener orderId
      let orderId = null;
      
      // Método 1: Función de extracción directa
      orderId = transbankService.extractOrderIdFromBuyOrder(transactionResult.buyOrder);
      
      // Método 2: Buscar en base de datos por buyOrder
      if (!orderId) {
        orderId = await transbankService.findOrderIdByBuyOrder(transactionResult.buyOrder);
      }
      
      // Método 3: Buscar por token en paymentResult
      if (!orderId) {
        const orderByToken = await Order.findOne({
          'paymentResult.id': token_ws
        }).select('_id');
        
        if (orderByToken) {
          orderId = orderByToken._id.toString();
        }
      }
      
      // Método 4: Buscar cualquier orden con status pending y mismo usuario
      if (!orderId) {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const pendingOrder = await Order.findOne({
          paymentMethod: 'webpay',
          status: 'pending',
          isPaid: false,
          createdAt: { $gte: twoHoursAgo }
        }).sort({ createdAt: -1 }).select('_id');
        
        if (pendingOrder) {
          orderId = pendingOrder._id.toString();
        }
      }
      
      if (!orderId) {
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?error=order_not_found&buyOrder=${encodeURIComponent(transactionResult.buyOrder)}&token=${encodeURIComponent(token_ws)}`);
      }
      
      const order = await Order.findById(orderId);
      
      if (!order) {
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?error=order_not_found&orderId=${orderId}`);
      }

      // Actualizar estado según resultado
      if (transactionResult.isApproved) {
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
          responseCode: transactionResult.responseCode,
          isRetry: order.paymentResult?.isRetry || false,
          retryCount: order.paymentResult?.retryCount || 1,
          previousAttempts: order.paymentResult?.previousAttempt ? [order.paymentResult.previousAttempt] : []
        };

        await order.save();

        // Enviar email de confirmación
        try {
          const user = await User.findById(order.user);
          if (user) {
            await emailService.sendOrderConfirmationEmail(order, user);
          }
        } catch (emailError) {
          console.error('Error al enviar email:', emailError);
        }

        const successUrl = `${process.env.FRONTEND_URL}/payment/success?order=${order._id}&token=${token_ws}`;
        return res.redirect(successUrl);
        
      } else {
        order.paymentResult = {
          id: token_ws,
          buyOrder: transactionResult.buyOrder,
          status: 'rejected',
          responseCode: transactionResult.responseCode,
          updateTime: new Date(),
          paymentMethod: 'webpay',
          amount: transactionResult.amount,
          isRetry: order.paymentResult?.isRetry || false,
          retryCount: order.paymentResult?.retryCount || 1,
          failedAttempts: (order.paymentResult?.failedAttempts || 0) + 1
        };
        
        await order.save();
        
        const failureUrl = `${process.env.FRONTEND_URL}/payment/failure?order=${order._id}&code=${transactionResult.responseCode}&retry=true`;
        return res.redirect(failureUrl);
      }
      
    } catch (transbankError) {
      console.error('Error al procesar respuesta de Transbank:', transbankError);
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?error=processing_error&details=${encodeURIComponent(transbankError.message)}`);
    }
    
  } catch (err) {
    console.error('Error general en handleWebpayReturn:', err);
    return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?error=system_error`);
  }
};

// Obtener estado de pago de una orden
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.orderId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de orden inválido'
      });
    }
    
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    const isOwner = order.user.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado para realizar esta acción'
      });
    }

    const responseData = {
      orderId: order._id,
      isPaid: order.isPaid,
      paidAt: order.paidAt,
      status: order.status,
      paymentResult: order.paymentResult,
      paymentMethod: order.paymentMethod,
      canRetryPayment: !order.isPaid && order.paymentMethod === 'webpay' && order.status === 'pending',
      retryCount: order.paymentResult?.retryCount || 0,
      lastPaymentAttempt: order.paymentResult?.updateTime
    };

    res.status(200).json({
      success: true,
      data: responseData
    });
    
  } catch (err) {
    console.error('Error en getPaymentStatus:', err);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Procesar anulación de pago
exports.processRefund = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    if (!order.isPaid) {
      return res.status(400).json({
        success: false,
        error: 'No se puede anular una orden que no ha sido pagada'
      });
    }

    if (!order.paymentResult || !order.paymentResult.id) {
      return res.status(400).json({
        success: false,
        error: 'No se encontró información de pago para anular'
      });
    }

    try {
      const refundResult = await transbankService.refundTransaction(
        order.paymentResult.id,
        order.totalPrice
      );

      if (refundResult.success) {
        order.status = 'cancelled';
        order.paymentResult.refund = {
          id: refundResult.refundId,
          amount: refundResult.amount,
          status: 'completed',
          processedAt: new Date()
        };

        await order.save();

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
      console.error(`Error en anulación para orden ${order._id}:`, refundError);
      
      res.status(500).json({
        success: false,
        error: `Error al procesar anulación: ${refundError.message}`
      });
    }
  } catch (err) {
    console.error('Error en processRefund:', err);
    next(err);
  }
};

// Validar configuración de Transbank
exports.getPaymentConfig = async (req, res, next) => {
  try {
    const config = transbankService.validateConfiguration();
    
    res.status(200).json({
      success: true,
      data: config
    });
  } catch (err) {
    console.error('Error en getPaymentConfig:', err);
    next(err);
  }
};

// Cancelar transacción pendiente y permitir reintento
exports.cancelPendingTransaction = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado para realizar esta acción'
      });
    }

    if (order.isPaid) {
      return res.status(400).json({
        success: false,
        error: 'No se puede cancelar una orden ya pagada'
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Solo se pueden cancelar órdenes pendientes'
      });
    }

    order.paymentResult = {
      status: 'cancelled_by_user',
      cancelledAt: new Date(),
      previousAttempt: order.paymentResult
    };

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Transacción cancelada. Puedes intentar el pago nuevamente.',
      data: {
        orderId: order._id,
        canRetryPayment: true
      }
    });

  } catch (err) {
    console.error('Error en cancelPendingTransaction:', err);
    next(err);
  }
};

module.exports = exports;