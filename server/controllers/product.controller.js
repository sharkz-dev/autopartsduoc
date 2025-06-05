const Product = require('../models/Product');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// Función helper para buscar producto por slug o ID
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
    
    // Si no se encuentra por slug, intentar por ID
    if (!product) {
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
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .trim();

  let slug = baseSlug;
  let counter = 1;

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

// ✅ BÚSQUEDA MEJORADA - Obtener todos los productos con búsqueda avanzada
exports.getProducts = async (req, res, next) => {
  try {
    // Construir objeto de consulta MongoDB
    let mongoQuery = {};

    // ✅ BÚSQUEDA MEJORADA POR TEXTO - Incluye modelos compatibles
    if (req.query.search) {
      const searchTerm = req.query.search.trim();
      
      mongoQuery.$or = [
        // Búsqueda en campos básicos
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { brand: { $regex: searchTerm, $options: 'i' } },
        { sku: { $regex: searchTerm, $options: 'i' } },
        { partNumber: { $regex: searchTerm, $options: 'i' } },
        
        // ✅ NUEVO: Búsqueda en modelos compatibles
        { 'compatibleModels.make': { $regex: searchTerm, $options: 'i' } },
        { 'compatibleModels.model': { $regex: searchTerm, $options: 'i' } },
        
        // ✅ NUEVO: Búsqueda por año (si es un número)
        ...(isNaN(searchTerm) ? [] : [
          { 'compatibleModels.year': parseInt(searchTerm) }
        ])
      ];
    }

    // Manejar filtros de precio
    if (req.query.minPrice || req.query.maxPrice) {
      mongoQuery.price = {};
      
      if (req.query.minPrice) {
        const minPrice = parseFloat(req.query.minPrice);
        if (!isNaN(minPrice)) {
          mongoQuery.price.$gte = minPrice;
        }
      }
      
      if (req.query.maxPrice) {
        const maxPrice = parseFloat(req.query.maxPrice);
        if (!isNaN(maxPrice)) {
          mongoQuery.price.$lte = maxPrice;
        }
      }
    }

    // Manejar filtros múltiples de categorías
    if (req.query.categories) {
      const categoryFilters = req.query.categories.split(',').map(cat => cat.trim()).filter(cat => cat);
      
      if (categoryFilters.length > 0) {
        const Category = require('../models/Category');
        const foundCategories = await Category.find({ 
          slug: { $in: categoryFilters } 
        }).select('_id slug name');
        
        if (foundCategories.length > 0) {
          const categoryIds = foundCategories.map(cat => cat._id);
          mongoQuery.category = { $in: categoryIds };
        } else {
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

    // Manejar filtros múltiples de marcas
    if (req.query.brands) {
      const brandFilters = req.query.brands.split(',').map(brand => brand.trim()).filter(brand => brand);
      
      if (brandFilters.length > 0) {
        const brandRegexes = brandFilters.map(brand => new RegExp(`^${brand}$`, 'i'));
        mongoQuery.brand = { $in: brandRegexes };
      }
    }

    // Manejar filtro de marca individual
    if (req.query.brand && !req.query.brands) {
      mongoQuery.brand = new RegExp(`^${req.query.brand}$`, 'i');
    }

    // ✅ NUEVO: Filtro por modelo compatible específico
    if (req.query.vehicleMake) {
      mongoQuery['compatibleModels.make'] = { $regex: req.query.vehicleMake, $options: 'i' };
    }

    if (req.query.vehicleModel) {
      mongoQuery['compatibleModels.model'] = { $regex: req.query.vehicleModel, $options: 'i' };
    }

    if (req.query.vehicleYear) {
      const year = parseInt(req.query.vehicleYear);
      if (!isNaN(year)) {
        mongoQuery['compatibleModels.year'] = year;
      }
    }

    // Manejar filtro de productos en oferta
    if (req.query.onSale === 'true') {
      mongoQuery.onSale = true;
      mongoQuery.discountPercentage = { $gt: 0 };
    }

    // Manejar filtro de productos destacados
    if (req.query.featured === 'true') {
      mongoQuery.featured = true;
    }

    // Manejar filtro de stock disponible
    if (req.query.inStock === 'true') {
      mongoQuery.stockQuantity = { $gt: 0 };
    }

    // Crear query base con los filtros construidos
    let query = Product.find(mongoQuery)
      .populate('category', 'name slug');

    // Ordenamiento
    let sortOption = '-createdAt';
    
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
    
    query = query.sort(sortOption);

    // Paginación
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    // Contar total de documentos
    const total = await Product.countDocuments(mongoQuery);

    // Aplicar paginación
    query = query.skip(startIndex).limit(limit);

    // Ejecutar query
    const products = await query;

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

    const responseData = {
      success: true,
      count: products.length,
      pagination,
      total,
      totalPages,
      currentPage: page,
      limit,
      data: products,
      appliedFilters: {
        search: req.query.search || null,
        categories: req.query.categories ? req.query.categories.split(',') : [],
        brands: req.query.brands ? req.query.brands.split(',') : [],
        vehicleFilters: {
          make: req.query.vehicleMake || null,
          model: req.query.vehicleModel || null,
          year: req.query.vehicleYear || null
        },
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
    console.error('Error en getProducts:', err);
    next(err);
  }
};

// Obtener productos en oferta
exports.getProductsOnSale = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const sort = req.query.sort || '-discountPercentage';
    
    const query = {
      onSale: true,
      discountPercentage: { $gt: 0 },
      stockQuantity: { $gt: 0 }
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
    
    res.status(200).json({
      success: true,
      count: products.length,
      pagination,
      total,
      data: products
    });
  } catch (err) {
    console.error('Error en getProductsOnSale:', err);
    next(err);
  }
};

// Obtener marcas únicas disponibles
exports.getBrands = async (req, res, next) => {
  try {
    const brands = await Product.distinct('brand', { 
      brand: { $exists: true, $ne: '', $ne: null } 
    });
    
    const sortedBrands = brands.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    
    res.status(200).json({
      success: true,
      count: sortedBrands.length,
      data: sortedBrands
    });
  } catch (err) {
    console.error('Error en getBrands:', err);
    next(err);
  }
};

// ✅ NUEVO: Obtener modelos compatibles únicos disponibles
exports.getCompatibleModels = async (req, res, next) => {
  try {
    // Usar agregación para obtener modelos únicos
    const models = await Product.aggregate([
      { $unwind: '$compatibleModels' },
      {
        $group: {
          _id: {
            make: '$compatibleModels.make',
            model: '$compatibleModels.model',
            year: '$compatibleModels.year'
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          make: '$_id.make',
          model: '$_id.model',
          year: '$_id.year',
          count: 1
        }
      },
      { $sort: { make: 1, model: 1, year: -1 } }
    ]);

    // Agrupar por marca para mejor organización
    const groupedModels = models.reduce((acc, item) => {
      if (!acc[item.make]) {
        acc[item.make] = [];
      }
      acc[item.make].push({
        model: item.model,
        year: item.year,
        count: item.count
      });
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      count: models.length,
      data: {
        models: models,
        groupedByMake: groupedModels
      }
    });
  } catch (err) {
    console.error('Error en getCompatibleModels:', err);
    next(err);
  }
};

// ✅ NUEVO: Búsqueda de sugerencias para autocompletado
exports.getSearchSuggestions = async (req, res, next) => {
  try {
    const { q: query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const searchRegex = { $regex: query, $options: 'i' };
    
    // Búsqueda en paralelo de diferentes tipos de sugerencias
    const [productNames, brands, compatibleMakes, compatibleModels] = await Promise.all([
      // Nombres de productos
      Product.find({ name: searchRegex })
        .select('name')
        .limit(5),
      
      // Marcas
      Product.distinct('brand', { brand: searchRegex }),
      
      // Marcas de vehículos compatibles
      Product.aggregate([
        { $unwind: '$compatibleModels' },
        { $match: { 'compatibleModels.make': searchRegex } },
        { $group: { _id: '$compatibleModels.make' } },
        { $limit: 5 }
      ]),
      
      // Modelos de vehículos compatibles
      Product.aggregate([
        { $unwind: '$compatibleModels' },
        { $match: { 'compatibleModels.model': searchRegex } },
        { $group: { _id: '$compatibleModels.model' } },
        { $limit: 5 }
      ])
    ]);

    const suggestions = [
      ...productNames.map(p => ({ type: 'product', value: p.name })),
      ...brands.slice(0, 3).map(b => ({ type: 'brand', value: b })),
      ...compatibleMakes.map(m => ({ type: 'vehicle_make', value: m._id })),
      ...compatibleModels.map(m => ({ type: 'vehicle_model', value: m._id }))
    ];

    res.status(200).json({
      success: true,
      data: suggestions.slice(0, 10) // Limitar a 10 sugerencias
    });
  } catch (err) {
    console.error('Error en getSearchSuggestions:', err);
    next(err);
  }
};

// Obtener un producto por slug o ID
exports.getProduct = async (req, res, next) => {
  try {
    const product = await findProductBySlugOrId(req.params.slug, true);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (err) {
    console.error('Error en getProduct:', err);
    next(err);
  }
};

// Crear un nuevo producto
exports.createProduct = async (req, res, next) => {
  try {
    // Generar slug único
    req.body.slug = await generateUniqueSlug(req.body.name);
    
    // Calcular el porcentaje de descuento si hay precio de oferta pero no porcentaje
    if (req.body.salePrice && req.body.onSale && !req.body.discountPercentage) {
      req.body.discountPercentage = Math.round(
        ((req.body.price - req.body.salePrice) / req.body.price) * 100
      );
    }

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (err) {
    console.error('Error al crear producto:', err);
    next(err);
  }
};

// Actualizar un producto
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await findProductBySlugOrId(req.params.slug, false);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    // Si se cambia el nombre, generar nuevo slug
    if (req.body.name && req.body.name !== product.name) {
      req.body.slug = await generateUniqueSlug(req.body.name, product._id);
    }

    // Calcular el porcentaje de descuento si hay precio de oferta pero no porcentaje
    if (req.body.salePrice && req.body.onSale && !req.body.discountPercentage) {
      req.body.discountPercentage = Math.round(
        ((req.body.price - req.body.salePrice) / req.body.price) * 100
      );
    }

    req.body.updatedAt = Date.now();

    product = await Product.findByIdAndUpdate(
      product._id, 
      req.body, 
      {
        new: true,
        runValidators: true
      }
    ).populate('category', 'name slug');

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (err) {
    console.error('Error al actualizar producto:', err);
    next(err);
  }
};

// Eliminar un producto
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await findProductBySlugOrId(req.params.slug, false);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    // Eliminar imágenes asociadas
    if (product.images && product.images.length > 0) {
      product.images.forEach(image => {
        const imagePath = path.join(__dirname, '../uploads', image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
      message: 'Producto eliminado correctamente'
    });
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    next(err);
  }
};

// Subir imágenes de producto
exports.uploadProductImages = async (req, res, next) => {
  try {
    const product = await findProductBySlugOrId(req.params.slug, false);

    if (!product) {
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

      // Actualizar el producto con la nueva imagen
      await Product.findByIdAndUpdate(
        product._id,
        { $push: { images: file.name } },
        { new: true }
      );

      res.status(200).json({
        success: true,
        data: file.name
      });
    });
  } catch (err) {
    console.error('Error al subir imagen:', err);
    next(err);
  }
};

// Obtener productos por distribuidor
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

// Obtener productos del distribuidor actual
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

// Obtener valoraciones de un producto
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

// Añadir una valoración a un producto
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

module.exports = exports;