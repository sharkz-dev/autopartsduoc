// fix-image-quotes.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const Category = require('./models/Category');

// Cargar variables de entorno
dotenv.config();

async function fixImageQuotes() {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB conectado\n');

    // Arreglar imágenes de productos
    console.log('=== ARREGLANDO COMILLAS EN IMÁGENES DE PRODUCTOS ===\n');
    const products = await Product.find({});
    
    let productsFixed = 0;
    for (const product of products) {
      if (!product.images || product.images.length === 0) continue;
      
      let needsUpdate = false;
      const fixedImages = product.images.map(image => {
        if (typeof image === 'string' && image.includes('"')) {
          needsUpdate = true;
          const cleanName = image.replace(/"/g, '');
          console.log(`Producto "${product.name}":`);
          console.log(`  Antes: ${image}`);
          console.log(`  Después: ${cleanName}\n`);
          return cleanName;
        }
        return image;
      });

      if (needsUpdate) {
        product.images = fixedImages;
        await product.save();
        productsFixed++;
      }
    }

    console.log(`\nProductos actualizados: ${productsFixed}`);

    // Arreglar imágenes de categorías
    console.log('\n=== ARREGLANDO COMILLAS EN IMÁGENES DE CATEGORÍAS ===\n');
    const categories = await Category.find({ image: { $exists: true, $ne: null } });
    
    let categoriesFixed = 0;
    for (const category of categories) {
      if (category.image && category.image.includes('"')) {
        const cleanName = category.image.replace(/"/g, '');
        console.log(`Categoría "${category.name}":`);
        console.log(`  Antes: ${category.image}`);
        console.log(`  Después: ${cleanName}\n`);
        category.image = cleanName;
        await category.save();
        categoriesFixed++;
      }
    }

    console.log(`\nCategorías actualizadas: ${categoriesFixed}`);
    console.log('\n✅ Proceso completado');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Ejecutar inmediatamente
console.log('Iniciando corrección de nombres de imágenes con comillas...\n');
fixImageQuotes();