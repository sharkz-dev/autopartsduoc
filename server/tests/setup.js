const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// Configuración global antes de todos los tests
beforeAll(async () => {
  // Crear servidor MongoDB en memoria
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  // Conectar a MongoDB
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  // Suprimir logs de consola durante tests (opcional)
  if (process.env.NODE_ENV === 'test') {
    console.log = jest.fn();
    console.warn = jest.fn();
    // Mantener console.error para debugging de errores importantes
  }
});

// Limpiar base de datos antes de cada test
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
  
  // Limpiar variables globales
  if (global.buyOrderMap) {
    global.buyOrderMap.clear();
  }
  
  // Reset de mocks
  jest.clearAllMocks();
});

// Cleanup después de todos los tests
afterAll(async () => {
  // Cerrar conexión a MongoDB
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  
  // Detener servidor MongoDB en memoria
  if (mongod) {
    await mongod.stop();
  }
  
  // Limpiar timers y handles
  jest.clearAllTimers();
  jest.useRealTimers();
});

// Configuración de timeout para tests largos
jest.setTimeout(30000);

// Mock de funciones globales si es necesario
global.console = {
  ...console,
  // Suprimir logs específicos durante tests
  log: process.env.NODE_ENV === 'test' ? jest.fn() : console.log,
  warn: process.env.NODE_ENV === 'test' ? jest.fn() : console.warn,
  error: console.error, // Mantener errores para debugging
  info: process.env.NODE_ENV === 'test' ? jest.fn() : console.info,
  debug: process.env.NODE_ENV === 'test' ? jest.fn() : console.debug
};

// Configuración para manejo de promesas no resueltas
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Mock de servicios externos si es necesario
jest.mock('../services/email.service', () => ({
  sendOrderConfirmationEmail: jest.fn(),
  sendOrderStatusUpdateEmail: jest.fn(),
  sendWelcomeEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn()
}));