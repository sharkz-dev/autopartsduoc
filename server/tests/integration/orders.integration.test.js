const request = require('supertest');
const express = require('express');
const User = require('../../models/User');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const Category = require('../../models/Category');

// Configurar aplicación completa para pruebas de integración
const app = express();
app.use(express.json());

// Importar rutas completas
app.use('/api/auth', require('../../routes/auth.routes'));
app.use('/api/orders', require('../../routes/order.routes'));
app.use('/api/products', require('../../routes/product.routes'));
app.use('/api/categories', require('../../routes/category.routes'));

describe('Integración: Sistema de Órdenes Completo', () => {
  let clientUser, adminUser, distributorUser;
  let clientToken, adminToken, distributorToken;
  let testCategory, testProduct1, testProduct2;

  beforeEach(async () => {
    // Crear usuarios de prueba
    clientUser = await global.testHelpers.createTestUser();
    adminUser = await global.testHelpers.createTestUser({
      ...global.testUtils.validAdmin,
      email: 'admin-integration@test.com'
    });
    distributorUser = await global.testHelpers.createTestUser({
      ...global.testUtils.validDistributor,
      email: 'distribuidor-integration@test.com'
    });

    // Generar tokens
    clientToken = global.testHelpers.generateTestToken(clientUser._id);
    adminToken = global.testHelpers.generateTestToken(adminUser._id);
    distributorToken = global.testHelpers.generateTestToken(distributorUser._id);

    // Crear productos de prueba
    testCategory = await global.testHelpers.createTestCategory();
    testProduct1 = await global.testHelpers.createTestProduct({
      name: 'Producto 1',
      sku: 'PROD-001',
      price: 25000,
      wholesalePrice: 20000,
      stockQuantity: 100
    }, testCategory._id);
    
    testProduct2 = await global.testHelpers.createTestProduct({
      name: 'Producto 2',
      sku: 'PROD-002',
      price: 15000,
      wholesalePrice: 12000,
      stockQuantity: 50
    }, testCategory._id);
  });

  describe('Flujo completo de orden B2C', () => {
    test('debería completar flujo de orden retail desde creación hasta entrega', async () => {
      // 1. Cliente crea una orden
      const orderData = {
        items: [
          { product: testProduct1._id, quantity: 2 },
          { product: testProduct2._id, quantity: 1 }
        ],
        shipmentMethod: 'delivery',
        shippingAddress: {
          street: 'Calle Principal 123',
          city: 'Santiago',
          state: 'RM',
          postalCode: '8320000',
          country: 'Chile'
        },
        paymentMethod: 'webpay',
        orderType: 'B2C'
      };

      const createResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(orderData)
        .expect(201);

      const orderId = createResponse.body.data._id;
      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.status).toBe('pending');
      expect(createResponse.body.data.orderType).toBe('B2C');

      // Verificar cálculos automáticos
      const expectedItemsPrice = (25000 * 2) + (15000 * 1); // 65000
      expect(createResponse.body.data.itemsPrice).toBe(expectedItemsPrice);
      expect(createResponse.body.data.taxPrice).toBeGreaterThan(0);
      expect(createResponse.body.data.totalPrice).toBeGreaterThan(expectedItemsPrice);

      // Verificar reducción de stock
      const updatedProduct1 = await Product.findById(testProduct1._id);
      const updatedProduct2 = await Product.findById(testProduct2._id);
      expect(updatedProduct1.stockQuantity).toBe(98); // 100 - 2
      expect(updatedProduct2.stockQuantity).toBe(49); // 50 - 1

      // 2. Cliente consulta su orden
      const getOrderResponse = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(getOrderResponse.body.data._id).toBe(orderId);
      expect(getOrderResponse.body.data.user._id).toBe(clientUser._id.toString());

      // 3. Cliente consulta sus órdenes
      const myOrdersResponse = await request(app)
        .get('/api/orders/my-orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(myOrdersResponse.body.count).toBe(1);
      expect(myOrdersResponse.body.data[0]._id).toBe(orderId);

      // 4. Admin actualiza estado a "processing"
      const updateToProcessingResponse = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'processing' })
        .expect(200);

      expect(updateToProcessingResponse.body.data.status).toBe('processing');

      // 5. Admin marca como pagado
      const markPaidResponse = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'processing', isPaid: true })
        .expect(200);

      expect(markPaidResponse.body.data.isPaid).toBe(true);
      expect(markPaidResponse.body.data.paidAt).toBeDefined();

      // 6. Admin actualiza a "shipped"
      const updateToShippedResponse = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'shipped' })
        .expect(200);

      expect(updateToShippedResponse.body.data.status).toBe('shipped');

      // 7. Admin marca como entregado
      const markDeliveredResponse = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'delivered' })
        .expect(200);

      expect(markDeliveredResponse.body.data.status).toBe('delivered');
      expect(markDeliveredResponse.body.data.isDelivered).toBe(true);
      expect(markDeliveredResponse.body.data.deliveredAt).toBeDefined();

      // 8. Verificar que no se puede cancelar orden entregada
      const cancelResponse = await request(app)
        .put(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(400);

      expect(cancelResponse.body.success).toBe(false);
      expect(cancelResponse.body.error).toContain('ya ha sido enviada o entregada');
    });
  });

  describe('Flujo completo de orden B2B', () => {
    test('debería completar flujo de orden mayorista con precios especiales', async () => {
      // 1. Distribuidor crea orden B2B
      const orderData = {
        items: [
          { product: testProduct1._id, quantity: 10 },
          { product: testProduct2._id, quantity: 5 }
        ],
        shipmentMethod: 'pickup',
        pickupLocation: {
          name: 'Bodega Central',
          address: 'Av. Industrial 500, Santiago',
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Mañana
        },
        paymentMethod: 'bankTransfer',
        orderType: 'B2B'
      };

      const createResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${distributorToken}`)
        .send(orderData)
        .expect(201);

      const orderId = createResponse.body.data._id;
      expect(createResponse.body.data.orderType).toBe('B2B');
      expect(createResponse.body.data.shipmentMethod).toBe('pickup');
      expect(createResponse.body.data.shippingPrice).toBe(0); // Pickup es gratuito

      // Verificar que se usaron precios mayoristas
      const expectedItemsPrice = (20000 * 10) + (12000 * 5); // Precios wholesale
      expect(createResponse.body.data.itemsPrice).toBe(expectedItemsPrice);

      // 2. Admin consulta todas las órdenes
      const allOrdersResponse = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(allOrdersResponse.body.count).toBeGreaterThan(0);
      const b2bOrder = allOrdersResponse.body.data.find(order => order._id === orderId);
      expect(b2bOrder).toBeDefined();
      expect(b2bOrder.orderType).toBe('B2B');

      // 3. Admin actualiza a "ready_for_pickup"
      const updateToReadyResponse = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ready_for_pickup', isPaid: true })
        .expect(200);

      expect(updateToReadyResponse.body.data.status).toBe('ready_for_pickup');
      expect(updateToReadyResponse.body.data.isDelivered).toBe(true);
      expect(updateToReadyResponse.body.data.deliveredAt).toBeDefined();
    });
  });

  describe('Manejo de errores y casos edge', () => {
    test('debería manejar stock insuficiente correctamente', async () => {
      const orderData = {
        items: [
          { product: testProduct1._id, quantity: 1000 } // Más del stock disponible
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
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Stock insuficiente');

      // Verificar que el stock no cambió
      const unchangedProduct = await Product.findById(testProduct1._id);
      expect(unchangedProduct.stockQuantity).toBe(100);
    });

    test('debería restaurar stock al cancelar orden', async () => {
      // Crear orden válida
      const orderData = {
        items: [
          { product: testProduct1._id, quantity: 5 }
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

      const createResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(orderData)
        .expect(201);

      const orderId = createResponse.body.data._id;

      // Verificar que el stock se redujo
      let updatedProduct = await Product.findById(testProduct1._id);
      expect(updatedProduct.stockQuantity).toBe(95); // 100 - 5

      // Cancelar orden
      const cancelResponse = await request(app)
        .put(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(cancelResponse.body.data.status).toBe('cancelled');

      // Verificar que el stock se restauró
      updatedProduct = await Product.findById(testProduct1._id);
      expect(updatedProduct.stockQuantity).toBe(100); // Stock restaurado
    });

    test('debería manejar autorización correctamente', async () => {
      // Crear orden con un usuario
      const orderData = {
        items: [
          { product: testProduct1._id, quantity: 1 }
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

      const createResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(orderData)
        .expect(201);

      const orderId = createResponse.body.data._id;

      // Crear otro usuario
      const otherUser = await global.testHelpers.createTestUser({
        email: 'otro-usuario@test.com',
        name: 'Otro Usuario'
      });
      const otherToken = global.testHelpers.generateTestToken(otherUser._id);

      // Otro usuario no debería poder ver la orden
      const unauthorizedResponse = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(401);

      expect(unauthorizedResponse.body.success).toBe(false);
      expect(unauthorizedResponse.body.error).toBe('No está autorizado para ver esta orden');

      // Cliente no debería poder actualizar estado
      const clientUpdateResponse = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ status: 'processing' })
        .expect(401);

      expect(clientUpdateResponse.body.success).toBe(false);
      expect(clientUpdateResponse.body.error).toBe('No está autorizado para actualizar el estado de la orden');

      // Admin sí debería poder actualizar estado
      const adminUpdateResponse = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'processing' })
        .expect(200);

      expect(adminUpdateResponse.body.success).toBe(true);
    });
  });

  describe('Cálculos automáticos y configuración del sistema', () => {
    test('debería aplicar configuraciones de envío correctamente', async () => {
      // Crear orden con monto alto (debería tener envío gratuito)
      const highValueOrderData = {
        items: [
          { product: testProduct1._id, quantity: 10 } // 250,000 CLP
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

      const highValueResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(highValueOrderData)
        .expect(201);

      expect(highValueResponse.body.data.shippingPrice).toBe(0); // Envío gratuito

      // Crear orden con monto bajo (debería tener costo de envío)
      const lowValueOrderData = {
        items: [
          { product: testProduct2._id, quantity: 1 } // 15,000 CLP
        ],
        shipmentMethod: 'delivery',
        shippingAddress: {
          street: 'Calle Test 456',
          city: 'Santiago',
          state: 'RM',
          postalCode: '8320000',
          country: 'Chile'
        },
        paymentMethod: 'webpay'
      };

      const lowValueResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(lowValueOrderData)
        .expect(201);

      expect(lowValueResponse.body.data.shippingPrice).toBeGreaterThan(0); // Con costo de envío
    });

    test('debería calcular IVA según configuración del sistema', async () => {
      const orderData = {
        items: [
          { product: testProduct1._id, quantity: 1 } // 25,000 CLP
        ],
        shipmentMethod: 'pickup',
        pickupLocation: {
          name: 'Tienda Principal',
          address: 'Av. Principal 123'
        },
        paymentMethod: 'cash'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(orderData)
        .expect(201);

      // Verificar que se aplicó IVA (configuración por defecto 19%)
      const expectedTax = Math.round(25000 * 0.19); // 4750
      expect(response.body.data.taxPrice).toBe(expectedTax);
      expect(response.body.data.taxRate).toBe(19);
      
      // Verificar cálculo total
      const expectedTotal = 25000 + expectedTax + 0; // items + tax + shipping
      expect(response.body.data.totalPrice).toBe(expectedTotal);
    });
  });

  describe('Concurrencia y consistencia de datos', () => {
    test('debería manejar múltiples órdenes simultáneas correctamente', async () => {
      // Crear múltiples órdenes simultáneamente para el mismo producto
      const orderPromises = [];
      for (let i = 0; i < 5; i++) {
        const orderData = {
          items: [
            { product: testProduct1._id, quantity: 10 }
          ],
          shipmentMethod: 'pickup',
          pickupLocation: {
            name: 'Tienda Principal',
            address: 'Av. Principal 123'
          },
          paymentMethod: 'cash'
        };

        orderPromises.push(
          request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${clientToken}`)
            .send(orderData)
        );
      }

      const responses = await Promise.all(orderPromises);
      
      // Algunas órdenes deberían fallar por stock insuficiente
      const successfulOrders = responses.filter(r => r.status === 201);
      const failedOrders = responses.filter(r => r.status === 400);
      
      expect(successfulOrders.length + failedOrders.length).toBe(5);
      expect(failedOrders.length).toBeGreaterThan(0); // Al menos una debería fallar
      
      // Verificar que el stock final es consistente
      const finalProduct = await Product.findById(testProduct1._id);
      const expectedStock = 100 - (successfulOrders.length * 10);
      expect(finalProduct.stockQuantity).toBe(expectedStock);
    });
  });

  describe('Validaciones de datos de entrada', () => {
    test('debería validar todos los campos requeridos para delivery', async () => {
      const incompleteOrderData = {
        items: [
          { product: testProduct1._id, quantity: 1 }
        ],
        shipmentMethod: 'delivery',
        shippingAddress: {
          street: 'Calle Test 123'
          // Faltan city, state, postalCode, country
        },
        paymentMethod: 'webpay'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(incompleteOrderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('dirección de envío');
    });

    test('debería validar campos requeridos para pickup', async () => {
      const incompleteOrderData = {
        items: [
          { product: testProduct1._id, quantity: 1 }
        ],
        shipmentMethod: 'pickup',
        pickupLocation: {
          name: 'Tienda'
          // Falta address
        },
        paymentMethod: 'cash'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(incompleteOrderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('ubicación de retiro');
    });

    test('debería validar métodos de pago válidos', async () => {
      const invalidPaymentOrderData = {
        items: [
          { product: testProduct1._id, quantity: 1 }
        ],
        shipmentMethod: 'pickup',
        pickupLocation: {
          name: 'Tienda Principal',
          address: 'Av. Principal 123'
        },
        paymentMethod: 'metodo-invalido'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(invalidPaymentOrderData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Auditoría y trazabilidad', () => {
    test('debería mantener historial completo de cambios de estado', async () => {
      // Crear orden
      const orderData = {
        items: [
          { product: testProduct1._id, quantity: 2 }
        ],
        shipmentMethod: 'delivery',
        shippingAddress: {
          street: 'Calle Audit 123',
          city: 'Santiago',
          state: 'RM',
          postalCode: '8320000',
          country: 'Chile'
        },
        paymentMethod: 'webpay'
      };

      const createResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(orderData)
        .expect(201);

      const orderId = createResponse.body.data._id;

      // Realizar múltiples cambios de estado
      const statusUpdates = ['processing', 'shipped', 'delivered'];
      
      for (const status of statusUpdates) {
        await request(app)
          .put(`/api/orders/${orderId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status })
          .expect(200);
        
        // Verificar que el cambio se persistió
        const updatedOrder = await Order.findById(orderId);
        expect(updatedOrder.status).toBe(status);
      }

      // Verificar estado final
      const finalOrderResponse = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(finalOrderResponse.body.data.status).toBe('delivered');
      expect(finalOrderResponse.body.data.isDelivered).toBe(true);
      expect(finalOrderResponse.body.data.deliveredAt).toBeDefined();
    });
  });

  describe('Performance y escalabilidad', () => {
    test('debería manejar consultas con paginación eficientemente', async () => {
      // Crear múltiples órdenes para el admin
      const orderPromises = [];
      for (let i = 0; i < 25; i++) {
        const orderData = {
          items: [
            { product: testProduct2._id, quantity: 1 }
          ],
          shipmentMethod: 'pickup',
          pickupLocation: {
            name: 'Tienda Principal',
            address: 'Av. Principal 123'
          },
          paymentMethod: 'cash'
        };

        orderPromises.push(
          request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${clientToken}`)
            .send(orderData)
        );
      }

      await Promise.all(orderPromises);

      // Consultar con paginación
      const firstPageResponse = await request(app)
        .get('/api/orders?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(firstPageResponse.body.data).toHaveLength(10);
      
      const secondPageResponse = await request(app)
        .get('/api/orders?page=2&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(secondPageResponse.body.data).toHaveLength(10);
      
      // Verificar que las órdenes son diferentes
      const firstPageIds = firstPageResponse.body.data.map(o => o._id);
      const secondPageIds = secondPageResponse.body.data.map(o => o._id);
      const intersection = firstPageIds.filter(id => secondPageIds.includes(id));
      expect(intersection).toHaveLength(0);
    });
  });
});