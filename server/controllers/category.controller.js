const Category = require('../models/Category');
const path = require('path');
const fs = require('fs');

// Función helper para generar slug único
const generateUniqueSlug = async (name, categoryId = null) => {
  let baseSlug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Eliminar caracteres especiales
    .replace(/\s+/g, '_')     // Reemplazar espacios con _
    .trim();

  let slug = baseSlug;
  let counter = 1;

  // Verificar si el slug ya existe (excluyendo la categoría actual si es una actualización)
  while (true) {
    const query = { slug };
    if (categoryId) {
      query._id = { $ne: categoryId };
    }
    
    const existingCategory = await Category.findOne(query);
    if (!existingCategory) break;
    
    slug = `${baseSlug}_${counter}`;
    counter++;
  }

  return slug;
};

// @desc    Obtener todas las categorías
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort('name').populate('parent', 'name slug');

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener una categoría por slug
// @route   GET /api/categories/:slug
// @access  Public
exports.getCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug }).populate('parent', 'name slug');

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Crear una nueva categoría
// @route   POST /api/categories
// @access  Private (admin)
exports.createCategory = async (req, res, next) => {
  try {
    // Generar slug único
    req.body.slug = await generateUniqueSlug(req.body.name);
    
    const category = await Category.create(req.body);

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (err) {
    // Manejar error de nombre duplicado
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe una categoría con ese nombre'
      });
    }
    next(err);
  }
};

// @desc    Actualizar una categoría
// @route   PUT /api/categories/:slug
// @access  Private (admin)
exports.updateCategory = async (req, res, next) => {
  try {
    let category = await Category.findOne({ slug: req.params.slug });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }

    // Si se cambia el nombre, generar nuevo slug
    if (req.body.name && req.body.name !== category.name) {
      req.body.slug = await generateUniqueSlug(req.body.name, category._id);
    }

    category = await Category.findOneAndUpdate(
      { slug: req.params.slug }, 
      req.body, 
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (err) {
    // Manejar error de nombre duplicado
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe una categoría con ese nombre'
      });
    }
    next(err);
  }
};

// @desc    Eliminar una categoría
// @route   DELETE /api/categories/:slug
// @access  Private (admin)
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }

    // Verificar si la categoría tiene productos asociados
    const Product = require('../models/Product');
    const products = await Product.countDocuments({ category: category._id });

    if (products > 0) {
      return res.status(400).json({
        success: false,
        error: `No se puede eliminar la categoría porque tiene ${products} productos asociados`
      });
    }

    // Verificar si la categoría tiene subcategorías
    const subcategories = await Category.countDocuments({ parent: category._id });

    if (subcategories > 0) {
      return res.status(400).json({
        success: false,
        error: `No se puede eliminar la categoría porque tiene ${subcategories} subcategorías`
      });
    }

    // Eliminar la imagen asociada (si existe)
    if (category.image) {
      const imagePath = path.join(__dirname, '../uploads', category.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Subir imagen de categoría
// @route   PUT /api/categories/:slug/image
// @access  Private (admin)
exports.uploadCategoryImage = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }

    if (!req.files) {
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
    file.name = `category_${category._id}_${Date.now()}${path.parse(file.name).ext}`;

    // Eliminar imagen anterior si existe
    if (category.image) {
      const imagePath = path.join(__dirname, '../uploads', category.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Mover archivo
    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          success: false,
          error: 'Problema al subir el archivo'
        });
      }

      // Actualizar categoría con nueva imagen
      await Category.findOneAndUpdate(
        { slug: req.params.slug },
        { image: file.name },
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

// @desc    Obtener subcategorías
// @route   GET /api/categories/:slug/subcategories
// @access  Public
exports.getSubcategories = async (req, res, next) => {
  try {
    // Buscar la categoría padre por slug
    const parentCategory = await Category.findOne({ slug: req.params.slug });
    
    if (!parentCategory) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }

    const subcategories = await Category.find({ parent: parentCategory._id }).sort('name');

    res.status(200).json({
      success: true,
      count: subcategories.length,
      data: subcategories
    });
  } catch (err) {
    next(err);
  }
};