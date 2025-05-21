const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

// Cargar variables de entorno
dotenv.config();

async function fixImageNames() {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB conectado\n');

    // Obtener todos los productos
    const products = await Product.find({});
    console.log(`Total de productos: ${products.length}\n`);

    let fixedCount = 0;

    for (const product of products) {
      if (!product.images || product.images.length === 0) continue;

      let needsUpdate = false;
      const updatedImages = product.images.map(image => {
        // Si la imagen contiene rutas o caracteres extraños, limpiarlo
        if (typeof image === 'string') {
          // Eliminar cualquier ruta y dejar solo el nombre del archivo
          const cleanName = image.split('/').pop().split('\\').pop();
          
          // Si el nombre es diferente, necesitamos actualizar
          if (cleanName !== image) {
            needsUpdate = true;
            console.log(`Producto: ${product.name}`);
            console.log(`  Cambiando: "${image}" -> "${cleanName}"`);
            return cleanName;
          }
        }
        return image;
      });

      if (needsUpdate) {
        product.images = updatedImages;
        await product.save();
        fixedCount++;
      }
    }

    console.log(`\n✅ Proceso completado`);
    console.log(`Productos actualizados: ${fixedCount}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Preguntar confirmación antes de ejecutar
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('¿Deseas corregir los nombres de las imágenes en la base de datos? (s/n): ', (answer) => {
  if (answer.toLowerCase() === 's') {
    rl.close();
    fixImageNames();
  } else {
    console.log('Operación cancelada');
    rl.close();
    process.exit(0);
  }
});