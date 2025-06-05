const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Order = require('./models/Order');
const SystemConfig = require('./models/SystemConfig');

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// =====================================================
// 📋 USUARIOS DEMOSTRATIVOS (1 de cada tipo)
// =====================================================
const users = [
  // 🔧 ADMINISTRADOR
  {
    "_id": "663f1a2b8c9d123456789001",
    "name": "Admin AutoParts",
    "email": "admin@autoparts.com",
    "password": "contraseña123", // password123
    "role": "admin",
    "address": {
      "street": "Av. Libertador Bernardo O'Higgins 1234",
      "city": "Santiago",
      "state": "Región Metropolitana",
      "postalCode": "8320000",
      "country": "Chile"
    },
    "phone": "+56 9 8765 4321",
    "createdAt": "2025-04-15T10:30:00.000Z"
  },
  // 👤 CLIENTE REGULAR
  {
    "_id": "663f1a2b8c9d123456789002",
    "name": "Carlos Mendoza",
    "email": "pa.hernandezu@duocuc.cl",
    "password": "contraseña123", // password123
    "role": "client",
    "address": {
      "street": "Calle Las Flores 567",
      "city": "Santiago",
      "state": "Región Metropolitana",
      "postalCode": "7500000",
      "country": "Chile"
    },
    "phone": "+56 9 1234 5678",
    "createdAt": "2025-04-18T14:15:00.000Z"
  },
  // 🏢 DISTRIBUIDOR APROBADO
  {
    "_id": "663f1a2b8c9d123456789003",
    "name": "Repuestos Central SpA",
    "email": "pa.hernandezu@duoocuc.cl",
    "password": "contraseña123", // password123
    "role": "distributor",
    "address": {
      "street": "Av. Industrial 2500",
      "city": "Santiago",
      "state": "Región Metropolitana",
      "postalCode": "8320000",
      "country": "Chile"
    },
    "phone": "+56 2 2890 4567",
    "distributorInfo": {
      "companyName": "Repuestos Central SpA",
      "companyRUT": "76.543.210-9",
      "businessLicense": "RES-2025-001",
      "creditLimit": 5000000,
      "discountPercentage": 18,
      "isApproved": true,
      "approvedBy": "663f1a2b8c9d123456789001",
      "approvedAt": "2025-04-20T09:00:00.000Z"
    },
    "createdAt": "2025-04-19T16:45:00.000Z"
  },
  // 🏢 DISTRIBUIDOR PENDIENTE
  {
    "_id": "663f1a2b8c9d123456789004",
    "name": "AutoServicios del Norte Ltda",
    "email": "gerencia@autoserviciosnorte.cl",
    "password": "contraseña123", // password123
    "role": "distributor",
    "address": {
      "street": "Calle Atacama 1890",
      "city": "Antofagasta",
      "state": "Región de Antofagasta",
      "postalCode": "1240000",
      "country": "Chile"
    },
    "phone": "+56 55 234 5678",
    "distributorInfo": {
      "companyName": "AutoServicios del Norte Ltda",
      "companyRUT": "87.654.321-0",
      "businessLicense": "RES-2025-002",
      "creditLimit": 0,
      "discountPercentage": 0,
      "isApproved": false // 🔄 PENDIENTE DE APROBACIÓN
    },
    "createdAt": "2025-05-10T11:20:00.000Z"
  }
];

