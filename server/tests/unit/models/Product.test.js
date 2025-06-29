const Product = require('../../../models/Product');

describe('Modelo Product', () => {
  let category;

  beforeEach(async () => {
    category = await global.testHelpers.createTestCategory();
  });

  describe('Validaciones de campos', () => {
    test('debería crear un producto válido', async () => {
      const productData = {
        ...global.testUtils.validProduct,
        category: category._id
      };
      const product = new Product(productData);
      
      const savedProduct = await product.save();
      
      expect(savedProduct.name).toBe(productData.name);
      expect(savedProduct.price).toBe(productData.price);
      expect(savedProduct.sku).toBe(productData.sku);
      expect(savedProduct.slug).toBeDefined();
      expect(savedProduct._id).toBeDefined();
    });

    test('debería fallar sin nombre', async () => {
      const productData = { ...global.testUtils.validProduct, category: category._id };
      delete productData.name;
      
      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow('Por favor ingrese un nombre de producto');
    });

    test('debería fallar sin descripción', async () => {
      const productData = { ...global.testUtils.validProduct, category: category._id };
      delete productData.description;
      
      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow('Por favor ingrese una descripción');
    });

    test('debería fallar sin precio', async () => {
      const productData = { ...global.testUtils.validProduct, category: category._id };
      delete productData.price;
      
      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow('Por favor ingrese un precio');
    });

    test('debería fallar con precio negativo', async () => {
      const productData = {
        ...global.testUtils.validProduct,
        category: category._id,
        price: -100
      };
      
      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow('El precio no puede ser negativo');
    });

    test('debería fallar sin stock', async () => {
      const productData = { ...global.testUtils.validProduct, category: category._id };
      delete productData.stockQuantity;
      
      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow('Por favor ingrese la cantidad en stock');
    });

    test('debería fallar con stock negativo', async () => {
      const productData = {
        ...global.testUtils.validProduct,
        category: category._id,
        stockQuantity: -5
      };
      
      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow('El stock no puede ser negativo');
    });

    test('debería fallar sin categoría', async () => {
      const productData = { ...global.testUtils.validProduct };
      delete productData.category;
      
      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow('Por favor seleccione una categoría');
    });

    test('debería fallar sin marca', async () => {
      const productData = { ...global.testUtils.validProduct, category: category._id };
      delete productData.brand;
      
      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow('Por favor ingrese una marca');
    });

    test('debería fallar sin SKU', async () => {
      const productData = { ...global.testUtils.validProduct, category: category._id };
      delete productData.sku;
      
      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow('Por favor ingrese el SKU');
    });

    test('debería fallar con SKU duplicado', async () => {
      const productData = {
        ...global.testUtils.validProduct,
        category: category._id
      };
      
      // Crear primer producto
      const product1 = new Product(productData);
      await product1.save();
      
      // Intentar crear segundo producto con mismo SKU
      const product2 = new Product({ ...productData, name: 'Producto Diferente' });
      
      await expect(product2.save()).rejects.toThrow();
    });
  });

  describe('Generación automática de slug', () => {
    test('debería generar slug automáticamente', async () => {
      const productData = {
        ...global.testUtils.validProduct,
        category: category._id,
        name: 'Producto de Prueba Único'
      };
      const product = new Product(productData);
      
      const savedProduct = await product.save();
      
      expect(savedProduct.slug).toBe('producto_de_prueba_unico');
    });

    test('debería generar slug único para nombres similares', async () => {
      const baseName = 'Producto Similar';
      
      // Crear primer producto
      const product1Data = {
        ...global.testUtils.validProduct,
        category: category._id,
        name: baseName,
        sku: 'SKU-001'
      };
      const product1 = new Product(product1Data);
      const savedProduct1 = await product1.save();
      
      // Crear segundo producto con nombre similar
      const product2Data = {
        ...global.testUtils.validProduct,
        category: category._id,
        name: baseName,
        sku: 'SKU-002'
      };
      const product2 = new Product(product2Data);
      const savedProduct2 = await product2.save();
      
      expect(savedProduct1.slug).toBe('producto_similar');
      expect(savedProduct2.slug).toBe('producto_similar_1');
      expect(savedProduct1.slug).not.toBe(savedProduct2.slug);
    });

    test('debería manejar caracteres especiales en slug', async () => {
      const productData = {
        ...global.testUtils.validProduct,
        category: category._id,
        name: 'Producto con Ácentos y Ñ @ # $ %'
      };
      const product = new Product(productData);
      
      const savedProduct = await product.save();
      
      expect(savedProduct.slug).toMatch(/^[a-z0-9_]+$/);
      expect(savedProduct.slug).not.toContain('@');
      expect(savedProduct.slug).not.toContain('#');
    });
  });

  describe('Funcionalidades de descuento', () => {
    test('debería calcular precio de oferta automáticamente', async () => {
      const productData = {
        ...global.testUtils.validProduct,
        category: category._id,
        price: 10000,
        onSale: true,
        discountPercentage: 20
      };
      const product = new Product(productData);
      
      const savedProduct = await product.save();
      
      expect(savedProduct.salePrice).toBe(8000); // 10000 - 20%
      expect(savedProduct.onSale).toBe(true);
    });

    test('debería desactivar oferta si no hay porcentaje de descuento', async () => {
      const productData = {
        ...global.testUtils.validProduct,
        category: category._id,
        onSale: true,
        discountPercentage: 0
      };
      const product = new Product(productData);
      
      const savedProduct = await product.save();
      
      expect(savedProduct.onSale).toBe(false);
      expect(savedProduct.salePrice).toBeNull();
    });

    test('debería validar porcentaje de descuento máximo', async () => {
      const productData = {
        ...global.testUtils.validProduct,
        category: category._id,
        discountPercentage: 150
      };
      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow('El porcentaje de descuento no puede ser mayor a 100');
    });

    test('debería validar porcentaje de descuento mínimo', async () => {
      const productData = {
        ...global.testUtils.validProduct,
        category: category._id,
        discountPercentage: -10
      };
      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow('El porcentaje de descuento no puede ser negativo');
    });
  });

  describe('Método calculateAvgRating()', () => {
    test('debería calcular promedio de calificaciones correctamente', async () => {
      const productData = {
        ...global.testUtils.validProduct,
        category: category._id
      };
      const product = new Product(productData);
      
      // Agregar algunas calificaciones
      product.ratings = [
        { rating: 5, comment: 'Excelente', userName: 'Usuario1' },
        { rating: 4, comment: 'Muy bueno', userName: 'Usuario2' },
        { rating: 3, comment: 'Regular', userName: 'Usuario3' }
      ];
      
      product.calculateAvgRating();
      
      expect(product.avgRating).toBe(4); // (5+4+3)/3 = 4
    });

    test('debería establecer avgRating en 0 sin calificaciones', async () => {
      const productData = {
        ...global.testUtils.validProduct,
        category: category._id
      };
      const product = new Product(productData);
      
      product.calculateAvgRating();
      
      expect(product.avgRating).toBe(0);
    });

    test('debería manejar una sola calificación', async () => {
      const productData = {
        ...global.testUtils.validProduct,
        category: category._id
      };
      const product = new Product(productData);
      
      product.ratings = [
        { rating: 5, comment: 'Perfecto', userName: 'Usuario1' }
      ];
      
      product.calculateAvgRating();
      
      expect(product.avgRating).toBe(5);
    });
  });

  describe('Validaciones de precios', () => {
    test('debería validar precio mayorista no negativo', async () => {
      const productData = {
        ...global.testUtils.validProduct,
        category: category._id,
        wholesalePrice: -500
      };
      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow('El precio mayorista no puede ser negativo');
    });

    test('debería validar precio de oferta no negativo', async () => {
      const productData = {
        ...global.testUtils.validProduct,
        category: category._id,
        salePrice: -100
      };
      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow('El precio de oferta no puede ser negativo');
    });

    test('debería permitir precios mayoristas opcionales', async () => {
      const productData = {
        ...global.testUtils.validProduct,
        category: category._id
      };
      delete productData.wholesalePrice;
      
      const product = new Product(productData);
      const savedProduct = await product.save();
      
      expect(savedProduct.wholesalePrice).toBeUndefined();
    });
  });

  describe('Campos de fecha automáticos', () => {
    test('debería establecer createdAt automáticamente', async () => {
      const productData = {
        ...global.testUtils.validProduct,
        category: category._id
      };
      const product = new Product(productData);
      
      const beforeSave = new Date();
      const savedProduct = await product.save();
      const afterSave = new Date();
      
      expect(savedProduct.createdAt).toBeInstanceOf(Date);
      expect(savedProduct.createdAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
      expect(savedProduct.createdAt.getTime()).toBeLessThanOrEqual(afterSave.getTime());
    });

    test('debería actualizar updatedAt en cada modificación', async () => {
      const productData = {
        ...global.testUtils.validProduct,
        category: category._id
      };
      const product = new Product(productData);
      const savedProduct = await product.save();
      
      const originalUpdatedAt = savedProduct.updatedAt;
      
      // Esperar un poco y actualizar
      await new Promise(resolve => setTimeout(resolve, 10));
      savedProduct.name = 'Nombre Actualizado';
      await savedProduct.save();
      
      expect(savedProduct.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Campos por defecto', () => {
    test('debería establecer campos booleanos por defecto', async () => {
      const productData = {
        ...global.testUtils.validProduct,
        category: category._id
      };
      delete productData.featured;
      delete productData.onSale;
      
      const product = new Product(productData);
      const savedProduct = await product.save();
      
      expect(savedProduct.featured).toBe(false);
      expect(savedProduct.onSale).toBe(false);
      expect(savedProduct.avgRating).toBe(0);
      expect(savedProduct.discountPercentage).toBe(0);
    });
  });

  describe('Validación de modelos compatibles', () => {
    test('debería permitir modelos compatibles válidos', async () => {
      const productData = {
        ...global.testUtils.validProduct,
        category: category._id,
        compatibleModels: [
          { make: 'Toyota', model: 'Corolla', year: 2020 },
          { make: 'Honda', model: 'Civic', year: 2019 }
        ]
      };
      const product = new Product(productData);
      
      const savedProduct = await product.save();
      
      expect(savedProduct.compatibleModels).toHaveLength(2);
      expect(savedProduct.compatibleModels[0].make).toBe('Toyota');
      expect(savedProduct.compatibleModels[0].model).toBe('Corolla');
      expect(savedProduct.compatibleModels[0].year).toBe(2020);
    });

    test('debería permitir productos sin modelos compatibles', async () => {
      const productData = {
        ...global.testUtils.validProduct,
        category: category._id
      };
      delete productData.compatibleModels;
      
      const product = new Product(productData);
      const savedProduct = await product.save();
      
      expect(savedProduct.compatibleModels).toEqual([]);
    });
  });
});