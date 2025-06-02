const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Order = require('./models/Order');

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const users = [
  {
    "_id": "60d0fe4f5311236168a109ca",
    "name": "Admin Usuario",
    "email": "admin@example.com",
    "password": "$2a$10$zQSPJhCxh3fZmY7qG4PBnelVh.BOQVRdK9oKpyXxA.z4IQpVR6PTS", // password123
    "role": "admin",
    "address": {
      "street": "Av. Administrador 100",
      "city": "Santiago",
      "state": "RM",
      "postalCode": "1000000",
      "country": "Chile"
    },
    "phone": "+56912345678",
    "createdAt": "2023-01-01T00:00:00.000Z"
  },
  {
    "_id": "60d0fe4f5311236168a109cc",
    "name": "Cliente Ejemplo",
    "email": "cliente@example.com",
    "password": "$2a$10$zQSPJhCxh3fZmY7qG4PBnelVh.BOQVRdK9oKpyXxA.z4IQpVR6PTS", // password123
    "role": "client",
    "address": {
      "street": "Calle Cliente 456",
      "city": "Santiago",
      "state": "RM",
      "postalCode": "1000000",
      "country": "Chile"
    },
    "phone": "+56912345679",
    "createdAt": "2023-01-03T00:00:00.000Z"
  },
  {
    "_id": "60d0fe4f5311236168a109cd",
    "name": "María González",
    "email": "maria@example.com",
    "password": "$2a$10$zQSPJhCxh3fZmY7qG4PBnelVh.BOQVRdK9oKpyXxA.z4IQpVR6PTS", // password123
    "role": "client",
    "address": {
      "street": "Av. Las Condes 789",
      "city": "Santiago",
      "state": "RM",
      "postalCode": "7550000",
      "country": "Chile"
    },
    "phone": "+56987654321",
    "createdAt": "2023-01-04T00:00:00.000Z"
  },
  {
    "_id": "60d0fe4f5311236168a109ce",
    "name": "Carlos Rodríguez",
    "email": "carlos@example.com",
    "password": "$2a$10$zQSPJhCxh3fZmY7qG4PBnelVh.BOQVRdK9oKpyXxA.z4IQpVR6PTS", // password123
    "role": "client",
    "address": {
      "street": "Calle Providencia 321",
      "city": "Santiago",
      "state": "RM",
      "postalCode": "7500000",
      "country": "Chile"
    },
    "phone": "+56956789012",
    "createdAt": "2023-01-05T00:00:00.000Z"
  }
];