// =====================================================
// 📂 CATEGORÍAS REPRESENTATIVAS
// =====================================================
const categories = [
  {
    "_id": "663f1a2b8c9d123456780001",
    "name": "Motor",
    "description": "Componentes internos y externos del motor",
    "slug": "motor",
    "createdAt": "2025-04-10T08:00:00.000Z"
  },
  {
    "_id": "663f1a2b8c9d123456780002",
    "name": "Sistema de Frenos",
    "description": "Pastillas, discos, líquidos y componentes de frenado",
    "slug": "sistema_de_frenos",
    "createdAt": "2025-04-10T08:15:00.000Z"
  },
  {
    "_id": "663f1a2b8c9d123456780003",
    "name": "Suspensión y Dirección",
    "description": "Amortiguadores, muelles y sistema de dirección",
    "slug": "suspension_y_direccion",
    "createdAt": "2025-04-10T08:30:00.000Z"
  },
  {
    "_id": "663f1a2b8c9d123456780004",
    "name": "Sistema Eléctrico",
    "description": "Baterías, alternadores, cableado y componentes eléctricos",
    "slug": "sistema_electrico",
    "createdAt": "2025-04-10T08:45:00.000Z"
  },
  {
    "_id": "663f1a2b8c9d123456780005",
    "name": "Transmisión",
    "description": "Embragues, cajas de cambio y transmisión",
    "slug": "transmision",
    "createdAt": "2025-04-10T09:00:00.000Z"
  },
  {
    "_id": "663f1a2b8c9d123456780006",
    "name": "Neumáticos y Llantas",
    "description": "Neumáticos, llantas y accesorios de ruedas",
    "slug": "neumaticos_y_llantas",
    "createdAt": "2025-04-10T09:15:00.000Z"
  }
];

