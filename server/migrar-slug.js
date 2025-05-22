// server/migrate-to-slugs.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const Category = require('./models/Category');

// Cargar variables de entorno
dotenv.config();

// Función para generar slug
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Eliminar caracteres especiales excepto guiones
    .replace(/\s+/g, '_')     // Reemplazar espacios con guiones bajos
    .replace(/_+/g, '_')      // Reemplazar múltiples guiones bajos con uno solo
    .replace(/^_|_$/g, '')    // Eliminar guiones bajos al inicio y final
    .trim();
};

// Función para generar slug único
const generateUniqueSlug = async (Model, name, excludeId = null) => {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const existing = await Model.findOne(query);
    if (!existing) break;
    
    slug = `${baseSlug}_${counter}`;
    counter++;
  }

  return slug;
};

async function migrateToSlugs() {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB conectado');

    console.log('\n=== MIGRACIÓN DE CATEGORÍAS ===');
    
    // Migrar categorías
    const categories = await Category.find({});
    console.log(`📦 Encontradas ${categories.length} categorías`);
    
    let categoriesUpdated = 0;
    for (const category of categories) {
      if (!category.slug) {
        const newSlug = await generateUniqueSlug(Category, category.name, category._id);
        await Category.findByIdAndUpdate(category._id, { slug: newSlug });
        console.log(`✅ Categoría: "${category.name}" -> slug: "${newSlug}"`);
        categoriesUpdated++;
      } else {
        console.log(`⏭️  Categoría: "${category.name}" ya tiene slug: "${category.slug}"`);
      }
    }
    
    console.log(`\n📊 Categorías actualizadas: ${categoriesUpdated}`);

    console.log('\n=== MIGRACIÓN DE PRODUCTOS ===');
    
    // Migrar productos
    const products = await Product.find({});
    console.log(`📦 Encontrados ${products.length} productos`);
    
    let productsUpdated = 0;
    for (const product of products) {
      if (!product.slug) {
        const newSlug = await generateUniqueSlug(Product, product.name, product._id);
        await Product.findByIdAndUpdate(product._id, { slug: newSlug });
        console.log(`✅ Producto: "${product.name}" -> slug: "${newSlug}"`);
        productsUpdated++;
      } else {
        console.log(`⏭️  Producto: "${product.name}" ya tiene slug: "${product.slug}"`);
      }
    }
    
    console.log(`\n📊 Productos actualizados: ${productsUpdated}`);

    console.log('\n=== RESUMEN DE MIGRACIÓN ===');
    console.log(`✅ Categorías actualizadas: ${categoriesUpdated}`);
    console.log(`✅ Productos actualizados: ${productsUpdated}`);
    console.log(`🎉 Migración completada exitosamente!`);

    // Verificar que todos los documentos tienen slugs
    const categoriesWithoutSlug = await Category.countDocuments({ slug: { $exists: false } });
    const productsWithoutSlug = await Product.countDocuments({ slug: { $exists: false } });
    
    if (categoriesWithoutSlug === 0 && productsWithoutSlug === 0) {
      console.log('\n✅ Verificación: Todos los documentos tienen slugs');
    } else {
      console.log(`\n⚠️  Advertencia: ${categoriesWithoutSlug} categorías y ${productsWithoutSlug} productos sin slug`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

// Función para revertir la migración (en caso de necesidad)
async function revertMigration() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB conectado');
    
    console.log('\n=== REVIRTIENDO MIGRACIÓN ===');
    
    // Eliminar campo slug de categorías
    await Category.updateMany({}, { $unset: { slug: 1 } });
    console.log('✅ Slugs eliminados de categorías');
    
    // Eliminar campo slug de productos
    await Product.updateMany({}, { $unset: { slug: 1 } });
    console.log('✅ Slugs eliminados de productos');
    
    console.log('🎉 Migración revertida exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al revertir migración:', error);
    process.exit(1);
  }
}

// Verificar argumentos de línea de comandos
const args = process.argv.slice(2);

if (args.includes('--revert')) {
  console.log('⚠️  REVIRTIENDO MIGRACIÓN DE SLUGS...');
  revertMigration();
} else {
  console.log('🚀 INICIANDO MIGRACIÓN DE SLUGS...');
  console.log('Esto agregará slugs únicos a todos los productos y categorías');
  console.log('Si deseas revertir, ejecuta: node migrate-to-slugs.js --revert\n');
  migrateToSlugs();
}