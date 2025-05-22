// server/controllers/product.controller.js - VERSIÓN CORREGIDA CON POPULATE
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
        .populate('category', 'name slug')
        .populate('distributor', 'name companyName');
    } else {
      product = await Product.findOne({ slug: identifier });
    }
    
    // Si no se encuentra por slug, intentar por ID (para compatibilidad)
    if (!product) {
      // Verificar si el identifier parece ser un ObjectId válido
      if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
        if (populate) {
          product = await Product.findById(identifier)
            .populate('category', 'name slug')
            .populate('distributor', 'name companyName');
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
    // Construir objeto de consulta MongoDB
    let mongoQuery = {};

    // Manejar búsqueda por texto
    if (req.query.search) {
      mongoQuery.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { brand: { $regex: req.query.search, $options: 'i' } }
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

    // Manejar filtro de categoría (por slug)
    if (req.query.category) {
      // Buscar categoría por slug
      const Category = require('../models/Category');
      const category = await Category.findOne({ slug: req.query.category });
      if (category) {
        mongoQuery.category = category._id;
      }
    }

    // Manejar filtro de marca
    if (req.query.brand) {
      mongoQuery.brand = req.query.brand;
    }

    // Manejar filtro de productos en oferta
    if (req.query.onSale === 'true') {
      mongoQuery.onSale = true;
    }

    // Manejar filtro de productos destacados
    if (req.query.featured === 'true') {
      mongoQuery.featured = true;
    }

    console.log('Query MongoDB:', JSON.stringify(mongoQuery, null, 2));

    // Crear query base con los filtros construidos
    let query = Product.find(mongoQuery)
      .populate('category', 'name slug')
      .populate('distributor', 'name companyName');

    // Ordenar
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Paginación
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const total = await Product.countDocuments(mongoQuery);

    query = query.skip(startIndex).limit(limit);

    // Ejecutar query
    const products = await query;

    // Resultado de paginación
    const pagination = {};

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

    res.status(200).json({
      success: true,
      count: products.length,
      pagination,
      total,
      data: products
    });
  } catch (err) {
    console.error('Error en getProducts:', err);
    next(err);
  }
};

// @desc    Obtener productos en oferta
// @route   GET /api/products/on-sale
// @access  Public
exports.getProductsOnSale = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const sort = req.query.sort || '-discountPercentage';
    
    const query = {
      onSale: true,
      salePrice: { $gt: 0 }
    };
    
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .populate('distributor', 'name companyName')
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
    // Asignar el distribuidor
    if (req.user.role === 'admin') {
      if (!req.body.distributor) {
        return res.status(400).json({
          success: false,
          error: 'Debe seleccionar un distribuidor'
        });
      }
    } else {
      req.body.distributor = req.user.id;
    }
    
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

    // Verificar permisos
    if (
      product.distributor.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        error: 'No está autorizado para actualizar este producto'
      });
    }

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
    ).populate('category', 'name slug')
     .populate('distributor', 'name companyName');

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

    // Verificar permisos
    if (
      product.distributor.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        error: 'No está autorizado para eliminar este producto'
      });
    }

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

    await product.deleteOne();
    console.log(`✅ Producto eliminado exitosamente`);

    res.status(200).json({
      success: true,
      data: {}
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

    // Verificar permisos
    if (
      product.distributor.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        error: 'No está autorizado para actualizar este producto'
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
      .populate('category', 'name slug')
      .populate('distributor', 'name companyName');

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