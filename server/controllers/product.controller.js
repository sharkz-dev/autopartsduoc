const Product = require('../models/Product');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// ✅ FUNCIÓN HELPER CORREGIDA - con populate
const findProductBySlugOrId = async (identifier, populate = true) => {
  let product = null;
  
  try {
    // Primero intentar por slug
    if (populate) {
      product = await Product.findOne({ slug: identifier })
        .populate('category', 'name slug');
    } else {
      product = await Product.findOne({ slug: identifier });
    }
    
    // Si no se encuentra por slug, intentar por ID (para compatibilidad)
    if (!product) {
      // Verificar si el identifier parece ser un ObjectId válido
      if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
        if (populate) {
          product = await Product.findById(identifier)
            .populate('category', 'name slug');
        } else {
          product = await Product.findById(identifier);
        }
      }
    }
  } catch (error) {
    console.error('Error en findProductBySlugOrId:', error);
    return null;
  }
  
  return product;
};

// Función helper para generar slug único
const generateUniqueSlug = async (name, productId = null) => {
  let baseSlug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Eliminar caracteres especiales
    .replace(/\s+/g, '_')     // Reemplazar espacios con _
    .trim();

  let slug = baseSlug;
  let counter = 1;

  // Verificar si el slug ya existe (excluyendo el producto actual si es una actualización)
  while (true) {
    const query = { slug };
    if (productId) {
      query._id = { $ne: productId };
    }
    
    const existingProduct = await Product.findOne(query);
    if (!existingProduct) break;
    
    slug = `${baseSlug}_${counter}`;
    counter++;
  }

  return slug;
};

