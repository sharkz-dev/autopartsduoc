const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Cargar variables de entorno de prueba
dotenv.config({ path: './.env.test' });

let mongoServer;

// ✅ CORREGIDO: Mock de nodemailer ANTES de cualquier importación
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(() => Promise.resolve({ 
      messageId: 'test-message-id',
      response: '250 OK'
    }))
  }))
}));

// Mock para file uploads
jest.mock('express-fileupload', () => ({
  __esModule: true,
  default: () => (req, res, next) => {
    req.files = {};
    next();
  }
}));

// Mock para fs operations en tests
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(() => true),
  unlinkSync: jest.fn(),
  mkdirSync: jest.fn(),
  accessSync: jest.fn()
}));

// Configuración global para pruebas
beforeAll(async () => {
  try {
    console.log('🔧 Configuración de pruebas inicializada correctamente');
    
    // Iniciar servidor de MongoDB en memoria
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '6.0.0'
      }
    });
    const mongoUri = mongoServer.getUri();
    
    // Conectar a MongoDB en memoria
    await mongoose.connect(mongoUri);
    
    console.log('✅ Conexión a MongoDB de prueba establecida');
  } catch (error) {
    console.error('❌ Error configurando base de datos de prueba:', error);
    throw error;
  }
});

// Limpiar después de cada prueba
afterEach(async () => {
  try {
    // Limpiar todas las colecciones
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
    
    // Limpiar mocks
    jest.clearAllMocks();
  } catch (error) {
    console.error('Error limpiando base de datos:', error);
  }
});

// Cerrar conexiones después de todas las pruebas
afterAll(async () => {
  try {
    // Cerrar conexión a MongoDB
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    
    // Detener servidor de MongoDB en memoria
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    console.log('✅ Conexiones de prueba cerradas correctamente');
  } catch (error) {
    console.error('❌ Error cerrando conexiones de prueba:', error);
  }
});

// Configuración de timeout para pruebas
jest.setTimeout(30000);

// Variables globales para pruebas
global.testUtils = {
  // Datos de prueba comunes
  validUser: {
    name: 'Usuario Prueba',
    email: 'test@autoparts.cl',
    password: 'contraseña123',
    role: 'client',
    address: {
      street: 'Calle Test 123',
      city: 'Santiago',
      state: 'RM',
      postalCode: '8320000',
      country: 'Chile'
    },
    phone: '+56912345678'
  },
  
  validAdmin: {
    name: 'Admin Prueba',
    email: 'admin@autoparts.cl',
    password: 'contraseña123',
    role: 'admin'
  },
  
  validDistributor: {
    name: 'Distribuidor Prueba',
    email: 'distribuidor@autoparts.cl',
    password: 'contraseña123',
    role: 'distributor',
    distributorInfo: {
      companyName: 'Distribuidora Test SpA',
      companyRUT: '12345678-9',
      businessLicense: 'LIC-123',
      creditLimit: 1000000,
      discountPercentage: 15,
      isApproved: true
    }
  },
  
  validCategory: {
    name: 'Categoría Prueba',
    description: 'Descripción de categoría de prueba'
    // ✅ CORREGIDO: No incluir slug manualmente, se genera automáticamente
  },
  
  validProduct: {
    name: 'Producto Prueba',
    description: 'Descripción del producto de prueba',
    price: 25990,
    wholesalePrice: 19990,
    stockQuantity: 50,
    brand: 'MarcaPrueba',
    sku: 'TEST-001',
    partNumber: 'PN-12345',
    featured: false,
    onSale: false,
    compatibleModels: [
      { make: 'Toyota', model: 'Corolla', year: 2020 }
    ]
    // ✅ CORREGIDO: No incluir slug manualmente, se genera automáticamente
  },
  
  validOrder: {
    items: [
      {
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
    totalPrice: 66856,
    orderType: 'B2C',
    taxRate: 19
  }
};

// Utilidades para pruebas
global.testHelpers = {
  // Genera token JWT para pruebas
  generateTestToken: (userId) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '1h'
    });
  },
  
  // Crea un usuario de prueba en la base de datos
  createTestUser: async (userData = {}) => {
    const User = require('../models/User');
    const testUser = { ...global.testUtils.validUser, ...userData };
    
    // ✅ CORREGIDO: Asegurar email único para cada test
    if (!userData.email) {
      testUser.email = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@autoparts.cl`;
    }
    if (!userData.sku && userData.role !== 'admin') {
      testUser.sku = `TEST-USER-${Date.now()}`;
    }
    
    return await User.create(testUser);
  },
  
  // Crea una categoría de prueba en la base de datos
  createTestCategory: async (categoryData = {}) => {
    const Category = require('../models/Category');
    const testCategory = { ...global.testUtils.validCategory, ...categoryData };
    
    // ✅ CORREGIDO: Asegurar nombre único
    if (!categoryData.name) {
      testCategory.name = `Categoría Test ${Date.now()}`;
    }
    
    return await Category.create(testCategory);
  },
  
  // Crea un producto de prueba en la base de datos
  createTestProduct: async (productData = {}, categoryId = null) => {
    const Product = require('../models/Product');
    const Category = require('../models/Category');
    
    let category;
    if (categoryId) {
      category = await Category.findById(categoryId);
    } else {
      category = await global.testHelpers.createTestCategory();
    }
    
    const testProduct = { 
      ...global.testUtils.validProduct, 
      category: category._id,
      ...productData 
    };
    
    // ✅ CORREGIDO: Asegurar SKU único
    if (!productData.sku) {
      testProduct.sku = `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    
    // ✅ CORREGIDO: Asegurar nombre único si no se proporciona
    if (!productData.name) {
      testProduct.name = `Producto Test ${Date.now()}`;
    }
    
    return await Product.create(testProduct);
  },
  
  // Crea una orden de prueba en la base de datos
  createTestOrder: async (orderData = {}, userId = null, productId = null) => {
    const Order = require('../models/Order');
    const user = userId ? { _id: userId } : await global.testHelpers.createTestUser();
    const product = productId ? { _id: productId } : await global.testHelpers.createTestProduct();
    
    const testOrder = {
      ...global.testUtils.validOrder,
      user: user._id,
      items: [
        {
          product: product._id,
          quantity: 2,
          price: 25990
        }
      ],
      ...orderData
    };
    return await Order.create(testOrder);
  },
  
  // ✅ NUEVO: Helper para crear configuración del sistema
  createTestSystemConfig: async (configData = {}) => {
    const SystemConfig = require('../models/SystemConfig');
    const defaultConfig = {
      key: `test_config_${Date.now()}`,
      value: 'test_value',
      description: 'Configuración de prueba',
      type: 'string',
      category: 'general',
      ...configData
    };
    return await SystemConfig.create(defaultConfig);
  },
  
  // ✅ NUEVO: Helper para limpiar base de datos específica
  cleanDatabase: async () => {
    const collections = mongoose.connection.collections;
    const cleanupPromises = Object.keys(collections).map(key => 
      collections[key].deleteMany({})
    );
    await Promise.all(cleanupPromises);
  },
  
  // ✅ NUEVO: Helper para mockear servicios
  mockEmailService: () => {
    return {
      sendEmail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
      sendWelcomeEmail: jest.fn().mockResolvedValue({ messageId: 'mock-welcome' }),
      sendOrderConfirmationEmail: jest.fn().mockResolvedValue({ messageId: 'mock-order' })
    };
  }
};

