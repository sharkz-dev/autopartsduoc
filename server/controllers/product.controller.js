const Product = require('../models/Product');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

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

    // Manejar filtros de precio - CORREGIDO
    if (req.query.minPrice || req.query.maxPrice) {
      mongoQuery.price = {};
      
      if (req.query.minPrice) {
        // Convertir a número y asegurar que sea válido
        const minPrice = parseFloat(req.query.minPrice);
        if (!isNaN(minPrice)) {
          mongoQuery.price.$gte = minPrice;
        }
      }
      
      if (req.query.maxPrice) {
        // Convertir a número y asegurar que sea válido
        const maxPrice = parseFloat(req.query.maxPrice);
        if (!isNaN(maxPrice)) {
          mongoQuery.price.$lte = maxPrice;
        }
      }
    }

    // Manejar filtro de categoría
    if (req.query.category) {
      mongoQuery.category = req.query.category;
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

    console.log('Query MongoDB:', JSON.stringify(mongoQuery, null, 2)); // Para debug

    // Crear query base con los filtros construidos
    let query = Product.find(mongoQuery)
      .populate('category', 'name')
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
    
    // Contar documentos con los mismos filtros
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
    // Convertir parámetros de query
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const sort = req.query.sort || '-discountPercentage';
    
    // Crear query para encontrar productos en oferta
    const query = {
      onSale: true,
      salePrice: { $gt: 0 }
    };
    
    // Ejecutar consulta con paginación y ordenamiento
    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('distributor', 'name companyName')
      .sort(sort)
      .skip(startIndex)
      .limit(limit);
    
    // Contar total para paginación
    const total = await Product.countDocuments(query);
    
    // Preparar información de paginación
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

// @desc    Obtener un producto por ID
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('distributor', 'name companyName');

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
    next(err);
  }
};

// @desc    Crear un nuevo producto
// @route   POST /api/products
// @access  Private (distribuidores y admin)
exports.createProduct = async (req, res, next) => {
  try {
    // Asignar el distribuidor (usuario actual)
    req.body.distributor = req.user.id;
    
    // Calcular el porcentaje de descuento si hay precio de oferta pero no porcentaje
    if (req.body.salePrice && req.body.onSale && !req.body.discountPercentage) {
      req.body.discountPercentage = Math.round(
        ((req.body.price - req.body.salePrice) / req.body.price) * 100
      );
    }

    // Crear producto
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Actualizar un producto
// @route   PUT /api/products/:id
// @access  Private (distribuidor dueño y admin)
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    // Asegurar que el usuario es el distribuidor dueño o un admin
    if (
      product.distributor.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        error: 'No está autorizado para actualizar este producto'
      });
    }

    // Calcular el porcentaje de descuento si hay precio de oferta pero no porcentaje
    if (req.body.salePrice && req.body.onSale && !req.body.discountPercentage) {
      req.body.discountPercentage = Math.round(
        ((req.body.price - req.body.salePrice) / req.body.price) * 100
      );
    }

    // Actualizar fecha
    req.body.updatedAt = Date.now();

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Eliminar un producto
// @route   DELETE /api/products/:id
// @access  Private (distribuidor dueño y admin)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    // Asegurar que el usuario es el distribuidor dueño o un admin
    if (
      product.distributor.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        error: 'No está autorizado para eliminar este producto'
      });
    }

    // Eliminar imágenes asociadas al producto
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
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Subir imágenes de producto
// @route   PUT /api/products/:id/images
// @access  Private (distribuidor dueño y admin)
exports.uploadProductImages = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    // Asegurar que el usuario es el distribuidor dueño o un admin
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
        console.error(err);
        return res.status(500).json({
          success: false,
          error: 'Problema al subir el archivo'
        });
      }

      // Actualizar el producto con la nueva imagen
      await Product.findByIdAndUpdate(
        req.params.id,
        { $push: { images: file.name } },
        { new: true }
      );

      res.status(200).json({
        success: true,
        data: file.name
      });
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener productos por distribuidor
// @route   GET /api/products/distributor/:id
// @access  Public
exports.getProductsByDistributor = async (req, res, next) => {
  try {
    const products = await Product.find({ distributor: req.params.id })
      .populate('category', 'name')
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
// @route   GET /api/products/my-products
// @access  Private (distribuidor)
exports.getMyProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ distributor: req.user.id })
      .populate('category', 'name');

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Añadir una valoración a un producto
// @route   POST /api/products/:id/ratings
// @access  Private (clientes)
exports.addProductRating = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    // Verificar si el usuario ya hizo una valoración
    const alreadyRated = product.ratings.find(
      r => r.user.toString() === req.user.id
    );

    if (alreadyRated) {
      // Actualizar valoración existente
      product.ratings.forEach(rating => {
        if (rating.user.toString() === req.user.id) {
          rating.rating = Number(rating);
          rating.comment = comment;
          rating.date = Date.now();
        }
      });
    } else {
      // Añadir nueva valoración
      product.ratings.push({
        user: req.user.id,
        rating: Number(rating),
        comment,
        date: Date.now()
      });
    }

    // Calcular rating promedio
    product.calculateAvgRating();

    await product.save();

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (err) {
    next(err);
  }
};