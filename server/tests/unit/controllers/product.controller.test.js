const request = require('supertest');
const express = require('express');
const productController = require('../../../controllers/product.controller');
const Product = require('../../../models/Product');

// Configurar aplicación Express para pruebas
const app = express();
app.use(express.json());

// Mock del middleware de autenticación
const mockAuth = (req, res, next) => {
  req.user = { 
    id: 'test-user-id', 
    role: 'admin',
    _id: 'test-user-id'
  };
  next();
};

const mockClientAuth = (req, res, next) => {
  req.user = { 
    id: 'test-client-id', 
    role: 'client',
    _id: 'test-client-id'
  };
  next();
};

// Configurar rutas de prueba
app.get('/products', productController.getProducts);
app.get('/products/on-sale', productController.getProductsOnSale);
app.get('/products/brands', productController.getBrands);
app.get('/products/compatible-models', productController.getCompatibleModels);
app.get('/products/search/suggestions', productController.getSearchSuggestions);
app.post('/products', mockAuth, productController.createProduct);
app.get('/products/:slug', productController.getProduct);
app.put('/products/:slug', mockAuth, productController.updateProduct);
app.delete('/products/:slug', mockAuth, productController.deleteProduct);
app.get('/products/:slug/ratings', productController.getProductRatings);
app.post('/products/:slug/ratings', mockClientAuth, productController.addProductRating);

