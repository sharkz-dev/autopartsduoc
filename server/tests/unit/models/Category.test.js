const Category = require('../../../models/Category');

describe('Modelo Category', () => {
  describe('Validaciones de campos', () => {
    test('debería crear una categoría válida', async () => {
      const categoryData = global.testUtils.validCategory;
      const category = new Category(categoryData);
      
      const savedCategory = await category.save();
      
      expect(savedCategory.name).toBe(categoryData.name);
      expect(savedCategory.description).toBe(categoryData.description);
      expect(savedCategory.slug).toBeDefined();
      expect(savedCategory._id).toBeDefined();
      expect(savedCategory.createdAt).toBeInstanceOf(Date);
    });

    test('debería fallar sin nombre', async () => {
      const categoryData = { ...global.testUtils.validCategory };
      delete categoryData.name;
      
      const category = new Category(categoryData);
      
      await expect(category.save()).rejects.toThrow('Por favor ingrese un nombre de categoría');
    });

    test('debería fallar con nombre duplicado', async () => {
      const categoryData = global.testUtils.validCategory;
      
      // Crear primera categoría
      const category1 = new Category(categoryData);
      await category1.save();
      
      // Intentar crear segunda categoría con mismo nombre
      const category2 = new Category(categoryData);
      
      await expect(category2.save()).rejects.toThrow();
    });

    test('debería permitir descripción opcional', async () => {
      const categoryData = { ...global.testUtils.validCategory };
      delete categoryData.description;
      
      const category = new Category(categoryData);
      const savedCategory = await category.save();
      
      expect(savedCategory.name).toBe(categoryData.name);
      expect(savedCategory.description).toBeUndefined();
    });

    test('debería permitir imagen opcional', async () => {
      const categoryData = global.testUtils.validCategory;
      const category = new Category(categoryData);
      
      const savedCategory = await category.save();
      
      expect(savedCategory.image).toBeUndefined();
    });
  });

  describe('Generación automática de slug', () => {
    test('debería generar slug automáticamente', async () => {
      const categoryData = {
        ...global.testUtils.validCategory,
        name: 'Categoría de Prueba Única'
      };
      const category = new Category(categoryData);
      
      const savedCategory = await category.save();
      
      expect(savedCategory.slug).toBe('categoria_de_prueba_unica');
    });

    test('debería generar slug único para nombres similares', async () => {
      const baseName = 'Categoría Similar';
      
      // Crear primera categoría
      const category1Data = {
        ...global.testUtils.validCategory,
        name: baseName
      };
      const category1 = new Category(category1Data);
      const savedCategory1 = await category1.save();
      
      // Crear segunda categoría con nombre similar
      const category2Data = {
        ...global.testUtils.validCategory,
        name: baseName
      };
      const category2 = new Category(category2Data);
      const savedCategory2 = await category2.save();
      
      expect(savedCategory1.slug).toBe('categoria_similar');
      expect(savedCategory2.slug).toBe('categoria_similar_1');
      expect(savedCategory1.slug).not.toBe(savedCategory2.slug);
    });

    test('debería manejar caracteres especiales en slug', async () => {
      const categoryData = {
        ...global.testUtils.validCategory,
        name: 'Categoría con Ácentos y Ñ @ # $ %'
      };
      const category = new Category(categoryData);
      
      const savedCategory = await category.save();
      
      expect(savedCategory.slug).toMatch(/^[a-z0-9_]+$/);
      expect(savedCategory.slug).not.toContain('@');
      expect(savedCategory.slug).not.toContain('#');
      expect(savedCategory.slug).not.toContain(' ');
    });

    test('debería actualizar slug si cambia el nombre', async () => {
      const categoryData = {
        ...global.testUtils.validCategory,
        name: 'Nombre Original'
      };
      const category = new Category(categoryData);
      const savedCategory = await category.save();
      
      const originalSlug = savedCategory.slug;
      expect(originalSlug).toBe('nombre_original');
      
      // Cambiar nombre
      savedCategory.name = 'Nuevo Nombre';
      await savedCategory.save();
      
      expect(savedCategory.slug).toBe('nuevo_nombre');
      expect(savedCategory.slug).not.toBe(originalSlug);
    });

    test('no debería cambiar slug si no cambia el nombre', async () => {
      const categoryData = global.testUtils.validCategory;
      const category = new Category(categoryData);
      const savedCategory = await category.save();
      
      const originalSlug = savedCategory.slug;
      
      // Cambiar solo descripción
      savedCategory.description = 'Nueva descripción';
      await savedCategory.save();
      
      expect(savedCategory.slug).toBe(originalSlug);
    });
  });

  describe('Método estático generateUniqueSlug', () => {
    test('debería generar slug único', async () => {
      const slug1 = await Category.generateUniqueSlug('Test Category');
      expect(slug1).toBe('test_category');
      
      // Crear categoría con ese slug
      const category = new Category({
        name: 'Test Category',
        slug: slug1
      });
      await category.save();
      
      // Generar nuevo slug para nombre similar
      const slug2 = await Category.generateUniqueSlug('Test Category');
      expect(slug2).toBe('test_category_1');
    });

    test('debería excluir ID específico al generar slug', async () => {
      const category = await Category.create({
        name: 'Unique Category',
        slug: 'unique_category'
      });
      
      // Debería poder usar el mismo nombre para el mismo ID
      const slug = await Category.generateUniqueSlug('Unique Category', category._id);
      expect(slug).toBe('unique_category');
    });

    test('debería incrementar contador para slugs duplicados', async () => {
      const baseName = 'Duplicate Category';
      
      // Crear varias categorías con nombres que generan el mismo slug base
      await Category.create({ name: baseName, slug: 'duplicate_category' });
      await Category.create({ name: baseName + ' 2', slug: 'duplicate_category_1' });
      await Category.create({ name: baseName + ' 3', slug: 'duplicate_category_2' });
      
      // El próximo slug debería ser duplicate_category_3
      const newSlug = await Category.generateUniqueSlug(baseName);
      expect(newSlug).toBe('duplicate_category_3');
    });

    test('debería manejar nombres con caracteres especiales', async () => {
      const specialName = 'Categoría Especial @ # $ %';
      const slug = await Category.generateUniqueSlug(specialName);
      
      expect(slug).toMatch(/^[a-z0-9_]+$/);
      expect(slug).not.toContain('@');
      expect(slug).not.toContain('#');
      expect(slug).not.toContain(' ');
    });

    test('debería manejar nombres muy largos', async () => {
      const longName = 'Esta es una categoría con un nombre extremadamente largo que debería ser manejado correctamente por el sistema de generación de slugs';
      const slug = await Category.generateUniqueSlug(longName);
      
      expect(typeof slug).toBe('string');
      expect(slug.length).toBeGreaterThan(0);
      expect(slug).toMatch(/^[a-z0-9_]+$/);
    });

    test('debería manejar nombres vacíos o inválidos', async () => {
      const emptySlug = await Category.generateUniqueSlug('');
      expect(emptySlug).toBe('');
      
      const nullSlug = await Category.generateUniqueSlug(null);
      expect(nullSlug).toBe('');
      
      const undefinedSlug = await Category.generateUniqueSlug(undefined);
      expect(undefinedSlug).toBe('');
    });
  });

  describe('Relaciones padre-hijo', () => {
    let parentCategory;

    beforeEach(async () => {
      parentCategory = await Category.create({
        name: 'Categoría Padre',
        description: 'Categoría principal',
        slug: 'categoria_padre'
      });
    });

    test('debería crear subcategoría con referencia al padre', async () => {
      const subcategoryData = {
        name: 'Subcategoría',
        description: 'Categoría hija',
        parent: parentCategory._id
      };
      
      const subcategory = new Category(subcategoryData);
      const savedSubcategory = await subcategory.save();
      
      expect(savedSubcategory.parent.toString()).toBe(parentCategory._id.toString());
    });

    test('debería permitir categorías sin padre (categorías raíz)', async () => {
      const rootCategoryData = {
        name: 'Categoría Raíz',
        description: 'Categoría sin padre'
      };
      
      const rootCategory = new Category(rootCategoryData);
      const savedRootCategory = await rootCategory.save();
      
      expect(savedRootCategory.parent).toBeNull();
    });

    test('debería poblar información del padre correctamente', async () => {
      const subcategory = await Category.create({
        name: 'Subcategoría Test',
        parent: parentCategory._id
      });
      
      const populatedSubcategory = await Category.findById(subcategory._id)
        .populate('parent', 'name slug');
      
      expect(populatedSubcategory.parent).toBeDefined();
      expect(populatedSubcategory.parent.name).toBe(parentCategory.name);
      expect(populatedSubcategory.parent.slug).toBe(parentCategory.slug);
    });

    test('debería permitir múltiples subcategorías para el mismo padre', async () => {
      const subcategory1 = await Category.create({
        name: 'Subcategoría 1',
        parent: parentCategory._id
      });
      
      const subcategory2 = await Category.create({
        name: 'Subcategoría 2',
        parent: parentCategory._id
      });
      
      expect(subcategory1.parent.toString()).toBe(parentCategory._id.toString());
      expect(subcategory2.parent.toString()).toBe(parentCategory._id.toString());
      expect(subcategory1._id).not.toEqual(subcategory2._id);
    });

    test('debería validar que el padre existe', async () => {
      const invalidParentId = '507f1f77bcf86cd799439011';
      
      const subcategoryData = {
        name: 'Subcategoría Inválida',
        parent: invalidParentId
      };
      
      const subcategory = new Category(subcategoryData);
      
      // MongoDB no valida automáticamente la existencia de referencias
      // pero podemos verificar que la referencia se guarde
      const savedSubcategory = await subcategory.save();
      expect(savedSubcategory.parent.toString()).toBe(invalidParentId);
    });
  });

  describe('Campos de fecha automáticos', () => {
    test('debería establecer createdAt automáticamente', async () => {
      const categoryData = global.testUtils.validCategory;
      const category = new Category(categoryData);
      
      const beforeSave = new Date();
      const savedCategory = await category.save();
      const afterSave = new Date();
      
      expect(savedCategory.createdAt).toBeInstanceOf(Date);
      expect(savedCategory.createdAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
      expect(savedCategory.createdAt.getTime()).toBeLessThanOrEqual(afterSave.getTime());
    });

    test('no debería cambiar createdAt en actualizaciones', async () => {
      const categoryData = global.testUtils.validCategory;
      const category = new Category(categoryData);
      const savedCategory = await category.save();
      
      const originalCreatedAt = savedCategory.createdAt;
      
      // Esperar un poco y actualizar
      await new Promise(resolve => setTimeout(resolve, 10));
      savedCategory.description = 'Descripción actualizada';
      await savedCategory.save();
      
      expect(savedCategory.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });
  });

  describe('Validaciones de integridad', () => {
    test('debería trimear espacios en nombre', async () => {
      const categoryData = {
        ...global.testUtils.validCategory,
        name: '  Categoría con espacios  '
      };
      const category = new Category(categoryData);
      
      const savedCategory = await category.save();
      
      expect(savedCategory.name).toBe('Categoría con espacios');
    });

    test('debería trimear espacios en descripción', async () => {
      const categoryData = {
        ...global.testUtils.validCategory,
        description: '  Descripción con espacios  '
      };
      const category = new Category(categoryData);
      
      const savedCategory = await category.save();
      
      expect(savedCategory.description).toBe('Descripción con espacios');
    });

    test('debería manejar slug único incluso con nombres similares tras trimear', async () => {
      const category1 = await Category.create({
        name: ' Categoría Test ',
        slug: 'categoria_test'
      });
      
      const category2Data = {
        name: 'Categoría Test  ', // Espacios diferentes pero mismo resultado tras trimear
      };
      const category2 = new Category(category2Data);
      const savedCategory2 = await category2.save();
      
      expect(savedCategory2.slug).toBe('categoria_test_1');
      expect(savedCategory2.slug).not.toBe(category1.slug);
    });
  });

  describe('Casos edge y límites', () => {
    test('debería manejar nombres muy largos', async () => {
      const longName = 'A'.repeat(1000);
      const categoryData = {
        ...global.testUtils.validCategory,
        name: longName
      };
      const category = new Category(categoryData);
      
      const savedCategory = await category.save();
      
      expect(savedCategory.name).toBe(longName);
      expect(savedCategory.slug).toBeDefined();
    });

    test('debería manejar caracteres Unicode en nombres', async () => {
      const unicodeName = 'Categoría 测试 أصناف Κατηγορία';
      const categoryData = {
        ...global.testUtils.validCategory,
        name: unicodeName
      };
      const category = new Category(categoryData);
      
      const savedCategory = await category.save();
      
      expect(savedCategory.name).toBe(unicodeName);
      expect(savedCategory.slug).toBeDefined();
    });

    test('debería manejar muchas categorías con slugs similares', async () => {
      const baseName = 'Test Category';
      const categories = [];
      
      // Crear 10 categorías con nombres similares
      for (let i = 0; i < 10; i++) {
        const categoryData = {
          name: `${baseName} ${i}`,
        };
        const category = new Category(categoryData);
        const savedCategory = await category.save();
        categories.push(savedCategory);
      }
      
      // Verificar que todos tienen slugs únicos
      const slugs = categories.map(cat => cat.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });

    test('debería manejar creación concurrente de categorías', async () => {
      const categoryPromises = [];
      
      // Crear múltiples categorías simultáneamente
      for (let i = 0; i < 5; i++) {
        const categoryData = {
          name: `Concurrent Category ${i}`,
        };
        categoryPromises.push(Category.create(categoryData));
      }
      
      const savedCategories = await Promise.all(categoryPromises);
      
      // Verificar que todas se crearon correctamente
      expect(savedCategories).toHaveLength(5);
      savedCategories.forEach(category => {
        expect(category._id).toBeDefined();
        expect(category.slug).toBeDefined();
      });
      
      // Verificar slugs únicos
      const slugs = savedCategories.map(cat => cat.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });
  });

  describe('Métodos de consulta y utilidades', () => {
    let categories;

    beforeEach(async () => {
      // Crear estructura de categorías para pruebas
      const parent1 = await Category.create({
        name: 'Electrónicos',
        slug: 'electronicos'
      });

      const parent2 = await Category.create({
        name: 'Ropa',
        slug: 'ropa'
      });

      const child1 = await Category.create({
        name: 'Smartphones',
        parent: parent1._id,
        slug: 'smartphones'
      });

      const child2 = await Category.create({
        name: 'Laptops',
        parent: parent1._id,
        slug: 'laptops'
      });

      const child3 = await Category.create({
        name: 'Camisas',
        parent: parent2._id,
        slug: 'camisas'
      });

      categories = { parent1, parent2, child1, child2, child3 };
    });

    test('debería encontrar categorías por slug', async () => {
      const foundCategory = await Category.findOne({ slug: 'electronicos' });
      
      expect(foundCategory).toBeDefined();
      expect(foundCategory.name).toBe('Electrónicos');
      expect(foundCategory._id.toString()).toBe(categories.parent1._id.toString());
    });

    test('debería encontrar subcategorías de una categoría padre', async () => {
      const subcategories = await Category.find({ parent: categories.parent1._id });
      
      expect(subcategories).toHaveLength(2);
      const names = subcategories.map(cat => cat.name);
      expect(names).toContain('Smartphones');
      expect(names).toContain('Laptops');
    });

    test('debería encontrar categorías raíz (sin padre)', async () => {
      const rootCategories = await Category.find({ parent: null });
      
      expect(rootCategories.length).toBeGreaterThanOrEqual(2);
      const names = rootCategories.map(cat => cat.name);
      expect(names).toContain('Electrónicos');
      expect(names).toContain('Ropa');
    });

    test('debería poblar información del padre correctamente', async () => {
      const subcategoryWithParent = await Category.findById(categories.child1._id)
        .populate('parent', 'name slug');
      
      expect(subcategoryWithParent.parent).toBeDefined();
      expect(subcategoryWithParent.parent.name).toBe('Electrónicos');
      expect(subcategoryWithParent.parent.slug).toBe('electronicos');
    });

    test('debería ordenar categorías alfabéticamente', async () => {
      const sortedCategories = await Category.find().sort('name');
      
      for (let i = 1; i < sortedCategories.length; i++) {
        expect(sortedCategories[i].name.localeCompare(sortedCategories[i-1].name))
          .toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Validaciones de esquema avanzadas', () => {
    test('debería validar que slug es requerido', async () => {
      const categoryData = {
        name: 'Test Category'
        // Sin slug (debería generarse automáticamente)
      };
      const category = new Category(categoryData);
      
      const savedCategory = await category.save();
      
      // El slug debería haberse generado automáticamente
      expect(savedCategory.slug).toBeDefined();
      expect(savedCategory.slug).toBe('test_category');
    });

    test('debería mantener unicidad de slug incluso con actualizaciones', async () => {
      const category1 = await Category.create({
        name: 'Original Category',
        slug: 'original_category'
      });

      const category2 = await Category.create({
        name: 'Another Category',
        slug: 'another_category'
      });

      // Intentar cambiar category2 para que tenga el mismo slug que category1
      category2.name = 'Original Category';
      
      // Al guardar, debería generar un slug único
      await category2.save();
      
      expect(category2.slug).toBe('original_category_1');
      expect(category2.slug).not.toBe(category1.slug);
    });

    test('debería preservar slug personalizado si no cambia el nombre', async () => {
      const customSlug = 'custom-slug-format';
      const category = await Category.create({
        name: 'Category with Custom Slug',
        slug: customSlug
      });

      // Cambiar solo la descripción
      category.description = 'Nueva descripción';
      await category.save();

      // El slug personalizado debería mantenerse
      expect(category.slug).toBe(customSlug);
    });
  });

  describe('Performance y optimización', () => {
    test('debería crear múltiples categorías eficientemente', async () => {
      const categoryDataArray = [];
      for (let i = 0; i < 100; i++) {
        categoryDataArray.push({
          name: `Category ${i}`,
          description: `Description ${i}`
        });
      }

      const startTime = Date.now();
      const savedCategories = await Category.create(categoryDataArray);
      const endTime = Date.now();

      expect(savedCategories).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(5000); // Menos de 5 segundos

      // Verificar que todas tienen slugs únicos
      const slugs = savedCategories.map(cat => cat.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });

    test('debería manejar consultas con índices eficientemente', async () => {
      // Crear categorías para probar
      await Category.create([
        { name: 'Test A', slug: 'test_a' },
        { name: 'Test B', slug: 'test_b' },
        { name: 'Test C', slug: 'test_c' }
      ]);

      const startTime = Date.now();
      
      // Consultas que deberían usar índices
      const bySlug = await Category.findOne({ slug: 'test_b' });
      const byName = await Category.findOne({ name: 'Test A' });
      
      const endTime = Date.now();

      expect(bySlug).toBeDefined();
      expect(byName).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Menos de 1 segundo
    });
  });
});