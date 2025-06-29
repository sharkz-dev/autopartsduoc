const Product = require('../../../models/Product');
const Category = require('../../../models/Category');
const mongoose = require('mongoose');

describe('Modelo Product', () => {
  let categoryId;

  beforeEach(async () => {
    // Crear una categoría para los tests
    const category = await Category.create({
      name: 'Categoría Test',
      description: 'Descripción de test'
    });
    categoryId = category._id;
  });

  afterEach(async () => {
    await Product.deleteMany({});
    await Category.deleteMany({});
  });

  describe('Validaciones de campos', () => {
    test('debería crear un producto válido', async () => {
      const productData = {
        name: 'Producto Test',
        description: 'Descripción del producto test',
        price: 100,
        stockQuantity: 10,
        category: categoryId,
        brand: 'Marca Test',
        sku: 'TEST-001'
      };

      const product = await Product.create(productData);

      expect(product).toBeDefined();
      expect(product.name).toBe('Producto Test');
      expect(product.slug).toBeDefined(); // Debe generarse automáticamente
      expect(product.slug).toBe('producto-test');
    });

    test('debería fallar sin nombre', async () => {
      const productData = {
        description: 'Descripción test',
        price: 100,
        stockQuantity: 10,
        category: categoryId,
        brand: 'Marca Test',
        sku: 'TEST-002'
      };

      await expect(Product.create(productData)).rejects.toThrow('Por favor ingrese un nombre de producto');
    });

    test('debería fallar sin descripción', async () => {
      const productData = {
        name: 'Producto Test',
        price: 100,
        stockQuantity: 10,
        category: categoryId,
        brand: 'Marca Test',
        sku: 'TEST-003'
      };

      await expect(Product.create(productData)).rejects.toThrow('Por favor ingrese una descripción');
    });

    test('debería fallar sin precio', async () => {
      const productData = {
        name: 'Producto Test',
        description: 'Descripción test',
        stockQuantity: 10,
        category: categoryId,
        brand: 'Marca Test',
        sku: 'TEST-004'
      };

      await expect(Product.create(productData)).rejects.toThrow('Por favor ingrese un precio');
    });

    test('debería fallar con precio negativo', async () => {
      const productData = {
        name: 'Producto Test',
        description: 'Descripción test',
        price: -10,
        stockQuantity: 10,
        category: categoryId,
        brand: 'Marca Test',
        sku: 'TEST-005'
      };

      await expect(Product.create(productData)).rejects.toThrow('El precio no puede ser negativo');
    });

    test('debería fallar sin stock', async () => {
      const productData = {
        name: 'Producto Test',
        description: 'Descripción test',
        price: 100,
        category: categoryId,
        brand: 'Marca Test',
        sku: 'TEST-006'
      };

      await expect(Product.create(productData)).rejects.toThrow('Por favor ingrese la cantidad en stock');
    });

    test('debería fallar con stock negativo', async () => {
      const productData = {
        name: 'Producto Test',
        description: 'Descripción test',
        price: 100,
        stockQuantity: -5,
        category: categoryId,
        brand: 'Marca Test',
        sku: 'TEST-007'
      };

      await expect(Product.create(productData)).rejects.toThrow('El stock no puede ser negativo');
    });

    test('debería fallar sin categoría', async () => {
      const productData = {
        name: 'Producto Test',
        description: 'Descripción test',
        price: 100,
        stockQuantity: 10,
        brand: 'Marca Test',
        sku: 'TEST-008'
      };

      await expect(Product.create(productData)).rejects.toThrow('Por favor seleccione una categoría');
    });

    test('debería fallar sin marca', async () => {
      const productData = {
        name: 'Producto Test',
        description: 'Descripción test',
        price: 100,
        stockQuantity: 10,
        category: categoryId,
        sku: 'TEST-009'
      };

      await expect(Product.create(productData)).rejects.toThrow('Por favor ingrese una marca');
    });

    test('debería fallar sin SKU', async () => {
      const productData = {
        name: 'Producto Test',
        description: 'Descripción test',
        price: 100,
        stockQuantity: 10,
        category: categoryId,
        brand: 'Marca Test'
      };

      await expect(Product.create(productData)).rejects.toThrow('Por favor ingrese el SKU');
    });

    test('debería fallar con SKU duplicado', async () => {
      const productData1 = {
        name: 'Producto Test 1',
        description: 'Descripción test 1',
        price: 100,
        stockQuantity: 10,
        category: categoryId,
        brand: 'Marca Test',
        sku: 'TEST-DUPLICATE'
      };

      const productData2 = {
        name: 'Producto Test 2',
        description: 'Descripción test 2',
        price: 200,
        stockQuantity: 5,
        category: categoryId,
        brand: 'Marca Test',
        sku: 'TEST-DUPLICATE'
      };

      await Product.create(productData1);
      await expect(Product.create(productData2)).rejects.toThrow();
    });
  });

  describe('Generación automática de slug', () => {
    test('debería generar slug automáticamente', async () => {
      const product = await Product.create({
        name: 'Filtro de Aceite Premium',
        description: 'Descripción test',
        price: 100,
        stockQuantity: 10,
        category: categoryId,
        brand: 'Marca Test',
        sku: 'TEST-SLUG-001'
      });

      expect(product.slug).toBe('filtro-de-aceite-premium');
    });

    test('debería generar slug único para nombres similares', async () => {
      const product1 = await Product.create({
        name: 'Producto Similar',
        description: 'Descripción test 1',
        price: 100,
        stockQuantity: 10,
        category: categoryId,
        brand: 'Marca Test',
        sku: 'TEST-SLUG-002'
      });

      const product2 = await Product.create({
        name: 'Producto Similar',
        description: 'Descripción test 2',
        price: 200,
        stockQuantity: 5,
        category: categoryId,
        brand: 'Marca Test',
        sku: 'TEST-SLUG-003'
      });

      expect(product1.slug).toBe('producto-similar');
      expect(product2.slug).toBe('producto-similar_1');
    });

    test('debería manejar caracteres especiales en slug', async () => {
      const product = await Product.create({
        name: 'Producto con Ñoños & Símbolos!',
        description: 'Descripción test',
        price: 100,
        stockQuantity: 10,
        category: categoryId,
        brand: 'Marca Test',
        sku: 'TEST-SLUG-004'
      });

      expect(product.slug).toBe('producto-con-nonos-simbolos');
    });
  });

  describe('Funcionalidades de descuento', () => {
    test('debería calcular precio de oferta automáticamente', async () => {
      const product = await Product.create({
        name: 'Producto con Descuento',
        description: 'Descripción test',
        price: 100,
        stockQuantity: 10,
        category: categoryId,
        brand: 'Marca Test',
        sku: 'TEST-DISCOUNT-001',
        onSale: true,
        discountPercentage: 20
      });

      expect(product.salePrice).toBe(80); // 100 - (100 * 0.2) = 80
      expect(product.onSale).toBe(true);
    });

    test('debería desactivar oferta si no hay porcentaje de descuento', async () => {
      const product = await Product.create({
        name: 'Producto sin Descuento Real',
        description: 'Descripción test',
        price: 100,
        stockQuantity: 10,
        category: categoryId,
        brand: 'Marca Test',
        sku: 'TEST-DISCOUNT-002',
        onSale: true,
        discountPercentage: 0
      });

      expect(product.onSale).toBe(false);
      expect(product.salePrice).toBeNull();
    });
  });

  describe('Validaciones específicas', () => {
    test('debería validar porcentaje de descuento máximo', async () => {
      const productData = {
        name: 'Producto Test',
        description: 'Descripción test',
        price: 100,
        stockQuantity: 10,
        category: categoryId,
        brand: 'Marca Test',
        sku: 'TEST-VALIDATION-001',
        discountPercentage: 150
      };

      await expect(Product.create(productData)).rejects.toThrow('El porcentaje de descuento no puede ser mayor a 100');
    });

    test('debería validar porcentaje de descuento mínimo', async () => {
      const productData = {
        name: 'Producto Test',
        description: 'Descripción test',
        price: 100,
        stockQuantity: 10,
        category: categoryId,
        brand: 'Marca Test',
        sku: 'TEST-VALIDATION-002',
        discountPercentage: -10
      };

      await expect(Product.create(productData)).rejects.toThrow('El porcentaje de descuento no puede ser negativo');
    });

    test('debería validar precio mayorista no negativo', async () => {
      const productData = {
        name: 'Producto Test',
        description: 'Descripción test',
        price: 100,
        wholesalePrice: -50,
        stockQuantity: 10,
        category: categoryId,
        brand: 'Marca Test',
        sku: 'TEST-VALIDATION-003'
      };

      await expect(Product.create(productData)).rejects.toThrow('El precio mayorista no puede ser negativo');
    });

    test('debería validar precio de oferta no negativo', async () => {
      const productData = {
        name: 'Producto Test',
        description: 'Descripción test',
        price: 100,
        salePrice: -20,
        stockQuantity: 10,
        category: categoryId,
        brand: 'Marca Test',
        sku: 'TEST-VALIDATION-004'
      };

      await expect(Product.create(productData)).rejects.toThrow('El precio de oferta no puede ser negativo');
    });

    test('debería permitir precios mayoristas opcionales', async () => {
      const product = await Product.create({
        name: 'Producto sin Mayorista',
        description: 'Descripción test',
        price: 100,
        stockQuantity: 10,
        category: categoryId,
        brand: 'Marca Test',
        sku: 'TEST-VALIDATION-005'
      });

      expect(product.wholesalePrice).toBeUndefined();
    });
  });

  describe('Método calculateAvgRating()', () => {
    test('debería calcular promedio de calificaciones correctamente', () => {
      const product = new Product({
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        stockQuantity: 10,
        category: categoryId,
        brand: 'Test Brand',
        sku: 'TEST-RATING-001',
        ratings: [
          { rating: 5, comment: 'Excelente' },
          { rating: 4, comment: 'Muy bueno' },
          { rating: 3, comment: 'Regular' }
        ]
      });

      product.calculateAvgRating();
      expect(product.avgRating).toBe(4); // (5+4+3)/3 = 4
    });

    test('debería establecer avgRating en 0 sin calificaciones', () => {
      const product = new Product({
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        stockQuantity: 10,
        category: categoryId,
        brand: 'Test Brand',
        sku: 'TEST-RATING-002',
        ratings: []
      });

      product.calculateAvgRating();
      expect(product.avgRating).toBe(0);
    });

    test('debería manejar una sola calificación', () => {
      const product = new Product({
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        stockQuantity: 10,
        category: categoryId,
        brand: 'Test Brand',
        sku: 'TEST-RATING-003',
        ratings: [{ rating: 5, comment: 'Perfecto' }]
      });

      product.calculateAvgRating();
      expect(product.avgRating).toBe(5);
    });
  });

  describe('Campos de fecha automáticos', () => {
    test('debería establecer createdAt automáticamente', async () => {
      const product = await Product.create({
        name: 'Producto con Fecha',
        description: 'Descripción test',
        price: 100,
        stockQuantity: 10,
        category: categoryId,
        brand: 'Marca Test',
        sku: 'TEST-DATE-001'
      });

      expect(product.createdAt).toBeDefined();
      expect(product.createdAt).toBeInstanceOf(Date);
    });

    test('debería actualizar updatedAt en cada modificación', async () => {
      const product = await Product.create({
        name: 'Producto para Actualizar',
        description: 'Descripción test',
        price: 100,
        stockQuantity: 10,
        category: categoryId,
        brand: 'Marca Test',
        sku: 'TEST-DATE-002'
      });

      const originalUpdatedAt = product.updatedAt;

      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 10));

      product.price = 150;
      await product.save();

      expect(product.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Campos por defecto', () => {
    test('debería establecer campos booleanos por defecto', async () => {
      const product = await Product.create({
        name: 'Producto con Defaults',
        description: 'Descripción test',
        price: 100,
        stockQuantity: 10,
        category: categoryId,
        brand: 'Marca Test',
        sku: 'TEST-DEFAULT-001'
      });

      expect(product.onSale).toBe(false);
      expect(product.featured).toBe(false);
      expect(product.discountPercentage).toBe(0);
      expect(product.avgRating).toBe(0);
    });
  });

  describe('Validación de modelos compatibles', () => {
    test('debería permitir modelos compatibles válidos', async () => {
      const product = await Product.create({
        name: 'Filtro Compatible',
        description: 'Descripción test',
        price: 100,
        stockQuantity: 10,
        category: categoryId,
        brand: 'Marca Test',
        sku: 'TEST-COMPATIBLE-001',
        compatibleModels: [
          { make: 'Toyota', model: 'Corolla', year: 2020 },
          { make: 'Honda', model: 'Civic', year: 2019 }
        ]
      });

      expect(product.compatibleModels).toHaveLength(2);
      expect(product.compatibleModels[0].make).toBe('Toyota');
    });

    test('debería permitir productos sin modelos compatibles', async () => {
      const product = await Product.create({
        name: 'Producto Universal',
        description: 'Descripción test',
        price: 100,
        stockQuantity: 10,
        category: categoryId,
        brand: 'Marca Test',
        sku: 'TEST-COMPATIBLE-002'
      });

      expect(product.compatibleModels).toHaveLength(0);
    });
  });
});