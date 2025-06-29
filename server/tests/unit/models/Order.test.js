const Order = require('../../../models/Order');
const User = require('../../../models/User');
const Product = require('../../../models/Product');
const Category = require('../../../models/Category');

describe('Modelo Order', () => {
  let testUser, testProduct, testCategory;

  beforeEach(async () => {
    // Crear datos de prueba necesarios
    testUser = await global.testHelpers.createTestUser();
    testCategory = await global.testHelpers.createTestCategory();
    testProduct = await global.testHelpers.createTestProduct({}, testCategory._id);
  });

  describe('Validaciones de campos requeridos', () => {
    test('debería crear una orden válida', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 2,
            price: 25990
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
        itemsPrice: 51980,
        taxPrice: 9876,
        shippingPrice: 5000,
        totalPrice: 66856
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      expect(savedOrder.user.toString()).toBe(testUser._id.toString());
      expect(savedOrder.items).toHaveLength(1);
      expect(savedOrder.items[0].product.toString()).toBe(testProduct._id.toString());
      expect(savedOrder.shipmentMethod).toBe('delivery');
      expect(savedOrder.paymentMethod).toBe('webpay');
      expect(savedOrder.status).toBe('pending');
      expect(savedOrder.orderType).toBe('B2C');
      expect(savedOrder.taxRate).toBe(19);
    });

    test('debería fallar sin usuario', async () => {
      const orderData = {
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 25990
          }
        ],
        paymentMethod: 'webpay'
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });

    test('debería fallar sin items', async () => {
      const orderData = {
        user: testUser._id,
        items: [],
        paymentMethod: 'webpay'
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });

    test('debería fallar sin método de envío', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 25990
          }
        ],
        paymentMethod: 'webpay'
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });

    test('debería fallar sin método de pago', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 25990
          }
        ],
        shipmentMethod: 'delivery'
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });
  });

  describe('Validaciones de items', () => {
    test('debería validar cantidad mínima en items', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 0, // Cantidad inválida
            price: 25990
          }
        ],
        shipmentMethod: 'delivery',
        paymentMethod: 'webpay'
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow('La cantidad mínima es 1');
    });

    test('debería requerir producto en cada item', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            quantity: 1,
            price: 25990
            // Sin producto
          }
        ],
        shipmentMethod: 'delivery',
        paymentMethod: 'webpay'
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });

    test('debería requerir precio en cada item', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1
            // Sin precio
          }
        ],
        shipmentMethod: 'delivery',
        paymentMethod: 'webpay'
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });

    test('debería permitir múltiples items', async () => {
      const testProduct2 = await global.testHelpers.createTestProduct({
        name: 'Producto 2',
        sku: 'TEST-002'
      }, testCategory._id);

      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 2,
            price: 25990
          },
          {
            product: testProduct2._id,
            quantity: 1,
            price: 15000
          }
        ],
        shipmentMethod: 'delivery',
        paymentMethod: 'webpay',
        itemsPrice: 66980,
        taxPrice: 12726,
        totalPrice: 79706
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      expect(savedOrder.items).toHaveLength(2);
      expect(savedOrder.items[0].product.toString()).toBe(testProduct._id.toString());
      expect(savedOrder.items[1].product.toString()).toBe(testProduct2._id.toString());
    });
  });

  describe('Validaciones de envío', () => {
    test('debería validar métodos de envío permitidos', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 25990
          }
        ],
        shipmentMethod: 'invalid-method',
        paymentMethod: 'webpay'
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });

    test('debería requerir dirección para envío delivery', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 25990
          }
        ],
        shipmentMethod: 'delivery',
        paymentMethod: 'webpay'
        // Sin shippingAddress
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      // Verificar validación condicional
      const validationError = savedOrder.validateSync();
      expect(validationError).toBeDefined();
    });

    test('debería permitir orden pickup sin dirección', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 25990
          }
        ],
        shipmentMethod: 'pickup',
        pickupLocation: {
          name: 'Tienda Principal',
          address: 'Av. Principal 123'
        },
        paymentMethod: 'cash',
        itemsPrice: 25990,
        taxPrice: 4938,
        totalPrice: 30928
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      expect(savedOrder.shipmentMethod).toBe('pickup');
      expect(savedOrder.pickupLocation.name).toBe('Tienda Principal');
      expect(savedOrder.shippingAddress).toBeUndefined();
    });

    test('debería validar campos requeridos en dirección de envío', async () => {
      const orderDataIncomplete = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 25990
          }
        ],
        shipmentMethod: 'delivery',
        shippingAddress: {
          street: 'Calle Test 123'
          // Faltan city, state, postalCode, country
        },
        paymentMethod: 'webpay'
      };

      const order = new Order(orderDataIncomplete);
      const savedOrder = await order.save();

      const validationError = savedOrder.validateSync();
      expect(validationError).toBeDefined();
    });
  });

  describe('Validaciones de pago', () => {
    test('debería validar métodos de pago permitidos', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 25990
          }
        ],
        shipmentMethod: 'pickup',
        paymentMethod: 'invalid-payment'
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });

    test('debería usar webpay como método por defecto', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 25990
          }
        ],
        shipmentMethod: 'pickup'
        // Sin paymentMethod
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      expect(savedOrder.paymentMethod).toBe('webpay');
    });

    test('debería permitir todos los métodos de pago válidos', async () => {
      const validPaymentMethods = ['webpay', 'bankTransfer', 'cash'];

      for (const paymentMethod of validPaymentMethods) {
        const orderData = {
          user: testUser._id,
          items: [
            {
              product: testProduct._id,
              quantity: 1,
              price: 25990
            }
          ],
          shipmentMethod: 'pickup',
          paymentMethod: paymentMethod
        };

        const order = new Order(orderData);
        const savedOrder = await order.save();

        expect(savedOrder.paymentMethod).toBe(paymentMethod);

        // Limpiar para siguiente iteración
        await Order.findByIdAndDelete(savedOrder._id);
      }
    });
  });

  describe('Campos por defecto', () => {
    test('debería establecer valores por defecto correctos', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 25990
          }
        ],
        shipmentMethod: 'pickup',
        paymentMethod: 'cash'
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      expect(savedOrder.itemsPrice).toBe(0);
      expect(savedOrder.taxPrice).toBe(0);
      expect(savedOrder.shippingPrice).toBe(0);
      expect(savedOrder.totalPrice).toBe(0);
      expect(savedOrder.isPaid).toBe(false);
      expect(savedOrder.isDelivered).toBe(false);
      expect(savedOrder.status).toBe('pending');
      expect(savedOrder.orderType).toBe('B2C');
      expect(savedOrder.taxRate).toBe(19);
    });

    test('debería establecer fechas automáticamente', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 25990
          }
        ],
        shipmentMethod: 'pickup',
        paymentMethod: 'cash'
      };

      const beforeCreate = new Date();
      const order = new Order(orderData);
      const savedOrder = await order.save();
      const afterCreate = new Date();

      expect(savedOrder.createdAt).toBeInstanceOf(Date);
      expect(savedOrder.updatedAt).toBeInstanceOf(Date);
      expect(savedOrder.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(savedOrder.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('Middleware de actualización', () => {
    test('debería actualizar updatedAt en cada modificación', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 25990
          }
        ],
        shipmentMethod: 'pickup',
        paymentMethod: 'cash'
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();
      const originalUpdatedAt = savedOrder.updatedAt;

      // Esperar un poco y actualizar
      await new Promise(resolve => setTimeout(resolve, 10));
      savedOrder.status = 'processing';
      await savedOrder.save();

      expect(savedOrder.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    test('debería sincronizar fiscalInfo.appliedTaxRate con taxRate', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 25990
          }
        ],
        shipmentMethod: 'pickup',
        paymentMethod: 'cash',
        taxRate: 21
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      expect(savedOrder.fiscalInfo.appliedTaxRate).toBe(21);
      expect(savedOrder.fiscalInfo.taxCalculationDate).toBeInstanceOf(Date);
    });
  });

  describe('Validaciones de tipos de orden', () => {
    test('debería validar tipos de orden permitidos', async () => {
      const validOrderTypes = ['B2C', 'B2B'];

      for (const orderType of validOrderTypes) {
        const orderData = {
          user: testUser._id,
          items: [
            {
              product: testProduct._id,
              quantity: 1,
              price: 25990
            }
          ],
          shipmentMethod: 'pickup',
          paymentMethod: 'cash',
          orderType: orderType
        };

        const order = new Order(orderData);
        const savedOrder = await order.save();

        expect(savedOrder.orderType).toBe(orderType);

        // Limpiar para siguiente iteración
        await Order.findByIdAndDelete(savedOrder._id);
      }
    });

    test('debería fallar con tipo de orden inválido', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 25990
          }
        ],
        shipmentMethod: 'pickup',
        paymentMethod: 'cash',
        orderType: 'INVALID'
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });
  });

  describe('Validaciones de estado', () => {
    test('debería validar estados permitidos', async () => {
      const validStatuses = ['pending', 'processing', 'shipped', 'ready_for_pickup', 'delivered', 'cancelled'];

      for (const status of validStatuses) {
        const orderData = {
          user: testUser._id,
          items: [
            {
              product: testProduct._id,
              quantity: 1,
              price: 25990
            }
          ],
          shipmentMethod: 'pickup',
          paymentMethod: 'cash',
          status: status
        };

        const order = new Order(orderData);
        const savedOrder = await order.save();

        expect(savedOrder.status).toBe(status);

        // Limpiar para siguiente iteración
        await Order.findByIdAndDelete(savedOrder._id);
      }
    });

    test('debería fallar con estado inválido', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 25990
          }
        ],
        shipmentMethod: 'pickup',
        paymentMethod: 'cash',
        status: 'invalid-status'
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });
  });

  describe('Validaciones de impuestos', () => {
    test('debería validar rango de tasa de IVA', async () => {
      // Tasa negativa (inválida)
      const orderDataNegative = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 25990
          }
        ],
        shipmentMethod: 'pickup',
        paymentMethod: 'cash',
        taxRate: -5
      };

      const orderNegative = new Order(orderDataNegative);
      await expect(orderNegative.save()).rejects.toThrow('La tasa de IVA no puede ser negativa');

      // Tasa mayor a 100% (inválida)
      const orderDataOverflow = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 25990
          }
        ],
        shipmentMethod: 'pickup',
        paymentMethod: 'cash',
        taxRate: 150
      };

      const orderOverflow = new Order(orderDataOverflow);
      await expect(orderOverflow.save()).rejects.toThrow('La tasa de IVA no puede ser mayor a 100%');
    });

    test('debería permitir tasas de IVA válidas', async () => {
      const validTaxRates = [0, 10, 19, 21, 50, 100];

      for (const taxRate of validTaxRates) {
        const orderData = {
          user: testUser._id,
          items: [
            {
              product: testProduct._id,
              quantity: 1,
              price: 25990
            }
          ],
          shipmentMethod: 'pickup',
          paymentMethod: 'cash',
          taxRate: taxRate
        };

        const order = new Order(orderData);
        const savedOrder = await order.save();

        expect(savedOrder.taxRate).toBe(taxRate);
        expect(savedOrder.fiscalInfo.appliedTaxRate).toBe(taxRate);

        // Limpiar para siguiente iteración
        await Order.findByIdAndDelete(savedOrder._id);
      }
    });
  });

  describe('Método recalculateTax()', () => {
    let testOrder;

    beforeEach(async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 25990
          }
        ],
        shipmentMethod: 'pickup',
        paymentMethod: 'cash',
        itemsPrice: 25990,
        taxPrice: 4938, // 19% de 25990
        shippingPrice: 0,
        totalPrice: 30928,
        taxRate: 19
      };

      testOrder = new Order(orderData);
      await testOrder.save();
    });

    test('debería recalcular impuestos correctamente', async () => {
      const newTaxRate = 21;
      const userId = testUser._id;

      const result = await testOrder.recalculateTax(newTaxRate, userId);

      expect(result.previousTaxRate).toBe(19);
      expect(result.newTaxRate).toBe(21);
      expect(result.previousTaxPrice).toBe(4938);
      expect(result.newTaxPrice).toBeGreaterThan(4938);

      // Verificar que se actualizó la orden
      expect(testOrder.taxRate).toBe(21);
      expect(testOrder.fiscalInfo.taxRecalculated).toBe(true);
      expect(testOrder.fiscalInfo.taxRecalculatedBy.toString()).toBe(userId.toString());
      expect(testOrder.fiscalInfo.taxRecalculatedAt).toBeInstanceOf(Date);
    });

    test('debería actualizar total price después de recalcular', async () => {
      const originalTotalPrice = testOrder.totalPrice;
      await testOrder.recalculateTax(21);

      expect(testOrder.totalPrice).not.toBe(originalTotalPrice);
      expect(testOrder.totalPrice).toBe(testOrder.itemsPrice + testOrder.taxPrice + testOrder.shippingPrice);
    });
  });

  describe('Método estático getTaxStatistics()', () => {
    beforeEach(async () => {
      // Crear órdenes con diferentes tasas de IVA para pruebas
      const orders = [
        {
          user: testUser._id,
          items: [{ product: testProduct._id, quantity: 1, price: 10000 }],
          shipmentMethod: 'pickup',
          paymentMethod: 'cash',
          taxRate: 19,
          taxPrice: 1900,
          totalPrice: 11900,
          status: 'delivered'
        },
        {
          user: testUser._id,
          items: [{ product: testProduct._id, quantity: 1, price: 20000 }],
          shipmentMethod: 'pickup',
          paymentMethod: 'cash',
          taxRate: 19,
          taxPrice: 3800,
          totalPrice: 23800,
          status: 'delivered'
        },
        {
          user: testUser._id,
          items: [{ product: testProduct._id, quantity: 1, price: 15000 }],
          shipmentMethod: 'pickup',
          paymentMethod: 'cash',
          taxRate: 21,
          taxPrice: 3150,
          totalPrice: 18150,
          status: 'delivered'
        }
      ];

      for (const orderData of orders) {
        await Order.create(orderData);
      }
    });

    test('debería generar estadísticas de IVA por período', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Ayer
      const endDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Mañana

      const stats = await Order.getTaxStatistics(startDate, endDate);

      expect(stats).toBeInstanceOf(Array);
      expect(stats.length).toBeGreaterThan(0);

      // Verificar estructura de estadísticas
      const rate19Stats = stats.find(stat => stat._id === 19);
      const rate21Stats = stats.find(stat => stat._id === 21);

      expect(rate19Stats).toBeDefined();
      expect(rate19Stats.orderCount).toBe(2);
      expect(rate19Stats.totalTaxCollected).toBe(5700); // 1900 + 3800

      expect(rate21Stats).toBeDefined();
      expect(rate21Stats.orderCount).toBe(1);
      expect(rate21Stats.totalTaxCollected).toBe(3150);
    });

    test('debería excluir órdenes canceladas de estadísticas', async () => {
      // Crear orden cancelada
      await Order.create({
        user: testUser._id,
        items: [{ product: testProduct._id, quantity: 1, price: 50000 }],
        shipmentMethod: 'pickup',
        paymentMethod: 'cash',
        taxRate: 19,
        taxPrice: 9500,
        totalPrice: 59500,
        status: 'cancelled'
      });

      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const stats = await Order.getTaxStatistics(startDate, endDate);
      const rate19Stats = stats.find(stat => stat._id === 19);

      // No debería incluir la orden cancelada
      expect(rate19Stats.orderCount).toBe(2); // Solo las 2 originales
      expect(rate19Stats.totalTaxCollected).toBe(5700); // Sin incluir los 9500 de la cancelada
    });
  });

  describe('Virtual taxInfo', () => {
    test('debería retornar información fiscal formateada', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 25990
          }
        ],
        shipmentMethod: 'pickup',
        paymentMethod: 'cash',
        taxRate: 19,
        taxPrice: 4938
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      const taxInfo = savedOrder.taxInfo;

      expect(taxInfo.rate).toBe(19);
      expect(taxInfo.percentage).toBe('19%');
      expect(taxInfo.amount).toBe(4938);
      expect(taxInfo.appliedAt).toBeInstanceOf(Date);
      expect(taxInfo.wasRecalculated).toBe(false);
    });

    test('debería mostrar información de recalculación si aplica', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 25990
          }
        ],
        shipmentMethod: 'pickup',
        paymentMethod: 'cash',
        taxRate: 19,
        taxPrice: 4938,
        fiscalInfo: {
          taxRecalculated: true,
          taxRecalculatedAt: new Date()
        }
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      const taxInfo = savedOrder.taxInfo;
      expect(taxInfo.wasRecalculated).toBe(true);
    });
  });

  describe('Índices y optimización', () => {
    test('debería tener índices apropiados para consultas comunes', async () => {
      // Crear múltiples órdenes para probar consultas
      const orders = [];
      for (let i = 0; i < 10; i++) {
        const orderData = {
          user: testUser._id,
          items: [
            {
              product: testProduct._id,
              quantity: 1,
              price: 10000 + i * 1000
            }
          ],
          shipmentMethod: 'pickup',
          paymentMethod: 'cash',
          status: i % 2 === 0 ? 'delivered' : 'pending'
        };

        const order = await Order.create(orderData);
        orders.push(order);
      }

      // Consulta por usuario y fecha
      const startTime = Date.now();
      const userOrders = await Order.find({ 
        user: testUser._id 
      }).sort({ createdAt: -1 });
      const endTime = Date.now();

      expect(userOrders.length).toBe(10);
      expect(endTime - startTime).toBeLessThan(1000); // Menos de 1 segundo

      // Consulta por estado
      const pendingOrders = await Order.find({ status: 'pending' });
      expect(pendingOrders.length).toBe(5);

      // Consulta por tasa de IVA
      const taxRateOrders = await Order.find({ taxRate: 19 });
      expect(taxRateOrders.length).toBeGreaterThan(0);
    });
  });

  describe('Validaciones complejas y casos edge', () => {
    test('debería manejar órdenes con información fiscal compleja', async () => {
      const complexOrderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 3,
            price: 33333.33
          }
        ],
        shipmentMethod: 'delivery',
        shippingAddress: {
          street: 'Calle Compleja 456',
          city: 'Santiago',
          state: 'RM',
          postalCode: '8320000',
          country: 'Chile'
        },
        paymentMethod: 'webpay',
        itemsPrice: 99999.99,
        taxPrice: 18999.998,
        shippingPrice: 5000,
        totalPrice: 123999.988,
        taxRate: 19,
        fiscalInfo: {
          appliedTaxRate: 19,
          taxCalculationDate: new Date(),
          taxRecalculated: false
        }
      };

      const order = new Order(complexOrderData);
      const savedOrder = await order.save();

      expect(savedOrder.itemsPrice).toBeCloseTo(99999.99, 2);
      expect(savedOrder.taxPrice).toBeCloseTo(18999.998, 3);
      expect(savedOrder.fiscalInfo.appliedTaxRate).toBe(19);
    });

    test('debería manejar fechas de pago y entrega apropiadamente', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 25990
          }
        ],
        shipmentMethod: 'pickup',
        paymentMethod: 'cash',
        isPaid: true,
        paidAt: new Date(),
        isDelivered: true,
        deliveredAt: new Date()
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      expect(savedOrder.isPaid).toBe(true);
      expect(savedOrder.paidAt).toBeInstanceOf(Date);
      expect(savedOrder.isDelivered).toBe(true);
      expect(savedOrder.deliveredAt).toBeInstanceOf(Date);
    });

    test('debería manejar información de pago compleja', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 2,
            price: 45000
          }
        ],
        shipmentMethod: 'delivery',
        shippingAddress: {
          street: 'Calle Pago 789',
          city: 'Santiago',
          state: 'RM',
          postalCode: '8320000',
          country: 'Chile'
        },
        paymentMethod: 'webpay',
        paymentResult: {
          id: 'webpay_token_123456',
          buyOrder: 'ORDER_789456123',
          sessionId: 'SESSION_987654',
          authorizationCode: 'AUTH123456',
          status: 'approved',
          updateTime: new Date().toISOString(),
          paymentMethod: 'webpay',
          amount: 90000,
          responseCode: 0,
          cardDetail: {
            card_number: '****1234'
          },
          installments: 1
        }
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      expect(savedOrder.paymentResult.id).toBe('webpay_token_123456');
      expect(savedOrder.paymentResult.status).toBe('approved');
      expect(savedOrder.paymentResult.authorizationCode).toBe('AUTH123456');
      expect(savedOrder.paymentResult.cardDetail.card_number).toBe('****1234');
    });

    test('debería manejar información de reembolso', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 30000
          }
        ],
        shipmentMethod: 'pickup',
        paymentMethod: 'webpay',
        paymentResult: {
          id: 'webpay_token_refund',
          status: 'approved',
          refund: {
            id: 'REFUND_123456',
            amount: 30000,
            status: 'completed',
            processedAt: new Date()
          }
        }
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      expect(savedOrder.paymentResult.refund.id).toBe('REFUND_123456');
      expect(savedOrder.paymentResult.refund.status).toBe('completed');
      expect(savedOrder.paymentResult.refund.processedAt).toBeInstanceOf(Date);
    });

    test('debería manejar ubicaciones de retiro complejas', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 25000
          }
        ],
        shipmentMethod: 'pickup',
        pickupLocation: {
          name: 'Sucursal Las Condes',
          address: 'Av. Apoquindo 1234, Las Condes, Santiago',
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Mañana
          notes: 'Traer documento de identidad y comprobante de compra'
        },
        paymentMethod: 'cash'
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      expect(savedOrder.pickupLocation.name).toBe('Sucursal Las Condes');
      expect(savedOrder.pickupLocation.scheduledDate).toBeInstanceOf(Date);
      expect(savedOrder.pickupLocation.notes).toContain('documento de identidad');
    });
  });

  describe('Poblado de referencias', () => {
    test('debería poblar correctamente referencias de usuario', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 25990
          }
        ],
        shipmentMethod: 'pickup',
        paymentMethod: 'cash'
      };

      const order = await Order.create(orderData);
      
      // Poblar usuario
      const populatedOrder = await Order.findById(order._id)
        .populate('user', 'name email');

      expect(populatedOrder.user.name).toBe(testUser.name);
      expect(populatedOrder.user.email).toBe(testUser.email);
      expect(populatedOrder.user.password).toBeUndefined(); // No debe incluir contraseña
    });

    test('debería poblar correctamente referencias de productos', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 2,
            price: 25990
          }
        ],
        shipmentMethod: 'pickup',
        paymentMethod: 'cash'
      };

      const order = await Order.create(orderData);
      
      // Poblar productos con categoría
      const populatedOrder = await Order.findById(order._id)
        .populate({
          path: 'items.product',
          select: 'name sku price category',
          populate: {
            path: 'category',
            select: 'name'
          }
        });

      expect(populatedOrder.items[0].product.name).toBe(testProduct.name);
      expect(populatedOrder.items[0].product.sku).toBe(testProduct.sku);
      expect(populatedOrder.items[0].product.category.name).toBe(testCategory.name);
    });

    test('debería poblar referencias anidadas correctamente', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 25990
          }
        ],
        shipmentMethod: 'pickup',
        paymentMethod: 'cash'
      };

      const order = await Order.create(orderData);
      
      // Poblar todo
      const fullyPopulatedOrder = await Order.findById(order._id)
        .populate('user', 'name email')
        .populate({
          path: 'items.product',
          select: 'name sku price category brand',
          populate: {
            path: 'category',
            select: 'name slug'
          }
        });

      expect(fullyPopulatedOrder.user.name).toBeDefined();
      expect(fullyPopulatedOrder.items[0].product.name).toBeDefined();
      expect(fullyPopulatedOrder.items[0].product.category.name).toBeDefined();
      expect(fullyPopulatedOrder.items[0].product.category.slug).toBeDefined();
    });
  });

  describe('Validaciones de consistencia de datos', () => {
    test('debería mantener consistencia entre itemsPrice y items', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 2,
            price: 15000
          },
          {
            product: testProduct._id,
            quantity: 1,
            price: 20000
          }
        ],
        shipmentMethod: 'pickup',
        paymentMethod: 'cash',
        itemsPrice: 50000, // 2*15000 + 1*20000 = 50000
        taxPrice: 9500,
        totalPrice: 59500
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      // Calcular total esperado de items
      const expectedItemsTotal = savedOrder.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);

      expect(expectedItemsTotal).toBe(50000);
      expect(savedOrder.itemsPrice).toBe(expectedItemsTotal);
    });

    test('debería mantener consistencia en cálculo de total', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 30000
          }
        ],
        shipmentMethod: 'delivery',
        shippingAddress: {
          street: 'Calle Total 123',
          city: 'Santiago',
          state: 'RM',
          postalCode: '8320000',
          country: 'Chile'
        },
        paymentMethod: 'webpay',
        itemsPrice: 30000,
        taxPrice: 5700, // 19% de 30000
        shippingPrice: 5000,
        totalPrice: 40700 // 30000 + 5700 + 5000
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      const expectedTotal = savedOrder.itemsPrice + savedOrder.taxPrice + savedOrder.shippingPrice;
      expect(savedOrder.totalPrice).toBe(expectedTotal);
    });
  });

  describe('Consultas y agregaciones', () => {
    beforeEach(async () => {
      // Crear varias órdenes para pruebas de consulta
      const ordersData = [
        {
          user: testUser._id,
          items: [{ product: testProduct._id, quantity: 1, price: 10000 }],
          shipmentMethod: 'pickup',
          paymentMethod: 'cash',
          status: 'delivered',
          totalPrice: 11900
        },
        {
          user: testUser._id,
          items: [{ product: testProduct._id, quantity: 2, price: 15000 }],
          shipmentMethod: 'delivery',
          paymentMethod: 'webpay',
          status: 'pending',
          totalPrice: 35700
        },
        {
          user: testUser._id,
          items: [{ product: testProduct._id, quantity: 1, price: 20000 }],
          shipmentMethod: 'pickup',
          paymentMethod: 'bankTransfer',
          status: 'cancelled',
          totalPrice: 23800
        }
      ];

      for (const orderData of ordersData) {
        await Order.create(orderData);
      }
    });

    test('debería encontrar órdenes por usuario', async () => {
      const userOrders = await Order.find({ user: testUser._id });
      expect(userOrders.length).toBe(3);
    });

    test('debería encontrar órdenes por estado', async () => {
      const pendingOrders = await Order.find({ status: 'pending' });
      expect(pendingOrders.length).toBe(1);
      expect(pendingOrders[0].status).toBe('pending');

      const deliveredOrders = await Order.find({ status: 'delivered' });
      expect(deliveredOrders.length).toBe(1);
      expect(deliveredOrders[0].status).toBe('delivered');
    });

    test('debería encontrar órdenes por método de pago', async () => {
      const webpayOrders = await Order.find({ paymentMethod: 'webpay' });
      expect(webpayOrders.length).toBe(1);

      const cashOrders = await Order.find({ paymentMethod: 'cash' });
      expect(cashOrders.length).toBe(1);
    });

    test('debería encontrar órdenes por rango de fechas', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const recentOrders = await Order.find({
        createdAt: {
          $gte: yesterday,
          $lte: tomorrow
        }
      });

      expect(recentOrders.length).toBe(3);
    });

    test('debería ordenar órdenes por fecha', async () => {
      const ordersDesc = await Order.find({ user: testUser._id })
        .sort({ createdAt: -1 });

      expect(ordersDesc.length).toBe(3);
      
      // Verificar orden descendente
      for (let i = 1; i < ordersDesc.length; i++) {
        expect(ordersDesc[i-1].createdAt.getTime())
          .toBeGreaterThanOrEqual(ordersDesc[i].createdAt.getTime());
      }
    });

    test('debería calcular agregaciones básicas', async () => {
      const stats = await Order.aggregate([
        { $match: { user: testUser._id, status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalAmount: { $sum: '$totalPrice' },
            averageAmount: { $avg: '$totalPrice' }
          }
        }
      ]);

      expect(stats[0].totalOrders).toBe(2); // Excluyendo cancelada
      expect(stats[0].totalAmount).toBe(47600); // 11900 + 35700
      expect(stats[0].averageAmount).toBe(23800); // 47600 / 2
    });
  });

  describe('Métodos de utilidad y helpers', () => {
    test('debería calcular correctamente totales de items', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 3,
            price: 12000
          },
          {
            product: testProduct._id,
            quantity: 2,
            price: 18000
          }
        ],
        shipmentMethod: 'pickup',
        paymentMethod: 'cash'
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      // Calcular total manualmente
      const calculatedTotal = savedOrder.items.reduce((sum, item) => {
        return sum + (item.quantity * item.price);
      }, 0);

      expect(calculatedTotal).toBe(72000); // 3*12000 + 2*18000
    });

    test('debería validar estructura de dirección completa', async () => {
      const completeAddress = {
        street: 'Av. Providencia 1234, Oficina 567',
        city: 'Providencia',
        state: 'Región Metropolitana',
        postalCode: '7500000',
        country: 'Chile'
      };

      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 25000
          }
        ],
        shipmentMethod: 'delivery',
        shippingAddress: completeAddress,
        paymentMethod: 'webpay'
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      expect(savedOrder.shippingAddress.street).toBe(completeAddress.street);
      expect(savedOrder.shippingAddress.city).toBe(completeAddress.city);
      expect(savedOrder.shippingAddress.state).toBe(completeAddress.state);
      expect(savedOrder.shippingAddress.postalCode).toBe(completeAddress.postalCode);
      expect(savedOrder.shippingAddress.country).toBe(completeAddress.country);
    });
  });

  describe('Casos edge y límites', () => {
    test('debería manejar órdenes con muchos items', async () => {
      const manyItems = [];
      for (let i = 0; i < 20; i++) {
        manyItems.push({
          product: testProduct._id,
          quantity: 1,
          price: 1000 + i * 100
        });
      }

      const orderData = {
        user: testUser._id,
        items: manyItems,
        shipmentMethod: 'pickup',
        paymentMethod: 'cash'
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      expect(savedOrder.items).toHaveLength(20);
    });

    test('debería manejar valores monetarios con decimales', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 33333.33
          }
        ],
        shipmentMethod: 'pickup',
        paymentMethod: 'cash',
        itemsPrice: 33333.33,
        taxPrice: 6333.33,
        shippingPrice: 0,
        totalPrice: 39666.66
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      expect(savedOrder.itemsPrice).toBeCloseTo(33333.33, 2);
      expect(savedOrder.taxPrice).toBeCloseTo(6333.33, 2);
      expect(savedOrder.totalPrice).toBeCloseTo(39666.66, 2);
    });

    test('debería manejar órdenes con cantidades grandes', async () => {
      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 999,
            price: 100
          }
        ],
        shipmentMethod: 'pickup',
        paymentMethod: 'cash',
        itemsPrice: 99900,
        taxPrice: 18981,
        totalPrice: 118881
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      expect(savedOrder.items[0].quantity).toBe(999);
      expect(savedOrder.itemsPrice).toBe(99900);
    });

    test('debería manejar fechas futuras en pickup', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Una semana

      const orderData = {
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            quantity: 1,
            price: 25000
          }
        ],
        shipmentMethod: 'pickup',
        pickupLocation: {
          name: 'Tienda Central',
          address: 'Av. Central 456',
          scheduledDate: futureDate
        },
        paymentMethod: 'cash'
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      expect(savedOrder.pickupLocation.scheduledDate.getTime()).toBe(futureDate.getTime());
    });
  });
});