// =====================================================
// 🛒 PRODUCTOS DEMOSTRATIVOS (Todas las funcionalidades)
// =====================================================
const products = [
  // 🔥 PRODUCTO EN SUPER OFERTA (Destacado + Descuento)
  {
    "_id": "663f1a2b8c9d123456770001",
    "name": "Kit de Pastillas de Freno Premium Brembo",
    "description": "Kit completo de pastillas de freno delanteras de la marca Brembo. Incluye pastillas cerámicas de alto rendimiento, clips de montaje y grasa para guías. Compatible con vehículos europeos de alta gama.",
    "price": 89990,
    "wholesalePrice": 67990,
    "stockQuantity": 25,
    "category": "663f1a2b8c9d123456780002",
    "brand": "Brembo",
    "sku": "BRE-KIT-001",
    "partNumber": "P85020",
    "compatibleModels": [
      { "make": "BMW", "model": "Serie 3", "year": 2020 },
      { "make": "Mercedes-Benz", "model": "Clase C", "year": 2019 },
      { "make": "Audi", "model": "A4", "year": 2021 }
    ],
    "featured": true, // ⭐ PRODUCTO DESTACADO
    "onSale": true, // 🔥 EN OFERTA
    "discountPercentage": 25, // 25% descuento
    "salePrice": 67493,
    "saleEndDate": "2025-06-15T23:59:59.000Z",
    "avgRating": 4.8,
    "ratings": [
      {
        "user": "663f1a2b8c9d123456789002",
        "rating": 5,
        "comment": "Excelente calidad, se nota la diferencia en el frenado",
        "userName": "Carlos M.",
        "date": "2025-05-15T14:30:00.000Z"
      }
    ],
    "createdAt": "2025-04-12T10:00:00.000Z",
    "slug": "kit_pastillas_freno_premium_brembo"
  },
  
  // 🆕 PRODUCTO NUEVO SIN DESCUENTO (Alto stock)
  {
    "_id": "663f1a2b8c9d123456770002",
    "name": "Filtro de Aceite Mahle Original",
    "description": "Filtro de aceite original Mahle para motores de 4 cilindros. Filtración superior que protege el motor y prolonga la vida útil del aceite. Incluye junta de goma nueva.",
    "price": 12990,
    "wholesalePrice": 9990,
    "stockQuantity": 150,
    "category": "663f1a2b8c9d123456780001",
    "brand": "Mahle",
    "sku": "MAH-FIL-002",
    "partNumber": "OC 90",
    "compatibleModels": [
      { "make": "Toyota", "model": "Corolla", "year": 2022 },
      { "make": "Honda", "model": "Civic", "year": 2021 },
      { "make": "Nissan", "model": "Sentra", "year": 2023 }
    ],
    "featured": false,
    "onSale": false,
    "discountPercentage": 0,
    "avgRating": 4.5,
    "createdAt": "2025-05-01T09:30:00.000Z",
    "slug": "filtro_aceite_mahle_original"
  },
  
  // ⚡ PRODUCTO EN DESCUENTO MODERADO (Stock medio)
  {
    "_id": "663f1a2b8c9d123456770003",
    "name": "Amortiguador Trasero Monroe",
    "description": "Amortiguador trasero Monroe Gas-Matic para máximo confort y control. Tecnología de válvula de precisión que proporciona una conducción suave en todo tipo de terrenos.",
    "price": 65990,
    "wholesalePrice": 52990,
    "stockQuantity": 45,
    "category": "663f1a2b8c9d123456780003",
    "brand": "Monroe",
    "sku": "MON-AMO-003",
    "partNumber": "G7240",
    "compatibleModels": [
      { "make": "Chevrolet", "model": "Cruze", "year": 2020 },
      { "make": "Ford", "model": "Focus", "year": 2019 }
    ],
    "featured": true,
    "onSale": true,
    "discountPercentage": 15, // 15% descuento
    "salePrice": 56092,
    "avgRating": 4.3,
    "createdAt": "2025-04-25T11:15:00.000Z",
    "slug": "amortiguador_trasero_monroe"
  },
  
  // ⚠️ PRODUCTO CON STOCK BAJO
  {
    "_id": "663f1a2b8c9d123456770004",
    "name": "Alternador Bosch 12V 90A",
    "description": "Alternador Bosch de 12V y 90A de potencia. Reconstruido con componentes originales, incluye garantía de 1 año. Ideal para vehículos de alta demanda eléctrica.",
    "price": 125990,
    "wholesalePrice": 99990,
    "stockQuantity": 3, // ⚠️ STOCK BAJO
    "category": "663f1a2b8c9d123456780004",
    "brand": "Bosch",
    "sku": "BOS-ALT-004",
    "partNumber": "0 986 045 340",
    "compatibleModels": [
      { "make": "Volkswagen", "model": "Golf", "year": 2018 },
      { "make": "Seat", "model": "Leon", "year": 2019 }
    ],
    "featured": false,
    "onSale": false,
    "discountPercentage": 0,
    "avgRating": 4.6,
    "createdAt": "2025-04-20T13:45:00.000Z",
    "slug": "alternador_bosch_12v_90a"
  },
  
  // 🚫 PRODUCTO AGOTADO
  {
    "_id": "663f1a2b8c9d123456770005",
    "name": "Kit de Embrague LuK RepSet",
    "description": "Kit completo de embrague LuK RepSet incluye disco, plato de presión y rodamiento de embrague. Para transmisiones manuales de vehículos medianos.",
    "price": 185990,
    "wholesalePrice": 148990,
    "stockQuantity": 0, // 🚫 AGOTADO
    "category": "663f1a2b8c9d123456780005",
    "brand": "LuK",
    "sku": "LUK-EMB-005",
    "partNumber": "623 3042 00",
    "compatibleModels": [
      { "make": "Hyundai", "model": "Elantra", "year": 2020 },
      { "make": "Kia", "model": "Cerato", "year": 2021 }
    ],
    "featured": false,
    "onSale": false,
    "discountPercentage": 0,
    "avgRating": 4.7,
    "createdAt": "2025-04-18T16:20:00.000Z",
    "slug": "kit_embrague_luk_repset"
  },
  
  // 🔋 PRODUCTO DE CATEGORÍA ELÉCTRICA (Con valoraciones)
  {
    "_id": "663f1a2b8c9d123456770006",
    "name": "Batería Varta Blue Dynamic 60Ah",
    "description": "Batería de arranque Varta Blue Dynamic de 60Ah. Tecnología libre de mantenimiento con excelente rendimiento en frío. 3 años de garantía.",
    "price": 89990,
    "wholesalePrice": 71990,
    "stockQuantity": 35,
    "category": "663f1a2b8c9d123456780004",
    "brand": "Varta",
    "sku": "VAR-BAT-006",
    "partNumber": "C22",
    "compatibleModels": [
      { "make": "Peugeot", "model": "208", "year": 2022 },
      { "make": "Citroën", "model": "C3", "year": 2021 }
    ],
    "featured": true,
    "onSale": false,
    "discountPercentage": 0,
    "avgRating": 4.4,
    "ratings": [
      {
        "user": "663f1a2b8c9d123456789002",
        "rating": 4,
        "comment": "Buena batería, arranca bien en invierno",
        "userName": "Carlos M.",
        "date": "2025-05-12T10:15:00.000Z"
      }
    ],
    "createdAt": "2025-04-28T09:00:00.000Z",
    "slug": "bateria_varta_blue_dynamic_60ah"
  },
  
  // Productos de relleno (más simples)
  {
    "_id": "663f1a2b8c9d123456770007",
    "name": "Neumático Michelin Primacy 4",
    "description": "Neumático Michelin Primacy 4 medida 205/55R16. Excelente agarre en mojado y seco.",
    "price": 75990,
    "wholesalePrice": 60990,
    "stockQuantity": 60,
    "category": "663f1a2b8c9d123456780006",
    "brand": "Michelin",
    "sku": "MIC-NEU-007",
    "partNumber": "223647",
    "featured": false,
    "onSale": false,
    "discountPercentage": 0,
    "avgRating": 4.2,
    "createdAt": "2025-05-03T14:00:00.000Z",
    "slug": "neumatico_michelin_primacy_4"
  },
  
  {
    "_id": "663f1a2b8c9d123456770008",
    "name": "Radiador Valeo",
    "description": "Radiador de aluminio Valeo para sistema de refrigeración. Excelente transferencia de calor.",
    "price": 95990,
    "wholesalePrice": 76990,
    "stockQuantity": 20,
    "category": "663f1a2b8c9d123456780001",
    "brand": "Valeo",
    "sku": "VAL-RAD-008",
    "partNumber": "732972",
    "featured": false,
    "onSale": true,
    "discountPercentage": 10,
    "salePrice": 86391,
    "avgRating": 4.1,
    "createdAt": "2025-04-30T12:30:00.000Z",
    "slug": "radiador_valeo"
  },
  
  {
    "_id": "663f1a2b8c9d123456770009",
    "name": "Bujías NGK Iridium",
    "description": "Juego de 4 bujías NGK con electrodo de iridio. Mayor duración y mejor encendido.",
    "price": 35990,
    "wholesalePrice": 28990,
    "stockQuantity": 80,
    "category": "663f1a2b8c9d123456780001",
    "brand": "NGK",
    "sku": "NGK-BUJ-009",
    "partNumber": "ILZFR6D11",
    "featured": false,
    "onSale": false,
    "discountPercentage": 0,
    "avgRating": 4.6,
    "createdAt": "2025-05-05T15:45:00.000Z",
    "slug": "bujias_ngk_iridium"
  },
  
  {
    "_id": "663f1a2b8c9d123456770010",
    "name": "Llanta de Aleación 17\"",
    "description": "Llanta de aleación deportiva de 17 pulgadas. Diseño moderno y peso reducido.",
    "price": 120990,
    "wholesalePrice": 96990,
    "stockQuantity": 24,
    "category": "663f1a2b8c9d123456780006",
    "brand": "OZ Racing",
    "sku": "OZR-LLA-010",
    "partNumber": "W0425320154",
    "featured": true,
    "onSale": false,
    "discountPercentage": 0,
    "avgRating": 4.5,
    "createdAt": "2025-05-08T11:00:00.000Z",
    "slug": "llanta_aleacion_17"
  }
];

