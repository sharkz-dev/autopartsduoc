const request = require('supertest');
const express = require('express');
const productRoutes = require('../../../routes/product.routes');
const authRoutes = require('../../../routes/auth.routes');
const categoryRoutes = require('../../../routes/category.routes');
const User = require('../../../models/User');
const Product = require('../../../models/Product');
const Category = require('../../../models/Category');

// Configurar app de pruebas
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error en test:', err);
  
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: errors.join(', ')
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      error: 'Valor duplicado'
    });
  }
  
  res.status(500).json({
    success: false,
    error: err.message || 'Error interno del servidor'
  });
});

describe('Controlador Product - Integración', () => {
  let adminUser, clientUser, adminToken, clientToken, category;

  beforeEach(async () => {
    // Crear usuarios de prueba
    adminUser = new User({
      name: 'Admin Test',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });
    await adminUser.save();
    adminToken = adminUser.getSignedJwtToken();

    clientUser = new User({
      name: 'Cliente Test',
      email: 'client@test.com',
      password: 'password123',
      role: 'client'
    });
    await clientUser.save();
    clientToken = clientUser.getSignedJwtToken();

    // Crear categoría de prueba
    category = new Category({
      name: 'Frenos',
      description: 'Sistema de frenos',
      slug: 'frenos'
    });
    await category.save();
  });

  describe('GET /api/products', () => {
    beforeEach(async () => {
      // Crear productos de prueba con slug
      const products = [
        {
          name: 'Pastillas Brembo',
          description: 'Pastillas de freno premium',
          price: 89990,
          stockQuantity: 25,
          brand: 'Brembo',
          sku: 'BRE-001',
          slug: 'pastillas-brembo',
          category: category._id,
          featured: true,
          onSale: true,
          discountPercentage: 15
        },
        {
          name: 'Filtro Mahle',
          description: 'Filtro de aceite original',
          price: 12990,
          stockQuantity: 50,
          brand: 'Mahle',
          sku: 'MAH-001',
          slug: 'filtro-mahle',
          category: category._id
        },
        {
          name: 'Amortiguador Monroe',
          description: 'Amortiguador trasero',
          price: 65990,
          stockQuantity: 0, // Sin stock
          brand: 'Monroe',
          sku: 'MON-001',
          slug: 'amortiguador-monroe',
          category: category._id
        }
      ];

      for (const productData of products) {
        await Product.create(productData);
      }
    });

    test('debe obtener todos los productos', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(3);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.total).toBe(3);
    });

    test('debe filtrar productos por búsqueda', async () => {
      const response = await request(app)
        .get('/api/products?search=Brembo')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].name).toContain('Brembo');
    });

    test('debe filtrar productos por marca', async () => {
      const response = await request(app)
        .get('/api/products?brand=Mahle')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].brand).toBe('Mahle');
    });

    test('debe filtrar productos en oferta', async () => {
      const response = await request(app)
        .get('/api/products?onSale=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].onSale).toBe(true);
    });

    test('debe filtrar productos destacados', async () => {
      const response = await request(app)
        .get('/api/products?featured=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].featured).toBe(true);
    });

    test('debe filtrar productos con stock', async () => {
      const response = await request(app)
        .get('/api/products?inStock=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2); // Solo los que tienen stock > 0
    });

    test('debe filtrar por rango de precio', async () => {
      const response = await request(app)
        .get('/api/products?minPrice=10000&maxPrice=20000')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].price).toBeGreaterThanOrEqual(10000);
      expect(response.body.data[0].price).toBeLessThanOrEqual(20000);
    });

    test('debe ordenar productos por precio', async () => {
      const response = await request(app)
        .get('/api/products?sort=price')
        .expect(200);

      expect(response.body.success).toBe(true);
      const prices = response.body.data.map(p => p.price);
      expect(prices[0]).toBeLessThanOrEqual(prices[1]);
    });

    test('debe manejar paginación', async () => {
      const response = await request(app)
        .get('/api/products?page=1&limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.currentPage).toBe(1);
      expect(response.body.limit).toBe(2);
    });
  });

  describe('GET /api/products/brands', () => {
    beforeEach(async () => {
      await Product.create([
        {
          name: 'Producto Brembo',
          description: 'Test',
          price: 10000,
          stockQuantity: 10,
          brand: 'Brembo',
          sku: 'TEST-001',
          slug: 'producto-brembo',
          category: category._id
        },
        {
          name: 'Producto Mahle',
          description: 'Test',
          price: 10000,
          stockQuantity: 10,
          brand: 'Mahle',
          sku: 'TEST-002',
          slug: 'producto-mahle',
          category: category._id
        }
      ]);
    });

    test('debe obtener lista de marcas únicas', async () => {
      const response = await request(app)
        .get('/api/products/brands')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toContain('Brembo');
      expect(response.body.data).toContain('Mahle');
    });
  });

  describe('GET /api/products/on-sale', () => {
    beforeEach(async () => {
      await Product.create([
        {
          name: 'Producto en Oferta',
          description: 'Test',
          price: 50000,
          stockQuantity: 10,
          brand: 'Test',
          sku: 'SALE-001',
          slug: 'producto-en-oferta',
          category: category._id,
          onSale: true,
          discountPercentage: 20
        },
        {
          name: 'Producto Normal',
          description: 'Test',
          price: 30000,
          stockQuantity: 10,
          brand: 'Test',
          sku: 'NORM-001',
          slug: 'producto-normal',
          category: category._id
        }
      ]);
    });

    test('debe obtener solo productos en oferta', async () => {
      const response = await request(app)
        .get('/api/products/on-sale')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].onSale).toBe(true);
    });
  });

  describe('GET /api/products/:slug', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await Product.create({
        name: 'Producto de Prueba',
        description: 'Descripción detallada',
        price: 45000,
        stockQuantity: 15,
        brand: 'TestBrand',
        sku: 'TEST-SLUG',
        slug: 'producto-de-prueba',
        category: category._id
      });
    });

    test('debe obtener producto por slug', async () => {
      const response = await request(app)
        .get(`/api/products/${testProduct.slug}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Producto de Prueba');
      expect(response.body.data.category.name).toBe('Frenos');
    });

    test('debe obtener producto por ID', async () => {
      const response = await request(app)
        .get(`/api/products/${testProduct._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Producto de Prueba');
    });

    test('debe retornar 404 para producto inexistente', async () => {
      const response = await request(app)
        .get('/api/products/producto-inexistente')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('no encontrado');
    });
  });

  describe('POST /api/products', () => {
    const newProductData = {
      name: 'Nuevo Producto',
      description: 'Descripción del nuevo producto',
      price: 75000,
      stockQuantity: 20,
      brand: 'NuevaMarca',
      sku: 'NEW-PROD-001',
      partNumber: 'PN-12345'
    };

    test('debe crear producto como admin', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newProductData,
          category: category._id
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(newProductData.name);
      expect(response.body.data.slug).toBeDefined();
    });

    test('debe rechazar creación sin autenticación', async () => {
      const response = await request(app)
        .post('/api/products')
        .send({
          ...newProductData,
          category: category._id
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('debe rechazar creación como cliente', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          ...newProductData,
          category: category._id
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('debe validar campos requeridos', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Solo Nombre'
          // Faltan campos requeridos
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('debe rechazar SKU duplicado', async () => {
      // Crear primer producto
      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newProductData,
          category: category._id
        })
        .expect(201);

      // Intentar crear segundo producto con mismo SKU
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newProductData,
          name: 'Producto Diferente',
          category: category._id
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('debe crear producto con oferta', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newProductData,
          category: category._id,
          onSale: true,
          discountPercentage: 25
        })
        .expect(201);

      expect(response.body.data.onSale).toBe(true);
      expect(response.body.data.salePrice).toBeDefined();
      expect(response.body.data.salePrice).toBeLessThan(response.body.data.price);
    });
  });

  describe('PUT /api/products/:slug', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await Product.create({
        name: 'Producto Editable',
        description: 'Para editar',
        price: 50000,
        stockQuantity: 10,
        brand: 'EditBrand',
        sku: 'EDIT-001',
        slug: 'producto-editable',
        category: category._id
      });
    });

    test('debe actualizar producto como admin', async () => {
      const updateData = {
        name: 'Producto Actualizado',
        price: 55000,
        discountPercentage: 10,
        onSale: true
      };

      const response = await request(app)
        .put(`/api/products/${testProduct.slug}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Producto Actualizado');
      expect(response.body.data.price).toBe(55000);
      expect(response.body.data.onSale).toBe(true);
    });

    test('debe actualizar slug cuando cambia el nombre', async () => {
      const response = await request(app)
        .put(`/api/products/${testProduct.slug}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Nombre Completamente Nuevo' })
        .expect(200);

      expect(response.body.data.slug).toBe('nombre_completamente_nuevo');
    });

    test('debe rechazar actualización sin autorización', async () => {
      const response = await request(app)
        .put(`/api/products/${testProduct.slug}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ name: 'Intento de Hackeo' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/products/:slug', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await Product.create({
        name: 'Producto a Eliminar',
        description: 'Para eliminar',
        price: 30000,
        stockQuantity: 5,
        brand: 'DeleteBrand',
        sku: 'DEL-001',
        slug: 'producto-a-eliminar',
        category: category._id
      });
    });

    test('debe eliminar producto como admin', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProduct.slug}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verificar que realmente se eliminó
      await request(app)
        .get(`/api/products/${testProduct.slug}`)
        .expect(404);
    });

    test('debe rechazar eliminación sin autorización', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProduct.slug}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('debe retornar 404 para producto inexistente', async () => {
      const response = await request(app)
        .delete('/api/products/producto-inexistente')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/products/:slug/ratings', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await Product.create({
        name: 'Producto para Valorar',
        description: 'Para valoraciones',
        price: 40000,
        stockQuantity: 8,
        brand: 'RatingBrand',
        sku: 'RAT-001',
        slug: 'producto-para-valorar',
        category: category._id
      });
    });

    test('debe agregar valoración como cliente', async () => {
      const ratingData = {
        rating: 5,
        comment: 'Excelente producto',
        userName: 'Cliente Satisfecho'
      };

      const response = await request(app)
        .post(`/api/products/${testProduct.slug}/ratings`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(ratingData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].rating).toBe(5);
    });

    test('debe rechazar valoración sin autenticación', async () => {
      const response = await request(app)
        .post(`/api/products/${testProduct.slug}/ratings`)
        .send({
          rating: 4,
          comment: 'Buen producto'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('debe validar rating entre 1 y 5', async () => {
      const response = await request(app)
        .post(`/api/products/${testProduct.slug}/ratings`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          rating: 6, // Inválido
          comment: 'Rating inválido'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('entre 1 y 5');
    });

    test('debe actualizar valoración existente del mismo usuario', async () => {
      // Primera valoración
      await request(app)
        .post(`/api/products/${testProduct.slug}/ratings`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          rating: 3,
          comment: 'Primera valoración'
        })
        .expect(200);

      // Segunda valoración del mismo usuario (debe actualizar)
      const response = await request(app)
        .post(`/api/products/${testProduct.slug}/ratings`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          rating: 5,
          comment: 'Valoración actualizada'
        })
        .expect(200);

      expect(response.body.data).toHaveLength(1); // Solo una valoración
      expect(response.body.data[0].rating).toBe(5);
      expect(response.body.data[0].comment).toBe('Valoración actualizada');
    });
  });

  describe('GET /api/products/:slug/ratings', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await Product.create({
        name: 'Producto con Valoraciones',
        description: 'Con valoraciones',
        price: 35000,
        stockQuantity: 12,
        brand: 'RatingsBrand',
        sku: 'RATS-001',
        slug: 'producto-con-valoraciones',
        category: category._id,
        ratings: [
          {
            user: clientUser._id,
            rating: 4,
            comment: 'Muy bueno',
            userName: 'Cliente Test',
            date: new Date()
          }
        ]
      });
    });

    test('debe obtener valoraciones del producto', async () => {
      const response = await request(app)
        .get(`/api/products/${testProduct.slug}/ratings`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].rating).toBe(4);
      expect(response.body.data[0].userName).toBe('Cliente Test');
    });
  });

  describe('Búsqueda avanzada', () => {
    beforeEach(async () => {
      await Product.create([
        {
          name: 'Pastillas BMW Serie 3',
          description: 'Para BMW Serie 3 2020',
          price: 80000,
          stockQuantity: 15,
          brand: 'Brembo',
          sku: 'BMW-001',
          slug: 'pastillas-bmw-serie-3',
          category: category._id,
          compatibleModels: [
            { make: 'BMW', model: 'Serie 3', year: 2020 }
          ]
        },
        {
          name: 'Filtro Mercedes Clase C',
          description: 'Para Mercedes Clase C',
          price: 25000,
          stockQuantity: 8,
          brand: 'Mahle',
          sku: 'MERC-001',
          slug: 'filtro-mercedes-clase-c',
          category: category._id,
          compatibleModels: [
            { make: 'Mercedes-Benz', model: 'Clase C', year: 2019 }
          ]
        }
      ]);
    });

    test('debe buscar por marca de vehículo', async () => {
      const response = await request(app)
        .get('/api/products?vehicleMake=BMW')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].compatibleModels[0].make).toBe('BMW');
    });

    test('debe buscar por modelo de vehículo', async () => {
      const response = await request(app)
        .get('/api/products?vehicleModel=Serie 3')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].compatibleModels[0].model).toBe('Serie 3');
    });

    test('debe buscar por año de vehículo', async () => {
      const response = await request(app)
        .get('/api/products?vehicleYear=2020')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].compatibleModels[0].year).toBe(2020);
    });

    test('debe combinar filtros de vehículo', async () => {
      const response = await request(app)
        .get('/api/products?vehicleMake=BMW&vehicleModel=Serie 3&vehicleYear=2020')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
    });
  });

  describe('Sugerencias de búsqueda', () => {
    beforeEach(async () => {
      await Product.create([
        {
          name: 'Pastillas de Freno Brembo',
          description: 'Pastillas premium',
          price: 90000,
          stockQuantity: 20,
          brand: 'Brembo',
          sku: 'SUGG-001',
          slug: 'pastillas-de-freno-brembo',
          category: category._id,
          compatibleModels: [
            { make: 'BMW', model: 'X5', year: 2021 }
          ]
        }
      ]);
    });

    test('debe obtener sugerencias de búsqueda', async () => {
      const response = await request(app)
        .get('/api/products/search/suggestions?q=Bre')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const suggestions = response.body.data;
      const types = suggestions.map(s => s.type);
      expect(types).toContain('product'); // Nombre de producto
      expect(types).toContain('brand'); // Marca
    });

    test('debe retornar array vacío para búsqueda muy corta', async () => {
      const response = await request(app)
        .get('/api/products/search/suggestions?q=B')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('Modelos compatibles', () => {
    beforeEach(async () => {
      await Product.create([
        {
          name: 'Producto Universal BMW',
          description: 'Compatible con varios BMW',
          price: 120000,
          stockQuantity: 10,
          brand: 'Universal',
          sku: 'UNIV-001',
          slug: 'producto-universal-bmw',
          category: category._id,
          compatibleModels: [
            { make: 'BMW', model: 'Serie 3', year: 2020 },
            { make: 'BMW', model: 'X5', year: 2021 },
            { make: 'Mercedes-Benz', model: 'Clase C', year: 2019 }
          ]
        }
      ]);
    });

    test('debe obtener modelos compatibles únicos', async () => {
      const response = await request(app)
        .get('/api/products/compatible-models')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.models.length).toBeGreaterThan(0);
      expect(response.body.data.groupedByMake).toBeDefined();
      expect(response.body.data.groupedByMake.BMW).toBeDefined();
    });
  });
});