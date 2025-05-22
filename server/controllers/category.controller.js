// server/controllers/category.controller.js - VERSIÓN COMPLETA CORREGIDA
const Category = require('../models/Category');
const path = require('path');
const fs = require('fs');

// ✅ FUNCIÓN HELPER CORREGIDA - con populate
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
    
    // Si no se encuentra por slug, intentar por ID (para compatibilidad)
    if (!category) {
      // Verificar si el identifier parece ser un ObjectId válido
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

// ✅ CORREGIDO: Obtener una categoría por slug o ID
// @desc    Obtener una categoría por slug o ID
// @route   GET /api/categories/:slug
// @access  Public
exports.getCategory = async (req, res, next) => {
  try {
    console.log(`🔍 Buscando categoría con identificador: ${req.params.slug}`);
    
    const category = await findCategoryBySlugOrId(req.params.slug, true);

    if (!category) {
      console.log(`❌ Categoría no encontrada: ${req.params.slug}`);
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }

    console.log(`✅ Categoría encontrada: ${category.name} (ID: ${category._id})`);

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (err) {
    console.error('💥 Error en getCategory:', err);
    next(err);
  }
};

// @desc    Crear una nueva categoría
// @route   POST /api/categories
// @access  Private (admin)
exports.createCategory = async (req, res, next) => {
  try {
    console.log(`➕ Creando nueva categoría: ${req.body.name}`);
    
    // Generar slug único
    req.body.slug = await generateUniqueSlug(req.body.name);
    console.log(`🔗 Slug generado: ${req.body.slug}`);
    
    const category = await Category.create(req.body);
    console.log(`✅ Categoría creada exitosamente: ${category.name} (ID: ${category._id})`);

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (err) {
    console.error('💥 Error al crear categoría:', err);
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

// ✅ CORREGIDO: Actualizar una categoría
// @desc    Actualizar una categoría
// @route   PUT /api/categories/:slug
// @access  Private (admin)
exports.updateCategory = async (req, res, next) => {
  try {
    console.log(`🔄 Actualizando categoría con identificador: ${req.params.slug}`);
    
    let category = await findCategoryBySlugOrId(req.params.slug, false); // Sin populate para actualización

    if (!category) {
      console.log(`❌ Categoría no encontrada para actualizar: ${req.params.slug}`);
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }

    console.log(`📝 Categoría encontrada para actualizar: ${category.name} (ID: ${category._id})`);

    // Si se cambia el nombre, generar nuevo slug
    if (req.body.name && req.body.name !== category.name) {
      req.body.slug = await generateUniqueSlug(req.body.name, category._id);
      console.log(`🔗 Nuevo slug generado: ${req.body.slug}`);
    }

    // Actualizar usando el ID de la categoría encontrada
    category = await Category.findByIdAndUpdate(
      category._id, 
      req.body, 
      {
        new: true,
        runValidators: true
      }
    ).populate('parent', 'name slug');

    console.log(`✅ Categoría actualizada exitosamente: ${category.name}`);

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (err) {
    console.error('💥 Error al actualizar categoría:', err);
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

// ✅ CORREGIDO: Eliminar una categoría
// @desc    Eliminar una categoría
// @route   DELETE /api/categories/:slug
// @access  Private (admin)
exports.deleteCategory = async (req, res, next) => {
  try {
    console.log(`🗑️ Eliminando categoría con identificador: ${req.params.slug}`);
    
    const category = await findCategoryBySlugOrId(req.params.slug, false);

    if (!category) {
      console.log(`❌ Categoría no encontrada para eliminar: ${req.params.slug}`);
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }

    console.log(`🔍 Categoría encontrada para eliminar: ${category.name} (ID: ${category._id})`);

    // Verificar si la categoría tiene productos asociados
    const Product = require('../models/Product');
    const products = await Product.countDocuments({ category: category._id });

    if (products > 0) {
      console.log(`⚠️ Categoría tiene ${products} productos asociados`);
      return res.status(400).json({
        success: false,
        error: `No se puede eliminar la categoría porque tiene ${products} productos asociados`
      });
    }

    // Verificar si la categoría tiene subcategorías
    const subcategories = await Category.countDocuments({ parent: category._id });

    if (subcategories > 0) {
      console.log(`⚠️ Categoría tiene ${subcategories} subcategorías`);
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
        console.log(`🖼️ Imagen eliminada: ${category.image}`);
      }
    }

    await category.deleteOne();
    console.log(`✅ Categoría eliminada exitosamente`);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error('💥 Error al eliminar categoría:', err);
    next(err);
  }
};

// ✅ CORREGIDO: Subir imagen de categoría
// @desc    Subir imagen de categoría
// @route   PUT /api/categories/:slug/image
// @access  Private (admin)
exports.uploadCategoryImage = async (req, res, next) => {
  try {
    console.log(`📸 Subiendo imagen para categoría: ${req.params.slug}`);
    
    const category = await findCategoryBySlugOrId(req.params.slug, false);

    if (!category) {
      console.log(`❌ Categoría no encontrada para subir imagen: ${req.params.slug}`);
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
        console.log(`🖼️ Imagen anterior eliminada: ${category.image}`);
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

      // Actualizar categoría con nueva imagen usando el ID
      await Category.findByIdAndUpdate(
        category._id,
        { image: file.name },
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

// ✅ CORREGIDO: Obtener subcategorías
// @desc    Obtener subcategorías
// @route   GET /api/categories/:slug/subcategories
// @access  Public
exports.getSubcategories = async (req, res, next) => {
  try {
    console.log(`🔍 Buscando subcategorías para: ${req.params.slug}`);
    
    // Buscar la categoría padre por slug o ID
    const parentCategory = await findCategoryBySlugOrId(req.params.slug, false);
    
    if (!parentCategory) {
      console.log(`❌ Categoría padre no encontrada: ${req.params.slug}`);
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }

    console.log(`✅ Categoría padre encontrada: ${parentCategory.name} (ID: ${parentCategory._id})`);

    const subcategories = await Category.find({ parent: parentCategory._id }).sort('name');

    console.log(`📂 Encontradas ${subcategories.length} subcategorías`);

    res.status(200).json({
      success: true,
      count: subcategories.length,
      data: subcategories
    });
  } catch (err) {
    console.error('💥 Error al obtener subcategorías:', err);
    next(err);
  }
};