// Categorías
const categories = [
  {
    "_id": "61098c591540b03a9423c8a7",
    "name": "Motor",
    "description": "Partes y componentes del motor del vehículo",
    "slug": "motor",
    "createdAt": "2023-01-01T00:00:00.000Z"
  },
  {
    "_id": "61098c591540b03a9423c8a8",
    "name": "Frenos",
    "description": "Sistema de frenos y todos sus componentes",
    "slug": "frenos",
    "createdAt": "2023-01-01T00:00:00.000Z"
  },
  {
    "_id": "61098c591540b03a9423c8a9",
    "name": "Suspensión",
    "description": "Componentes del sistema de suspensión",
    "slug": "suspension",
    "createdAt": "2023-01-01T00:00:00.000Z"
  },
  {
    "_id": "61098c591540b03a9423c8aa",
    "name": "Eléctrico",
    "description": "Componentes eléctricos y electrónicos del vehículo",
    "slug": "electrico",
    "createdAt": "2023-01-01T00:00:00.000Z"
  },
  {
    "_id": "61098c591540b03a9423c8ab",
    "name": "Transmisión",
    "description": "Sistema de transmisión y embrague",
    "slug": "transmision",
    "createdAt": "2023-01-01T00:00:00.000Z"
  },
  {
    "_id": "61098c591540b03a9423c8ac",
    "name": "Carrocería",
    "description": "Partes externas de carrocería y accesorios",
    "slug": "carroceria",
    "createdAt": "2023-01-01T00:00:00.000Z"
  },
  {
    "_id": "61098c591540b03a9423c8ad",
    "name": "Interior",
    "description": "Componentes y accesorios del interior del vehículo",
    "slug": "interior",
    "createdAt": "2023-01-01T00:00:00.000Z"
  },
  {
    "_id": "61098c591540b03a9423c8ae",
    "name": "Llantas y Neumáticos",
    "description": "Llantas, neumáticos y accesorios relacionados",
    "slug": "llantas-neumaticos",
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
];

// Productos actualizados (sin referencias a distribuidor)
const products = [
  {
    "_id": "61099192e06a763f761cb8e1",
    "name": "Filtro de Aceite Premium",
    "description": "Filtro de aceite de alta calidad para motores de 4 cilindros. Compatible con múltiples marcas y modelos. Ofrece excelente filtración y durabilidad extendida.",
    "price": 9990,
    "wholesalePrice": 7990,
    "stockQuantity": 100,
    "category": "61098c591540b03a9423c8a7",
    "brand": "FilterPro",
    "sku": "FP-1234",
    "partNumber": "FP-OIL-1234",
    "compatibleModels": [
      { "make": "Toyota", "model": "Corolla", "year": 2018 },
      { "make": "Honda", "model": "Civic", "year": 2019 },
      { "make": "Nissan", "model": "Sentra", "year": 2020 }
    ],
    "featured": true,
    "avgRating": 4.5,
    "createdAt": "2023-01-05T00:00:00.000Z",
    "onSale": true,
    "discountPercentage": 20,
    "salePrice": 7992,
    "slug": "filtro_de_aceite_premium"
  },
  {
    "_id": "61099192e06a763f761cb8e2",
    "name": "Pastillas de Freno Delanteras",
    "description": "Pastillas de freno de cerámica de alto rendimiento. Duración extendida, bajo nivel de ruido y excelente poder de frenado en todas las condiciones.",
    "price": 24990,
    "wholesalePrice": 19990,
    "stockQuantity": 50,
    "category": "61098c591540b03a9423c8a8",
    "brand": "BrakeMaster",
    "sku": "BM-2468",
    "partNumber": "BM-FRONT-2468",
    "compatibleModels": [
      { "make": "Chevrolet", "model": "Cruze", "year": 2017 },
      { "make": "Hyundai", "model": "Elantra", "year": 2018 },
      { "make": "Kia", "model": "Cerato", "year": 2019 }
    ],
    "featured": true,
    "avgRating": 4.8,
    "createdAt": "2023-01-06T00:00:00.000Z",
    "onSale": true,
    "discountPercentage": 15,
    "salePrice": 21242,
    "slug": "pastillas_de_freno_delanteras"
  },
  {
    "_id": "61099192e06a763f761cb8e3",
    "name": "Amortiguador Trasero",
    "description": "Amortiguador de alta resistencia para uso en todo tipo de terrenos. Proporciona mayor estabilidad, control y comodidad de manejo.",
    "price": 49990,
    "wholesalePrice": 39990,
    "stockQuantity": 30,
    "category": "61098c591540b03a9423c8a9",
    "brand": "SuspensionTech",
    "sku": "ST-3690",
    "partNumber": "ST-REAR-3690",
    "compatibleModels": [
      { "make": "Nissan", "model": "Sentra", "year": 2019 },
      { "make": "Kia", "model": "Rio", "year": 2020 },
      { "make": "Hyundai", "model": "Accent", "year": 2018 }
    ],
    "featured": false,
    "avgRating": 4.2,
    "createdAt": "2023-01-07T00:00:00.000Z",
    "onSale": false,
    "discountPercentage": 0,
    "salePrice": null,
    "slug": "amortiguador_trasero"
  },
  {
    "_id": "61099192e06a763f761cb8e4",
    "name": "Alternador 12V",
    "description": "Alternador de alto rendimiento para sistemas eléctricos de 12V. Mayor duración, eficiencia mejorada y funcionamiento silencioso.",
    "price": 79990,
    "wholesalePrice": 64990,
    "stockQuantity": 20,
    "category": "61098c591540b03a9423c8aa",
    "brand": "ElectroPower",
    "sku": "EP-4812",
    "partNumber": "EP-ALT-4812",
    "compatibleModels": [
      { "make": "Ford", "model": "Focus", "year": 2018 },
      { "make": "Mazda", "model": "3", "year": 2019 },
      { "make": "Volkswagen", "model": "Polo", "year": 2020 }
    ],
    "featured": true,
    "avgRating": 4.6,
    "createdAt": "2023-01-08T00:00:00.000Z",
    "onSale": true,
    "discountPercentage": 25,
    "salePrice": 59993,
    "slug": "alternador_12v"
  },
  {
    "_id": "61099192e06a763f761cb8e5",
    "name": "Kit de Embrague Completo",
    "description": "Kit completo de embrague incluyendo disco, plato y rodamiento. Mayor durabilidad, rendimiento suave y instalación sencilla.",
    "price": 129990,
    "wholesalePrice": 99990,
    "stockQuantity": 15,
    "category": "61098c591540b03a9423c8ab",
    "brand": "TransmissionPro",
    "sku": "TP-5730",
    "partNumber": "TP-CLUTCH-5730",
    "compatibleModels": [
      { "make": "Mitsubishi", "model": "Lancer", "year": 2017 },
      { "make": "Subaru", "model": "Impreza", "year": 2018 },
      { "make": "Suzuki", "model": "Swift", "year": 2019 }
    ],
    "featured": false,
    "avgRating": 4.7,
    "createdAt": "2023-01-09T00:00:00.000Z",
    "onSale": true,
    "discountPercentage": 30,
    "salePrice": 90993,
    "slug": "kit_de_embrague_completo"
  },
  {
    "_id": "61099192e06a763f761cb8e6",
    "name": "Espejo Retrovisor Izquierdo",
    "description": "Espejo retrovisor lateral izquierdo con ajuste eléctrico y calefacción. Diseño OEM para reemplazo directo sin modificaciones.",
    "price": 59990,
    "wholesalePrice": 47990,
    "stockQuantity": 25,
    "category": "61098c591540b03a9423c8ac",
    "brand": "BodyParts",
    "sku": "BP-6854",
    "partNumber": "BP-MIRROR-L-6854",
    "compatibleModels": [
      { "make": "Volkswagen", "model": "Golf", "year": 2019 },
      { "make": "Audi", "model": "A3", "year": 2020 },
      { "make": "Seat", "model": "Leon", "year": 2018 }
    ],
    "featured": true,
    "avgRating": 4.4,
    "createdAt": "2023-01-10T00:00:00.000Z",
    "onSale": false,
    "discountPercentage": 0,
    "salePrice": null,
    "slug": "espejo_retrovisor_izquierdo"
  },
  {
    "_id": "61099192e06a763f761cb8e7",
    "name": "Batería 12V 45Ah",
    "description": "Batería de arranque de 12V y 45Ah de capacidad. Tecnología de plomo-ácido libre de mantenimiento con excelente rendimiento en frío.",
    "price": 45990,
    "wholesalePrice": 36990,
    "stockQuantity": 40,
    "category": "61098c591540b03a9423c8aa",
    "brand": "PowerMax",
    "sku": "PM-BAT45",
    "partNumber": "PM-12V-45AH",
    "compatibleModels": [
      { "make": "Toyota", "model": "Yaris", "year": 2018 },
      { "make": "Honda", "model": "Fit", "year": 2019 },
      { "make": "Nissan", "model": "March", "year": 2020 }
    ],
    "featured": true,
    "avgRating": 4.3,
    "createdAt": "2023-01-11T00:00:00.000Z",
    "onSale": false,
    "discountPercentage": 0,
    "salePrice": null,
    "slug": "bateria_12v_45ah"
  },
  {
    "_id": "61099192e06a763f761cb8e8",
    "name": "Radiador de Aluminio",
    "description": "Radiador de aluminio de alta eficiencia para sistema de refrigeración. Excelente transferencia de calor y resistencia a la corrosión.",
    "price": 89990,
    "wholesalePrice": 71990,
    "stockQuantity": 18,
    "category": "61098c591540b03a9423c8a7",
    "brand": "CoolTech",
    "sku": "CT-RAD890",
    "partNumber": "CT-ALU-RAD-890",
    "compatibleModels": [
      { "make": "Ford", "model": "Fiesta", "year": 2017 },
      { "make": "Chevrolet", "model": "Spark", "year": 2018 },
      { "make": "Renault", "model": "Logan", "year": 2019 }
    ],
    "featured": false,
    "avgRating": 4.1,
    "createdAt": "2023-01-12T00:00:00.000Z",
    "onSale": true,
    "discountPercentage": 12,
    "salePrice": 79192,
    "slug": "radiador_de_aluminio"
  },
  {
    "_id": "61099192e06a763f761cb8e9",
    "name": "Juego de Bujías",
    "description": "Juego completo de 4 bujías de iridio de larga duración. Mejor encendido, mayor eficiencia de combustible y reducción de emisiones.",
    "price": 19990,
    "wholesalePrice": 15990,
    "stockQuantity": 75,
    "category": "61098c591540b03a9423c8a7",
    "brand": "SparkPro",
    "sku": "SP-IRID4",
    "partNumber": "SP-IR-SET-4",
    "compatibleModels": [
      { "make": "Toyota", "model": "Corolla", "year": 2018 },
      { "make": "Mazda", "model": "2", "year": 2019 },
      { "make": "Mitsubishi", "model": "Mirage", "year": 2020 }
    ],
    "featured": true,
    "avgRating": 4.6,
    "createdAt": "2023-01-13T00:00:00.000Z",
    "onSale": true,
    "discountPercentage": 18,
    "salePrice": 16392,
    "slug": "juego_de_bujias"
  },
  {
    "_id": "61099192e06a763f761cb8ea",
    "name": "Llanta de Aleación 16\"",
    "description": "Llanta de aleación de aluminio de 16 pulgadas. Diseño deportivo, peso reducido y excelente resistencia. Incluye centro de llanta.",
    "price": 69990,
    "wholesalePrice": 55990,
    "stockQuantity": 32,
    "category": "61098c591540b03a9423c8ae",
    "brand": "WheelMax",
    "sku": "WM-AL16",
    "partNumber": "WM-ALLOY-16-001",
    "compatibleModels": [
      { "make": "Honda", "model": "Civic", "year": 2018 },
      { "make": "Toyota", "model": "Corolla", "year": 2019 },
      { "make": "Hyundai", "model": "Elantra", "year": 2020 }
    ],
    "featured": true,
    "avgRating": 4.5,
    "createdAt": "2023-01-14T00:00:00.000Z",
    "onSale": false,
    "discountPercentage": 0,
    "salePrice": null,
    "slug": "llanta_de_aleacion_16"
  }
];

const systemConfigs = [
  {
    key: 'tax_rate',
    value: 19,
    description: 'Porcentaje de IVA aplicado a las ventas',
    type: 'number',
    category: 'tax',
    validationRules: { min: 0, max: 100 },
    isEditable: true
  },
  {
    key: 'free_shipping_threshold',
    value: 100000,
    description: 'Monto mínimo para envío gratuito (CLP)',
    type: 'number',
    category: 'shipping',
    validationRules: { min: 0 },
    isEditable: true
  },
  {
    key: 'default_shipping_cost',
    value: 5000,
    description: 'Costo de envío por defecto (CLP)',
    type: 'number',
    category: 'shipping',
    validationRules: { min: 0 },
    isEditable: true
  },
  {
    key: 'site_name',
    value: 'AutoParts',
    description: 'Nombre del sitio web',
    type: 'string',
    category: 'general',
    isEditable: true
  },
  {
    key: 'contact_email',
    value: 'info@autoparts.com',
    description: 'Email de contacto principal',
    type: 'string',
    category: 'general',
    isEditable: true
  },
  {
    key: 'max_file_size',
    value: 5242880,
    description: 'Tamaño máximo de archivo en bytes (5MB)',
    type: 'number',
    category: 'general',
    validationRules: { min: 1048576, max: 10485760 }, // 1MB - 10MB
    isEditable: false
  },
  {
    key: 'currency',
    value: 'CLP',
    description: 'Moneda por defecto del sistema',
    type: 'string',
    category: 'general',
    isEditable: false
  },
  {
    key: 'enable_b2b',
    value: true,
    description: 'Habilitar funcionalidades B2B (mayorista)',
    type: 'boolean',
    category: 'general',
    isEditable: true
  }
];

// Función actualizada para importar datos
const importData = async () => {
  try {
    console.log('🔄 Importando usuarios...');
    await User.create(users);
    console.log('✅ Usuarios importados correctamente');

    console.log('🔄 Importando categorías...');
    await Category.create(categories);
    console.log('✅ Categorías importadas correctamente');

    console.log('🔄 Importando productos...');
    await Product.create(products);
    console.log('✅ Productos importados correctamente');

    // NUEVO: Importar configuraciones del sistema
    console.log('🔄 Importando configuraciones del sistema...');
    const SystemConfig = require('./models/SystemConfig');
    
    for (const config of systemConfigs) {
      try {
        await SystemConfig.create(config);
        console.log(`✅ Configuración creada: ${config.key}`);
      } catch (err) {
        if (err.code === 11000) {
          console.log(`⚠️ Configuración ya existe: ${config.key}`);
        } else {
          console.error(`❌ Error al crear configuración ${config.key}:`, err.message);
        }
      }
    }
    console.log('✅ Configuraciones del sistema importadas correctamente');

    console.log('🎉 Todos los datos han sido importados exitosamente');
    console.log(`📊 Resumen:`);
    console.log(`   - ${users.length} usuarios`);
    console.log(`   - ${categories.length} categorías`);
    console.log(`   - ${products.length} productos`);
    console.log(`   - ${systemConfigs.length} configuraciones del sistema`);
    
    process.exit();
  } catch (err) {
    console.error('❌ Error al importar datos:', err);
    process.exit(1);
  }
};

// Función actualizada para eliminar datos
const deleteData = async () => {
  try {
    console.log('🔄 Eliminando usuarios...');
    await User.deleteMany();
    console.log('✅ Usuarios eliminados');

    console.log('🔄 Eliminando categorías...');
    await Category.deleteMany();
    console.log('✅ Categorías eliminadas');

    console.log('🔄 Eliminando productos...');
    await Product.deleteMany();
    console.log('✅ Productos eliminados');

    console.log('🔄 Eliminando órdenes...');
    await Order.deleteMany();
    console.log('✅ Órdenes eliminadas');

    // NUEVO: Eliminar configuraciones del sistema
    console.log('🔄 Eliminando configuraciones del sistema...');
    const SystemConfig = require('./models/SystemConfig');
    await SystemConfig.deleteMany();
    console.log('✅ Configuraciones del sistema eliminadas');

    console.log('🗑️ Todos los datos han sido eliminados correctamente');
    process.exit();
  } catch (err) {
    console.error('❌ Error al eliminar datos:', err);
    process.exit(1);
  }
};

// Verificar argumentos para importar o eliminar
if (process.argv[2] === '-i') {
  console.log('🚀 Iniciando importación de datos...');
  importData();
} else if (process.argv[2] === '-d') {
  console.log('🗑️ Iniciando eliminación de datos...');
  deleteData();
} else {
  console.log('❓ Uso: node seeder.js [opción]');
  console.log('   Opciones:');
  console.log('   -i    Importar datos de ejemplo');
  console.log('   -d    Eliminar todos los datos');
  console.log('');
  console.log('   Ejemplos:');
  console.log('   npm run data:import   (importar)');
  console.log('   npm run data:destroy  (eliminar)');
  process.exit(1);
}