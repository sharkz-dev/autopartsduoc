const request = require('supertest');
const express = require('express');
const orderController = require('../../../controllers/order.controller');
const Order = require('../../../models/Order');
const Product = require('../../../models/Product');

// Configurar aplicación Express para pruebas
const app = express();
app.use(express.json());

// Mock del middleware de autenticación
const mockClientAuth = (req, res, next) => {
  req.user = { 
    id: 'test-client-id', 
    role: 'client',
    _id: 'test-client-id'
  };
  next();
};

const mockAdminAuth = (req, res, next) => {
  req.user = { 
    id: 'test-admin-id', 
    role: 'admin',
    _id: 'test-admin-id'
  };
  next();
};

// Configurar rutas de prueba
app.post('/orders', mockClientAuth, orderController.createOrder);
app.get('/orders/my-orders', mockClientAuth, orderController.getMyOrders);
app.get('/orders/:id', mockClientAuth, orderController.getOrder);
app.put('/orders/:id/cancel', mockClientAuth, orderController.cancelOrder);
app.get('/orders', mockAdminAuth, orderController.getOrders);
app.put('/orders/:id/status', mockAdminAuth, orderController.updateOrderStatus);

describe('Controlador Order', () => {
  let testUser;
  let testCategory;
  let testProduct;

  beforeEach(async () => {
    testUser = await global.testHelpers.createTestUser();
    testCategory = await global.testHelpers.createTestCategory();
    testProduct = await global.testHelpers.createTestProduct({}, testCategory._id);
  });

  describe('POST /orders', () => {
    test('debería crear una nueva orden B2C válida', async () => {
      const orderData = {
        items: [
          {
            product: testProduct._id,
            quantity: 2
          }
        ],
        shipmentMethod: 'delivery',
        shippingAddress: {
          street: 'Calle Test 123',
          city: 'Santiago',
          state: 'RM',
          postalCode: '8320000',
          country: 'Chile'
        },
        paymentMethod: 'webpay',
        orderType: 'B2C'
      };

      const response = await request(app)
        .post('/orders')
        .send(orderData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].product._id.toString()).toBe(testProduct._id.toString());
      expect(response.body.data.items[0].quantity).toBe(2);
      expect(response.body.data.shipmentMethod).toBe('delivery');
      expect(response.body.data.orderType).toBe('B2C');
      expect(response.body.data.status).toBe('pending');
      
      // Verificar cálculos automáticos
      expect(response.body.data.itemsPrice).toBeDefined();
      expect(response.body.data.taxPrice).toBeDefined();
      expect(response.body.data.shippingPrice).toBeDefined();
      expect(response.body.data.totalPrice).toBeDefined();
      
      // Verificar que el stock se redujo
      const updatedProduct = await Product.findById(testProduct._id);
      expect(updatedProduct.stockQuantity).toBe(testProduct.stockQuantity - 2);
    });

    test('debería crear una orden B2B para distribuidor', async () => {
      const distributor = await global.testHelpers.createTestUser(global.testUtils.validDistributor);
      
      // Actualizar mock de auth para distribuidor
      app._router.stack.forEach(layer => {
        if (layer.route && layer.route.path === '/orders' && layer.route.methods.post) {
          layer.route.stack[0].handle = (req, res, next) => {
            req.user = { 
              id: distributor._id, 
              role: 'distributor',
              _id: distributor._id
            };
            next();
          };
        }
      });

      const orderData = {
        items: [
          {
            product: testProduct._id,
            quantity: 5
          }
        ],
        shipmentMethod: 'pickup',
        pickupLocation: {
          name: 'Sucursal Central',
          address: 'Av. Principal 123'
        },
        paymentMethod: 'bankTransfer',
        orderType: 'B2B'
      };

      const response = await request(app)
        .post('/orders')
        .send(orderData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.orderType).toBe('B2B');
      expect(response.body.data.shipmentMethod).toBe('pickup');
      expect(response.body.data.pickupLocation).toBeDefined();
      expect(response.body.data.pickupLocation.name).toBe('Sucursal Central');
    });

    test('debería fallar sin items', async () => {
      const orderData = {
        items: [],
        shipmentMethod: 'delivery',
        paymentMethod: 'webpay'
      };

      const response = await request(app)
        .post('/orders')
        .send(orderData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No hay productos en la orden');
    });

    test('debería fallar con método de envío inválido', async () => {
      const orderData = {
        items: [
          {
            product: testProduct._id,
            quantity: 1
          }
        ],
        shipmentMethod: 'metodo-invalido',
        paymentMethod: 'webpay'
      };

      const response = await request(app)
        .post('/orders')
        .send(orderData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Método de envío inválido');
    });

    test('debería fallar sin dirección para delivery', async () => {
      const orderData = {
        items: [
          {
            product: testProduct._id,
            quantity: 1
          }
        ],
        shipmentMethod: 'delivery',
        paymentMethod: 'webpay'
        // Sin shippingAddress
      };

      const response = await request(app)
        .post('/orders')
        .send(orderData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('La dirección de envío es requerida para envíos a domicilio');
    });

    test('debería fallar sin ubicación de retiro para pickup', async () => {
      const orderData = {
        items: [
          {
            product: testProduct._id,
            quantity: 1
          }
        ],
        shipmentMethod: 'pickup',
        paymentMethod: 'cash'
        // Sin pickupLocation
      };

      const response = await request(app)
        .post('/orders')
        .send(orderData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('La ubicación de retiro es requerida para retiro en tienda');
    });

    test('debería fallar con stock insuficiente', async () => {
      const orderData = {
        items: [
          {
            product: testProduct._id,
            quantity: testProduct.stockQuantity + 10 // Más del stock disponible
          }
        ],
        shipmentMethod: 'delivery',
        shippingAddress: {
          street: 'Calle Test 123',
          city: 'Santiago',
          state: 'RM',
          postalCode: '8320000',
          country: 'Chile'
        },
        paymentMethod: 'webpay'
      };

      const response = await request(app)
        .post('/orders')
        .send(orderData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Stock insuficiente');
    });

    test('debería fallar con producto inexistente', async () => {
      const orderData = {
        items: [
          {
            product: '507f1f77bcf86cd799439011', // ID inexistente
            quantity: 1
          }
        ],
        shipmentMethod: 'delivery',
        shippingAddress: {
          street: 'Calle Test 123',
          city: 'Santiago',
          state: 'RM',
          postalCode: '8320000',
          country: 'Chile'
        },
        paymentMethod: 'webpay'
      };

      const response = await request(app)
        .post('/orders')
        .send(orderData)
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Producto no encontrado');
    });
  });

  describe('GET /orders/my-orders', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await global.testHelpers.createTestOrder({}, testUser._id, testProduct._id);
    });

    test('debería retornar órdenes del usuario', async () => {
      const response = await request(app)
        .get('/orders/my-orders')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0]._id.toString()).toBe(testOrder._id.toString());
    });

    test('debería retornar lista vacía si no hay órdenes', async () => {
      // Eliminar la orden de prueba
      await Order.findByIdAndDelete(testOrder._id);

      const response = await request(app)
        .get('/orders/my-orders')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);
    });
  });

  describe('GET /orders/:id', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await global.testHelpers.createTestOrder({}, testUser._id, testProduct._id);
    });

    test('debería retornar una orden específica', async () => {
      const response = await request(app)
        .get(`/orders/${testOrder._id}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data._id.toString()).toBe(testOrder._id.toString());
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.items).toBeDefined();
      expect(response.body.data.items[0].product).toBeDefined();
    });

    test('debería fallar con orden inexistente', async () => {
      const response = await request(app)
        .get('/orders/507f1f77bcf86cd799439011')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Orden no encontrada');
    });

    test('debería fallar si el usuario no es propietario', async () => {
      // Crear otro usuario y su orden
      const otherUser = await global.testHelpers.createTestUser({
        email: 'otro@test.com',
        name: 'Otro Usuario'
      });
      const otherOrder = await global.testHelpers.createTestOrder({}, otherUser._id, testProduct._id);

      const response = await request(app)
        .get(`/orders/${otherOrder._id}`)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No está autorizado para ver esta orden');
    });
  });

  describe('PUT /orders/:id/cancel', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await global.testHelpers.createTestOrder({}, testUser._id, testProduct._id);
    });

    test('debería cancelar una orden pendiente', async () => {
      const response = await request(app)
        .put(`/orders/${testOrder._id}/cancel`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
      
      // Verificar que el stock se restauró
      const updatedProduct = await Product.findById(testProduct._id);
      expect(updatedProduct.stockQuantity).toBe(testProduct.stockQuantity);
    });

    test('debería fallar al cancelar orden ya enviada', async () => {
      // Actualizar orden a estado enviado
      await Order.findByIdAndUpdate(testOrder._id, { status: 'shipped' });

      const response = await request(app)
        .put(`/orders/${testOrder._id}/cancel`)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No se puede cancelar una orden que ya ha sido enviada o entregada');
    });

    test('debería fallar con orden inexistente', async () => {
      const response = await request(app)
        .put('/orders/507f1f77bcf86cd799439011/cancel')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Orden no encontrada');
    });
  });

  describe('GET /orders (admin)', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await global.testHelpers.createTestOrder({}, testUser._id, testProduct._id);
    });

    test('debería retornar todas las órdenes (admin)', async () => {
      const response = await request(app)
        .get('/orders')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0]._id.toString()).toBe(testOrder._id.toString());
    });
  });

  describe('PUT /orders/:id/status (admin)', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await global.testHelpers.createTestOrder({}, testUser._id, testProduct._id);
    });

    test('debería actualizar el estado de una orden', async () => {
      const updateData = {
        status: 'processing'
      };

      const response = await request(app)
        .put(`/orders/${testOrder._id}/status`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('processing');
    });

    test('debería marcar como pagado al actualizar estado', async () => {
      const updateData = {
        status: 'processing',
        isPaid: true
      };

      const response = await request(app)
        .put(`/orders/${testOrder._id}/status`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.isPaid).toBe(true);
      expect(response.body.data.paidAt).toBeDefined();
    });

    test('debería marcar como entregado para estados finales', async () => {
      const updateData = {
        status: 'delivered'
      };

      const response = await request(app)
        .put(`/orders/${testOrder._id}/status`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('delivered');
      expect(response.body.data.isDelivered).toBe(true);
      expect(response.body.data.deliveredAt).toBeDefined();
    });

    test('debería fallar con orden inexistente', async () => {
      const updateData = {
        status: 'processing'
      };

      const response = await request(app)
        .put('/orders/507f1f77bcf86cd799439011/status')
        .send(updateData)
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Orden no encontrada');
    });
  });
});