// ✅ NUEVO: Mock para servicios específicos
jest.mock('../services/email.service', () => ({
  sendEmail: jest.fn().mockResolvedValue({ messageId: 'mock-email' }),
  sendWelcomeEmail: jest.fn().mockResolvedValue({ messageId: 'mock-welcome' }),
  sendOrderConfirmationEmail: jest.fn().mockResolvedValue({ messageId: 'mock-order-confirmation' }),
  sendOrderStatusUpdateEmail: jest.fn().mockResolvedValue({ messageId: 'mock-status-update' }),
  sendDistributorApprovalEmail: jest.fn().mockResolvedValue({ messageId: 'mock-distributor-approval' }),
  sendDistributorOrderNotification: jest.fn().mockResolvedValue({ messageId: 'mock-distributor-notification' }),
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ messageId: 'mock-password-reset' }),
  sendLowStockAlert: jest.fn().mockResolvedValue({ messageId: 'mock-low-stock' }),
  sendNewReviewNotification: jest.fn().mockResolvedValue({ messageId: 'mock-review-notification' }),
  sendPromotionalEmail: jest.fn().mockResolvedValue([{ email: 'test@test.com', status: 'sent' }]),
  sendAbandonedCartReminder: jest.fn().mockResolvedValue({ messageId: 'mock-cart-reminder' })
}));

// ✅ NUEVO: Mock para transbank service
jest.mock('../services/transbank.service', () => ({
  createPaymentTransaction: jest.fn().mockResolvedValue({
    token: 'mock-token',
    url: 'https://mock-webpay-url.com',
    buyOrder: 'mock-buy-order',
    sessionId: 'mock-session-id',
    amount: 100000
  }),
  confirmPaymentTransaction: jest.fn().mockResolvedValue({
    buyOrder: 'mock-buy-order',
    sessionId: 'mock-session-id',
    amount: 100000,
    authorizationCode: 'mock-auth-code',
    responseCode: 0,
    status: 'approved',
    isApproved: true
  }),
  extractOrderIdFromBuyOrder: jest.fn().mockReturnValue('mock-order-id'),
  findOrderIdByBuyOrder: jest.fn().mockResolvedValue('mock-order-id'),
  getTransactionStatus: jest.fn().mockResolvedValue({ status: 'approved' }),
  refundTransaction: jest.fn().mockResolvedValue({ success: true }),
  validateConfiguration: jest.fn().mockReturnValue({ isValid: true })
}));

// Configuración de variables de entorno específicas para tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_muy_largo_para_pruebas';
process.env.JWT_EXPIRE = '1h';
process.env.JWT_COOKIE_EXPIRE = '1';
process.env.FILE_UPLOAD_PATH = './uploads_test';
process.env.MAX_FILE_SIZE = '5000000';
process.env.EMAIL_SERVICE = 'gmail';
process.env.EMAIL_USERNAME = 'test@autoparts.cl';
process.env.EMAIL_PASSWORD = 'test_password';
process.env.FROM_NAME = 'AutoParts Test';
process.env.FROM_EMAIL = 'test@autoparts.cl';
process.env.TRANSBANK_COMMERCE_CODE = '597055555532';
process.env.TRANSBANK_API_KEY = 'test_api_key';
process.env.TRANSBANK_ENVIRONMENT = 'integration';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.BASE_URL = 'http://localhost:5001';