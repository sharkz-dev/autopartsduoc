const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Configuración global antes de todas las pruebas
beforeAll(async () => {
  try {
    // Crear instancia de MongoDB en memoria
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Conectar mongoose a la base de datos en memoria
    await mongoose.connect(mongoUri);
    
    console.log('✅ Conexión a MongoDB de pruebas establecida');
  } catch (error) {
    console.error('❌ Error en setup de pruebas:', error);
    throw error;
  }
});

// Limpiar datos después de cada prueba
afterEach(async () => {
  try {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error('❌ Error limpiando colecciones:', error);
  }
});

// Limpiar después de todas las pruebas
afterAll(async () => {
  try {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
    
    console.log('✅ Limpieza de pruebas completada');
  } catch (error) {
    console.error('❌ Error en limpieza de pruebas:', error);
  }
});

// Configuración de timeout global
jest.setTimeout(30000);