// @desc    Obtener todos los productos
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    console.log('📊 Parámetros de consulta recibidos:', req.query);
    
    // Construir objeto de consulta MongoDB
    let mongoQuery = {};

    // Manejar búsqueda por texto
    if (req.query.search) {
      console.log('🔍 Aplicando filtro de búsqueda:', req.query.search);
      mongoQuery.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { brand: { $regex: req.query.search, $options: 'i' } },
        { sku: { $regex: req.query.search, $options: 'i' } },
        { partNumber: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Manejar filtros de precio
    if (req.query.minPrice || req.query.maxPrice) {
      mongoQuery.price = {};
      
      if (req.query.minPrice) {
        const minPrice = parseFloat(req.query.minPrice);
        if (!isNaN(minPrice)) {
          mongoQuery.price.$gte = minPrice;
          console.log('💰 Aplicando precio mínimo:', minPrice);
        }
      }
      
      if (req.query.maxPrice) {
        const maxPrice = parseFloat(req.query.maxPrice);
        if (!isNaN(maxPrice)) {
          mongoQuery.price.$lte = maxPrice;
          console.log('💰 Aplicando precio máximo:', maxPrice);
        }
      }
    }

    // ✅ CORREGIDO: Manejar filtros múltiples de categorías
    if (req.query.categories) {
      console.log('📂 Procesando filtro de categorías:', req.query.categories);
      
      const categoryFilters = req.query.categories.split(',').map(cat => cat.trim()).filter(cat => cat);
      console.log('📂 Categorías separadas:', categoryFilters);
      
      if (categoryFilters.length > 0) {
        // Buscar categorías por slug
        const Category = require('../models/Category');
        const foundCategories = await Category.find({ 
          slug: { $in: categoryFilters } 
        }).select('_id slug name');
        
        console.log('📂 Categorías encontradas:', foundCategories.map(c => ({ id: c._id, slug: c.slug, name: c.name })));
        
        if (foundCategories.length > 0) {
          const categoryIds = foundCategories.map(cat => cat._id);
          mongoQuery.category = { $in: categoryIds };
          console.log('📂 IDs de categorías aplicados al filtro:', categoryIds);
        } else {
          console.log('⚠️ No se encontraron categorías válidas para los slugs proporcionados');
          // Si no se encuentran categorías válidas, devolver array vacío
          return res.status(200).json({
            success: true,
            count: 0,
            pagination: {},
            total: 0,
            data: []
          });
        }
      }
    }

    // ✅ NUEVO: Manejar filtros múltiples de marcas
    if (req.query.brands) {
      console.log('🏷️ Procesando filtro de marcas:', req.query.brands);
      
      const brandFilters = req.query.brands.split(',').map(brand => brand.trim()).filter(brand => brand);
      console.log('🏷️ Marcas separadas:', brandFilters);
      
      if (brandFilters.length > 0) {
        // Crear expresión regular para búsqueda case-insensitive
        const brandRegexes = brandFilters.map(brand => new RegExp(`^${brand}$`, 'i'));
        mongoQuery.brand = { $in: brandRegexes };
        console.log('🏷️ Filtros de marca aplicados:', brandFilters);
      }
    }

    // Manejar filtro de marca individual (para compatibilidad)
    if (req.query.brand && !req.query.brands) {
      console.log('🏷️ Aplicando filtro de marca individual:', req.query.brand);
      mongoQuery.brand = new RegExp(`^${req.query.brand}$`, 'i');
    }

    // Manejar filtro de productos en oferta
    if (req.query.onSale === 'true') {
      console.log('🔥 Aplicando filtro de productos en oferta');
      mongoQuery.onSale = true;
      mongoQuery.discountPercentage = { $gt: 0 };
    }

    // Manejar filtro de productos destacados
    if (req.query.featured === 'true') {
      console.log('⭐ Aplicando filtro de productos destacados');
      mongoQuery.featured = true;
    }

    // Manejar filtro de stock disponible
    if (req.query.inStock === 'true') {
      console.log('📦 Aplicando filtro de productos en stock');
      mongoQuery.stockQuantity = { $gt: 0 };
    }

    console.log('🔍 Query MongoDB final:', JSON.stringify(mongoQuery, null, 2));

    // Crear query base con los filtros construidos
    let query = Product.find(mongoQuery)
      .populate('category', 'name slug');

    // ✅ MEJORADO: Ordenamiento más robusto
    let sortOption = '-createdAt'; // Por defecto más recientes primero
    
    if (req.query.sort) {
      const validSortOptions = [
        'createdAt', '-createdAt',
        'price', '-price', 
        'name', '-name',
        'avgRating', '-avgRating',
        'stockQuantity', '-stockQuantity',
        'discountPercentage', '-discountPercentage'
      ];
      
      if (validSortOptions.includes(req.query.sort)) {
        sortOption = req.query.sort;
      }
    }
    
    console.log('📊 Aplicando ordenamiento:', sortOption);
    query = query.sort(sortOption);

    // ✅ MEJORADO: Paginación con límites más seguros
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12)); // Límite entre 1 y 50
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    console.log('📄 Paginación:', { page, limit, startIndex });
    
    // Contar total de documentos que coinciden con la consulta
    const total = await Product.countDocuments(mongoQuery);
    console.log('📊 Total de productos encontrados:', total);

    // Aplicar paginación
    query = query.skip(startIndex).limit(limit);

    // Ejecutar query
    const products = await query;
    console.log('✅ Productos devueltos:', products.length);

    // Resultado de paginación
    const pagination = {};
    const totalPages = Math.ceil(total / limit);

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    // ✅ NUEVO: Agregar información adicional útil
    const responseData = {
      success: true,
      count: products.length,
      pagination,
      total,
      totalPages,
      currentPage: page,
      limit,
      data: products,
      // Información de filtros aplicados para depuración
      appliedFilters: {
        search: req.query.search || null,
        categories: req.query.categories ? req.query.categories.split(',') : [],
        brands: req.query.brands ? req.query.brands.split(',') : [],
        priceRange: {
          min: req.query.minPrice || null,
          max: req.query.maxPrice || null
        },
        features: {
          onSale: req.query.onSale === 'true',
          featured: req.query.featured === 'true',
          inStock: req.query.inStock === 'true'
        },
        sort: sortOption
      }
    };

    res.status(200).json(responseData);
  } catch (err) {
    console.error('💥 Error en getProducts:', err);
    next(err);
  }
};

// @desc    Obtener productos en oferta
// @route   GET /api/products/on-sale
// @access  Public
exports.getProductsOnSale = async (req, res, next) => {
  try {
    console.log('🔥 Obteniendo productos en oferta...');
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const sort = req.query.sort || '-discountPercentage';
    
    const query = {
      onSale: true,
      discountPercentage: { $gt: 0 },
      stockQuantity: { $gt: 0 } // Solo productos en stock
    };
    
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(startIndex)
      .limit(limit);
    
    const total = await Product.countDocuments(query);
    
    const pagination = {};
    if (startIndex + limit < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }
    
    console.log(`✅ Productos en oferta encontrados: ${products.length}/${total}`);
    
    res.status(200).json({
      success: true,
      count: products.length,
      pagination,
      total,
      data: products
    });
  } catch (err) {
    console.error('💥 Error en getProductsOnSale:', err);
    next(err);
  }
};

// ✅ NUEVO: Obtener marcas únicas disponibles
// @desc    Obtener todas las marcas únicas
// @route   GET /api/products/brands
// @access  Public
exports.getBrands = async (req, res, next) => {
  try {
    console.log('🏷️ Obteniendo marcas únicas...');
    
    const brands = await Product.distinct('brand', { 
      brand: { $exists: true, $ne: '', $ne: null } 
    });
    
    // Ordenar alfabéticamente
    const sortedBrands = brands.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    
    console.log(`✅ Marcas encontradas: ${sortedBrands.length}`);
    
    res.status(200).json({
      success: true,
      count: sortedBrands.length,
      data: sortedBrands
    });
  } catch (err) {
    console.error('💥 Error en getBrands:', err);
    next(err);
  }
};

