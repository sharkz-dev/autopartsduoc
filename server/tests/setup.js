const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Cargar variables de entorno de prueba
dotenv.config({ path: './.env.test' });

let mongoServer;

// Configuración global para pruebas
beforeAll(async () => {
  try {
    // Iniciar servidor de MongoDB en memoria
    mongoServer = await MongoMemoryServer.create();
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
  } catch (error) {
    console.error('Error limpiando base de datos:', error);
  }
});

// Cerrar conexiones después de todas las pruebas
afterAll(async () => {
  try {
    // Cerrar conexión a MongoDB
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    
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

// Mock para nodemailer (evitar envío real de emails en pruebas)
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn(() => Promise.resolve({ messageId: 'test-message-id' }))
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
    description: 'Descripción de categoría de prueba',
    slug: 'categoria_prueba'
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
    orderType: 'B2C'
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
    return await User.create(testUser);
  },
  
  // Crea una categoría de prueba en la base de datos
  createTestCategory: async (categoryData = {}) => {
    const Category = require('../models/Category');
    const testCategory = { ...global.testUtils.validCategory, ...categoryData };
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
  }
};

console.log('🔧 Configuración de pruebas inicializada correctamente');