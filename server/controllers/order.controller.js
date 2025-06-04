const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const SystemConfig = require('../models/SystemConfig');
const emailService = require('../services/email.service');
const SystemConfigService = require('../services/systemConfig.service');

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

    console.log('🛒 === CREANDO NUEVA ORDEN ===');
    console.log('👤 Usuario:', req.user.id);
    console.log('📦 Items:', items?.length || 0);
    console.log('🚚 Método de envío:', shipmentMethod);
    console.log('💳 Método de pago:', paymentMethod);
    console.log('💰 Precio frontend:', { itemsPrice, taxPrice, shippingPrice, totalPrice });

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
    console.log(`📊 Usando tasa de IVA actual: ${currentTaxRate}%`);

    // ✅ CORREGIDO: Obtener detalles completos de productos y calcular precios correctamente
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

      // ✅ CORREGIDO: Determinar precio correcto con descuentos
      let finalPrice = product.price; // Precio base minorista
      
      console.log(`💰 Calculando precio para ${product.name}:`);
      console.log(`   - Precio base: $${product.price}`);
      console.log(`   - Precio mayorista: $${product.wholesalePrice || 'N/A'}`);
      console.log(`   - En oferta: ${product.onSale}`);
      console.log(`   - Descuento: ${product.discountPercentage}%`);
      console.log(`   - Tipo de orden: ${orderType}`);
      
      // Usar precio mayorista si es orden B2B y el producto lo tiene
      if (orderType === 'B2B' && product.wholesalePrice) {
        finalPrice = product.wholesalePrice;
        console.log(`   - Usando precio mayorista: $${finalPrice}`);
      } else {
        console.log(`   - Usando precio minorista: $${finalPrice}`);
      }
      
      // ✅ CRÍTICO: Aplicar descuento al precio correcto (mayorista o minorista)
      if (product.onSale && product.discountPercentage > 0) {
        const discountedPrice = Math.round(finalPrice * (1 - product.discountPercentage / 100));
        console.log(`   - Aplicando descuento del ${product.discountPercentage}%`);
        console.log(`   - Precio original: $${finalPrice}`);
        console.log(`   - Precio con descuento: $${discountedPrice}`);
        console.log(`   - Ahorro: $${finalPrice - discountedPrice}`);
        
        finalPrice = discountedPrice;
      }
      
      console.log(`   - Precio final: $${finalPrice}`);

      // Calcular subtotal del item
      const itemTotal = finalPrice * item.quantity;
      calculatedItemsPrice += itemTotal;
      
      console.log(`   - Cantidad: ${item.quantity}`);
      console.log(`   - Subtotal del item: $${itemTotal}`);

      // Añadir a items de orden
      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: finalPrice // ✅ Usar el precio final con descuentos aplicados
      });

      // Actualizar stock del producto
      product.stockQuantity -= item.quantity;
      await product.save();
    }

    console.log(`💰 Precio total calculado de items: $${calculatedItemsPrice}`);

    // Recalcular impuestos con la tasa actual del sistema
    const calculatedTaxPrice = await SystemConfigService.calculateTax(calculatedItemsPrice);
    
    // Calcular costo de envío usando configuración del sistema
    const calculatedShippingPrice = await SystemConfigService.calculateShippingCost(
      calculatedItemsPrice, 
      shipmentMethod
    );

    // Calcular total final
    const calculatedTotalPrice = calculatedItemsPrice + calculatedTaxPrice + calculatedShippingPrice;

    // Log para debugging
    console.log('💰 Cálculos finales de orden:');
    console.log(`   - Items: $${calculatedItemsPrice.toLocaleString()}`);
    console.log(`   - IVA (${currentTaxRate}%): $${calculatedTaxPrice.toLocaleString()}`);
    console.log(`   - Envío: $${calculatedShippingPrice.toLocaleString()}`);
    console.log(`   - Total: $${calculatedTotalPrice.toLocaleString()}`);

    // ✅ VERIFICACIÓN: Comparar con lo enviado desde frontend
    const tolerance = 100; // Tolerancia de $100 CLP para diferencias de redondeo
    
    if (Math.abs(calculatedItemsPrice - itemsPrice) > tolerance) {
      console.warn(`⚠️ Diferencia en precio de items: Frontend: $${itemsPrice}, Backend: $${calculatedItemsPrice}`);
      console.warn(`⚠️ Diferencia: $${Math.abs(calculatedItemsPrice - itemsPrice)}`);
    }
    
    if (Math.abs(calculatedTaxPrice - taxPrice) > tolerance) {
      console.warn(`⚠️ Diferencia en IVA: Frontend: $${taxPrice}, Backend: $${calculatedTaxPrice}`);
    }

    if (Math.abs(calculatedTotalPrice - totalPrice) > tolerance) {
      console.warn(`⚠️ Diferencia en total: Frontend: $${totalPrice}, Backend: $${calculatedTotalPrice}`);
    }

    // ✅ USAR VALORES CALCULADOS EN BACKEND para garantizar consistencia
    const finalOrderData = {
      user: req.user.id,
      items: orderItems,
      shipmentMethod,
      shippingAddress: shipmentMethod === 'delivery' ? shippingAddress : undefined,
      pickupLocation: shipmentMethod === 'pickup' ? pickupLocation : undefined,
      paymentMethod,
      itemsPrice: calculatedItemsPrice,    // ✅ Usar valor calculado
      taxPrice: calculatedTaxPrice,        // ✅ Usar valor calculado
      shippingPrice: calculatedShippingPrice, // ✅ Usar valor calculado
      totalPrice: calculatedTotalPrice,    // ✅ Usar valor calculado
      orderType: orderType || 'B2C',
      status: paymentMethod === 'cash' && shipmentMethod === 'pickup' ? 'pending' : 'pending',
      // Guardar la tasa de IVA usada para esta orden
      taxRate: currentTaxRate
    };

    console.log('📋 Datos finales de la orden:', {
      itemsPrice: finalOrderData.itemsPrice,
      taxPrice: finalOrderData.taxPrice,
      shippingPrice: finalOrderData.shippingPrice,
      totalPrice: finalOrderData.totalPrice,
      itemCount: finalOrderData.items.length
    });

    // Crear orden con los valores calculados en el backend
    const order = await Order.create(finalOrderData);

    // Cargar la orden completa con datos relacionados
    const populatedOrder = await Order.findById(order._id)
      .populate({
        path: 'user',
        select: 'name email'
      })
      .populate({
        path: 'items.product',
        select: 'name images'
      });

    console.log('✅ Orden creada exitosamente:', {
      orderId: order._id,
      total: order.totalPrice,
      status: order.status
    });

    // Si el método de pago es contra reembolso o transferencia, enviar notificaciones
    if (paymentMethod === 'cash' || paymentMethod === 'bankTransfer') {
      try {
        // Enviar email de confirmación al usuario
        const user = await User.findById(req.user.id);
        await emailService.sendOrderConfirmationEmail(populatedOrder, user);
        console.log('📧 Email de confirmación enviado');
      } catch (emailError) {
        console.error('Error al enviar notificaciones por email:', emailError);
        // No interrumpir la creación de la orden por errores de email
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
    console.error('❌ Error al crear orden:', err);
    
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
        console.log('🔄 Stock restaurado después del error');
      } catch (restoreError) {
        console.error('Error al restaurar stock:', restoreError);
      }
    }
    
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
        select: 'name images sku price wholesalePrice category'
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

