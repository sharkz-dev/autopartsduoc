const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const SystemConfig = require('../models/SystemConfig');
const emailService = require('../services/email.service');
const SystemConfigService = require('../services/systemConfig.service');

// Crear nueva orden
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

    // Obtener el porcentaje de IVA actual desde la configuración del sistema
    const currentTaxRate = await SystemConfigService.getTaxRate();
    
    // Obtener detalles completos de productos y calcular precios correctamente
    const orderItems = [];
    let calculatedItemsPrice = 0;
    
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

      // Determinar precio correcto con descuentos
      let finalPrice = product.price; // Precio base minorista
      
      // Usar precio mayorista si es orden B2B y el producto lo tiene
      if (orderType === 'B2B' && product.wholesalePrice) {
        finalPrice = product.wholesalePrice;
      }
      
      // Aplicar descuento al precio correcto (mayorista o minorista)
      if (product.onSale && product.discountPercentage > 0) {
        const discountedPrice = Math.round(finalPrice * (1 - product.discountPercentage / 100));
        finalPrice = discountedPrice;
      }

      // Calcular subtotal del item
      const itemTotal = finalPrice * item.quantity;
      calculatedItemsPrice += itemTotal;

      // Añadir a items de orden
      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: finalPrice
      });

      // Actualizar stock del producto
      product.stockQuantity -= item.quantity;
      await product.save();
    }

    // Recalcular impuestos con la tasa actual del sistema
    const calculatedTaxPrice = await SystemConfigService.calculateTax(calculatedItemsPrice);
    
    // Calcular costo de envío usando configuración del sistema
    const calculatedShippingPrice = await SystemConfigService.calculateShippingCost(
      calculatedItemsPrice, 
      shipmentMethod
    );

    // Calcular total final
    const calculatedTotalPrice = calculatedItemsPrice + calculatedTaxPrice + calculatedShippingPrice;

    // Usar valores calculados en backend para garantizar consistencia
    const finalOrderData = {
      user: req.user.id,
      items: orderItems,
      shipmentMethod,
      shippingAddress: shipmentMethod === 'delivery' ? shippingAddress : undefined,
      pickupLocation: shipmentMethod === 'pickup' ? pickupLocation : undefined,
      paymentMethod,
      itemsPrice: calculatedItemsPrice,
      taxPrice: calculatedTaxPrice,
      shippingPrice: calculatedShippingPrice,
      totalPrice: calculatedTotalPrice,
      orderType: orderType || 'B2C',
      status: paymentMethod === 'cash' && shipmentMethod === 'pickup' ? 'pending' : 'pending',
      taxRate: currentTaxRate
    };

    // Crear orden con los valores calculados en el backend
    const order = await Order.create(finalOrderData);

    // ✅ CORREGIDO: Cargar la orden completa con datos poblados correctamente
    const populatedOrder = await Order.findById(order._id)
      .populate({
        path: 'user',
        select: 'name email'
      })
      .populate({
        path: 'items.product',
        select: 'name images sku category', // ✅ Incluir 'category' aquí
        populate: {
          path: 'category',
          select: 'name' // ✅ Popular la categoría también
        }
      });

    // Si el método de pago es contra reembolso o transferencia, enviar notificaciones
    if (paymentMethod === 'cash' || paymentMethod === 'bankTransfer') {
      try {
        const user = await User.findById(req.user.id);
        await emailService.sendOrderConfirmationEmail(populatedOrder, user);
      } catch (emailError) {
        console.error('Error al enviar notificaciones por email:', emailError);
      }
    }

    res.status(201).json({
      success: true,
      data: populatedOrder,
      calculationDetails: {
        taxRate: currentTaxRate,
        taxPercentage: `${currentTaxRate}%`,
        recalculated: {
          itemsPrice: calculatedItemsPrice,
          taxPrice: calculatedTaxPrice,
          shippingPrice: calculatedShippingPrice,
          totalPrice: calculatedTotalPrice
        }
      }
    });
  } catch (err) {
    console.error('Error al crear orden:', err);
    
    // Restaurar stock si hay error después de haberlo reducido
    if (orderItems && orderItems.length > 0) {
      try {
        for (const item of orderItems) {
          const product = await Product.findById(item.product);
          if (product) {
            product.stockQuantity += item.quantity;
            await product.save();
          }
        }
      } catch (restoreError) {
        console.error('Error al restaurar stock:', restoreError);
      }
    }
    
    next(err);
  }
};

// Obtener orden por ID
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({
        path: 'user',
        select: 'name email'
      })
      .populate({
        path: 'items.product',
        select: 'name images sku price wholesalePrice category',
        populate: {
          path: 'category',
          select: 'name'
        }
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    // Verificar que el usuario es el propietario o un admin
    const isOwner = order.user._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(401).json({
        success: false,
        error: 'No está autorizado para ver esta orden'
      });
    }

    // Agregar información de tasa de IVA si está disponible
    let taxRateInfo = null;
    if (order.taxRate) {
      taxRateInfo = {
        rate: order.taxRate,
        percentage: `${order.taxRate}%`,
        appliedAt: order.createdAt
      };
    }

    res.status(200).json({
      success: true,
      data: order,
      taxRateInfo
    });
  } catch (err) {
    next(err);
  }
};

// Obtener mis órdenes
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

// Obtener todas las órdenes (admin)
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

// ✅ CORREGIDO: Actualizar estado de la orden con populate mejorado
exports.updateOrderStatus = async (req, res, next) => {
  try {
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    // Solo admin puede actualizar el estado
    if (req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'No está autorizado para actualizar el estado de la orden'
      });
    }
    
    const previousStatus = order.status;
    order.status = req.body.status;
    
    // Actualizar isPaid y paidAt si se marca como pagado
    if (req.body.isPaid !== undefined) {
      order.isPaid = req.body.isPaid;
      if (req.body.isPaid) {
        order.paidAt = Date.now();
      }
    }
    
    // Actualizar isDelivered y deliveredAt según el estado
    if (['delivered', 'ready_for_pickup'].includes(req.body.status)) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    await order.save();

    // ✅ CORREGIDO: Enviar notificación al cliente con orden completa
    try {
      // Obtener la orden completa con todos los datos poblados
      const fullOrder = await Order.findById(order._id)
        .populate({
          path: 'user',
          select: 'name email'
        })
        .populate({
          path: 'items.product',
          select: 'name images sku category',
          populate: {
            path: 'category',
            select: 'name'
          }
        });

      const user = await User.findById(order.user);
      if (user && fullOrder) {
        await emailService.sendOrderStatusUpdateEmail(fullOrder, user);
      }
    } catch (emailError) {
      console.error('Error al enviar email de actualización de estado:', emailError);
    }

    // Obtener orden actualizada con datos poblados para la respuesta
    const updatedOrder = await Order.findById(order._id)
      .populate({
        path: 'user',
        select: 'name email'
      })
      .populate({
        path: 'items.product',
        select: 'name images sku category',
        populate: {
          path: 'category',
          select: 'name'
        }
      });
    
    res.status(200).json({
      success: true,
      data: updatedOrder
    });
  } catch (err) {
    console.error('Error en updateOrderStatus:', err);
    next(err);
  }
};

// Cancelar una orden
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