// =====================================================
// 📋 ÓRDENES DEMOSTRATIVAS (Diferentes estados)
// =====================================================
const orders = [
  // 🛒 ORDEN COMPLETADA B2C (Cliente regular)
  {
    "_id": "663f1a2b8c9d123456760001",
    "user": "663f1a2b8c9d123456789002",
    "items": [
      {
        "product": "663f1a2b8c9d123456770002",
        "quantity": 2,
        "price": 12990
      },
      {
        "product": "663f1a2b8c9d123456770009",
        "quantity": 1,
        "price": 35990
      }
    ],
    "shipmentMethod": "delivery",
    "shippingAddress": {
      "street": "Calle Las Flores 567",
      "city": "Santiago",
      "state": "Región Metropolitana",
      "postalCode": "7500000",
      "country": "Chile"
    },
    "paymentMethod": "webpay",
    "itemsPrice": 61970,
    "taxPrice": 11774,
    "shippingPrice": 5000,
    "totalPrice": 78744,
    "orderType": "B2C",
    "taxRate": 19,
    "isPaid": true,
    "paidAt": "2025-05-14T10:30:00.000Z",
    "isDelivered": true,
    "deliveredAt": "2025-05-16T14:20:00.000Z",
    "status": "delivered",
    "paymentResult": {
      "id": "token_ws_123456",
      "buyOrder": "ORDER_001_1715693400",
      "authorizationCode": "123456",
      "status": "approved",
      "paymentMethod": "webpay"
    },
    "createdAt": "2025-05-14T09:15:00.000Z"
  },
  
  // 🏢 ORDEN B2B PENDIENTE (Distribuidor)
  {
    "_id": "663f1a2b8c9d123456760002",
    "user": "663f1a2b8c9d123456789003",
    "items": [
      {
        "product": "663f1a2b8c9d123456770001",
        "quantity": 5,
        "price": 67990 // Precio mayorista
      },
      {
        "product": "663f1a2b8c9d123456770006",
        "quantity": 3,
        "price": 71990 // Precio mayorista
      }
    ],
    "shipmentMethod": "pickup",
    "pickupLocation": {
      "name": "AutoParts Bodega Central",
      "address": "Av. Industrial 1500, Santiago",
      "scheduledDate": "2025-05-22T10:00:00.000Z"
    },
    "paymentMethod": "bankTransfer",
    "itemsPrice": 555920,
    "taxPrice": 105625,
    "shippingPrice": 0,
    "totalPrice": 661545,
    "orderType": "B2B",
    "taxRate": 19,
    "isPaid": false,
    "isDelivered": false,
    "status": "processing",
    "createdAt": "2025-05-18T16:45:00.000Z"
  }
];

