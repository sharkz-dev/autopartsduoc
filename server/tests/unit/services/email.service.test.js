const emailService = require('../../../services/email.service');
const nodemailer = require('nodemailer');

// Mock nodemailer
jest.mock('nodemailer');

describe('Servicio Email', () => {
  let mockTransporter;

  beforeEach(() => {
    // Configurar mock del transporter
    mockTransporter = {
      sendMail: jest.fn()
    };
    
    nodemailer.createTransporter.mockReturnValue(mockTransporter);
    
    // Mock de variables de entorno para pruebas
    process.env.EMAIL_SERVICE = 'gmail';
    process.env.EMAIL_USERNAME = 'test@autoparts.com';
    process.env.EMAIL_PASSWORD = 'test-password';
    process.env.FROM_NAME = 'AutoParts Test';
    process.env.FROM_EMAIL = 'test@autoparts.com';
    process.env.FRONTEND_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail()', () => {
    test('debería enviar email básico correctamente', async () => {
      const mockResponse = { messageId: 'test-message-id-123' };
      mockTransporter.sendMail.mockResolvedValue(mockResponse);

      const emailOptions = {
        to: 'cliente@test.com',
        subject: 'Email de Prueba',
        text: 'Contenido de prueba',
        html: '<p>Contenido HTML de prueba</p>'
      };

      const result = await emailService.sendEmail(emailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'AutoParts Test <test@autoparts.com>',
        to: 'cliente@test.com',
        subject: 'Email de Prueba',
        text: 'Contenido de prueba',
        html: '<p>Contenido HTML de prueba</p>'
      });

      expect(result.messageId).toBe('test-message-id-123');
    });

    test('debería manejar errores de envío', async () => {
      const mockError = new Error('Error de conexión SMTP');
      mockTransporter.sendMail.mockRejectedValue(mockError);

      const emailOptions = {
        to: 'cliente@test.com',
        subject: 'Email de Prueba',
        text: 'Contenido de prueba'
      };

      await expect(emailService.sendEmail(emailOptions))
        .rejects.toThrow('No se pudo enviar el email');
    });

    test('debería enviar email solo con texto', async () => {
      const mockResponse = { messageId: 'text-only-message' };
      mockTransporter.sendMail.mockResolvedValue(mockResponse);

      const emailOptions = {
        to: 'cliente@test.com',
        subject: 'Solo Texto',
        text: 'Solo contenido de texto'
      };

      await emailService.sendEmail(emailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'AutoParts Test <test@autoparts.com>',
        to: 'cliente@test.com',
        subject: 'Solo Texto',
        text: 'Solo contenido de texto',
        html: undefined
      });
    });
  });

  describe('sendWelcomeEmail()', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await global.testHelpers.createTestUser();
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'welcome-message' });
    });

    test('debería enviar email de bienvenida a cliente', async () => {
      await emailService.sendWelcomeEmail(testUser);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      
      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.to).toBe(testUser.email);
      expect(sentEmail.subject).toContain('Bienvenido a AutoParts');
      expect(sentEmail.html).toContain(testUser.name);
      expect(sentEmail.html).toContain('explorar nuestro amplio catálogo');
    });

    test('debería enviar email de bienvenida a distribuidor', async () => {
      const distributor = await global.testHelpers.createTestUser(global.testUtils.validDistributor);
      
      await emailService.sendWelcomeEmail(distributor);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      
      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.to).toBe(distributor.email);
      expect(sentEmail.subject).toContain('Distribuidor Creada');
      expect(sentEmail.html).toContain(distributor.name);
      expect(sentEmail.html).toContain('Pendiente de Aprobación');
      expect(sentEmail.html).toContain('precios mayoristas');
    });

    test('debería incluir URL del frontend en enlaces', async () => {
      await emailService.sendWelcomeEmail(testUser);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain('http://localhost:3000/products');
    });

    test('debería manejar errores de envío gracefully', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));
      
      // No debería lanzar error, solo logearlo
      await expect(emailService.sendWelcomeEmail(testUser))
        .resolves.toBeUndefined();
    });
  });

  describe('sendOrderConfirmationEmail()', () => {
    let testUser, testOrder;

    beforeEach(async () => {
      testUser = await global.testHelpers.createTestUser();
      const testCategory = await global.testHelpers.createTestCategory();
      const testProduct = await global.testHelpers.createTestProduct({}, testCategory._id);
      
      testOrder = await global.testHelpers.createTestOrder({
        items: [
          {
            product: testProduct,
            quantity: 2,
            price: 25990
          }
        ],
        paymentMethod: 'webpay',
        shipmentMethod: 'delivery',
        totalPrice: 66856
      }, testUser._id, testProduct._id);

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'order-confirmation' });
    });

    test('debería enviar confirmación de orden B2C', async () => {
      await emailService.sendOrderConfirmationEmail(testOrder, testUser);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      
      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.to).toBe(testUser.email);
      expect(sentEmail.subject).toContain('Orden Confirmada');
      expect(sentEmail.subject).toContain(testOrder._id);
      expect(sentEmail.html).toContain(testUser.name);
      expect(sentEmail.html).toContain('Orden Retail (B2C)');
      expect(sentEmail.html).toContain('66856'); // Total price formatted
    });

    test('debería incluir detalles de productos correctamente', async () => {
      await emailService.sendOrderConfirmationEmail(testOrder, testUser);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain('Producto Prueba'); // Nombre del producto
      expect(sentEmail.html).toContain('TEST-001'); // SKU
      expect(sentEmail.html).toContain('25.990'); // Precio formateado
      expect(sentEmail.html).toContain('2'); // Cantidad
    });

    test('debería manejar orden B2B correctamente', async () => {
      const distributorUser = await global.testHelpers.createTestUser(global.testUtils.validDistributor);
      const b2bOrder = await global.testHelpers.createTestOrder({
        orderType: 'B2B',
        shipmentMethod: 'pickup',
        pickupLocation: {
          name: 'Bodega Central',
          address: 'Av. Industrial 500'
        }
      }, distributorUser._id);

      await emailService.sendOrderConfirmationEmail(b2bOrder, distributorUser);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain('Orden Mayorista (B2B)');
      expect(sentEmail.html).toContain('Retiro en Tienda');
      expect(sentEmail.html).toContain('Bodega Central');
    });

    test('debería incluir información de pago según método', async () => {
      // Orden con Webpay
      await emailService.sendOrderConfirmationEmail(testOrder, testUser);
      let sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain('Webpay');
      expect(sentEmail.html).toContain('Tarjeta de Crédito/Débito');

      // Reset mock
      mockTransporter.sendMail.mockClear();

      // Orden con transferencia bancaria
      const bankTransferOrder = await global.testHelpers.createTestOrder({
        paymentMethod: 'bankTransfer'
      }, testUser._id);

      await emailService.sendOrderConfirmationEmail(bankTransferOrder, testUser);
      sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain('Transferencia Bancaria');
      expect(sentEmail.html).toContain('Pendiente de confirmación');
    });

    test('debería mostrar envío gratuito correctamente', async () => {
      const freeShippingOrder = await global.testHelpers.createTestOrder({
        shippingPrice: 0,
        totalPrice: 51980 // Solo items + tax
      }, testUser._id);

      await emailService.sendOrderConfirmationEmail(freeShippingOrder, testUser);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain('Gratuito');
    });

    test('debería manejar productos sin categoría', async () => {
      // Crear orden con producto sin categoría
      const orderWithoutCategory = {
        ...testOrder.toObject(),
        items: [
          {
            product: {
              name: 'Producto Sin Categoría',
              sku: 'NO-CAT-001',
              category: null
            },
            quantity: 1,
            price: 10000
          }
        ]
      };

      await emailService.sendOrderConfirmationEmail(orderWithoutCategory, testUser);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain('Sin categoría');
    });
  });

  describe('sendOrderStatusUpdateEmail()', () => {
    let testUser, testOrder;

    beforeEach(async () => {
      testUser = await global.testHelpers.createTestUser();
      testOrder = await global.testHelpers.createTestOrder({}, testUser._id);
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'status-update' });
    });

    test('debería enviar actualización para estado "processing"', async () => {
      testOrder.status = 'processing';
      
      await emailService.sendOrderStatusUpdateEmail(testOrder, testUser);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.subject).toContain('Tu orden está en proceso');
      expect(sentEmail.html).toContain('Hemos comenzado a procesar');
      expect(sentEmail.html).toContain('Verificación de stock');
    });

    test('debería enviar actualización para estado "shipped"', async () => {
      testOrder.status = 'shipped';
      
      await emailService.sendOrderStatusUpdateEmail(testOrder, testUser);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.subject).toContain('Tu orden ha sido enviada');
      expect(sentEmail.html).toContain('está en camino');
      expect(sentEmail.html).toContain('en tránsito');
    });

    test('debería enviar actualización para estado "ready_for_pickup"', async () => {
      testOrder.status = 'ready_for_pickup';
      
      await emailService.sendOrderStatusUpdateEmail(testOrder, testUser);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.subject).toContain('lista para retiro');
      expect(sentEmail.html).toContain('esperándote en nuestra tienda');
      expect(sentEmail.html).toContain('documento de identidad');
    });

    test('debería enviar actualización para estado "delivered"', async () => {
      testOrder.status = 'delivered';
      
      await emailService.sendOrderStatusUpdateEmail(testOrder, testUser);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.subject).toContain('ha sido entregada');
      expect(sentEmail.html).toContain('entregada exitosamente');
      expect(sentEmail.html).toContain('perfectas condiciones');
    });

    test('debería enviar actualización para estado "cancelled"', async () => {
      testOrder.status = 'cancelled';
      
      await emailService.sendOrderStatusUpdateEmail(testOrder, testUser);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.subject).toContain('ha sido cancelada');
      expect(sentEmail.html).toContain('cancelar tu orden');
      expect(sentEmail.html).toContain('procesaremos el reembolso');
    });

    test('debería incluir número de seguimiento si está disponible', async () => {
      testOrder.trackingNumber = 'TRACK123456789';
      testOrder.status = 'shipped';
      
      await emailService.sendOrderStatusUpdateEmail(testOrder, testUser);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain('TRACK123456789');
      expect(sentEmail.html).toContain('Información de Seguimiento');
    });

    test('debería incluir detalles de la orden', async () => {
      await emailService.sendOrderStatusUpdateEmail(testOrder, testUser);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain(testOrder._id);
      expect(sentEmail.html).toContain(testOrder.totalPrice.toLocaleString('es-CL'));
    });
  });

  describe('sendDistributorApprovalEmail()', () => {
    let distributor;

    beforeEach(async () => {
      distributor = await global.testHelpers.createTestUser(global.testUtils.validDistributor);
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'approval-email' });
    });

    test('debería enviar email de aprobación de distribuidor', async () => {
      await emailService.sendDistributorApprovalEmail(distributor);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      
      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.to).toBe(distributor.email);
      expect(sentEmail.subject).toContain('Cuenta de Distribuidor Aprobada');
      expect(sentEmail.html).toContain(distributor.name);
      expect(sentEmail.html).toContain('ha sido aprobada');
    });

    test('debería incluir información de la empresa', async () => {
      await emailService.sendDistributorApprovalEmail(distributor);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain(distributor.distributorInfo.companyName);
      expect(sentEmail.html).toContain(distributor.distributorInfo.companyRUT);
      expect(sentEmail.html).toContain(distributor.distributorInfo.discountPercentage);
    });

    test('debería incluir beneficios activados', async () => {
      await emailService.sendDistributorApprovalEmail(distributor);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain('precios mayoristas exclusivos');
      expect(sentEmail.html).toContain('Descuentos automáticos');
      expect(sentEmail.html).toContain('Línea de crédito empresarial');
    });

    test('debería incluir enlace de acceso', async () => {
      await emailService.sendDistributorApprovalEmail(distributor);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain('http://localhost:3000/login');
      expect(sentEmail.html).toContain('Acceder a mi Cuenta');
    });
  });

  describe('sendPasswordResetEmail()', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await global.testHelpers.createTestUser();
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'reset-email' });
    });

    test('debería enviar email de recuperación de contraseña', async () => {
      const resetToken = 'reset-token-123456';
      
      await emailService.sendPasswordResetEmail(testUser, resetToken);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      
      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.to).toBe(testUser.email);
      expect(sentEmail.subject).toContain('Restablecimiento de Contraseña');
      expect(sentEmail.html).toContain(testUser.name);
    });

    test('debería incluir enlace de restablecimiento con token', async () => {
      const resetToken = 'reset-token-123456';
      
      await emailService.sendPasswordResetEmail(testUser, resetToken);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      const expectedUrl = `http://localhost:3000/reset-password/${resetToken}`;
      expect(sentEmail.html).toContain(expectedUrl);
      expect(sentEmail.html).toContain('Restablecer Contraseña');
    });

    test('debería incluir consejos de seguridad', async () => {
      const resetToken = 'reset-token-123456';
      
      await emailService.sendPasswordResetEmail(testUser, resetToken);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain('Consejos de Seguridad');
      expect(sentEmail.html).toContain('contraseña única');
      expect(sentEmail.html).toContain('gestor de contraseñas');
    });

    test('debería incluir URL alternativa en texto plano', async () => {
      const resetToken = 'reset-token-123456';
      
      await emailService.sendPasswordResetEmail(testUser, resetToken);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      const expectedUrl = `http://localhost:3000/reset-password/${resetToken}`;
      expect(sentEmail.html).toContain(expectedUrl);
    });
  });

  describe('sendLowStockAlert()', () => {
    let testProducts, adminEmails;

    beforeEach(async () => {
      const category = await global.testHelpers.createTestCategory();
      testProducts = [
        await global.testHelpers.createTestProduct({
          name: 'Producto Agotado',
          sku: 'AGOTADO-001',
          stockQuantity: 0
        }, category._id),
        await global.testHelpers.createTestProduct({
          name: 'Producto Stock Bajo',
          sku: 'BAJO-001', 
          stockQuantity: 2
        }, category._id)
      ];
      
      adminEmails = ['admin1@autoparts.com', 'admin2@autoparts.com'];
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'stock-alert' });
    });

    test('debería enviar alerta a múltiples administradores', async () => {
      await emailService.sendLowStockAlert(testProducts, adminEmails);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
      
      const sentEmails = mockTransporter.sendMail.mock.calls;
      expect(sentEmails[0][0].to).toBe('admin1@autoparts.com');
      expect(sentEmails[1][0].to).toBe('admin2@autoparts.com');
    });

    test('debería incluir todos los productos afectados', async () => {
      await emailService.sendLowStockAlert(testProducts, adminEmails);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.subject).toContain(`${testProducts.length} Producto(s)`);
      expect(sentEmail.html).toContain('Producto Agotado');
      expect(sentEmail.html).toContain('Producto Stock Bajo');
      expect(sentEmail.html).toContain('AGOTADO-001');
      expect(sentEmail.html).toContain('BAJO-001');
    });

    test('debería mostrar estados correctos para cada producto', async () => {
      await emailService.sendLowStockAlert(testProducts, adminEmails);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain('Agotado'); // Para producto con stock 0
      expect(sentEmail.html).toContain('Stock Bajo'); // Para producto con stock 2
    });

    test('debería incluir acciones recomendadas', async () => {
      await emailService.sendLowStockAlert(testProducts, adminEmails);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain('Contactar a proveedores');
      expect(sentEmail.html).toContain('Actualizar stock en sistema');
      expect(sentEmail.html).toContain('productos alternativos');
    });
  });

  describe('sendPromotionalEmail()', () => {
    let testUsers, promotion;

    beforeEach(async () => {
      testUsers = [
        await global.testHelpers.createTestUser(),
        await global.testHelpers.createTestUser({
          email: 'user2@test.com',
          name: 'Usuario 2'
        })
      ];

      promotion = {
        title: 'Súper Descuento de Verano',
        subtitle: '¡Solo por tiempo limitado!',
        description: 'Aprovecha nuestros increíbles descuentos en productos seleccionados.',
        discount: 25,
        category: 'Frenos y Suspensión',
        couponCode: 'VERANO25',
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
        link: '/products?category=frenos',
        terms: 'Válido solo para productos en stock. No acumulable con otras ofertas.'
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'promo-email' });
    });

    test('debería enviar promoción a múltiples usuarios', async () => {
      const results = await emailService.sendPromotionalEmail(testUsers, promotion);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(2);
      expect(results[0].status).toBe('sent');
      expect(results[1].status).toBe('sent');
    });

    test('debería incluir información completa de la promoción', async () => {
      await emailService.sendPromotionalEmail(testUsers, promotion);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.subject).toContain('Súper Descuento de Verano');
      expect(sentEmail.html).toContain('25% de Descuento');
      expect(sentEmail.html).toContain('VERANO25');
      expect(sentEmail.html).toContain('Frenos y Suspensión');
    });

    test('debería incluir código de cupón destacado', async () => {
      await emailService.sendPromotionalEmail(testUsers, promotion);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain('VERANO25');
      expect(sentEmail.html).toContain('Código de Cupón');
      expect(sentEmail.html).toContain('copia este código');
    });

    test('debería incluir fecha de validez', async () => {
      await emailService.sendPromotionalEmail(testUsers, promotion);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      const expectedDate = promotion.validUntil.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      expect(sentEmail.html).toContain(expectedDate);
    });

    test('debería incluir enlace de acción', async () => {
      await emailService.sendPromotionalEmail(testUsers, promotion);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain('http://localhost:3000/products?category=frenos');
      expect(sentEmail.html).toContain('Comprar Ahora');
    });

    test('debería manejar errores de envío individualmente', async () => {
      mockTransporter.sendMail
        .mockResolvedValueOnce({ messageId: 'success-1' })
        .mockRejectedValueOnce(new Error('SMTP Error'));

      const results = await emailService.sendPromotionalEmail(testUsers, promotion);

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe('sent');
      expect(results[1].status).toBe('failed');
      expect(results[1].error).toBe('SMTP Error');
    });

    test('debería manejar promoción sin productos destacados', async () => {
      const simplePromotion = {
        title: 'Promoción Simple',
        description: 'Descuento general en toda la tienda'
      };

      await emailService.sendPromotionalEmail(testUsers, simplePromotion);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain('Promoción Simple');
      expect(sentEmail.html).not.toContain('Productos en Oferta');
    });
  });

  describe('sendAbandonedCartReminder()', () => {
    let testUser, cartItems;

    beforeEach(async () => {
      testUser = await global.testHelpers.createTestUser();
      const category = await global.testHelpers.createTestCategory();
      const product1 = await global.testHelpers.createTestProduct({}, category._id);
      const product2 = await global.testHelpers.createTestProduct({
        name: 'Producto 2',
        sku: 'TEST-002',
        price: 15000
      }, category._id);

      cartItems = [
        {
          product: product1,
          quantity: 2
        },
        {
          product: product2,
          quantity: 1
        }
      ];

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'cart-reminder' });
    });

    test('debería enviar recordatorio de carrito abandonado', async () => {
      await emailService.sendAbandonedCartReminder(testUser, cartItems);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      
      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.to).toBe(testUser.email);
      expect(sentEmail.subject).toContain('productos te están esperando');
      expect(sentEmail.html).toContain(testUser.name);
    });

    test('debería incluir resumen del carrito', async () => {
      await emailService.sendAbandonedCartReminder(testUser, cartItems);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain('3 producto(s)'); // 2 + 1
      
      const totalValue = (25990 * 2) + (15000 * 1); // Cálculo del total
      expect(sentEmail.html).toContain(totalValue.toLocaleString('es-CL'));
    });

    test('debería mostrar productos en el carrito', async () => {
      await emailService.sendAbandonedCartReminder(testUser, cartItems);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain('Producto Prueba');
      expect(sentEmail.html).toContain('Producto 2');
      expect(sentEmail.html).toContain('Cantidad: 2');
      expect(sentEmail.html).toContain('Cantidad: 1');
    });

    test('debería incluir incentivos especiales', async () => {
      await emailService.sendAbandonedCartReminder(testUser, cartItems);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain('Oferta Especial');
      expect(sentEmail.html).toContain('próximas 24 horas');
      expect(sentEmail.html).toContain('Envío gratuito');
      expect(sentEmail.html).toContain('5% de descuento');
    });

    test('debería incluir enlace al carrito', async () => {
      await emailService.sendAbandonedCartReminder(testUser, cartItems);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain('http://localhost:3000/cart');
      expect(sentEmail.html).toContain('Finalizar Compra');
    });

    test('debería mostrar solo primeros 3 productos si hay más', async () => {
      // Agregar más productos al carrito
      const category = await global.testHelpers.createTestCategory();
      for (let i = 3; i <= 5; i++) {
        const product = await global.testHelpers.createTestProduct({
          name: `Producto ${i}`,
          sku: `TEST-00${i}`
        }, category._id);
        cartItems.push({ product, quantity: 1 });
      }

      await emailService.sendAbandonedCartReminder(testUser, cartItems);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain('+ 2 producto(s) más'); // Solo muestra 3, indica que hay 2 más
    });
  });

  describe('Utilidades de plantillas', () => {
    test('debería generar plantilla base correctamente', async () => {
      // Enviar un email simple para probar la plantilla base
      await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test content</p>'
      });

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain('AutoParts');
      expect(sentEmail.html).toContain('Tu tienda especializada');
    });

    test('debería incluir información de contacto en footer', async () => {
      await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test content</p>'
      });

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain(process.env.FROM_EMAIL);
      expect(sentEmail.html).toContain('¿Necesitas ayuda?');
    });

    test('debería manejar contenido vacío', async () => {
      await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test vacío',
        text: ''
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'AutoParts Test <test@autoparts.com>',
        to: 'test@example.com',
        subject: 'Test vacío',
        text: '',
        html: undefined
      });
    });
  });

  describe('Configuración y variables de entorno', () => {
    test('debería usar configuración por defecto si faltan variables', async () => {
      delete process.env.FROM_NAME;
      delete process.env.FROM_EMAIL;

      await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        text: 'Test'
      });

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.from).toContain('<'); // Debería tener algún formato de email
    });

    test('debería manejar URL de frontend faltante', async () => {
      delete process.env.FRONTEND_URL;
      
      const testUser = await global.testHelpers.createTestUser();
      await emailService.sendWelcomeEmail(testUser);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain('http://localhost:3000'); // URL por defecto
    });
  });

  describe('Manejo de errores y logging', () => {
    test('debería logear errores de envío', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Connection Failed'));

      await expect(emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        text: 'Test'
      })).rejects.toThrow('No se pudo enviar el email');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error al enviar email:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    test('debería logear éxito de envío', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'success-id' });

      await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        text: 'Test'
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Email enviado exitosamente: %s',
        'success-id'
      );

      consoleSpy.mockRestore();
    });
  });
});