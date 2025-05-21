/**
 * Script para resetear y cargar productos con campos de oferta
 * 
 * Este script elimina todos los productos existentes y carga los nuevos con configuración
 * de oferta correcta desde el archivo products.json actualizado.
 * 
 * Uso: 
 * 1. Guarda este archivo como reset-products.js en la raíz del proyecto server
 * 2. Reemplaza el archivo _data/products.json con la versión actualizada
 * 3. Ejecuta: node reset-products.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');
const Product = require('./models/Product');

// Cargar variables de entorno
dotenv.config();

// Función principal
async function resetProducts() {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Conectado: ${mongoose.connection.host}`);

    // Eliminar todos los productos existentes
    console.log('Eliminando productos existentes...');
    await Product.deleteMany({});
    
    // Leer el archivo de productos actualizado
    console.log('Leyendo archivo de productos actualizado...');
    const products = JSON.parse(fs.readFileSync('./_data/products.json', 'utf-8'));
    
    // Insertar los nuevos productos
    console.log(`Insertando ${products.length} productos con configuración de oferta...`);
    await Product.insertMany(products);
    
    // Verificar productos en oferta
    const onSaleProducts = await Product.countDocuments({ onSale: true });
    console.log(`Se han configurado ${onSaleProducts} productos en oferta.`);
    
    // Listar productos en oferta
    const offerDetails = await Product.find({ onSale: true })
      .select('name price discountPercentage salePrice')
      .lean();
      
    console.log('Detalles de las ofertas:');
    offerDetails.forEach(product => {
      console.log(`- ${product.name}: $${product.price} → $${product.salePrice} (${product.discountPercentage}% off)`);
    });
    
    console.log('¡Operación completada con éxito!');
    process.exit(0);
  } catch (error) {
    console.error('Error durante la ejecución del script:', error);
    process.exit(1);
  }
}

// Ejecutar la función principal
resetProducts();