// =====================================================
// ⚙️ CONFIGURACIONES DEL SISTEMA
// =====================================================
const systemConfigs = [
  {
    key: 'tax_rate',
    value: 19,
    description: 'Porcentaje de IVA aplicado a las ventas',
    type: 'number',
    category: 'tax',
    validationRules: { min: 0, max: 100 },
    lastModifiedBy: "663f1a2b8c9d123456789001",
    createdAt: "2025-04-15T10:30:00.000Z"
  },
  {
    key: 'free_shipping_threshold',
    value: 80000,
    description: 'Monto mínimo para envío gratuito (CLP)',
    type: 'number',
    category: 'shipping',
    validationRules: { min: 0 },
    lastModifiedBy: "663f1a2b8c9d123456789001",
    createdAt: "2025-04-15T10:30:00.000Z"
  },
  {
    key: 'default_shipping_cost',
    value: 5000,
    description: 'Costo de envío por defecto (CLP)',
    type: 'number',
    category: 'shipping',
    validationRules: { min: 0 },
    lastModifiedBy: "663f1a2b8c9d123456789001",
    createdAt: "2025-04-15T10:30:00.000Z"
  },
  {
    key: 'site_name',
    value: 'AutoParts',
    description: 'Nombre del sitio web',
    type: 'string',
    category: 'general',
    lastModifiedBy: "663f1a2b8c9d123456789001",
    createdAt: "2025-04-15T10:30:00.000Z"
  },
  {
    key: 'contact_email',
    value: 'info@autoparts.com',
    description: 'Email de contacto principal',
    type: 'string',
    category: 'general',
    lastModifiedBy: "663f1a2b8c9d123456789001",
    createdAt: "2025-04-15T10:30:00.000Z"
  },
  {
    key: 'enable_b2b',
    value: true,
    description: 'Habilitar funcionalidades B2B (mayorista)',
    type: 'boolean',
    category: 'general',
    isEditable: true,
    lastModifiedBy: "663f1a2b8c9d123456789001",
    createdAt: "2025-04-15T10:30:00.000Z"
  },
  {
    key: 'webpay_environment',
    value: 'integration',
    description: 'Entorno de Webpay (integration/production)',
    type: 'string',
    category: 'payment',
    validationRules: { enum: ['integration', 'production'] },
    isEditable: true,
    lastModifiedBy: "663f1a2b8c9d123456789001",
    createdAt: "2025-04-15T10:30:00.000Z"
  },
  {
    key: 'low_stock_threshold',
    value: 5,
    description: 'Umbral de stock bajo para alertas',
    type: 'number',
    category: 'inventory',
    validationRules: { min: 1, max: 50 },
    isEditable: true,
    lastModifiedBy: "663f1a2b8c9d123456789001",
    createdAt: "2025-04-15T10:30:00.000Z"
  }
];

