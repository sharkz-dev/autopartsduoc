const transbankService = require('../../../services/transbank.service');
const User = require('../../../models/User');
const Order = require('../../../models/Order');

// Mock del SDK de Transbank
jest.mock('transbank-sdk', () => ({
  WebpayPlus: {
    Transaction: jest.fn().mockImplementation(() => ({
      create: jest.fn(),
      commit: jest.fn()
    }))
  },
  Environment: {
    Integration: 'integration',
    Production: 'production'
  },
  IntegrationCommerceCodes: {
    WEBPAY_PLUS: 'test_commerce_code'
  },
  IntegrationApiKeys: {
    WEBPAY: 'test_api_key'
  }
}));

describe('Servicio Transbank', () => {
  let user, order, mockTx;

  beforeEach(async () => {
    // Crear usuario de prueba
    user = new User({
      name: 'Cliente Test',
      email: 'cliente@test.com',
      password: 'password123'
    });
    await user.save();

    // Crear orden de prueba
    order = new Order({
      user: user._id,
      items: [{
        product: '507f1f77bcf86cd799439011',
        quantity: 2,
        price: 50000
      }],
      shipmentMethod: 'delivery',
      shippingAddress: {
        street: 'Calle Test 123',
        city: 'Santiago',
        state: 'RM',
        postalCode: '8320000',
        country: 'Chile'
      },
      paymentMethod: 'webpay',
      itemsPrice: 100000,
      taxPrice: 19000,
      shippingPrice: 5000,
      totalPrice: 124000
    });
    await order.save();

    // Limpiar mapa global
    global.buyOrderMap = new Map();

    // Configurar mock de transbank
    const { WebpayPlus } = require('transbank-sdk');
    mockTx = new WebpayPlus.Transaction();
    
    // Reset mocks
    mockTx.create.mockReset();
    mockTx.commit.mockReset();
  });

  describe('Generación de identificadores', () => {
    test('debe generar buyOrder válido para ID corto', () => {
      const orderId = '12345';
      const buyOrder = transbankService.generateBuyOrder(orderId);
      
      expect(buyOrder).toContain('12345_');
      expect(buyOrder.length).toBeLessThanOrEqual(26);
    });

    test('debe generar buyOrder válido para ID largo', () => {
      const longOrderId = '507f1f77bcf86cd799439011abcdef';
      const buyOrder = transbankService.generateBuyOrder(longOrderId);
      
      expect(buyOrder.length).toBeLessThanOrEqual(26);
      expect(buyOrder).toContain('_');
    });

    test('debe generar sessionId válido', () => {
      const userId = user._id.toString();
      const sessionId = transbankService.generateSessionId(userId);
      
      expect(sessionId).toMatch(/^S.+T\d{10}$/);
      expect(sessionId.length).toBeLessThanOrEqual(61);
    });
  });

  describe('Creación de transacciones', () => {
    test('debe crear transacción exitosamente', async () => {
      mockTx.create.mockResolvedValue({
        token: 'test_token_123',
        url: 'https://webpay3gint.transbank.cl/webpayserver/initTransaction'
      });

      const result = await transbankService.createPaymentTransaction(order);
      
      expect(result).toHaveProperty('token', 'test_token_123');
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('buyOrder');
      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('amount', 124000);
    });

    test('debe manejar error en creación de transacción', async () => {
      mockTx.create.mockRejectedValue(new Error('Error de Transbank'));

      await expect(
        transbankService.createPaymentTransaction(order)
      ).rejects.toThrow('No se pudo crear la transacción de pago');
    });

    test('debe validar datos de orden requeridos', async () => {
      await expect(
        transbankService.createPaymentTransaction(null)
      ).rejects.toThrow('Datos de orden incompletos');
    });

    test('debe validar totalPrice en orden', async () => {
      const invalidOrder = { ...order.toObject() };
      delete invalidOrder.totalPrice;

      await expect(
        transbankService.createPaymentTransaction(invalidOrder)
      ).rejects.toThrow('Datos de orden incompletos');
    });
  });

  describe('Confirmación de transacciones', () => {
    test('debe confirmar transacción aprobada', async () => {
      mockTx.commit.mockResolvedValue({
        buy_order: 'ORDER_123_456',
        session_id: 'SESSION_123',
        amount: 124000,
        authorization_code: '123456',
        response_code: 0, // Aprobada
        transaction_date: '2025-01-01T10:00:00Z',
        payment_type_code: 'VN',
        card_detail: { card_number: '****1234' },
        installments_number: 0
      });

      const result = await transbankService.confirmPaymentTransaction('test_token');
      
      expect(result.isApproved).toBe(true);
      expect(result.status).toBe('approved');
      expect(result.authorizationCode).toBe('123456');
      expect(result.responseCode).toBe(0);
    });

    test('debe confirmar transacción rechazada', async () => {
      mockTx.commit.mockResolvedValue({
        buy_order: 'ORDER_123_456',
        session_id: 'SESSION_123',
        amount: 124000,
        response_code: -1, // Rechazada
        authorization_code: null
      });

      const result = await transbankService.confirmPaymentTransaction('test_token');
      
      expect(result.isApproved).toBe(false);
      expect(result.status).toBe('rejected');
      expect(result.responseCode).toBe(-1);
    });

    test('debe manejar error en confirmación', async () => {
      mockTx.commit.mockRejectedValue(new Error('Error de confirmación'));

      await expect(
        transbankService.confirmPaymentTransaction('invalid_token')
      ).rejects.toThrow('No se pudo confirmar la transacción');
    });

    test('debe requerir token para confirmación', async () => {
      await expect(
        transbankService.confirmPaymentTransaction(null)
      ).rejects.toThrow('Token de transacción requerido');
    });
  });

  describe('Extracción de orderId', () => {
    test('debe extraer orderId del mapa global', () => {
      const buyOrder = 'ORDER_123_456789';
      const orderId = '507f1f77bcf86cd799439011';
      
      global.buyOrderMap.set(buyOrder, orderId);
      
      const extracted = transbankService.extractOrderIdFromBuyOrder(buyOrder);
      expect(extracted).toBe(orderId);
      
      // Verificar que se elimina del mapa después de usar
      expect(global.buyOrderMap.has(buyOrder)).toBe(false);
    });

    test('debe extraer orderId por parsing cuando no está en mapa', () => {
      const buyOrder = '507f1f77bcf86cd799439011_456789';
      
      const extracted = transbankService.extractOrderIdFromBuyOrder(buyOrder);
      expect(extracted).toBe('507f1f77bcf86cd799439011');
    });

    test('debe retornar null para buyOrder inválido', () => {
      const buyOrder = 'invalid_format';
      
      const extracted = transbankService.extractOrderIdFromBuyOrder(buyOrder);
      expect(extracted).toBeNull();
    });
  });

  describe('Búsqueda por buyOrder en base de datos', () => {
    test('debe encontrar orderId en base de datos', async () => {
      const buyOrder = 'ORDER_TEST_123';
      
      // Actualizar orden con buyOrder
      await Order.findByIdAndUpdate(order._id, {
        'paymentResult.buyOrder': buyOrder
      });

      const foundOrderId = await transbankService.findOrderIdByBuyOrder(buyOrder);
      expect(foundOrderId).toBe(order._id.toString());
    });

    test('debe retornar null si no encuentra orden', async () => {
      const foundOrderId = await transbankService.findOrderIdByBuyOrder('NONEXISTENT_ORDER');
      expect(foundOrderId).toBeNull();
    });
  });

  describe('Estado de transacción', () => {
    test('debe obtener estado de transacción exitosa', async () => {
      mockTx.commit.mockResolvedValue({
        buy_order: 'ORDER_123',
        response_code: 0,
        amount: 124000
      });

      const status = await transbankService.getTransactionStatus('test_token');
      
      expect(status.status).toBe('approved');
      expect(status.isApproved).toBe(true);
      expect(status.token).toBe('test_token');
    });

    test('debe manejar error en consulta de estado', async () => {
      mockTx.commit.mockRejectedValue(new Error('Error de consulta'));

      const status = await transbankService.getTransactionStatus('invalid_token');
      
      expect(status.status).toBe('error');
      expect(status.isApproved).toBe(false);
      expect(status.error).toBeDefined();
    });
  });

  describe('Reembolsos', () => {
    test('debe procesar reembolso simulado', async () => {
      const result = await transbankService.refundTransaction('test_token', 124000);
      
      expect(result.success).toBe(true);
      expect(result.token).toBe('test_token');
      expect(result.amount).toBe(124000);
      expect(result.refundId).toMatch(/^REFUND_\d+$/);
      expect(result.status).toBe('completed');
    });

    test('debe incluir nota sobre implementación en producción', async () => {
      const result = await transbankService.refundTransaction('test_token', 124000);
      
      expect(result.note).toContain('Implementar WebpayPlus.Refund para producción');
    });
  });

  describe('Validación de configuración', () => {
    test('debe validar configuración de integración', () => {
      const config = transbankService.validateConfiguration();
      
      expect(config.environment).toBe('integration');
      expect(config.hasApiKey).toBe(true);
      expect(config.isProduction).toBe(false);
      expect(config.commerceCode).toBeDefined();
    });

    test('debe detectar entorno de producción', () => {
      const originalEnv = process.env.TRANSBANK_ENVIRONMENT;
      process.env.TRANSBANK_ENVIRONMENT = 'production';
      
      const config = transbankService.validateConfiguration();
      expect(config.isProduction).toBe(true);
      
      // Restaurar valor original
      process.env.TRANSBANK_ENVIRONMENT = originalEnv;
    });
  });

  describe('Manejo de errores de respuesta de Transbank', () => {
    test('debe manejar error con detalles de respuesta', async () => {
      const errorWithResponse = new Error('Request failed');
      errorWithResponse.response = {
        data: { error: 'Invalid commerce code' }
      };
      
      mockTx.create.mockRejectedValue(errorWithResponse);

      await expect(
        transbankService.createPaymentTransaction(order)
      ).rejects.toThrow('No se pudo crear la transacción de pago');
    });

    test('debe manejar error sin detalles de respuesta', async () => {
      mockTx.create.mockRejectedValue(new Error('Network error'));

      await expect(
        transbankService.createPaymentTransaction(order)
      ).rejects.toThrow('No se pudo crear la transacción de pago');
    });
  });

  describe('Validaciones de longitud de parámetros', () => {
    test('debe validar longitud máxima de buyOrder', async () => {
      const longOrderId = 'a'.repeat(50); // ID muy largo
      
      mockTx.create.mockResolvedValue({ token: 'test', url: 'test' });

      // Crear orden con ID válido de MongoDB
      const longOrder = new Order({
        user: user._id,
        items: [{
          product: '507f1f77bcf86cd799439011',
          quantity: 1,
          price: 50000
        }],
        shipmentMethod: 'delivery',
        shippingAddress: {
          street: 'Test',
          city: 'Test',
          state: 'Test',
          postalCode: '1234567',
          country: 'Chile'
        },
        paymentMethod: 'webpay',
        itemsPrice: 50000,
        taxPrice: 9500,
        shippingPrice: 5000,
        totalPrice: 64500
      });
      await longOrder.save();
      
      // Debería manejar IDs largos sin error
      const result = await transbankService.createPaymentTransaction(longOrder);
      expect(result).toBeDefined();
    });

    test('debe generar sessionId dentro del límite', () => {
      const longUserId = 'a'.repeat(50);
      const sessionId = transbankService.generateSessionId(longUserId);
      
      expect(sessionId.length).toBeLessThanOrEqual(61);
    });
  });

  describe('Actualización de orden en base de datos', () => {
    test('debe actualizar orden con datos de pago', async () => {
      mockTx.create.mockResolvedValue({
        token: 'test_token_123',
        url: 'https://test.url'
      });

      await transbankService.createPaymentTransaction(order);
      
      // Verificar que la orden se actualizó
      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder.paymentResult.buyOrder).toBeDefined();
      expect(updatedOrder.paymentResult.sessionId).toBeDefined();
      expect(updatedOrder.paymentResult.status).toBe('pending');
    });
  });
});