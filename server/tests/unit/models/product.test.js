const Product = require('../../../models/Product');
const Category = require('../../../models/Category');

describe('Modelo Product', () => {
  let category;

  // Crear categoría antes de las pruebas
  beforeEach(async () => {
    category = new Category({
      name: 'Frenos',
      description: 'Sistema de frenos',
      slug: 'frenos'
    });
    await category.save();
  });

  const productData = {
    name: 'Pastillas de Freno Brembo',
    description: 'Pastillas de freno de alta calidad para vehículos europeos',
    price: 89990,
    stockQuantity: 25,
    brand: 'Brembo',
    sku: 'BRE-PAD-001',
    partNumber: 'P85020'
  };

  describe('Creación de productos', () => {
    test('debe crear un producto correctamente', async () => {
      const product = new Product({
        ...productData,
        category: category._id
      });

      const savedProduct = await product.save();

      expect(savedProduct.name).toBe(productData.name);
      expect(savedProduct.price).toBe(productData.price);
      expect(savedProduct.stockQuantity).toBe(productData.stockQuantity);
      expect(savedProduct.slug).toBeDefined();
      expect(savedProduct.createdAt).toBeDefined();
      expect(savedProduct.avgRating).toBe(0);
    });

    test('debe generar slug automáticamente', async () => {
      const product = new Product({
        ...productData,
        category: category._id
      });

      await product.save();
      expect(product.slug).toBe('pastillas_de_freno_brembo');
    });

    test('debe requerir campos obligatorios', async () => {
      const product = new Product({});
      
      await expect(product.save()).rejects.toThrow();
    });

    test('debe validar precio no negativo', async () => {
      const product = new Product({
        ...productData,
        category: category._id,
        price: -100
      });

      await expect(product.save()).rejects.toThrow();
    });

    test('debe validar stock no negativo', async () => {
      const product = new Product({
        ...productData,
        category: category._id,
        stockQuantity: -5
      });

      await expect(product.save()).rejects.toThrow();
    });

    test('debe requerir SKU único', async () => {
      const product1 = new Product({
        ...productData,
        category: category._id
      });
      await product1.save();

      const product2 = new Product({
        ...productData,
        name: 'Otro Producto',
        category: category._id
      });

      await expect(product2.save()).rejects.toThrow();
    });
  });

  describe('Funcionalidad de ofertas', () => {
    test('debe calcular precio de oferta correctamente', async () => {
      const product = new Product({
        ...productData,
        category: category._id,
        onSale: true,
        discountPercentage: 20
      });

      await product.save();

      const expectedSalePrice = productData.price - (productData.price * 0.20);
      expect(product.salePrice).toBe(expectedSalePrice);
      expect(product.onSale).toBe(true);
    });

    test('debe desactivar oferta si no hay descuento', async () => {
      const product = new Product({
        ...productData,
        category: category._id,
        onSale: true,
        discountPercentage: 0
      });

      await product.save();

      expect(product.onSale).toBe(false);
      expect(product.salePrice).toBeNull();
    });

    test('debe validar porcentaje de descuento válido', async () => {
      const product = new Product({
        ...productData,
        category: category._id,
        discountPercentage: 150 // Mayor a 100%
      });

      await expect(product.save()).rejects.toThrow();
    });
  });

  describe('Precio mayorista', () => {
    test('debe permitir precio mayorista menor al precio regular', async () => {
      const product = new Product({
        ...productData,
        category: category._id,
        wholesalePrice: 70000
      });

      await product.save();
      expect(product.wholesalePrice).toBe(70000);
    });

    test('debe validar precio mayorista no negativo', async () => {
      const product = new Product({
        ...productData,
        category: category._id,
        wholesalePrice: -1000
      });

      await expect(product.save()).rejects.toThrow();
    });
  });

  describe('Modelos compatibles', () => {
    test('debe agregar modelos compatibles correctamente', async () => {
      const product = new Product({
        ...productData,
        category: category._id,
        compatibleModels: [
          { make: 'BMW', model: 'Serie 3', year: 2020 },
          { make: 'Mercedes-Benz', model: 'Clase C', year: 2019 }
        ]
      });

      await product.save();
      expect(product.compatibleModels).toHaveLength(2);
      expect(product.compatibleModels[0].make).toBe('BMW');
      expect(product.compatibleModels[1].year).toBe(2019);
    });
  });

  describe('Sistema de valoraciones', () => {
    let product;

    beforeEach(async () => {
      product = new Product({
        ...productData,
        category: category._id
      });
      await product.save();
    });

    test('debe calcular promedio de valoraciones correctamente', () => {
      product.ratings = [
        { rating: 5, comment: 'Excelente', userName: 'Usuario1' },
        { rating: 4, comment: 'Muy bueno', userName: 'Usuario2' },
        { rating: 5, comment: 'Perfecto', userName: 'Usuario3' }
      ];

      product.calculateAvgRating();
      expect(product.avgRating).toBeCloseTo(4.67, 2);
    });

    test('debe manejar sin valoraciones', () => {
      product.ratings = [];
      product.calculateAvgRating();
      expect(product.avgRating).toBe(0);
    });

    test('debe calcular promedio con una sola valoración', () => {
      product.ratings = [
        { rating: 3, comment: 'Regular', userName: 'Usuario1' }
      ];

      product.calculateAvgRating();
      expect(product.avgRating).toBe(3);
    });
  });

  describe('Generación de slug único', () => {
    test('debe generar slugs únicos para nombres similares', async () => {
      const product1 = new Product({
        ...productData,
        category: category._id
      });
      await product1.save();

      const product2 = new Product({
        ...productData,
        name: 'Pastillas de Freno Brembo',
        sku: 'BRE-PAD-002',
        category: category._id
      });
      await product2.save();

      expect(product1.slug).toBe('pastillas_de_freno_brembo');
      expect(product2.slug).toBe('pastillas_de_freno_brembo_1');
    });

    test('debe manejar caracteres especiales en el nombre', async () => {
      const product = new Product({
        ...productData,
        name: 'Filtro de Aceite Mahle® Original 100%',
        category: category._id
      });

      await product.save();
      expect(product.slug).toBe('filtro_de_aceite_mahle_original_100');
    });
  });

  describe('Actualización de fecha', () => {
    test('debe actualizar updatedAt al guardar', async () => {
      const product = new Product({
        ...productData,
        category: category._id
      });

      await product.save();
      const originalUpdatedAt = product.updatedAt;

      // Esperar un poco para que cambie la fecha
      await new Promise(resolve => setTimeout(resolve, 100));
      
      product.price = 95000;
      await product.save();

      expect(product.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Validaciones adicionales', () => {
    test('debe aceptar imágenes como array', async () => {
      const product = new Product({
        ...productData,
        category: category._id,
        images: ['imagen1.jpg', 'imagen2.jpg']
      });

      await product.save();
      expect(product.images).toHaveLength(2);
    });

    test('debe manejar producto destacado', async () => {
      const product = new Product({
        ...productData,
        category: category._id,
        featured: true
      });

      await product.save();
      expect(product.featured).toBe(true);
    });

    test('debe establecer valores por defecto correctos', async () => {
      const product = new Product({
        ...productData,
        category: category._id
      });

      await product.save();
      expect(product.onSale).toBe(false);
      expect(product.discountPercentage).toBe(0);
      expect(product.featured).toBe(false);
      expect(product.avgRating).toBe(0);
      expect(product.ratings).toHaveLength(0);
    });
  });

  describe('Método estático generateUniqueSlug', () => {
    test('debe generar slug único cuando no existe', async () => {
      const slug = await Product.generateUniqueSlug('Nuevo Producto Test');
      expect(slug).toBe('nuevo_producto_test');
    });

    test('debe agregar número cuando slug ya existe', async () => {
      // Crear producto con slug conocido
      const product = new Product({
        ...productData,
        category: category._id
      });
      await product.save();

      // Generar nuevo slug con el mismo nombre
      const newSlug = await Product.generateUniqueSlug('Pastillas de Freno Brembo');
      expect(newSlug).toBe('pastillas_de_freno_brembo_1');
    });
  });
});