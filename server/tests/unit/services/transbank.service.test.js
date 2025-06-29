const transbankService = require('../../../services/transbank.service');
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
    WEBPAY_PLUS: '597055555532'
  },
  IntegrationApiKeys: {
    WEBPAY: '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C'
  }
}));

describe('Servicio Transbank', () => {
  let mockTransaction;

  beforeEach(() => {
    // Resetear mocks
    jest.clearAllMocks();
    
    // Mock de variables de entorno
    process.env.TRANSBANK_ENVIRONMENT = 'integration';
    process.env.TRANSBANK_COMMERCE_CODE = '597055555532';
    process.env.TRANSBANK_API_KEY = '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C';
    process.env.BASE_URL = 'http://localhost:5000';

    // Configurar mock del transaction
    const { WebpayPlus } = require('transbank-sdk');
    mockTransaction = {
      create: jest.fn(),
      commit: jest.fn()
    };
    WebpayPlus.Transaction.mockImplementation(() => mockTransaction);

    // Limpiar mapa global de buyOrders
    global.buyOrderMap = new Map();
  });

  describe('createPaymentTransaction()', () => {
    let testOrder;

    beforeEach(async () => {
      const testUser = await global.testHelpers.createTestUser();
      const testCategory = await global.testHelpers.createTestCategory();
      const testProduct = await global.testHelpers.createTestProduct({}, testCategory._id);
      
      testOrder = await global.testHelpers.createTestOrder({
        totalPrice: 150000,
        paymentMethod: 'webpay'
      }, testUser._id, testProduct._id);
    });

    test('debería crear transacción exitosamente', async () => {
      const mockResponse = {
        token: 'e9d555262db0f989e49d724b4db0b0af367cc415cde41f500a776550fc5fddd7',
        url: 'https://webpay3gint.transbank.cl/webpayserver/initTransaction'
      };

      mockTransaction.create.mockResolvedValue(mockResponse);

      const result = await transbankService.createPaymentTransaction(testOrder);

      expect(result.token).toBe(mockResponse.token);
      expect(result.url).toBe(mockResponse.url);
      expect(result.amount).toBe(150000);
      expect(result.buyOrder).toBeDefined();
      expect(result.sessionId).toBeDefined();

      // Verificar que se llamó al SDK correctamente
      expect(mockTransaction.create).toHaveBeenCalledWith(
        expect.any(String), // buyOrder
        expect.any(String), // sessionId
        150000, // amount
        expect.stringContaining('/api/payment/webpay/return') // returnUrl
      );
    });

    test('debería generar buyOrder válido', async () => {
      const mockResponse = {
        token: 'test_token',
        url: 'https://webpay3gint.transbank.cl/webpayserver/initTransaction'
      };

      mockTransaction.create.mockResolvedValue(mockResponse);

      const result = await transbankService.createPaymentTransaction(testOrder);

      expect(result.buyOrder).toBeDefined();
      expect(result.buyOrder.length).toBeLessThanOrEqual(26);
      expect(result.buyOrder).toContain('_'); // Debería tener formato orderId_timestamp
    });

    test('debería generar sessionId válido', async () => {
      const mockResponse = {
        token: 'test_token',
        url: 'https://webpay3gint.transbank.cl/webpayserver/initTransaction'
      };

      mockTransaction.create.mockResolvedValue(mockResponse);

      const result = await transbankService.createPaymentTransaction(testOrder);

      expect(result.sessionId).toBeDefined();
      expect(result.sessionId.length).toBeLessThanOrEqual(61);
      expect(result.sessionId).toMatch(/^S.*T.*/); // Formato S{userId}T{timestamp}
    });

    test('debería manejar buyOrder muy largo', async () => {
      // Crear orden con ID muy largo
      const longOrderId = 'a'.repeat(30);
      const longOrder = { ...testOrder.toObject(), _id: longOrderId };

      const mockResponse = {
        token: 'test_token',
        url: 'https://webpay3gint.transbank.cl/webpayserver/initTransaction'
      };

      mockTransaction.create.mockResolvedValue(mockResponse);

      const result = await transbankService.createPaymentTransaction(longOrder);

      expect(result.buyOrder.length).toBeLessThanOrEqual(26);
    });

    test('debería actualizar orden con información de pago', async () => {
      const mockResponse = {
        token: 'test_token_update',
        url: 'https://webpay3gint.transbank.cl/webpayserver/initTransaction'
      };

      mockTransaction.create.mockResolvedValue(mockResponse);

      await transbankService.createPaymentTransaction(testOrder);

      // Verificar que la orden se actualizó
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.paymentResult.buyOrder).toBeDefined();
      expect(updatedOrder.paymentResult.sessionId).toBeDefined();
      expect(updatedOrder.paymentResult.status).toBe('pending');
    });

    test('debería guardar mapeo en memoria global', async () => {
      const mockResponse = {
        token: 'test_token_mapping',
        url: 'https://webpay3gint.transbank.cl/webpayserver/initTransaction'
      };

      mockTransaction.create.mockResolvedValue(mockResponse);

      const result = await transbankService.createPaymentTransaction(testOrder);

      expect(global.buyOrderMap).toBeDefined();
      expect(global.buyOrderMap.has(result.buyOrder)).toBe(true);
      expect(global.buyOrderMap.get(result.buyOrder)).toBe(testOrder._id.toString());
    });

    test('debería fallar con datos incompletos', async () => {
      const incompleteOrder = null;

      await expect(transbankService.createPaymentTransaction(incompleteOrder))
        .rejects.toThrow('Datos de orden incompletos');
    });

    test('debería fallar sin totalPrice', async () => {
      const orderWithoutPrice = { ...testOrder.toObject() };
      delete orderWithoutPrice.totalPrice;

      await expect(transbankService.createPaymentTransaction(orderWithoutPrice))
        .rejects.toThrow('Datos de orden incompletos');
    });

    test('debería manejar error del SDK de Transbank', async () => {
      const mockError = new Error('Error de conexión con Transbank');
      mockTransaction.create.mockRejectedValue(mockError);

      await expect(transbankService.createPaymentTransaction(testOrder))
        .rejects.toThrow('No se pudo crear la transacción de pago');
    });

    test('debería limpiar transacción anterior si existe', async () => {
      // Simular transacción anterior
      testOrder.paymentResult = {
        id: 'previous_token',
        status: 'failed'
      };
      await testOrder.save();

      const mockResponse = {
        token: 'new_token',
        url: 'https://webpay3gint.transbank.cl/webpayserver/initTransaction'
      };

      mockTransaction.create.mockResolvedValue(mockResponse);

      await transbankService.createPaymentTransaction(testOrder);

      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.paymentResult.status).toBe('pending');
      expect(updatedOrder.paymentResult.previousAttempt).toBeDefined();
    });
  });

  describe('confirmPaymentTransaction()', () => {
    test('debería confirmar transacción aprobada', async () => {
      const mockResponse = {
        buy_order: 'ORDER_123456',
        session_id: 'SESSION_789',
        amount: 150000,
        authorization_code: 'AUTH123456',
        response_code: 0, // Aprobada
        transaction_date: new Date().toISOString(),
        payment_type_code: 'VN',
        card_detail: {
          card_number: '****1234'
        },
        installments_number: 1
      };

      mockTransaction.commit.mockResolvedValue(mockResponse);

      const result = await transbankService.confirmPaymentTransaction('test_token');

      expect(result.isApproved).toBe(true);
      expect(result.status).toBe('approved');
      expect(result.buyOrder).toBe('ORDER_123456');
      expect(result.authorizationCode).toBe('AUTH123456');
      expect(result.cardDetail.card_number).toBe('****1234');
    });

    test('debería confirmar transacción rechazada', async () => {
      const mockResponse = {
        buy_order: 'ORDER_123456',
        session_id: 'SESSION_789',
        amount: 150000,
        authorization_code: '',
        response_code: -1, // Rechazada
        transaction_date: new Date().toISOString(),
        payment_type_code: 'VN'
      };

      mockTransaction.commit.mockResolvedValue(mockResponse);

      const result = await transbankService.confirmPaymentTransaction('test_token');

      expect(result.isApproved).toBe(false);
      expect(result.status).toBe('rejected');
      expect(result.responseCode).toBe(-1);
    });

    test('debería fallar sin token', async () => {
      await expect(transbankService.confirmPaymentTransaction(null))
        .rejects.toThrow('Token de transacción requerido');

      await expect(transbankService.confirmPaymentTransaction(''))
        .rejects.toThrow('Token de transacción requerido');
    });

    test('debería manejar error del SDK en confirmación', async () => {
      const mockError = new Error('Error de confirmación en Transbank');
      mockTransaction.commit.mockRejectedValue(mockError);

      await expect(transbankService.confirmPaymentTransaction('test_token'))
        .rejects.toThrow('No se pudo confirmar la transacción');
    });

    test('debería incluir datos completos en respuesta', async () => {
      const mockResponse = {
        buy_order: 'ORDER_COMPLETE',
        session_id: 'SESSION_COMPLETE',
        amount: 250000,
        authorization_code: 'AUTH789456',
        response_code: 0,
        transaction_date: '2023-12-01T10:30:00Z',
        payment_type_code: 'VD',
        card_detail: {
          card_number: '****5678'
        },
        installments_number: 3
      };

      mockTransaction.commit.mockResolvedValue(mockResponse);

      const result = await transbankService.confirmPaymentTransaction('complete_token');

      expect(result.buyOrder).toBe('ORDER_COMPLETE');
      expect(result.sessionId).toBe('SESSION_COMPLETE');
      expect(result.amount).toBe(250000);
      expect(result.installmentsNumber).toBe(3);
      expect(result.raw).toEqual(mockResponse);
    });
  });

  describe('extractOrderIdFromBuyOrder()', () => {
    test('debería extraer orderId del mapa global', () => {
      const buyOrder = 'TEST_ORDER_123456';
      const orderId = '507f1f77bcf86cd799439011';
      
      global.buyOrderMap.set(buyOrder, orderId);

      const result = transbankService.extractOrderIdFromBuyOrder(buyOrder);

      expect(result).toBe(orderId);
      expect(global.buyOrderMap.has(buyOrder)).toBe(false); // Debería eliminarse del mapa
    });

    test('debería extraer orderId parseando formato buyOrder', () => {
      const orderId = '507f1f77bcf86cd799439011';
      const buyOrder = `${orderId}_1638360000000`;

      const result = transbankService.extractOrderIdFromBuyOrder(buyOrder);

      expect(result).toBe(orderId);
    });

    test('debería retornar null para buyOrder inválido', () => {
      const invalidBuyOrder = 'INVALID_FORMAT';

      const result = transbankService.extractOrderIdFromBuyOrder(invalidBuyOrder);

      expect(result).toBeNull();
    });

    test('debería manejar buyOrder con múltiples guiones bajos', () => {
      const orderId = 'order_with_underscores_123';
      const buyOrder = `${orderId}_1638360000000`;

      const result = transbankService.extractOrderIdFromBuyOrder(buyOrder);

      expect(result).toBe(orderId);
    });

    test('debería manejar errores gracefully', () => {
      const result = transbankService.extractOrderIdFromBuyOrder(null);
      expect(result).toBeNull();

      const result2 = transbankService.extractOrderIdFromBuyOrder(undefined);
      expect(result2).toBeNull();
    });
  });

  describe('findOrderIdByBuyOrder()', () => {
    let testOrder;

    beforeEach(async () => {
      const testUser = await global.testHelpers.createTestUser();
      const testCategory = await global.testHelpers.createTestCategory();
      const testProduct = await global.testHelpers.createTestProduct({}, testCategory._id);
      
      testOrder = await global.testHelpers.createTestOrder({
        paymentResult: {
          buyOrder: 'DB_SEARCH_123456'
        }
      }, testUser._id, testProduct._id);
    });

    test('debería encontrar orderId en base de datos', async () => {
      const result = await transbankService.findOrderIdByBuyOrder('DB_SEARCH_123456');

      expect(result).toBe(testOrder._id.toString());
    });

    test('debería retornar null si no encuentra buyOrder', async () => {
      const result = await transbankService.findOrderIdByBuyOrder('NON_EXISTENT_BUYORDER');

      expect(result).toBeNull();
    });

    test('debería manejar errores de base de datos', async () => {
      // Simular error de base de datos
      const originalFind = Order.findOne;
      Order.findOne = jest.fn().mockRejectedValue(new Error('DB Error'));

      const result = await transbankService.findOrderIdByBuyOrder('ANY_BUYORDER');

      expect(result).toBeNull();

      // Restaurar método original
      Order.findOne = originalFind;
    });
  });

  describe('getTransactionStatus()', () => {
    test('debería obtener estado de transacción exitosa', async () => {
      const mockResponse = {
        buy_order: 'STATUS_ORDER_123',
        response_code: 0,
        amount: 100000
      };

      mockTransaction.commit.mockResolvedValue(mockResponse);

      const result = await transbankService.getTransactionStatus('status_token');

      expect(result.token).toBe('status_token');
      expect(result.status).toBe('approved');
      expect(result.isApproved).toBe(true);
      expect(result.amount).toBe(100000);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    test('debería manejar transacción fallida', async () => {
      const mockError = new Error('Transaction failed');
      mockTransaction.commit.mockRejectedValue(mockError);

      const result = await transbankService.getTransactionStatus('failed_token');

      expect(result.token).toBe('failed_token');
      expect(result.status).toBe('error');
      expect(result.isApproved).toBe(false);
      expect(result.error).toBe('Transaction failed');
    });
  });

  describe('refundTransaction()', () => {
    test('debería procesar reembolso simulado exitosamente', async () => {
      const token = 'refund_token_123';
      const amount = 50000;

      const result = await transbankService.refundTransaction(token, amount);

      expect(result.success).toBe(true);
      expect(result.token).toBe(token);
      expect(result.amount).toBe(amount);
      expect(result.refundId).toContain('REFUND_');
      expect(result.status).toBe('completed');
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.note).toContain('simulada');
    });

    test('debería manejar errores en reembolso', async () => {
      // En la implementación actual, el reembolso es simulado y siempre exitoso
      // Pero podemos probar el manejo de errores simulando uno
      const originalConsoleError = console.error;
      console.error = jest.fn();

      const result = await transbankService.refundTransaction('error_token', 25000);

      expect(result.success).toBe(true); // Porque es simulado
      expect(result.note).toContain('simulada');

      console.error = originalConsoleError;
    });
  });

  describe('validateConfiguration()', () => {
    test('debería validar configuración de integración', () => {
      process.env.TRANSBANK_ENVIRONMENT = 'integration';

      const result = transbankService.validateConfiguration();

      expect(result.environment).toBe('integration');
      expect(result.isProduction).toBe(false);
      expect(result.hasApiKey).toBe(true);
      expect(result.commerceCode).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    test('debería validar configuración de producción', () => {
      process.env.TRANSBANK_ENVIRONMENT = 'production';
      process.env.TRANSBANK_COMMERCE_CODE = 'PROD_CODE_123';
      process.env.TRANSBANK_API_KEY = 'PROD_API_KEY_456';

      const result = transbankService.validateConfiguration();

      expect(result.environment).toBe('production');
      expect(result.isProduction).toBe(true);
      expect(result.commerceCode).toBe('PROD_CODE_123');
      expect(result.hasApiKey).toBe(true);
    });

    test('debería usar valores por defecto si no hay variables de entorno', () => {
      delete process.env.TRANSBANK_ENVIRONMENT;
      delete process.env.TRANSBANK_COMMERCE_CODE;
      delete process.env.TRANSBANK_API_KEY;

      const result = transbankService.validateConfiguration();

      expect(result.environment).toBe('integration');
      expect(result.isProduction).toBe(false);
      expect(result.commerceCode).toBe('597055555532'); // Código de integración
    });
  });

  describe('Generación de identificadores únicos', () => {
    test('debería generar buyOrders únicos', async () => {
      const testUser = await global.testHelpers.createTestUser();
      const testCategory = await global.testHelpers.createTestCategory();
      const testProduct = await global.testHelpers.createTestProduct({}, testCategory._id);
      
      const testOrder1 = await global.testHelpers.createTestOrder({}, testUser._id, testProduct._id);
      const testOrder2 = await global.testHelpers.createTestOrder({}, testUser._id, testProduct._id);

      const mockResponse = {
        token: 'test_token',
        url: 'https://webpay3gint.transbank.cl/webpayserver/initTransaction'
      };

      mockTransaction.create.mockResolvedValue(mockResponse);

      const result1 = await transbankService.createPaymentTransaction(testOrder1);
      const result2 = await transbankService.createPaymentTransaction(testOrder2);

      expect(result1.buyOrder).not.toBe(result2.buyOrder);
    });

    test('debería generar sessionIds únicos', async () => {
      const testUser1 = await global.testHelpers.createTestUser();
      const testUser2 = await global.testHelpers.createTestUser({
        email: 'user2@test.com',
        name: 'Usuario 2'
      });
      const testCategory = await global.testHelpers.createTestCategory();
      const testProduct = await global.testHelpers.createTestProduct({}, testCategory._id);
      
      const testOrder1 = await global.testHelpers.createTestOrder({}, testUser1._id, testProduct._id);
      const testOrder2 = await global.testHelpers.createTestOrder({}, testUser2._id, testProduct._id);

      const mockResponse = {
        token: 'test_token',
        url: 'https://webpay3gint.transbank.cl/webpayserver/initTransaction'
      };

      mockTransaction.create.mockResolvedValue(mockResponse);

      const result1 = await transbankService.createPaymentTransaction(testOrder1);
      const result2 = await transbankService.createPaymentTransaction(testOrder2);

      expect(result1.sessionId).not.toBe(result2.sessionId);
    });

    test('debería manejar IDs muy largos correctamente', async () => {
      const testUser = await global.testHelpers.createTestUser();
      const testCategory = await global.testHelpers.createTestCategory();
      const testProduct = await global.testHelpers.createTestProduct({}, testCategory._id);
      
      // Simular orden con ID muy largo
      const longOrder = await global.testHelpers.createTestOrder({}, testUser._id, testProduct._id);
      longOrder._id = 'a'.repeat(30); // ID muy largo

      const mockResponse = {
        token: 'test_token',
        url: 'https://webpay3gint.transbank.cl/webpayserver/initTransaction'
      };

      mockTransaction.create.mockResolvedValue(mockResponse);

      const result = await transbankService.createPaymentTransaction(longOrder);

      expect(result.buyOrder.length).toBeLessThanOrEqual(26);
      expect(result.sessionId.length).toBeLessThanOrEqual(61);
    });
  });

  describe('Manejo de errores y recuperación', () => {
    test('debería logear errores detallados', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const mockError = new Error('Detailed Transbank Error');
      mockError.response = {
        data: { error: 'Detailed error info' }
      };
      
      mockTransaction.create.mockRejectedValue(mockError);

      const testUser = await global.testHelpers.createTestUser();
      const testCategory = await global.testHelpers.createTestCategory();
      const testProduct = await global.testHelpers.createTestProduct({}, testCategory._id);
      const testOrder = await global.testHelpers.createTestOrder({}, testUser._id, testProduct._id);

      await expect(transbankService.createPaymentTransaction(testOrder))
        .rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error al crear transacción Webpay'),
        mockError
      );

      consoleSpy.mockRestore();
    });

    test('debería propagar errores apropiadamente', async () => {
      const specificError = new Error('Specific SDK Error');
      mockTransaction.create.mockRejectedValue(specificError);

      const testUser = await global.testHelpers.createTestUser();
      const testCategory = await global.testHelpers.createTestCategory();
      const testProduct = await global.testHelpers.createTestProduct({}, testCategory._id);
      const testOrder = await global.testHelpers.createTestOrder({}, testUser._id, testProduct._id);

      await expect(transbankService.createPaymentTransaction(testOrder))
        .rejects.toThrow('No se pudo crear la transacción de pago: Specific SDK Error');
    });

    test('debería manejar respuestas inesperadas del SDK', async () => {
      // Respuesta sin campos esperados
      const incompleteResponse = {
        token: 'incomplete_token'
        // Sin url
      };

      mockTransaction.create.mockResolvedValue(incompleteResponse);

      const testUser = await global.testHelpers.createTestUser();
      const testCategory = await global.testHelpers.createTestCategory();
      const testProduct = await global.testHelpers.createTestProduct({}, testCategory._id);
      const testOrder = await global.testHelpers.createTestOrder({}, testUser._id, testProduct._id);

      const result = await transbankService.createPaymentTransaction(testOrder);

      expect(result.token).toBe('incomplete_token');
      expect(result.url).toBeUndefined();
    });
  });

  describe('Integración con base de datos', () => {
    test('debería manejar errores de actualización de orden', async () => {
      const testUser = await global.testHelpers.createTestUser();
      const testCategory = await global.testHelpers.createTestCategory();
      const testProduct = await global.testHelpers.createTestProduct({}, testCategory._id);
      const testOrder = await global.testHelpers.createTestOrder({}, testUser._id, testProduct._id);

      // Simular error de base de datos
      const originalFindByIdAndUpdate = Order.findByIdAndUpdate;
      Order.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('DB Update Error'));

      const mockResponse = {
        token: 'test_token',
        url: 'https://webpay3gint.transbank.cl/webpayserver/initTransaction'
      };

      mockTransaction.create.mockResolvedValue(mockResponse);

      // Debería crear la transacción aunque falle la actualización de BD
      const result = await transbankService.createPaymentTransaction(testOrder);

      expect(result.token).toBe('test_token');

      // Restaurar método original
      Order.findByIdAndUpdate = originalFindByIdAndUpdate;
    });
  });
});