// =====================================================
// 📊 FUNCIONES DE IMPORTACIÓN Y ELIMINACIÓN
// =====================================================

// Función para importar datos
const importData = async () => {
  try {
    console.log('🚀 Iniciando importación de datos AutoParts...');
    console.log('📅 Datos de ejemplo con fechas abril-mayo 2025\n');

    // Importar usuarios
    console.log('👥 Importando usuarios...');
    await User.create(users);
    console.log(`✅ ${users.length} usuarios importados:`);
    console.log('   🔧 1 Administrador');
    console.log('   👤 1 Cliente regular');
    console.log('   🏢 1 Distribuidor aprobado');
    console.log('   ⏳ 1 Distribuidor pendiente\n');

    // Importar categorías
    console.log('📂 Importando categorías...');
    await Category.create(categories);
    console.log(`✅ ${categories.length} categorías importadas\n`);

    // Importar productos
    console.log('🛒 Importando productos...');
    await Product.create(products);
    console.log(`✅ ${products.length} productos importados:`);
    console.log('   🔥 1 Producto en super oferta (25% desc)');
    console.log('   ⚡ 1 Producto en descuento moderado (15% desc)');
    console.log('   🆕 Productos nuevos sin descuento');
    console.log('   ⚠️ 1 Producto con stock bajo');
    console.log('   🚫 1 Producto agotado');
    console.log('   ⭐ Productos destacados');
    console.log('   💬 Productos con valoraciones\n');

    // Importar órdenes
    console.log('📋 Importando órdenes...');
    await Order.create(orders);
    console.log(`✅ ${orders.length} órdenes importadas:`);
    console.log('   ✅ 1 Orden B2C completada (delivery)');
    console.log('   🏢 1 Orden B2B en proceso (pickup)\n');

    // Importar configuraciones del sistema
    console.log('⚙️ Importando configuraciones del sistema...');
    for (const config of systemConfigs) {
      try {
        await SystemConfig.create(config);
        console.log(`   ✅ ${config.key}: ${config.value}`);
      } catch (err) {
        if (err.code === 11000) {
          console.log(`   ⚠️ Ya existe: ${config.key}`);
        } else {
          console.error(`   ❌ Error: ${config.key} - ${err.message}`);
        }
      }
    }

    console.log('\n🎉 ¡Importación completada exitosamente!');
    console.log('\n📊 RESUMEN DE FUNCIONALIDADES INCLUIDAS:');
    console.log('═══════════════════════════════════════════');
    console.log('🔐 AUTENTICACIÓN:');
    console.log('   • Admin, Cliente, Distribuidor aprobado/pendiente');
    console.log('\n🛒 PRODUCTOS:');
    console.log('   • Productos en oferta con descuentos');
    console.log('   • Productos destacados');
    console.log('   • Stock bajo y agotados');
    console.log('   • Precios B2B y B2C');
    console.log('   • Valoraciones y comentarios');
    console.log('\n📦 ÓRDENES:');
    console.log('   • Orden B2C completada con Webpay');
    console.log('   • Orden B2B mayorista en proceso');
    console.log('   • Diferentes métodos de pago y envío');
    console.log('\n🏢 FUNCIONALIDADES B2B:');
    console.log('   • Distribuidor aprobado con descuentos');
    console.log('   • Distribuidor pendiente de aprobación');
    console.log('   • Precios mayoristas diferenciados');
    console.log('\n⚙️ CONFIGURACIONES:');
    console.log('   • IVA, envío gratuito, costos');
    console.log('   • Configuración Webpay');
    console.log('   • Alertas de stock bajo');
    console.log('\n🎯 DATOS DE ACCESO:');
    console.log('   📧 Admin: admin@autoparts.com');
    console.log('   📧 Cliente: carlos.mendoza@gmail.com');
    console.log('   📧 Distribuidor: contacto@repuestoscentral.cl');
    console.log('   🔑 Password (todos): password123');
    console.log('\n✨ ¡Listo para probar todas las funcionalidades!');
    
    process.exit();
  } catch (err) {
    console.error('❌ Error al importar datos:', err);
    process.exit(1);
  }
};

