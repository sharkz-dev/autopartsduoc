const Category = require('../models/Category');
const path = require('path');
const fs = require('fs');

// Función helper para buscar categoría por slug o ID
const findCategoryBySlugOrId = async (identifier, populate = true) => {
  let category = null;
  
  try {
    // Primero intentar por slug
    if (populate) {
      category = await Category.findOne({ slug: identifier })
        .populate('parent', 'name slug');
    } else {
      category = await Category.findOne({ slug: identifier });
    }
    
    // Si no se encuentra por slug, intentar por ID
    if (!category) {
      if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
        if (populate) {
          category = await Category.findById(identifier)
            .populate('parent', 'name slug');
        } else {
          category = await Category.findById(identifier);
        }
      }
    }
  } catch (error) {
    console.error('Error en findCategoryBySlugOrId:', error);
    return null;
  }
  
  return category;
};

// Función helper para generar slug único
const generateUniqueSlug = async (name, categoryId = null) => {
  let baseSlug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .trim();

  let slug = baseSlug;
  let counter = 1;

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

// Obtener todas las categorías
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

// Obtener una categoría por slug o ID
exports.getCategory = async (req, res, next) => {
  try {
    const category = await findCategoryBySlugOrId(req.params.slug, true);

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
    console.error('Error en getCategory:', err);
    next(err);
  }
};

// Crear una nueva categoría
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
    console.error('Error al crear categoría:', err);
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

// Actualizar una categoría
exports.updateCategory = async (req, res, next) => {
  try {
    let category = await findCategoryBySlugOrId(req.params.slug, false);

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

    category = await Category.findByIdAndUpdate(
      category._id, 
      req.body, 
      {
        new: true,
        runValidators: true
      }
    ).populate('parent', 'name slug');

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (err) {
    console.error('Error al actualizar categoría:', err);
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

// Eliminar una categoría
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await findCategoryBySlugOrId(req.params.slug, false);

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
    console.error('Error al eliminar categoría:', err);
    next(err);
  }
};

// Subir imagen de categoría
exports.uploadCategoryImage = async (req, res, next) => {
  try {
    const category = await findCategoryBySlugOrId(req.params.slug, false);

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
        console.error('Error al mover archivo:', err);
        return res.status(500).json({
          success: false,
          error: 'Problema al subir el archivo'
        });
      }

      // Actualizar categoría con nueva imagen
      await Category.findByIdAndUpdate(
        category._id,
        { image: file.name },
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

// Obtener subcategorías
exports.getSubcategories = async (req, res, next) => {
  try {
    // Buscar la categoría padre por slug o ID
    const parentCategory = await findCategoryBySlugOrId(req.params.slug, false);
    
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
    console.error('Error al obtener subcategorías:', err);
    next(err);
  }
};