// @desc    Obtener mis órdenes
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

// @desc    Actualizar estado de la orden
// @route   PUT /api/orders/:id/status
// @access  Private (admin)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    console.log(`=== INICIO updateOrderStatus ===`);
    console.log(`ID de orden: ${req.params.id}`);
    console.log(`Usuario: ${req.user.name} (${req.user.role})`);
    console.log(`Nuevo estado solicitado: ${req.body.status}`);
    
    // Buscar la orden
    let order = await Order.findById(req.params.id);

    if (!order) {
      console.log(`❌ Orden no encontrada con ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    console.log(`✅ Orden encontrada. Estado actual: ${order.status}`);

    // Solo admin puede actualizar el estado
    if (req.user.role !== 'admin') {
      console.log(`❌ Usuario sin permisos: ${req.user.role}`);
      return res.status(401).json({
        success: false,
        error: 'No está autorizado para actualizar el estado de la orden'
      });
    }

    console.log(`👨‍💼 Usuario admin - puede actualizar cualquier estado`);
    
    // El admin puede actualizar cualquier estado
    const previousStatus = order.status;
    order.status = req.body.status;
    
    console.log(`Cambiando estado de "${previousStatus}" a "${req.body.status}"`);
    
    // Actualizar isPaid y paidAt si se marca como pagado
    if (req.body.isPaid !== undefined) {
      order.isPaid = req.body.isPaid;
      if (req.body.isPaid) {
        order.paidAt = Date.now();
        console.log(`✅ Marcado como pagado`);
      }
    }
    
    // Actualizar isDelivered y deliveredAt según el estado
    if (['delivered', 'ready_for_pickup'].includes(req.body.status)) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      console.log(`✅ Marcado como entregado`);
    }

    // Guardar cambios
    console.log(`💾 Guardando cambios en la base de datos...`);
    await order.save();
    console.log(`✅ Cambios guardados exitosamente`);

    // Enviar notificación al cliente sobre cambio de estado
    try {
      const user = await User.findById(order.user);
      if (user) {
        console.log(`📧 Enviando notificación por email a: ${user.email}`);
        await emailService.sendOrderStatusUpdateEmail(order, user);
        console.log(`✅ Email enviado exitosamente`);
      }
    } catch (emailError) {
      console.error('⚠️ Error al enviar email de actualización de estado:', emailError);
      // No interrumpir la actualización por errores de email
    }

    // Obtener orden actualizada con datos poblados para la respuesta
    const updatedOrder = await Order.findById(order._id)
      .populate({
        path: 'user',
        select: 'name email'
      })
      .populate({
        path: 'items.product',
        select: 'name images'
      });

    console.log(`=== FIN updateOrderStatus - ÉXITO ===`);
    
    res.status(200).json({
      success: true,
      data: updatedOrder
    });
  } catch (err) {
    console.error('💥 Error en updateOrderStatus:', err);
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