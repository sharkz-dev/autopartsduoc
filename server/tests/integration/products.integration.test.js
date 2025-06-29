const request = require('supertest');
const express = require('express');
const Product = require('../../models/Product');
const Category = require('../../models/Category');
const User = require('../../models/User');

// Configurar aplicación completa para pruebas de integración
const app = express();
app.use(express.json());

// Importar rutas completas
app.use('/api/auth', require('../../routes/auth.routes'));
app.use('/api/products', require('../../routes/product.routes'));
app.use('/api/categories', require('../../routes/category.routes'));

describe('Integración: Sistema de Productos Completo', () => {
  let adminUser, clientUser, distributorUser;
  let adminToken, clientToken, distributorToken;
  let testCategory1, testCategory2;

  beforeEach(async () => {
    // Crear usuarios de prueba
    adminUser = await global.testHelpers.createTestUser({
      ...global.testUtils.validAdmin,
      email: 'admin-products@test.com'
    });
    clientUser = await global.testHelpers.createTestUser({
      email: 'client-products@test.com'
    });
    distributorUser = await global.testHelpers.createTestUser({
      ...global.testUtils.validDistributor,
      email: 'distributor-products@test.com'
    });

    // Generar tokens
    adminToken = global.testHelpers.generateTestToken(adminUser._id);
    clientToken = global.testHelpers.generateTestToken(clientUser._id);
    distributorToken = global.testHelpers.generateTestToken(distributorUser._id);

    // Crear categorías de prueba
    testCategory1 = await global.testHelpers.createTestCategory({
      name: 'Frenos',
      slug: 'frenos'
    });
    testCategory2 = await global.testHelpers.createTestCategory({
      name: 'Motor',
      slug: 'motor'
    });
  });

  describe('Flujo completo de gestión de productos (Admin)', () => {
    test('debería completar flujo CRUD completo de productos', async () => {
      // 1. Admin crea un producto
      const productData = {
        name: 'Pastillas de Freno Premium',
        description: 'Pastillas de freno de alta calidad para vehículos de lujo',
        price: 89990,
        wholesalePrice: 65000,
        stockQuantity: 50,
        category: testCategory1._id,
        brand: 'Brembo',
        sku: 'BREMBO-001',
        partNumber: 'BP-PREMIUM-001',
        featured: true,
        compatibleModels: [
          { make: 'BMW', model: 'Serie 3', year: 2020 },
          { make: 'Mercedes', model: 'Clase C', year: 2019 }
        ]
      };

      const createResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.name).toBe(productData.name);
      expect(createResponse.body.data.slug).toBe('pastillas_de_freno_premium');
      expect(createResponse.body.data.compatibleModels).toHaveLength(2);

      const productId = createResponse.body.data._id;
      const productSlug = createResponse.body.data.slug;

      // 2. Verificar que el producto aparece en listado público
      const listResponse = await request(app)
        .get('/api/products')
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.count).toBe(1);
      expect(listResponse.body.data[0]._id).toBe(productId);

      // 3. Obtener producto individual por slug
      const getBySlugResponse = await request(app)
        .get(`/api/products/${productSlug}`)
        .expect(200);

      expect(getBySlugResponse.body.success).toBe(true);
      expect(getBySlugResponse.body.data.name).toBe(productData.name);
      expect(getBySlugResponse.body.data.category.name).toBe('Frenos');

      // 4. Obtener producto individual por ID
      const getByIdResponse = await request(app)
        .get(`/api/products/${productId}`)
        .expect(200);

      expect(getByIdResponse.body.success).toBe(true);
      expect(getByIdResponse.body.data._id).toBe(productId);

      // 5. Admin actualiza el producto
      const updateData = {
        name: 'Pastillas de Freno Premium Plus',
        price: 99990,
        stockQuantity: 75,
        onSale: true,
        discountPercentage: 15
      };

      const updateResponse = await request(app)
        .put(`/api/products/${productSlug}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.name).toBe(updateData.name);
      expect(updateResponse.body.data.slug).toBe('pastillas_de_freno_premium_plus');
      expect(updateResponse.body.data.onSale).toBe(true);
      expect(updateResponse.body.data.salePrice).toBeDefined();

      // 6. Verificar que el producto aparece en productos en oferta
      const saleProductsResponse = await request(app)
        .get('/api/products/on-sale')
        .expect(200);

      expect(saleProductsResponse.body.success).toBe(true);
      expect(saleProductsResponse.body.data).toHaveLength(1);
      expect(saleProductsResponse.body.data[0]._id).toBe(productId);

      // 7. Admin elimina el producto
      const deleteResponse = await request(app)
        .delete(`/api/products/${productSlug}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // 8. Verificar que el producto ya no existe
      const notFoundResponse = await request(app)
        .get(`/api/products/${productSlug}`)
        .expect(404);

      expect(notFoundResponse.body.success).toBe(false);
      expect(notFoundResponse.body.error).toBe('Producto no encontrado');

      // 9. Verificar que fue eliminado de la base de datos
      const productInDb = await Product.findById(productId);
      expect(productInDb).toBeNull();
    });

    test('debería manejar creación de múltiples productos con slugs únicos', async () => {
      const baseProductData = {
        description: 'Producto de prueba',
        price: 25000,
        stockQuantity: 10,
        category: testCategory1._id,
        brand: 'TestBrand',
        sku: 'TEST-BASE'
      };

      // Crear productos con nombres similares
      const products = [];
      for (let i = 1; i <= 5; i++) {
        const productData = {
          ...baseProductData,
          name: 'Producto Duplicado',
          sku: `TEST-${i.toString().padStart(3, '0')}`
        };

        const response = await request(app)
          .post('/api/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(productData)
          .expect(201);

        products.push(response.body.data);
      }

      // Verificar que todos tienen slugs únicos
      const slugs = products.map(p => p.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);

      // Verificar formato de slugs
      expect(slugs[0]).toBe('producto_duplicado');
      expect(slugs[1]).toBe('producto_duplicado_1');
      expect(slugs[2]).toBe('producto_duplicado_2');
    });
  });

  describe('Búsqueda y filtrado de productos', () => {
    beforeEach(async () => {
      // Crear productos de prueba con diferentes características
      const testProducts = [
        {
          name: 'Filtro de Aceite Toyota',
          description: 'Filtro de aceite original Toyota',
          price: 15000,
          wholesalePrice: 12000,
          stockQuantity: 100,
          category: testCategory2._id,
          brand: 'Toyota',
          sku: 'TOY-FILT-001',
          compatibleModels: [
            { make: 'Toyota', model: 'Corolla', year: 2020 },
            { make: 'Toyota', model: 'Camry', year: 2019 }
          ]
        },
        {
          name: 'Pastillas de Freno BMW',
          description: 'Pastillas de freno deportivas BMW',
          price: 85000,
          wholesalePrice: 68000,
          stockQuantity: 25,
          category: testCategory1._id,
          brand: 'BMW',
          sku: 'BMW-BRAKE-001',
          onSale: true,
          discountPercentage: 20,
          compatibleModels: [
            { make: 'BMW', model: 'Serie 3', year: 2021 },
            { make: 'BMW', model: 'X3', year: 2020 }
          ]
        },
        {
          name: 'Aceite Motor Castrol',
          description: 'Aceite sintético para motor',
          price: 35000,
          wholesalePrice: 28000,
          stockQuantity: 0, // Sin stock
          category: testCategory2._id,
          brand: 'Castrol',
          sku: 'CAST-OIL-001',
          featured: true
        }
      ];

      for (const productData of testProducts) {
        await request(app)
          .post('/api/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(productData)
          .expect(201);
      }
    });

    test('debería buscar productos por texto', async () => {
      // Búsqueda por nombre
      const searchNameResponse = await request(app)
        .get('/api/products?search=Toyota')
        .expect(200);

      expect(searchNameResponse.body.success).toBe(true);
      expect(searchNameResponse.body.data).toHaveLength(1);
      expect(searchNameResponse.body.data[0].name).toContain('Toyota');

      // Búsqueda por descripción
      const searchDescResponse = await request(app)
        .get('/api/products?search=sintético')
        .expect(200);

      expect(searchDescResponse.body.data).toHaveLength(1);
      expect(searchDescResponse.body.data[0].description).toContain('sintético');

      // Búsqueda por marca
      const searchBrandResponse = await request(app)
        .get('/api/products?search=BMW')
        .expect(200);

      expect(searchBrandResponse.body.data).toHaveLength(1);
      expect(searchBrandResponse.body.data[0].brand).toBe('BMW');
    });

    test('debería filtrar productos por rango de precio', async () => {
      // Productos entre 20,000 y 50,000
      const priceRangeResponse = await request(app)
        .get('/api/products?minPrice=20000&maxPrice=50000')
        .expect(200);

      expect(priceRangeResponse.body.success).toBe(true);
      expect(priceRangeResponse.body.data).toHaveLength(1);
      expect(priceRangeResponse.body.data[0].price).toBeGreaterThanOrEqual(20000);
      expect(priceRangeResponse.body.data[0].price).toBeLessThanOrEqual(50000);

      // Solo precio mínimo
      const minPriceResponse = await request(app)
        .get('/api/products?minPrice=80000')
        .expect(200);

      expect(minPriceResponse.body.data).toHaveLength(1);
      expect(minPriceResponse.body.data[0].price).toBeGreaterThanOrEqual(80000);
    });

    test('debería filtrar productos por categoría', async () => {
      const categoryResponse = await request(app)
        .get(`/api/products?categories=${testCategory1.slug}`)
        .expect(200);

      expect(categoryResponse.body.success).toBe(true);
      expect(categoryResponse.body.data).toHaveLength(1);
      expect(categoryResponse.body.data[0].category.slug).toBe(testCategory1.slug);
    });

    test('debería filtrar productos por marca', async () => {
      const brandResponse = await request(app)
        .get('/api/products?brand=BMW')
        .expect(200);

      expect(brandResponse.body.success).toBe(true);
      expect(brandResponse.body.data).toHaveLength(1);
      expect(brandResponse.body.data[0].brand).toBe('BMW');
    });

    test('debería filtrar productos en oferta', async () => {
      const saleResponse = await request(app)
        .get('/api/products?onSale=true')
        .expect(200);

      expect(saleResponse.body.success).toBe(true);
      expect(saleResponse.body.data).toHaveLength(1);
      expect(saleResponse.body.data[0].onSale).toBe(true);
    });

    test('debería filtrar productos destacados', async () => {
      const featuredResponse = await request(app)
        .get('/api/products?featured=true')
        .expect(200);

      expect(featuredResponse.body.success).toBe(true);
      expect(featuredResponse.body.data).toHaveLength(1);
      expect(featuredResponse.body.data[0].featured).toBe(true);
    });

    test('debería filtrar productos con stock', async () => {
      const inStockResponse = await request(app)
        .get('/api/products?inStock=true')
        .expect(200);

      expect(inStockResponse.body.success).toBe(true);
      expect(inStockResponse.body.data).toHaveLength(2); // Excluye el que tiene stock 0
      inStockResponse.body.data.forEach(product => {
        expect(product.stockQuantity).toBeGreaterThan(0);
      });
    });

    test('debería buscar por modelo compatible', async () => {
      const modelResponse = await request(app)
        .get('/api/products?vehicleMake=Toyota&vehicleModel=Corolla')
        .expect(200);

      expect(modelResponse.body.success).toBe(true);
      expect(modelResponse.body.data).toHaveLength(1);
      expect(modelResponse.body.data[0].compatibleModels.some(
        model => model.make === 'Toyota' && model.model === 'Corolla'
      )).toBe(true);
    });

    test('debería combinar múltiples filtros', async () => {
      const combinedResponse = await request(app)
        .get('/api/products?search=BMW&minPrice=50000&onSale=true')
        .expect(200);

      expect(combinedResponse.body.success).toBe(true);
      expect(combinedResponse.body.data).toHaveLength(1);
      
      const product = combinedResponse.body.data[0];
      expect(product.brand).toBe('BMW');
      expect(product.price).toBeGreaterThanOrEqual(50000);
      expect(product.onSale).toBe(true);
    });

    test('debería ordenar productos correctamente', async () => {
      // Ordenar por precio ascendente
      const priceAscResponse = await request(app)
        .get('/api/products?sort=price')
        .expect(200);

      const prices = priceAscResponse.body.data.map(p => p.price);
      expect(prices).toEqual([...prices].sort((a, b) => a - b));

      // Ordenar por precio descendente
      const priceDescResponse = await request(app)
        .get('/api/products?sort=-price')
        .expect(200);

      const pricesDesc = priceDescResponse.body.data.map(p => p.price);
      expect(pricesDesc).toEqual([...pricesDesc].sort((a, b) => b - a));
    });

    test('debería manejar paginación correctamente', async () => {
      // Primera página
      const page1Response = await request(app)
        .get('/api/products?page=1&limit=2')
        .expect(200);

      expect(page1Response.body.data).toHaveLength(2);
      expect(page1Response.body.currentPage).toBe(1);
      expect(page1Response.body.pagination.next).toBeDefined();

      // Segunda página
      const page2Response = await request(app)
        .get('/api/products?page=2&limit=2')
        .expect(200);

      expect(page2Response.body.data).toHaveLength(1);
      expect(page2Response.body.currentPage).toBe(2);
      expect(page2Response.body.pagination.prev).toBeDefined();
    });
  });

  describe('Endpoints especializados de productos', () => {
    beforeEach(async () => {
      // Crear productos con diferentes marcas y modelos
      const testProducts = [
        {
          name: 'Producto Honda',
          brand: 'Honda',
          compatibleModels: [{ make: 'Honda', model: 'Civic', year: 2020 }]
        },
        {
          name: 'Producto Nissan',
          brand: 'Nissan',
          compatibleModels: [{ make: 'Nissan', model: 'Sentra', year: 2019 }]
        },
        {
          name: 'Producto Hyundai',
          brand: 'Hyundai',
          compatibleModels: [{ make: 'Hyundai', model: 'Elantra', year: 2021 }]
        }
      ];

      for (const productData of testProducts) {
        const fullProductData = {
          ...productData,
          description: 'Producto de prueba',
          price: 25000,
          stockQuantity: 10,
          category: testCategory1._id,
          sku: `TEST-${Date.now()}-${Math.random()}`
        };

        await request(app)
          .post('/api/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(fullProductData)
          .expect(201);
      }
    });

    test('debería obtener lista de marcas únicas', async () => {
      const brandsResponse = await request(app)
        .get('/api/products/brands')
        .expect(200);

      expect(brandsResponse.body.success).toBe(true);
      expect(brandsResponse.body.data).toBeInstanceOf(Array);
      expect(brandsResponse.body.data).toContain('Honda');
      expect(brandsResponse.body.data).toContain('Nissan');
      expect(brandsResponse.body.data).toContain('Hyundai');
      expect(brandsResponse.body.count).toBe(3);
    });

    test('debería obtener modelos compatibles', async () => {
      const modelsResponse = await request(app)
        .get('/api/products/compatible-models')
        .expect(200);

      expect(modelsResponse.body.success).toBe(true);
      expect(modelsResponse.body.data.models).toBeInstanceOf(Array);
      expect(modelsResponse.body.data.groupedByMake).toBeDefined();
      expect(modelsResponse.body.data.groupedByMake.Honda).toBeDefined();
      expect(modelsResponse.body.data.groupedByMake.Nissan).toBeDefined();
    });

    test('debería obtener sugerencias de búsqueda', async () => {
      const suggestionsResponse = await request(app)
        .get('/api/products/search/suggestions?q=Hon')
        .expect(200);

      expect(suggestionsResponse.body.success).toBe(true);
      expect(suggestionsResponse.body.data).toBeInstanceOf(Array);
      expect(suggestionsResponse.body.data.length).toBeGreaterThan(0);
    });

    test('debería retornar lista vacía para consulta muy corta', async () => {
      const shortQueryResponse = await request(app)
        .get('/api/products/search/suggestions?q=H')
        .expect(200);

      expect(shortQueryResponse.body.success).toBe(true);
      expect(shortQueryResponse.body.data).toEqual([]);
    });
  });

  describe('Sistema de valoraciones de productos', () => {
    let testProduct;

    beforeEach(async () => {
      const productData = {
        name: 'Producto Para Valorar',
        description: 'Producto para probar valoraciones',
        price: 50000,
        stockQuantity: 20,
        category: testCategory1._id,
        brand: 'TestBrand',
        sku: 'RATING-TEST-001'
      };

      const createResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      testProduct = createResponse.body.data;
    });

    test('debería manejar flujo completo de valoraciones', async () => {
      const productSlug = testProduct.slug;

      // 1. Verificar que no hay valoraciones inicialmente
      const initialRatingsResponse = await request(app)
        .get(`/api/products/${productSlug}/ratings`)
        .expect(200);

      expect(initialRatingsResponse.body.data).toEqual([]);

      // 2. Cliente agrega primera valoración
      const rating1Data = {
        rating: 5,
        comment: 'Excelente producto, superó mis expectativas',
        userName: 'Cliente Satisfecho'
      };

      const addRating1Response = await request(app)
        .post(`/api/products/${productSlug}/ratings`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(rating1Data)
        .expect(200);

      expect(addRating1Response.body.success).toBe(true);
      expect(addRating1Response.body.data).toHaveLength(1);

      // 3. Verificar que la valoración aparece en el listado
      const ratingsAfterFirstResponse = await request(app)
        .get(`/api/products/${productSlug}/ratings`)
        .expect(200);

      expect(ratingsAfterFirstResponse.body.data).toHaveLength(1);
      expect(ratingsAfterFirstResponse.body.data[0].rating).toBe(5);
      expect(ratingsAfterFirstResponse.body.data[0].comment).toBe(rating1Data.comment);

      // 4. Verificar que el promedio se actualizó en el producto
      const productAfterRatingResponse = await request(app)
        .get(`/api/products/${productSlug}`)
        .expect(200);

      expect(productAfterRatingResponse.body.data.avgRating).toBe(5);

      // 5. Otro cliente agrega segunda valoración
      const rating2Data = {
        rating: 3,
        comment: 'Producto regular, cumple su función',
        userName: 'Cliente Neutral'
      };

      // Crear segundo cliente
      const client2User = await global.testHelpers.createTestUser({
        email: 'client2@test.com',
        name: 'Cliente 2'
      });
      const client2Token = global.testHelpers.generateTestToken(client2User._id);

      await request(app)
        .post(`/api/products/${productSlug}/ratings`)
        .set('Authorization', `Bearer ${client2Token}`)
        .send(rating2Data)
        .expect(200);

      // 6. Verificar promedio actualizado
      const finalRatingsResponse = await request(app)
        .get(`/api/products/${productSlug}/ratings`)
        .expect(200);

      expect(finalRatingsResponse.body.data).toHaveLength(2);

      const finalProductResponse = await request(app)
        .get(`/api/products/${productSlug}`)
        .expect(200);

      expect(finalProductResponse.body.data.avgRating).toBe(4); // (5+3)/2 = 4

      // 7. Cliente original actualiza su valoración
      const updatedRatingData = {
        rating: 4,
        comment: 'Actualizo mi valoración después de más uso',
        userName: 'Cliente Satisfecho'
      };

      await request(app)
        .post(`/api/products/${productSlug}/ratings`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updatedRatingData)
        .expect(200);

      // 8. Verificar que sigue habiendo solo 2 valoraciones (se actualizó, no se duplicó)
      const updatedRatingsResponse = await request(app)
        .get(`/api/products/${productSlug}/ratings`)
        .expect(200);

      expect(updatedRatingsResponse.body.data).toHaveLength(2);

      const updatedProductResponse = await request(app)
        .get(`/api/products/${productSlug}`)
        .expect(200);

      expect(updatedProductResponse.body.data.avgRating).toBe(3.5); // (4+3)/2 = 3.5
    });

    test('debería validar valoraciones correctamente', async () => {
      const productSlug = testProduct.slug;

      // Valoración con rating inválido (mayor a 5)
      const invalidRating1 = {
        rating: 6,
        comment: 'Comentario',
        userName: 'Usuario'
      };

      const invalidResponse1 = await request(app)
        .post(`/api/products/${productSlug}/ratings`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(invalidRating1)
        .expect(400);

      expect(invalidResponse1.body.error).toBe('La valoración debe estar entre 1 y 5');

      // Valoración con rating inválido (menor a 1)
      const invalidRating2 = {
        rating: 0,
        comment: 'Comentario',
        userName: 'Usuario'
      };

      const invalidResponse2 = await request(app)
        .post(`/api/products/${productSlug}/ratings`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(invalidRating2)
        .expect(400);

      expect(invalidResponse2.body.error).toBe('La valoración debe estar entre 1 y 5');

      // Valoración sin rating
      const noRatingData = {
        comment: 'Comentario sin rating',
        userName: 'Usuario'
      };

      await request(app)
        .post(`/api/products/${productSlug}/ratings`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(noRatingData)
        .expect(400);
    });

    test('debería requerir autenticación para agregar valoraciones', async () => {
      const ratingData = {
        rating: 5,
        comment: 'Intento sin autenticación',
        userName: 'Usuario No Autenticado'
      };

      const unauthorizedResponse = await request(app)
        .post(`/api/products/${testProduct.slug}/ratings`)
        .send(ratingData)
        .expect(401);

      expect(unauthorizedResponse.body.success).toBe(false);
    });
  });

  describe('Control de acceso y permisos', () => {
    let testProduct;

    beforeEach(async () => {
      const productData = {
        name: 'Producto Permisos Test',
        description: 'Producto para probar permisos',
        price: 30000,
        stockQuantity: 15,
        category: testCategory1._id,
        brand: 'TestBrand',
        sku: 'PERMS-TEST-001'
      };

      const createResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      testProduct = createResponse.body.data;
    });

    test('solo admin debería poder crear productos', async () => {
      const productData = {
        name: 'Producto Cliente',
        description: 'Intento crear como cliente',
        price: 25000,
        stockQuantity: 10,
        category: testCategory1._id,
        brand: 'TestBrand',
        sku: 'CLIENT-FAIL-001'
      };

      // Cliente intenta crear producto (debería fallar)
      const clientResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(productData)
        .expect(403);

      expect(clientResponse.body.success).toBe(false);

      // Distribuidor intenta crear producto (debería fallar)
      const distributorResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${distributorToken}`)
        .send(productData)
        .expect(403);

      expect(distributorResponse.body.success).toBe(false);

      // Admin puede crear producto
      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);
    });

    test('solo admin debería poder actualizar productos', async () => {
      const updateData = {
        name: 'Nombre Actualizado',
        price: 35000
      };

      // Cliente intenta actualizar (debería fallar)
      await request(app)
        .put(`/api/products/${testProduct.slug}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData)
        .expect(403);

      // Admin puede actualizar
      const adminUpdateResponse = await request(app)
        .put(`/api/products/${testProduct.slug}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(adminUpdateResponse.body.data.name).toBe(updateData.name);
    });

    test('solo admin debería poder eliminar productos', async () => {
      // Cliente intenta eliminar (debería fallar)
      await request(app)
        .delete(`/api/products/${testProduct.slug}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      // Verificar que el producto aún existe
      await request(app)
        .get(`/api/products/${testProduct.slug}`)
        .expect(200);

      // Admin puede eliminar
      await request(app)
        .delete(`/api/products/${testProduct.slug}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verificar que fue eliminado
      await request(app)
        .get(`/api/products/${testProduct.slug}`)
        .expect(404);
    });

    test('todos los usuarios pueden ver productos públicamente', async () => {
      // Sin autenticación
      await request(app)
        .get('/api/products')
        .expect(200);

      await request(app)
        .get(`/api/products/${testProduct.slug}`)
        .expect(200);

      // Con diferentes roles
      await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${distributorToken}`)
        .expect(200);

      await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    test('solo clientes autenticados pueden agregar valoraciones', async () => {
      const ratingData = {
        rating: 4,
        comment: 'Buen producto',
        userName: 'Cliente Test'
      };

      // Sin autenticación (debería fallar)
      await request(app)
        .post(`/api/products/${testProduct.slug}/ratings`)
        .send(ratingData)
        .expect(401);

      // Cliente puede agregar valoración
      await request(app)
        .post(`/api/products/${testProduct.slug}/ratings`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(ratingData)
        .expect(200);

      // Nota: Según las rutas, solo 'client' puede agregar valoraciones
      // Si distribuidores también deberían poder, ajustar las rutas
    });
  });

  describe('Manejo de errores y casos edge', () => {
    test('debería manejar productos con SKU duplicado', async () => {
      const productData1 = {
        name: 'Producto 1',
        description: 'Primer producto',
        price: 25000,
        stockQuantity: 10,
        category: testCategory1._id,
        brand: 'TestBrand',
        sku: 'DUPLICATE-SKU'
      };

      const productData2 = {
        name: 'Producto 2',
        description: 'Segundo producto',
        price: 30000,
        stockQuantity: 15,
        category: testCategory1._id,
        brand: 'TestBrand',
        sku: 'DUPLICATE-SKU' // Mismo SKU
      };

      // Crear primer producto
      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData1)
        .expect(201);

      // Intentar crear segundo producto con mismo SKU (debería fallar)
      const duplicateResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData2)
        .expect(400);

      expect(duplicateResponse.body.success).toBe(false);
    });

    test('debería manejar búsqueda de productos inexistentes', async () => {
      const notFoundResponse = await request(app)
        .get('/api/products/producto-inexistente')
        .expect(404);

      expect(notFoundResponse.body.success).toBe(false);
      expect(notFoundResponse.body.error).toBe('Producto no encontrado');
    });

    test('debería manejar valoración en producto inexistente', async () => {
      const ratingData = {
        rating: 5,
        comment: 'Valoración en producto inexistente',
        userName: 'Cliente Test'
      };

      const notFoundResponse = await request(app)
        .post('/api/products/producto-inexistente/ratings')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(ratingData)
        .expect(404);

      expect(notFoundResponse.body.success).toBe(false);
      expect(notFoundResponse.body.error).toBe('Producto no encontrado');
    });

    test('debería manejar creación con datos faltantes', async () => {
      const incompleteProductData = {
        name: 'Producto Incompleto'
        // Faltan campos requeridos
      };

      const errorResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(incompleteProductData)
        .expect(400);

      expect(errorResponse.body.success).toBe(false);
    });

    test('debería manejar actualización de producto inexistente', async () => {
      const updateData = {
        name: 'Actualización Fallida',
        price: 50000
      };

      const notFoundResponse = await request(app)
        .put('/api/products/producto-inexistente')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);

      expect(notFoundResponse.body.success).toBe(false);
      expect(notFoundResponse.body.error).toBe('Producto no encontrado');
    });

    test('debería manejar eliminación de producto inexistente', async () => {
      const notFoundResponse = await request(app)
        .delete('/api/products/producto-inexistente')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(notFoundResponse.body.success).toBe(false);
      expect(notFoundResponse.body.error).toBe('Producto no encontrado');
    });
  });

  describe('Funcionalidades avanzadas de productos', () => {
    test('debería manejar productos con descuentos automáticos', async () => {
      const productWithDiscountData = {
        name: 'Producto Con Descuento Auto',
        description: 'Producto que calcula descuento automáticamente',
        price: 100000,
        stockQuantity: 20,
        category: testCategory1._id,
        brand: 'TestBrand',
        sku: 'AUTO-DISCOUNT-001',
        onSale: true,
        discountPercentage: 25
      };

      const createResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productWithDiscountData)
        .expect(201);

      expect(createResponse.body.data.onSale).toBe(true);
      expect(createResponse.body.data.discountPercentage).toBe(25);
      expect(createResponse.body.data.salePrice).toBe(75000); // 100000 - 25%
    });

    test('debería manejar productos con modelos compatibles complejos', async () => {
      const productWithModelsData = {
        name: 'Repuesto Universal',
        description: 'Compatible con múltiples vehículos',
        price: 45000,
        stockQuantity: 30,
        category: testCategory1._id,
        brand: 'Universal',
        sku: 'UNIVERSAL-001',
        compatibleModels: [
          { make: 'Toyota', model: 'Corolla', year: 2020 },
          { make: 'Toyota', model: 'Corolla', year: 2021 },
          { make: 'Honda', model: 'Civic', year: 2020 },
          { make: 'Nissan', model: 'Sentra', year: 2019 },
          { make: 'Hyundai', model: 'Elantra', year: 2021 }
        ]
      };

      const createResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productWithModelsData)
        .expect(201);

      expect(createResponse.body.data.compatibleModels).toHaveLength(5);

      // Buscar por diferentes fabricantes
      const toyotaSearchResponse = await request(app)
        .get('/api/products?vehicleMake=Toyota')
        .expect(200);

      expect(toyotaSearchResponse.body.data).toHaveLength(1);
      expect(toyotaSearchResponse.body.data[0]._id).toBe(createResponse.body.data._id);

      const hondaSearchResponse = await request(app)
        .get('/api/products?vehicleMake=Honda&vehicleModel=Civic')
        .expect(200);

      expect(hondaSearchResponse.body.data).toHaveLength(1);
    });

    test('debería manejar precios mayoristas para distribuidores', async () => {
      const productWithWholesaleData = {
        name: 'Producto Mayorista',
        description: 'Producto con precio mayorista',
        price: 50000,
        wholesalePrice: 40000,
        stockQuantity: 25,
        category: testCategory1._id,
        brand: 'Wholesale',
        sku: 'WHOLESALE-001'
      };

      const createResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productWithWholesaleData)
        .expect(201);

      expect(createResponse.body.data.price).toBe(50000);
      expect(createResponse.body.data.wholesalePrice).toBe(40000);

      // Verificar que el producto aparece en listados normales
      const listResponse = await request(app)
        .get('/api/products')
        .expect(200);

      const product = listResponse.body.data.find(p => p._id === createResponse.body.data._id);
      expect(product).toBeDefined();
      expect(product.wholesalePrice).toBe(40000);
    });

    test('debería generar slugs únicos incluso con nombres muy similares', async () => {
      const baseProductData = {
        description: 'Producto de prueba de slugs',
        price: 25000,
        stockQuantity: 10,
        category: testCategory1._id,
        brand: 'SlugTest'
      };

      const products = [];
      const names = [
        'Filtro Aceite',
        'Filtro de Aceite',
        'Filtro  de  Aceite',
        'FILTRO DE ACEITE',
        'filtro de aceite'
      ];

      for (let i = 0; i < names.length; i++) {
        const productData = {
          ...baseProductData,
          name: names[i],
          sku: `SLUG-TEST-${i + 1}`
        };

        const response = await request(app)
          .post('/api/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(productData)
          .expect(201);

        products.push(response.body.data);
      }

      // Verificar que todos tienen slugs únicos
      const slugs = products.map(p => p.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });
  });

  describe('Performance y escalabilidad', () => {
    test('debería manejar búsquedas complejas eficientemente', async () => {
      // Crear múltiples productos para pruebas de performance
      const products = [];
      for (let i = 1; i <= 20; i++) {
        const productData = {
          name: `Producto Performance ${i}`,
          description: `Descripción del producto ${i}`,
          price: 10000 + (i * 1000),
          stockQuantity: i * 5,
          category: i % 2 === 0 ? testCategory1._id : testCategory2._id,
          brand: i % 3 === 0 ? 'BrandA' : i % 3 === 1 ? 'BrandB' : 'BrandC',
          sku: `PERF-${i.toString().padStart(3, '0')}`,
          onSale: i % 4 === 0,
          discountPercentage: i % 4 === 0 ? 10 + (i % 20) : 0
        };

        const response = await request(app)
          .post('/api/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(productData)
          .expect(201);

        products.push(response.body.data);
      }

      // Realizar búsqueda compleja
      const startTime = Date.now();
      
      const complexSearchResponse = await request(app)
        .get('/api/products?search=Producto&minPrice=15000&maxPrice=25000&brand=BrandB&sort=-price&page=1&limit=5')
        .expect(200);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(complexSearchResponse.body.success).toBe(true);
      expect(queryTime).toBeLessThan(2000); // Menos de 2 segundos
      expect(complexSearchResponse.body.data.length).toBeGreaterThan(0);
    });

    test('debería manejar paginación de grandes conjuntos de datos', async () => {
      // Los productos ya fueron creados en el test anterior
      
      // Obtener primera página
      const page1Response = await request(app)
        .get('/api/products?page=1&limit=5')
        .expect(200);

      expect(page1Response.body.data).toHaveLength(5);
      expect(page1Response.body.pagination.next).toBeDefined();

      // Obtener última página
      const totalPages = page1Response.body.totalPages;
      const lastPageResponse = await request(app)
        .get(`/api/products?page=${totalPages}&limit=5`)
        .expect(200);

      expect(lastPageResponse.body.currentPage).toBe(totalPages);
      if (totalPages > 1) {
        expect(lastPageResponse.body.pagination.prev).toBeDefined();
      }
    });
  });

  describe('Integración con categorías', () => {
    test('debería manejar productos con categorías padre e hija', async () => {
      // Crear categoría padre
      const parentCategoryResponse = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sistema de Frenos',
          description: 'Categoría padre para frenos'
        })
        .expect(201);

      const parentCategory = parentCategoryResponse.body.data;

      // Crear subcategoría
      const subCategoryResponse = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Pastillas de Freno',
          description: 'Subcategoría de frenos',
          parent: parentCategory._id
        })
        .expect(201);

      const subCategory = subCategoryResponse.body.data;

      // Crear producto en subcategoría
      const productData = {
        name: 'Pastillas Premium Subcategoría',
        description: 'Producto en subcategoría',
        price: 75000,
        stockQuantity: 15,
        category: subCategory._id,
        brand: 'SubCatBrand',
        sku: 'SUBCAT-001'
      };

      const productResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      // Verificar que el producto muestra la categoría correcta
      const getProductResponse = await request(app)
        .get(`/api/products/${productResponse.body.data.slug}`)
        .expect(200);

      expect(getProductResponse.body.data.category.name).toBe('Pastillas de Freno');
      expect(getProductResponse.body.data.category._id).toBe(subCategory._id);

      // Filtrar por subcategoría
      const filterResponse = await request(app)
        .get(`/api/products?categories=${subCategory.slug}`)
        .expect(200);

      expect(filterResponse.body.data).toHaveLength(1);
      expect(filterResponse.body.data[0]._id).toBe(productResponse.body.data._id);
    });
  });
});