// ✅ CORREGIDO: Obtener un producto por slug o ID
// @desc    Obtener un producto por slug o ID
// @route   GET /api/products/:slug
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    console.log(`🔍 Buscando producto con identificador: ${req.params.slug}`);
    
    const product = await findProductBySlugOrId(req.params.slug, true);

    if (!product) {
      console.log(`❌ Producto no encontrado: ${req.params.slug}`);
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    console.log(`✅ Producto encontrado: ${product.name} (ID: ${product._id})`);
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (err) {
    console.error('💥 Error en getProduct:', err);
    next(err);
  }
};

// @desc    Crear un nuevo producto
// @route   POST /api/products
// @access  Private (distribuidores y admin)
exports.createProduct = async (req, res, next) => {
  try {
    console.log('➕ Creando nuevo producto:', req.body.name);
    
    // Generar slug único
    req.body.slug = await generateUniqueSlug(req.body.name);
    
    // Calcular el porcentaje de descuento si hay precio de oferta pero no porcentaje
    if (req.body.salePrice && req.body.onSale && !req.body.discountPercentage) {
      req.body.discountPercentage = Math.round(
        ((req.body.price - req.body.salePrice) / req.body.price) * 100
      );
    }

    const product = await Product.create(req.body);
    console.log(`✅ Producto creado: ${product.name} (${product.slug})`);

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (err) {
    console.error('💥 Error al crear producto:', err);
    next(err);
  }
};

// ✅ CORREGIDO: Actualizar un producto
// @desc    Actualizar un producto
// @route   PUT /api/products/:slug
// @access  Private (distribuidor dueño y admin)
exports.updateProduct = async (req, res, next) => {
  try {
    console.log(`🔄 Actualizando producto con identificador: ${req.params.slug}`);
    
    let product = await findProductBySlugOrId(req.params.slug, false); // Sin populate para actualización

    if (!product) {
      console.log(`❌ Producto no encontrado para actualizar: ${req.params.slug}`);
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    console.log(`📝 Producto encontrado para actualizar: ${product.name} (ID: ${product._id})`);

    // Si se cambia el nombre, generar nuevo slug
    if (req.body.name && req.body.name !== product.name) {
      req.body.slug = await generateUniqueSlug(req.body.name, product._id);
      console.log(`🔗 Nuevo slug generado: ${req.body.slug}`);
    }

    // Calcular el porcentaje de descuento si hay precio de oferta pero no porcentaje
    if (req.body.salePrice && req.body.onSale && !req.body.discountPercentage) {
      req.body.discountPercentage = Math.round(
        ((req.body.price - req.body.salePrice) / req.body.price) * 100
      );
    }

    req.body.updatedAt = Date.now();

    // Actualizar usando el ID del producto encontrado
    product = await Product.findByIdAndUpdate(
      product._id, 
      req.body, 
      {
        new: true,
        runValidators: true
      }
    ).populate('category', 'name slug');

    console.log(`✅ Producto actualizado exitosamente: ${product.name}`);

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (err) {
    console.error('💥 Error al actualizar producto:', err);
    next(err);
  }
};

// ✅ CORREGIDO: Eliminar un producto
// @desc    Eliminar un producto
// @route   DELETE /api/products/:slug
// @access  Private (distribuidor dueño y admin)
exports.deleteProduct = async (req, res, next) => {
  try {
    console.log(`🗑️ Eliminando producto con identificador: ${req.params.slug}`);
    
    const product = await findProductBySlugOrId(req.params.slug, false);

    if (!product) {
      console.log(`❌ Producto no encontrado para eliminar: ${req.params.slug}`);
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    console.log(`🔍 Producto encontrado para eliminar: ${product.name} (ID: ${product._id})`);

    // ✅ CORRECCIÓN: Eliminar verificación de distributor ya que no existe en el modelo
    // Solo verificar que sea admin (ya se verifica en las rutas con middleware authorize('admin'))
    console.log(`👨‍💼 Usuario admin autorizado para eliminar producto`);

    // Eliminar imágenes asociadas
    if (product.images && product.images.length > 0) {
      product.images.forEach(image => {
        const imagePath = path.join(__dirname, '../uploads', image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(`🖼️ Imagen eliminada: ${image}`);
        }
      });
    }

    // ✅ MÉTODO CORRECTO: Usar deleteOne() en lugar de remove()
    await product.deleteOne();
    console.log(`✅ Producto eliminado exitosamente`);

    res.status(200).json({
      success: true,
      data: {},
      message: 'Producto eliminado correctamente'
    });
  } catch (err) {
    console.error('💥 Error al eliminar producto:', err);
    next(err);
  }
};


// ✅ CORREGIDO: Subir imágenes de producto
// @desc    Subir imágenes de producto
// @route   PUT /api/products/:slug/images
// @access  Private (distribuidor dueño y admin)
exports.uploadProductImages = async (req, res, next) => {
  try {
    console.log(`📸 Subiendo imagen para producto: ${req.params.slug}`);
    
    const product = await findProductBySlugOrId(req.params.slug, false);

    if (!product) {
      console.log(`❌ Producto no encontrado para subir imagen: ${req.params.slug}`);
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }
    
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        error: 'Por favor suba un archivo'
      });
    }

    const file = req.files.file;

    // Verificar que es una imagen
    if (!file.mimetype.startsWith('image')) {
      return res.status(400).json({
        success: false,
        error: 'Por favor suba una imagen'
      });
    }

    // Verificar tamaño del archivo
    if (file.size > process.env.MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        error: `Por favor suba una imagen de menos de ${process.env.MAX_FILE_SIZE / 1000000} MB`
      });
    }

    // Crear nombre de archivo personalizado
    file.name = `product_${product._id}_${Date.now()}${path.parse(file.name).ext}`;

    // Mover archivo
    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
      if (err) {
        console.error('Error al mover archivo:', err);
        return res.status(500).json({
          success: false,
          error: 'Problema al subir el archivo'
        });
      }

      // Actualizar el producto con la nueva imagen usando el ID
      await Product.findByIdAndUpdate(
        product._id,
        { $push: { images: file.name } },
        { new: true }
      );

      console.log(`✅ Imagen subida exitosamente: ${file.name}`);

      res.status(200).json({
        success: true,
        data: file.name
      });
    });
  } catch (err) {
    console.error('💥 Error al subir imagen:', err);
    next(err);
  }
};