// Función para eliminar datos
const deleteData = async () => {
  try {
    console.log('🗑️ Iniciando eliminación de datos...');

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

    console.log('🔄 Eliminando configuraciones del sistema...');
    await SystemConfig.deleteMany();
    console.log('✅ Configuraciones eliminadas');

    console.log('\n🗑️ Todos los datos han sido eliminados correctamente');
    console.log('💡 Ejecuta "npm run data:import" para restaurar datos de ejemplo');
    
    process.exit();
  } catch (err) {
    console.error('❌ Error al eliminar datos:', err);
    process.exit(1);
  }
};

// Función para mostrar estadísticas de la base de datos
const showStats = async () => {
  try {
    console.log('📊 ESTADÍSTICAS DE LA BASE DE DATOS AutoParts');
    console.log('═══════════════════════════════════════════════');

    const userCount = await User.countDocuments();
    const clientCount = await User.countDocuments({ role: 'client' });
    const distributorCount = await User.countDocuments({ role: 'distributor' });
    const adminCount = await User.countDocuments({ role: 'admin' });

    const categoryCount = await Category.countDocuments();
    const productCount = await Product.countDocuments();
    const featuredProductCount = await Product.countDocuments({ featured: true });
    const onSaleProductCount = await Product.countDocuments({ onSale: true });
    const lowStockProductCount = await Product.countDocuments({ stockQuantity: { $lte: 5 } });
    const outOfStockProductCount = await Product.countDocuments({ stockQuantity: 0 });

    const orderCount = await Order.countDocuments();
    const b2cOrderCount = await Order.countDocuments({ orderType: 'B2C' });
    const b2bOrderCount = await Order.countDocuments({ orderType: 'B2B' });
    const completedOrderCount = await Order.countDocuments({ status: 'delivered' });

    const configCount = await SystemConfig.countDocuments();

    console.log('\n👥 USUARIOS:');
    console.log(`   Total: ${userCount}`);
    console.log(`   🔧 Administradores: ${adminCount}`);
    console.log(`   👤 Clientes: ${clientCount}`);
    console.log(`   🏢 Distribuidores: ${distributorCount}`);

    console.log('\n📂 CATEGORÍAS:');
    console.log(`   Total: ${categoryCount}`);

    console.log('\n🛒 PRODUCTOS:');
    console.log(`   Total: ${productCount}`);
    console.log(`   ⭐ Destacados: ${featuredProductCount}`);
    console.log(`   🔥 En oferta: ${onSaleProductCount}`);
    console.log(`   ⚠️ Stock bajo: ${lowStockProductCount}`);
    console.log(`   🚫 Agotados: ${outOfStockProductCount}`);

    console.log('\n📋 ÓRDENES:');
    console.log(`   Total: ${orderCount}`);
    console.log(`   🛒 B2C (Retail): ${b2cOrderCount}`);
    console.log(`   🏢 B2B (Mayorista): ${b2bOrderCount}`);
    console.log(`   ✅ Completadas: ${completedOrderCount}`);

    console.log('\n⚙️ CONFIGURACIONES:');
    console.log(`   Total: ${configCount}`);

    // Mostrar algunos productos destacados
    const featuredProducts = await Product.find({ featured: true }).select('name price onSale discountPercentage stockQuantity').limit(3);
    if (featuredProducts.length > 0) {
      console.log('\n🌟 PRODUCTOS DESTACADOS:');
      featuredProducts.forEach(product => {
        const status = product.stockQuantity === 0 ? '🚫 Agotado' : 
                      product.stockQuantity <= 5 ? '⚠️ Stock bajo' : '✅ Disponible';
        const offer = product.onSale ? ` (${product.discountPercentage}% DESC)` : '';
        console.log(`   • ${product.name} - ${product.price.toLocaleString('es-CL')}${offer} - ${status}`);
      });
    }

    // Mostrar distribuidores
    const distributors = await User.find({ role: 'distributor' }).select('name distributorInfo.isApproved distributorInfo.companyName');
    if (distributors.length > 0) {
      console.log('\n🏢 DISTRIBUIDORES:');
      distributors.forEach(dist => {
        const status = dist.distributorInfo?.isApproved ? '✅ Aprobado' : '⏳ Pendiente';
        console.log(`   • ${dist.distributorInfo?.companyName || dist.name} - ${status}`);
      });
    }

    console.log('\n🎯 ACCESOS RÁPIDOS:');
    console.log('   📧 admin@autoparts.com (Admin)');
    console.log('   📧 carlos.mendoza@gmail.com (Cliente)');
    console.log('   📧 contacto@repuestoscentral.cl (Distribuidor)');
    console.log('   🔑 Password: password123 (para todos)');

    process.exit();
  } catch (err) {
    console.error('❌ Error al obtener estadísticas:', err);
    process.exit(1);
  }
};

