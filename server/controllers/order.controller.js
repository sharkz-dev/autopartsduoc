// server/controllers/order.controller.js (actualizado)
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const emailService = require('../services/email.service');

// @desc    Crear nueva orden
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const {
      items,
      shipmentMethod,
      shippingAddress,
      pickupLocation,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      orderType
    } = req.body;

    // Verificar items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No hay productos en la orden'
      });
    }

    // Verificar método de envío
    if (!shipmentMethod || !['delivery', 'pickup'].includes(shipmentMethod)) {
      return res.status(400).json({
        success: false,
        error: 'Método de envío inválido'
      });
    }

    // Verificar dirección de envío para delivery
    if (shipmentMethod === 'delivery' && (!shippingAddress || !shippingAddress.street || !shippingAddress.city)) {
      return res.status(400).json({
        success: false,
        error: 'La dirección de envío es requerida para envíos a domicilio'
      });
    }

    // Verificar ubicación de retiro para pickup
    if (shipmentMethod === 'pickup' && (!pickupLocation || !pickupLocation.name || !pickupLocation.address)) {
      return res.status(400).json({
        success: false,
        error: 'La ubicación de retiro es requerida para retiro en tienda'
      });
    }

    // Obtener detalles completos de productos y verificar stock
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          error: `Producto no encontrado con ID: ${item.product}`
        });
      }

      // Verificar stock
      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Stock insuficiente para ${product.name}. Disponible: ${product.stockQuantity}`
        });
      }

      // Determinar precio correcto según tipo de orden (B2B o B2C)
      const price = orderType === 'B2B' && product.wholesalePrice 
        ? product.wholesalePrice 
        : product.price;

      // Añadir a items de orden
      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price,
        distributor: product.distributor
      });

      // Actualizar stock del producto
      product.stockQuantity -= item.quantity;
      await product.save();
    }

    // Crear orden
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      shipmentMethod,
      shippingAddress: shipmentMethod === 'delivery' ? shippingAddress : undefined,
      pickupLocation: shipmentMethod === 'pickup' ? pickupLocation : undefined,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      orderType: orderType || 'B2C',
      status: paymentMethod === 'cash' && shipmentMethod === 'pickup' ? 'pending' : 'pending'
    });

    // Cargar la orden completa con datos relacionados
    const populatedOrder = await Order.findById(order._id)
      .populate({
        path: 'user',
        select: 'name email'
      })
      .populate({
        path: 'items.product',
        select: 'name images'
      })
      .populate({
        path: 'items.distributor',
        select: 'name companyName email'
      });

    // Si el método de pago es contra reembolso o transferencia, enviar notificaciones
    if (paymentMethod === 'cash' || paymentMethod === 'bankTransfer') {
      try {
        // Enviar email de confirmación al usuario
        const user = await User.findById(req.user.id);
        await emailService.sendOrderConfirmationEmail(populatedOrder, user);

        // Agrupar items por distribuidor para enviar notificaciones
        const itemsByDistributor = {};
        for (const item of populatedOrder.items) {
          const distributorId = item.distributor._id.toString();
          if (!itemsByDistributor[distributorId]) {
            itemsByDistributor[distributorId] = {
              distributor: item.distributor,
              items: []
            };
          }
          itemsByDistributor[distributorId].items.push(item);
        }

        // Enviar notificación a cada distribuidor
        for (const distributorId in itemsByDistributor) {
          const { distributor, items } = itemsByDistributor[distributorId];
          await emailService.sendDistributorOrderNotification(
            populatedOrder,
            distributor,
            items
          );
        }
      } catch (emailError) {
        console.error('Error al enviar notificaciones por email:', emailError);
        // No interrumpir la creación de la orden por errores de email
      }
    }

    res.status(201).json({
      success: true,
      data: populatedOrder
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener orden por ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({
        path: 'user',
        select: 'name email'
      })
      .populate({
        path: 'items.product',
        select: 'name images'
      })
      .populate({
        path: 'items.distributor',
        select: 'name companyName'
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    // Verificar que el usuario es el propietario o un admin
    if (
      order.user._id.toString() !== req.user.id &&
      req.user.role !== 'admin' &&
      // Si es distribuidor, verificar que tenga algún producto en la orden
      !(
        req.user.role === 'distributor' &&
        order.items.some(item => item.distributor._id.toString() === req.user.id)
      )
    ) {
      return res.status(401).json({
        success: false,
        error: 'No está autorizado para ver esta orden'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener todas las órdenes del usuario actual
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate({
        path: 'items.product',
        select: 'name images'
      })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener todas las órdenes (admin)
// @route   GET /api/orders
// @access  Private (admin)
exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate({
        path: 'user',
        select: 'name email'
      })
      .populate({
        path: 'items.product',
        select: 'name images'
      })
      .populate({
        path: 'items.distributor',
        select: 'name companyName'
      })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener órdenes con productos del distribuidor actual
// @route   GET /api/orders/distributor-orders
// @access  Private (distribuidor)
exports.getDistributorOrders = async (req, res, next) => {
  try {
    // Buscar órdenes que contengan productos del distribuidor actual
    const orders = await Order.find({
      'items.distributor': req.user.id
    })
      .populate({
        path: 'user',
        select: 'name email'
      })
      .populate({
        path: 'items.product',
        select: 'name images price'
      })
      .sort('-createdAt');

    // Para cada orden, filtrar solo los items que pertenecen a este distribuidor
    const filteredOrders = orders.map(order => {
      const filteredItems = order.items.filter(
        item => item.distributor.toString() === req.user.id
      );
      
      // Crear objeto con solo los datos relevantes para el distribuidor
      return {
        _id: order._id,
        user: order.user,
        items: filteredItems,
        status: order.status,
        createdAt: order.createdAt,
        // Calcular subtotal para este distribuidor
        subtotal: filteredItems.reduce(
          (acc, item) => acc + item.price * item.quantity,
          0
        )
      };
    });

    res.status(200).json({
      success: true,
      count: filteredOrders.length,
      data: filteredOrders
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Actualizar estado de la orden
// @route   PUT /api/orders/:id/status
// @access  Private (admin y distribuidor parcialmente)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    // Verificar permisos según rol
    if (req.user.role === 'admin') {
      // El admin puede actualizar cualquier estado
      order.status = req.body.status;
      
      // Actualizar isPaid y paidAt si se marca como pagado
      if (req.body.isPaid) {
        order.isPaid = true;
        order.paidAt = Date.now();
      }
      
      // Actualizar isDelivered y deliveredAt según el estado
      if (['delivered', 'ready_for_pickup'].includes(req.body.status)) {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
      }
    } else if (req.user.role === 'distributor') {
      // Verificar que el distribuidor tiene productos en la orden
      const hasProducts = order.items.some(
        item => item.distributor.toString() === req.user.id
      );

      if (!hasProducts) {
        return res.status(401).json({
          success: false,
          error: 'No está autorizado para actualizar esta orden'
        });
      }

      // Los distribuidores solo pueden actualizar entre ciertos estados
      const allowedStatusChanges = ['processing', 'shipped', 'ready_for_pickup'];
      if (!allowedStatusChanges.includes(req.body.status)) {
        return res.status(400).json({
          success: false,
          error: 'Los distribuidores solo pueden cambiar el estado a: processing, shipped, ready_for_pickup'
        });
      }

      order.status = req.body.status;
      
      // Si el estado es "listo para retiro" y el método de envío es "pickup"
      if (req.body.status === 'ready_for_pickup' && order.shipmentMethod === 'pickup') {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
      }
    } else {
      return res.status(401).json({
        success: false,
        error: 'No está autorizado para actualizar el estado de la orden'
      });
    }

    await order.save();

    // Enviar notificación al cliente sobre cambio de estado
    try {
      const user = await User.findById(order.user);
      if (user) {
        await emailService.sendOrderStatusUpdateEmail(order, user);
      }
    } catch (emailError) {
      console.error('Error al enviar email de actualización de estado:', emailError);
      // No interrumpir la actualización por errores de email
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancelar una orden
// @route   PUT /api/orders/:id/cancel
// @access  Private (usuario dueño o admin)
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    // Verificar que el usuario es el propietario o un admin
    if (
      order.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        error: 'No está autorizado para cancelar esta orden'
      });
    }

    // Solo se puede cancelar si aún no ha sido enviada
    if (['shipped', 'delivered'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: 'No se puede cancelar una orden que ya ha sido enviada o entregada'
      });
    }

    // Actualizar estado a cancelado
    order.status = 'cancelled';

    // Restaurar stock de productos
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stockQuantity += item.quantity;
        await product.save();
      }
    }

    await order.save();

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    next(err);
  }
};

module.exports = exports;