describe('Controlador Product', () => {
  let testCategory;
  let testProduct;

  beforeEach(async () => {
    testCategory = await global.testHelpers.createTestCategory();
    testProduct = await global.testHelpers.createTestProduct({}, testCategory._id);
  });

  describe('GET /products', () => {
    test('debería retornar lista de productos', async () => {
      const response = await request(app)
        .get('/products')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBe(1);
      expect(response.body.total).toBe(1);
      expect(response.body.data[0]._id.toString()).toBe(testProduct._id.toString());
    });

    test('debería filtrar productos por búsqueda', async () => {
      const response = await request(app)
        .get('/products?search=Producto Prueba')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.appliedFilters.search).toBe('Producto Prueba');
    });

    test('debería filtrar productos por rango de precio', async () => {
      const response = await request(app)
        .get('/products?minPrice=20000&maxPrice=30000')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.appliedFilters.priceRange.min).toBe('20000');
      expect(response.body.appliedFilters.priceRange.max).toBe('30000');
    });

    test('debería filtrar productos por marca', async () => {
      const response = await request(app)
        .get('/products?brand=MarcaPrueba')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    test('debería filtrar productos en oferta', async () => {
      // Crear producto en oferta
      await global.testHelpers.createTestProduct({
        name: 'Producto en Oferta',
        sku: 'OFERTA-001',
        onSale: true,
        discountPercentage: 20
      }, testCategory._id);

      const response = await request(app)
        .get('/products?onSale=true')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].onSale).toBe(true);
    });

    test('debería soportar paginación', async () => {
      // Crear más productos para prueba de paginación
      for (let i = 1; i <= 15; i++) {
        await global.testHelpers.createTestProduct({
          name: `Producto ${i}`,
          sku: `TEST-${i.toString().padStart(3, '0')}`
        }, testCategory._id);
      }

      const response = await request(app)
        .get('/products?page=2&limit=10')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.currentPage).toBe(2);
      expect(response.body.limit).toBe(10);
      expect(response.body.pagination.prev).toBeDefined();
    });

    test('debería ordenar productos correctamente', async () => {
      // Crear producto con precio diferente
      await global.testHelpers.createTestProduct({
        name: 'Producto Barato',
        sku: 'BARATO-001',
        price: 10000
      }, testCategory._id);

      const response = await request(app)
        .get('/products?sort=price')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data[0].price).toBeLessThanOrEqual(response.body.data[1].price);
    });
  });

  describe('GET /products/on-sale', () => {
    test('debería retornar solo productos en oferta', async () => {
      // Crear producto en oferta
      const saleProduct = await global.testHelpers.createTestProduct({
        name: 'Producto en Oferta',
        sku: 'SALE-001',
        onSale: true,
        discountPercentage: 25
      }, testCategory._id);

      const response = await request(app)
        .get('/products/on-sale')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]._id.toString()).toBe(saleProduct._id.toString());
      expect(response.body.data[0].onSale).toBe(true);
    });

    test('debería retornar lista vacía si no hay productos en oferta', async () => {
      const response = await request(app)
        .get('/products/on-sale')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /products/brands', () => {
    test('debería retornar lista de marcas únicas', async () => {
      // Crear productos con diferentes marcas
      await global.testHelpers.createTestProduct({
        name: 'Producto Honda',
        sku: 'HONDA-001',
        brand: 'Honda'
      }, testCategory._id);

      await global.testHelpers.createTestProduct({
        name: 'Producto Toyota',
        sku: 'TOYOTA-001',
        brand: 'Toyota'
      }, testCategory._id);

      const response = await request(app)
        .get('/products/brands')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toContain('Honda');
      expect(response.body.data).toContain('Toyota');
      expect(response.body.data).toContain('MarcaPrueba');
      expect(response.body.count).toBe(3);
    });
  });

  describe('GET /products/compatible-models', () => {
    test('debería retornar modelos compatibles únicos', async () => {
      // Crear productos con diferentes modelos compatibles
      await global.testHelpers.createTestProduct({
        name: 'Filtro para Honda',
        sku: 'HONDA-FILTRO-001',
        compatibleModels: [
          { make: 'Honda', model: 'Civic', year: 2020 },
          { make: 'Honda', model: 'Accord', year: 2019 }
        ]
      }, testCategory._id);

      const response = await request(app)
        .get('/products/compatible-models')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.models).toBeInstanceOf(Array);
      expect(response.body.data.groupedByMake).toBeDefined();
      expect(response.body.data.groupedByMake.Honda).toBeDefined();
      expect(response.body.data.groupedByMake.Toyota).toBeDefined();
    });
  });

  describe('GET /products/search/suggestions', () => {
    test('debería retornar sugerencias de búsqueda', async () => {
      const response = await request(app)
        .get('/products/search/suggestions?q=Producto')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('debería retornar lista vacía para consulta muy corta', async () => {
      const response = await request(app)
        .get('/products/search/suggestions?q=P')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('POST /products', () => {
    test('debería crear un nuevo producto', async () => {
      const productData = {
        name: 'Nuevo Producto Test',
        description: 'Descripción del nuevo producto',
        price: 35000,
        stockQuantity: 25,
        category: testCategory._id,
        brand: 'NuevaMarca',
        sku: 'NUEVO-001',
        partNumber: 'PN-NUEVO-001'
      };

      const response = await request(app)
        .post('/products')
        .send(productData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(productData.name);
      expect(response.body.data.price).toBe(productData.price);
      expect(response.body.data.slug).toBe('nuevo_producto_test');
      
      // Verificar en base de datos
      const productInDb = await Product.findById(response.body.data._id);
      expect(productInDb.name).toBe(productData.name);
    });

    test('debería calcular porcentaje de descuento automáticamente', async () => {
      const productData = {
        name: 'Producto con Oferta',
        description: 'Producto en oferta',
        price: 10000,
        salePrice: 8000,
        onSale: true,
        stockQuantity: 25,
        category: testCategory._id,
        brand: 'MarcaOferta',
        sku: 'OFERTA-002'
      };

      const response = await request(app)
        .post('/products')
        .send(productData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.discountPercentage).toBe(20); // (10000-8000)/10000 * 100
    });

    test('debería fallar con datos incompletos', async () => {
      const incompleteData = {
        name: 'Producto Incompleto'
        // Faltan campos requeridos
      };

      const response = await request(app)
        .post('/products')
        .send(incompleteData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /products/:slug', () => {
    test('debería retornar un producto por slug', async () => {
      const response = await request(app)
        .get(`/products/${testProduct.slug}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data._id.toString()).toBe(testProduct._id.toString());
      expect(response.body.data.name).toBe(testProduct.name);
    });

    test('debería retornar un producto por ID', async () => {
      const response = await request(app)
        .get(`/products/${testProduct._id}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data._id.toString()).toBe(testProduct._id.toString());
    });

    test('debería fallar con slug inexistente', async () => {
      const response = await request(app)
        .get('/products/slug-inexistente')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Producto no encontrado');
    });
  });

  describe('PUT /products/:slug', () => {
    test('debería actualizar un producto existente', async () => {
      const updateData = {
        name: 'Producto Actualizado',
        price: 30000,
        stockQuantity: 75
      };

      const response = await request(app)
        .put(`/products/${testProduct.slug}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.price).toBe(updateData.price);
      expect(response.body.data.stockQuantity).toBe(updateData.stockQuantity);
      expect(response.body.data.slug).toBe('producto_actualizado');
    });

    test('debería fallar con producto inexistente', async () => {
      const updateData = {
        name: 'Producto Actualizado'
      };

      const response = await request(app)
        .put('/products/slug-inexistente')
        .send(updateData)
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Producto no encontrado');
    });
  });

  describe('DELETE /products/:slug', () => {
    test('debería eliminar un producto existente', async () => {
      const response = await request(app)
        .delete(`/products/${testProduct.slug}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Producto eliminado correctamente');
      
      // Verificar que fue eliminado de la base de datos
      const productInDb = await Product.findById(testProduct._id);
      expect(productInDb).toBeNull();
    });

    test('debería fallar con producto inexistente', async () => {
      const response = await request(app)
        .delete('/products/slug-inexistente')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Producto no encontrado');
    });
  });

  describe('GET /products/:slug/ratings', () => {
    test('debería retornar valoraciones del producto', async () => {
      // Agregar valoraciones al producto
      testProduct.ratings = [
        {
          rating: 5,
          comment: 'Excelente producto',
          userName: 'Usuario Test',
          date: new Date()
        }
      ];
      await testProduct.save();

      const response = await request(app)
        .get(`/products/${testProduct.slug}/ratings`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].rating).toBe(5);
      expect(response.body.data[0].comment).toBe('Excelente producto');
    });

    test('debería retornar lista vacía si no hay valoraciones', async () => {
      const response = await request(app)
        .get(`/products/${testProduct.slug}/ratings`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('POST /products/:slug/ratings', () => {
    test('debería agregar una nueva valoración', async () => {
      const ratingData = {
        rating: 4,
        comment: 'Muy buen producto',
        userName: 'Cliente Test'
      };

      const response = await request(app)
        .post(`/products/${testProduct.slug}/ratings`)
        .send(ratingData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(1);
      
      // Verificar en base de datos
      const updatedProduct = await Product.findById(testProduct._id);
      expect(updatedProduct.ratings).toHaveLength(1);
      expect(updatedProduct.ratings[0].rating).toBe(4);
      expect(updatedProduct.avgRating).toBe(4);
    });

    test('debería actualizar valoración existente del mismo usuario', async () => {
      // Agregar valoración inicial
      const initialRating = {
        rating: 3,
        comment: 'Regular',
        userName: 'Cliente Test'
      };

      await request(app)
        .post(`/products/${testProduct.slug}/ratings`)
        .send(initialRating)
        .expect(200);
      
      // Actualizar valoración
      const updatedRating = {
        rating: 5,
        comment: 'Excelente después de usarlo más',
        userName: 'Cliente Test'
      };

      const response = await request(app)
        .post(`/products/${testProduct.slug}/ratings`)
        .send(updatedRating)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      
      // Verificar que solo hay una valoración
      const updatedProduct = await Product.findById(testProduct._id);
      expect(updatedProduct.ratings).toHaveLength(1);
      expect(updatedProduct.ratings[0].rating).toBe(5);
      expect(updatedProduct.avgRating).toBe(5);
    });

    test('debería fallar con valoración inválida', async () => {
      const invalidRating = {
        rating: 6, // Fuera del rango 1-5
        comment: 'Comentario',
        userName: 'Cliente Test'
      };

      const response = await request(app)
        .post(`/products/${testProduct.slug}/ratings`)
        .send(invalidRating)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('La valoración debe estar entre 1 y 5');
    });

    test('debería fallar con producto inexistente', async () => {
      const ratingData = {
        rating: 4,
        comment: 'Comentario',
        userName: 'Cliente Test'
      };

      const response = await request(app)
        .post('/products/slug-inexistente/ratings')
        .send(ratingData)
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Producto no encontrado');
    });
  });
});