// =====================================================
// 🎯 EJECUCIÓN SEGÚN ARGUMENTOS
// =====================================================

// Verificar argumentos de línea de comandos
if (process.argv[2] === '-i' || process.argv[2] === '--import') {
  console.log('🚀 Iniciando importación de datos AutoParts...');
  importData();
} else if (process.argv[2] === '-d' || process.argv[2] === '--delete') {
  console.log('🗑️ Iniciando eliminación de datos...');
  deleteData();
} else if (process.argv[2] === '-s' || process.argv[2] === '--stats') {
  console.log('📊 Consultando estadísticas...');
  showStats();
} else {
  console.log('🎯 SEEDER AutoParts - Gestor de Datos de Demostración');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('📋 USO: node seeder.js [opción]');
  console.log('');
  console.log('🔧 OPCIONES DISPONIBLES:');
  console.log('   -i, --import    Importar datos de demostración');
  console.log('   -d, --delete    Eliminar todos los datos');
  console.log('   -s, --stats     Mostrar estadísticas actuales');
  console.log('');
  console.log('💡 EJEMPLOS:');
  console.log('   npm run data:import    (importar datos)');
  console.log('   npm run data:destroy   (eliminar datos)');
  console.log('   npm run data:stats     (ver estadísticas)');
  console.log('');
  console.log('🎯 FUNCIONALIDADES INCLUIDAS:');
  console.log('   ✅ Sistema de autenticación completo');
  console.log('   ✅ Productos con ofertas y descuentos');
  console.log('   ✅ Funcionalidades B2B para distribuidores');
  console.log('   ✅ Gestión de inventario y stock');
  console.log('   ✅ Sistema de órdenes y pagos');
  console.log('   ✅ Configuraciones del sistema');
  console.log('   ✅ Valoraciones y reseñas');
  console.log('');
  console.log('📅 Datos de ejemplo: Abril-Mayo 2025');
  console.log('🎪 ¡Perfecto para demostraciones!');
  
  process.exit(1);
}