// @desc    Obtener productos por distribuidor
// @route   GET /api/products/distributor/:id
// @access  Public
exports.getProductsByDistributor = async (req, res, next) => {
  try {
    const products = await Product.find({ distributor: req.params.id })
      .populate('category', 'name slug');

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener productos del distribuidor actual
// @route   GET /api/products/my/products
// @access  Private (distribuidor)
exports.getMyProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ distributor: req.user.id })
      .populate('category', 'name slug');

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (err) {
    next(err);
  }
};

// ✅ CORREGIDO: Obtener valoraciones de un producto
// @desc    Obtener valoraciones de un producto
// @route   GET /api/products/:slug/ratings
// @access  Public
exports.getProductRatings = async (req, res, next) => {
  try {
    const product = await findProductBySlugOrId(req.params.slug, false);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    // Obtener las valoraciones con información de usuario
    const ratings = await Promise.all(
      product.ratings.map(async (rating) => {
        let userName = 'Usuario';
        if (rating.user) {
          try {
            const user = await User.findById(rating.user).select('name');
            if (user) {
              userName = user.name;
            }
          } catch (err) {
            console.error('Error al obtener usuario para la valoración:', err);
          }
        }

        return {
          _id: rating._id,
          rating: rating.rating,
          comment: rating.comment,
          userName: rating.userName || userName,
          createdAt: rating.date
        };
      })
    );

    res.status(200).json({
      success: true,
      data: ratings
    });
  } catch (err) {
    next(err);
  }
};

// ✅ CORREGIDO: Añadir una valoración a un producto
// @desc    Añadir una valoración a un producto
// @route   POST /api/products/:slug/ratings
// @access  Private (clientes)
exports.addProductRating = async (req, res, next) => {
  try {
    const { rating, comment, userName } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'La valoración debe estar entre 1 y 5'
      });
    }

    const product = await findProductBySlugOrId(req.params.slug, false);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    // Verificar si el usuario ya hizo una valoración
    const alreadyRated = product.ratings.find(
      r => r.user && r.user.toString() === req.user.id
    );

    if (alreadyRated) {
      // Actualizar valoración existente
      product.ratings.forEach(r => {
        if (r.user && r.user.toString() === req.user.id) {
          r.rating = Number(rating);
          r.comment = comment;
          r.userName = userName;
          r.date = Date.now();
        }
      });
    } else {
      // Añadir nueva valoración
      product.ratings.push({
        user: req.user.id,
        rating: Number(rating),
        comment,
        userName,
        date: Date.now()
      });
    }

    // Calcular rating promedio
    product.calculateAvgRating();

    await product.save();

    res.status(200).json({
      success: true,
      data: product.ratings
    });
  } catch (err) {
    next(err);
  }
};