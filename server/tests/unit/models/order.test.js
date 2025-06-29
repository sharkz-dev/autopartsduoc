const Order = require('../../../models/Order');
const User = require('../../../models/User');
const Product = require('../../../models/Product');
const Category = require('../../../models/Category');

describe('Modelo Order', () => {
  let user, product, category;

  beforeEach(async () => {
    // Crear usuario de prueba
    user = new User({
      name: 'Cliente Test',
      email: 'cliente@test.com',
      password: 'password123',
      role: 'client'
    });
    await user.save();

    // Crear categoría de prueba
    category = new Category({
      name: 'Frenos',
      description: 'Sistema de frenos',
      slug: 'frenos'
    });
    await category.save();

    // Crear producto de prueba
    product = new Product({
      name: 'Pastillas de Freno',
      description: 'Pastillas de alta calidad',
      price: 50000,
      stockQuantity: 10,
      brand: 'Brembo',
      sku: 'BRE-001',
      category: category._id
    });
    await product.save();
  });

  const orderData = {
    items: [
      {
        quantity: 2,
        price: 50000
      }
    ],
    shipmentMethod: 'delivery',
    shippingAddress: {
      street: 'Calle Test 123',
      city: 'Santiago',
      state: 'Región Metropolitana',
      postalCode: '8320000',
      country: 'Chile'
    },
    paymentMethod: 'webpay',
    itemsPrice: 100000,
    taxPrice: 19000,
    shippingPrice: 5000,
    totalPrice: 124000,
    taxRate: 19
  };

  describe('Creación de órdenes', () => {
    test('debe crear una orden correctamente', async () => {
      const order = new Order({
        ...orderData,
        user: user._id,
        items: [{
          product: product._id,
          quantity: 2,
          price: 50000
        }]
      });

      const savedOrder = await order.save();

      expect(savedOrder.user).toEqual(user._id);
      expect(savedOrder.items).toHaveLength(1);
      expect(savedOrder.totalPrice).toBe(124000);
      expect(savedOrder.status).toBe('pending');
      expect(savedOrder.isPaid).toBe(false);
      expect(savedOrder.isDelivered).toBe(false);
    });

    test('debe requerir usuario', async () => {
      const order = new Order({
        ...orderData,
        items: [{
          product: product._id,
          quantity: 2,
          price: 50000
        }]
        // user faltante
      });

      await expect(order.save()).rejects.toThrow();
    });

    test('debe requerir al menos un item', async () => {
      const order = new Order({
        ...orderData,
        user: user._id,
        items: [] // Sin items
      });

      await expect(order.save()).rejects.toThrow();
    });

    test('debe validar cantidad mínima de items', async () => {
      const order = new Order({
        ...orderData,
        user: user._id,
        items: [{
          product: product._id,
          quantity: 0, // Cantidad inválida
          price: 50000
        }]
      });

      await expect(order.save()).rejects.toThrow();
    });
  });

  describe('Métodos de envío', () => {
    test('debe aceptar método delivery con dirección', async () => {
      const order = new Order({
        ...orderData,
        user: user._id,
        items: [{
          product: product._id,
          quantity: 2,
          price: 50000
        }],
        shipmentMethod: 'delivery'
      });

      await order.save();
      expect(order.shipmentMethod).toBe('delivery');
      expect(order.shippingAddress.street).toBe('Calle Test 123');
    });

    test('debe aceptar método pickup con ubicación', async () => {
      const order = new Order({
        ...orderData,
        user: user._id,
        items: [{
          product: product._id,
          quantity: 2,
          price: 50000
        }],
        shipmentMethod: 'pickup',
        pickupLocation: {
          name: 'Tienda Principal',
          address: 'Av. Principal 456'
        }
      });

      delete order.shippingAddress; // No necesario para pickup
      await order.save();
      
      expect(order.shipmentMethod).toBe('pickup');
      expect(order.pickupLocation.name).toBe('Tienda Principal');
    });
  });

  describe('Tipos de orden', () => {
    test('debe establecer B2C por defecto', async () => {
      const order = new Order({
        ...orderData,
        user: user._id,
        items: [{
          product: product._id,
          quantity: 2,
          price: 50000
        }]
      });

      await order.save();
      expect(order.orderType).toBe('B2C');
    });

    test('debe permitir orden B2B', async () => {
      const order = new Order({
        ...orderData,
        user: user._id,
        items: [{
          product: product._id,
          quantity: 2,
          price: 50000
        }],
        orderType: 'B2B'
      });

      await order.save();
      expect(order.orderType).toBe('B2B');
    });
  });

  describe('Información fiscal', () => {
    test('debe establecer fiscalInfo automáticamente', async () => {
      const order = new Order({
        ...orderData,
        user: user._id,
        items: [{
          product: product._id,
          quantity: 2,
          price: 50000
        }],
        taxRate: 19
      });

      await order.save();
      
      expect(order.fiscalInfo.appliedTaxRate).toBe(19);
      expect(order.fiscalInfo.taxCalculationDate).toBeDefined();
    });

    test('debe validar tasa de IVA en rango válido', async () => {
      const order = new Order({
        ...orderData,
        user: user._id,
        items: [{
          product: product._id,
          quantity: 2,
          price: 50000
        }],
        taxRate: 150 // Mayor a 100%
      });

      await expect(order.save()).rejects.toThrow();
    });

    test('debe validar tasa de IVA no negativa', async () => {
      const order = new Order({
        ...orderData,
        user: user._id,
        items: [{
          product: product._id,
          quantity: 2,
          price: 50000
        }],
        taxRate: -5 // Negativa
      });

      await expect(order.save()).rejects.toThrow();
    });
  });

  describe('Estados de la orden', () => {
    let order;

    beforeEach(async () => {
      order = new Order({
        ...orderData,
        user: user._id,
        items: [{
          product: product._id,
          quantity: 2,
          price: 50000
        }]
      });
      await order.save();
    });

    test('debe cambiar estado a processing', async () => {
      order.status = 'processing';
      await order.save();
      
      expect(order.status).toBe('processing');
    });

    test('debe cambiar estado a shipped', async () => {
      order.status = 'shipped';
      await order.save();
      
      expect(order.status).toBe('shipped');
    });

    test('debe cambiar estado a delivered', async () => {
      order.status = 'delivered';
      order.isDelivered = true;
      order.deliveredAt = new Date();
      await order.save();
      
      expect(order.status).toBe('delivered');
      expect(order.isDelivered).toBe(true);
      expect(order.deliveredAt).toBeDefined();
    });

    test('debe manejar estado cancelled', async () => {
      order.status = 'cancelled';
      await order.save();
      
      expect(order.status).toBe('cancelled');
    });
  });

  describe('Información de pago', () => {
    test('debe almacenar resultado de pago de Webpay', async () => {
      const order = new Order({
        ...orderData,
        user: user._id,
        items: [{
          product: product._id,
          quantity: 2,
          price: 50000
        }],
        paymentResult: {
          id: 'token_ws_123456',
          buyOrder: 'ORDER_123_456789',
          authorizationCode: '123456',
          status: 'approved',
          paymentMethod: 'webpay'
        },
        isPaid: true,
        paidAt: new Date()
      });

      await order.save();
      
      expect(order.paymentResult.status).toBe('approved');
      expect(order.paymentResult.paymentMethod).toBe('webpay');
      expect(order.isPaid).toBe(true);
    });
  });

  describe('Actualización de fechas', () => {
    test('debe actualizar updatedAt automáticamente', async () => {
      const order = new Order({
        ...orderData,
        user: user._id,
        items: [{
          product: product._id,
          quantity: 2,
          price: 50000
        }]
      });

      await order.save();
      const originalUpdatedAt = order.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 100));
      
      order.status = 'processing';
      await order.save();

      expect(order.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Virtual taxInfo', () => {
    test('debe calcular información de impuestos virtual', async () => {
      const order = new Order({
        ...orderData,
        user: user._id,
        items: [{
          product: product._id,
          quantity: 2,
          price: 50000
        }],
        taxRate: 19,
        taxPrice: 19000
      });

      await order.save();
      
      const taxInfo = order.taxInfo;
      expect(taxInfo.rate).toBe(19);
      expect(taxInfo.percentage).toBe('19%');
      expect(taxInfo.amount).toBe(19000);
      expect(taxInfo.appliedAt).toBeDefined();
    });
  });

  describe('Método estático getTaxStatistics', () => {
    test('debe calcular estadísticas de IVA por período', async () => {
      // Crear varias órdenes con diferentes tasas de IVA
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      const order1 = new Order({
        ...orderData,
        user: user._id,
        items: [{
          product: product._id,
          quantity: 1,
          price: 50000
        }],
        taxRate: 19,
        taxPrice: 9500,
        totalPrice: 59500
      });
      await order1.save();

      const order2 = new Order({
        ...orderData,
        user: user._id,
        items: [{
          product: product._id,
          quantity: 2,
          price: 50000
        }],
        taxRate: 19,
        taxPrice: 19000,
        totalPrice: 119000
      });
      await order2.save();

      const stats = await Order.getTaxStatistics(startDate, endDate);
      
      expect(stats).toHaveLength(1); // Solo una tasa de IVA (19%)
      expect(stats[0]._id).toBe(19);
      expect(stats[0].orderCount).toBe(2);
      expect(stats[0].totalTaxCollected).toBe(28500);
    });
  });

  describe('Método recalculateTax', () => {
    test('debe recalcular impuestos correctamente', async () => {
      const order = new Order({
        ...orderData,
        user: user._id,
        items: [{
          product: product._id,
          quantity: 2,
          price: 50000
        }],
        itemsPrice: 100000,
        taxRate: 19,
        taxPrice: 19000,
        totalPrice: 124000
      });

      await order.save();

      // Simular recálculo con nueva tasa
      const SystemConfigService = require('../../../services/systemConfig.service');
      jest.spyOn(SystemConfigService, 'calculateTax').mockResolvedValue(21000);

      const result = await order.recalculateTax(21, user._id);

      expect(result.previousTaxRate).toBe(19);
      expect(result.newTaxRate).toBe(21);
      expect(result.newTaxPrice).toBe(21000);
      expect(order.fiscalInfo.taxRecalculated).toBe(true);
    });
  });
});