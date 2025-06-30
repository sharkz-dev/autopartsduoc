const request = require('supertest');
const express = require('express');
const orderRoutes = require('../../../routes/order.routes');
const authRoutes = require('../../../routes/auth.routes');
const User = require('../../../models/User');
const Product = require('../../../models/Product');
const Category = require('../../../models/Category');
const Order = require('../../../models/Order');
const SystemConfig = require('../../../models/SystemConfig');

// Mock del servicio de email para evitar errores
jest.mock('../../../services/email.service', () => ({
  sendOrderConfirmationEmail: jest.fn(),
  sendOrderStatusUpdateEmail: jest.fn()
}));

// Mock del servicio SystemConfig
jest.mock('../../../services/systemConfig.service', () => ({
  getTaxRate: jest.fn().mockResolvedValue(19),
  calculateTax: jest.fn().mockImplementation((amount) => Math.round(amount * 0.19)),
  calculateShippingCost: jest.fn().mockImplementation((amount, method) => {
    if (method === 'pickup') return 0;
    return amount >= 100000 ? 0 : 5000;
  })
}));

// Configurar app de pruebas
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

describe('Controlador Order - Integración', () => {
  let clientUser, adminUser, clientToken, adminToken;
  let category, product1, product2;

  beforeEach(async () => {
    // Crear usuarios de prueba
    clientUser = new User({
      name: 'Cliente Test',
      email: 'cliente@test.com',
      password: 'password123',
      role: 'client'
    });
    await clientUser.save();
    clientToken = clientUser.getSignedJwtToken();

    adminUser = new User({
      name: 'Admin Test',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });
    await adminUser.save();
    adminToken = adminUser.getSignedJwtToken();

    // Crear configuraciones del sistema
    await SystemConfig.create([
      {
        key: 'tax_rate',
        value: 19,
        description: 'IVA',
        type: 'number',
        category: 'tax'
      },
      {
        key: 'free_shipping_threshold',
        value: 100000,
        description: 'Envío gratuito',
        type: 'number',
        category: 'shipping'
      },
      {
        key: 'default_shipping_cost',
        value: 5000,
        description: 'Costo envío',
        type: 'number',
        category: 'shipping'
      }
    ]);

    // Crear categoría y productos
    category = new Category({
      name: 'Repuestos',
      description: 'Repuestos automotrices',
      slug: 'repuestos'
    });
    await category.save();

    product1 = new Product({
      name: 'Pastillas de Freno',
      description: 'Pastillas premium',
      price: 50000,
      stockQuantity: 20,
      brand: 'Brembo',
      sku: 'BRAKE-001',
      category: category._id
    });
    await product1.save();

    product2 = new Product({
      name: 'Filtro de Aceite',
      description: 'Filtro original',
      price: 15000,
      stockQuantity: 30,
      brand: 'Mahle',
      sku: 'FILTER-001',
      category: category._id
    });
    await product2.save();
  });

  describe('POST /api/orders', () => {
    const validOrderData = {
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
      totalPrice: 124000
    };

    test('debe crear orden correctamente', async () => {
      const orderData = {
        ...validOrderData,
        items: [
          {
            product: product1._id,
            quantity: 2,
            price: 50000
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe('Cliente Test');
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.totalPrice).toBeDefined();
    });

    test('debe recalcular precios en el backend', async () => {
      const orderData = {
        ...validOrderData,
        items: [
          {
            product: product1._id,
            quantity: 1,
            price: 50000
          }
        ],
        // Enviar precios incorrectos intencionalmente
        itemsPrice: 999999,
        taxPrice: 888888,
        totalPrice: 777777
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      // Verificar que se recalculó correctamente
      expect(response.body.data.itemsPrice).toBe(50000); // Precio correcto
      expect(response.body.calculationDetails.recalculated).toBeDefined();
    });

    test('debe manejar envío gratuito por monto alto', async () => {
      const orderData = {
        ...validOrderData,
        items: [
          {
            product: product1._id,
            quantity: 3, // 150000 total, supera umbral
            price: 50000
          }
        ],
        itemsPrice: 150000
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.shippingPrice).toBe(0); // Envío gratuito
    });

    test('debe crear orden para retiro en tienda', async () => {
      const orderData = {
        ...validOrderData,
        shipmentMethod: 'pickup',
        pickupLocation: {
          name: 'Tienda Principal',
          address: 'Av. Principal 456',
          scheduledDate: new Date(Date.now() + 86400000) // Mañana
        },
        items: [
          {
            product: product1._id,
            quantity: 1,
            price: 50000
          }
        ]
      };

      delete orderData.shippingAddress; // No necesario para pickup

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.shipmentMethod).toBe('pickup');
      expect(response.body.data.pickupLocation.name).toBe('Tienda Principal');
      expect(response.body.data.shippingPrice).toBe(0); // Pickup siempre gratuito
    });

    test('debe reducir stock de productos', async () => {
      const initialStock = product1.stockQuantity;
      
      const orderData = {
        ...validOrderData,
        items: [
          {
            product: product1._id,
            quantity: 3,
            price: 50000
          }
        ]
      };

      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(orderData)
        .expect(201);

      // Verificar que se redujo el stock
      const updatedProduct = await Product.findById(product1._id);
      expect(updatedProduct.stockQuantity).toBe(initialStock - 3);
    });

    test('debe rechazar orden sin stock suficiente', async () => {
      const orderData = {
        ...validOrderData,
        items: [
          {
            product: product1._id,
            quantity: 100, // Más del stock disponible
            price: 50000
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Stock insuficiente');
    });

    test('debe requerir autenticación', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send(validOrderData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('debe validar método de envío', async () => {
      const orderData = {
        ...validOrderData,
        shipmentMethod: 'invalid_method'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Método de envío inválido');
    });

    test('debe requerir dirección para delivery', async () => {
      const orderData = {
        ...validOrderData,
        shipmentMethod: 'delivery'
      };
      delete orderData.shippingAddress;

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('dirección de envío es requerida');
    });

    test('debe requerir ubicación para pickup', async () => {
      const orderData = {
        ...validOrderData,
        shipmentMethod: 'pickup'
      };
      delete orderData.shippingAddress;
      // Sin pickupLocation

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('ubicación de retiro es requerida');
    });
  });

  describe('GET /api/orders/my-orders', () => {
    beforeEach(async () => {
      // Crear órdenes de prueba para el cliente con datos válidos
      await Order.create([
        {
          user: clientUser._id,
          items: [
            {
              product: product1._id,
              quantity: 1,
              price: 50000
            }
          ],
          shipmentMethod: 'delivery',
          shippingAddress: {
            street: 'Calle 1',
            city: 'Santiago',
            state: 'RM',
            postalCode: '8320000',
            country: 'Chile'
          },
          paymentMethod: 'webpay',
          itemsPrice: 50000,
          taxPrice: 9500,
          shippingPrice: 5000,
          totalPrice: 64500,
          status: 'delivered'
        },
        {
          user: clientUser._id,
          items: [
            {
              product: product2._id,
              quantity: 2,
              price: 15000
            }
          ],
          shipmentMethod: 'pickup',
          pickupLocation: {
            name: 'Tienda',
            address: 'Dirección'
          },
          paymentMethod: 'cash',
          itemsPrice: 30000,
          taxPrice: 5700,
          shippingPrice: 0,
          totalPrice: 35700,
          status: 'pending'
        }
      ]);
    });

    test('debe obtener órdenes del usuario autenticado', async () => {
      const response = await request(app)
        .get('/api/orders/my-orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
      
      // Verificar que todas las órdenes pertenecen al usuario
      response.body.data.forEach(order => {
        expect(order.user).toBe(clientUser._id.toString());
      });
    });

    test('debe ordenar por fecha más reciente', async () => {
      const response = await request(app)
        .get('/api/orders/my-orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      const dates = response.body.data.map(order => new Date(order.createdAt));
      expect(dates[0].getTime()).toBeGreaterThanOrEqual(dates[1].getTime());
    });

    test('debe requerir autenticación', async () => {
      const response = await request(app)
        .get('/api/orders/my-orders')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/orders/:id', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create({
        user: clientUser._id,
        items: [
          {
            product: product1._id,
            quantity: 1,
            price: 50000
          }
        ],
        shipmentMethod: 'delivery',
        shippingAddress: {
          street: 'Calle Test',
          city: 'Santiago',
          state: 'RM',
          postalCode: '8320000',
          country: 'Chile'
        },
        paymentMethod: 'webpay',
        itemsPrice: 50000,
        taxPrice: 9500,
        shippingPrice: 5000,
        totalPrice: 64500
      });
    });

    test('debe obtener orden por ID como propietario', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testOrder._id.toString());
      expect(response.body.data.user.name).toBe('Cliente Test');
    });

    test('debe obtener orden como admin', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testOrder._id.toString());
    });

    test('debe retornar 404 para orden inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/orders/${fakeId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('no encontrada');
    });
  });

  describe('PUT /api/orders/:id/status', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create({
        user: clientUser._id,
        items: [
          {
            product: product1._id,
            quantity: 1,
            price: 50000
          }
        ],
        shipmentMethod: 'delivery',
        shippingAddress: {
          street: 'Calle Test',
          city: 'Santiago',
          state: 'RM',
          postalCode: '8320000',
          country: 'Chile'
        },
        paymentMethod: 'webpay',
        itemsPrice: 50000,
        taxPrice: 9500,
        shippingPrice: 5000,
        totalPrice: 64500,
        status: 'pending'
      });
    });

    test('debe actualizar estado como admin', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'processing' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('processing');
    });

    test('debe marcar como pagado cuando se especifica', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          status: 'processing',
          isPaid: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isPaid).toBe(true);
      expect(response.body.data.paidAt).toBeDefined();
    });

    test('debe marcar como entregado para estados finales', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'delivered' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isDelivered).toBe(true);
      expect(response.body.data.deliveredAt).toBeDefined();
    });


    test('debe retornar 404 para orden inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .put(`/api/orders/${fakeId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'processing' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/orders/:id/cancel', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create({
        user: clientUser._id,
        items: [
          {
            product: product1._id,
            quantity: 2,
            price: 50000
          }
        ],
        shipmentMethod: 'delivery',
        shippingAddress: {
          street: 'Calle Test',
          city: 'Santiago',
          state: 'RM',
          postalCode: '8320000',
          country: 'Chile'
        },
        paymentMethod: 'webpay',
        itemsPrice: 100000,
        taxPrice: 19000,
        shippingPrice: 5000,
        totalPrice: 124000,
        status: 'pending'
      });
    });

    test('debe cancelar orden como propietario', async () => {
      const initialStock = product1.stockQuantity;

      const response = await request(app)
        .put(`/api/orders/${testOrder._id}/cancel`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');

      // Verificar que se restauró el stock
      const updatedProduct = await Product.findById(product1._id);
      expect(updatedProduct.stockQuantity).toBe(initialStock + 2);
    });

    test('debe cancelar orden como admin', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrder._id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
    });

    test('debe rechazar cancelación de orden enviada', async () => {
      // Actualizar orden a estado enviado
      await Order.findByIdAndUpdate(testOrder._id, { status: 'shipped' });

      const response = await request(app)
        .put(`/api/orders/${testOrder._id}/cancel`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('ya ha sido enviada');
    });

    test('debe rechazar cancelación de otro usuario', async () => {
      const otherUser = new User({
        name: 'Otro Usuario',
        email: 'otro@test.com',
        password: 'password123',
        role: 'client'
      });
      await otherUser.save();
      const otherToken = otherUser.getSignedJwtToken();

      const response = await request(app)
        .put(`/api/orders/${testOrder._id}/cancel`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/orders (admin)', () => {
    beforeEach(async () => {
      // Crear múltiples órdenes de diferentes usuarios
      const user2 = new User({
        name: 'Usuario 2',
        email: 'user2@test.com',
        password: 'password123',
        role: 'client'
      });
      await user2.save();

      await Order.create([
        {
          user: clientUser._id,
          items: [{ product: product1._id, quantity: 1, price: 50000 }],
          shipmentMethod: 'delivery',
          shippingAddress: {
            street: 'Calle 1',
            city: 'Santiago',
            state: 'RM',
            postalCode: '8320000',
            country: 'Chile'
          },
          paymentMethod: 'webpay',
          itemsPrice: 50000,
          taxPrice: 9500,
          shippingPrice: 5000,
          totalPrice: 64500
        },
        {
          user: user2._id,
          items: [{ product: product2._id, quantity: 1, price: 15000 }],
          shipmentMethod: 'pickup',
          pickupLocation: { name: 'Tienda', address: 'Dir' },
          paymentMethod: 'cash',
          itemsPrice: 15000,
          taxPrice: 2850,
          shippingPrice: 0,
          totalPrice: 17850
        }
      ]);
    });

    test('debe obtener todas las órdenes como admin', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
    });

    test('debe rechazar acceso como cliente', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('debe ordenar por fecha más reciente', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const dates = response.body.data.map(order => new Date(order.createdAt));
      expect(dates[0].getTime()).toBeGreaterThanOrEqual(dates[1].getTime());
    });
  });

  describe('Validaciones específicas', () => {
    test('debe requerir al menos un item', async () => {
      const orderData = {
        items: [], // Sin items
        shipmentMethod: 'delivery',
        shippingAddress: {
          street: 'Calle Test',
          city: 'Santiago',
          state: 'RM',
          postalCode: '8320000',
          country: 'Chile'
        },
        paymentMethod: 'webpay'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No hay productos');
    });

    test('debe validar que los productos existan', async () => {
      const orderData = {
        items: [
          {
            product: '507f1f77bcf86cd799439011', // ID inexistente
            quantity: 1,
            price: 50000
          }
        ],
        shipmentMethod: 'delivery',
        shippingAddress: {
          street: 'Calle Test',
          city: 'Santiago',
          state: 'RM',
          postalCode: '8320000',
          country: 'Chile'
        },
        paymentMethod: 'webpay'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(orderData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Producto no encontrado');
    });
  });
});