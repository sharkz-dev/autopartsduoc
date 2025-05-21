const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Obtener la ruta de uploads
const uploadsDir = process.env.FILE_UPLOAD_PATH || './uploads';
const absoluteUploadsDir = path.isAbsolute(uploadsDir) 
  ? uploadsDir 
  : path.join(__dirname, uploadsDir);

console.log('Configurando carpeta de uploads...');
console.log(`Ruta configurada: ${absoluteUploadsDir}`);

try {
  // Crear carpeta si no existe
  if (!fs.existsSync(absoluteUploadsDir)) {
    fs.mkdirSync(absoluteUploadsDir, { recursive: true });
    console.log('✅ Carpeta de uploads creada exitosamente');
  } else {
    console.log('✅ Carpeta de uploads ya existe');
  }
  
  // Verificar permisos
  fs.accessSync(absoluteUploadsDir, fs.constants.R_OK | fs.constants.W_OK);
  console.log('✅ Permisos de lectura y escritura verificados');
  
  // Crear archivo .gitkeep para mantener la carpeta en git
  const gitkeepPath = path.join(absoluteUploadsDir, '.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '');
    console.log('✅ Archivo .gitkeep creado');
  }
  
  // Copiar imágenes de prueba si existen
  const testImagesDir = path.join(__dirname, '_data', 'test-images');
  if (fs.existsSync(testImagesDir)) {
    const testImages = fs.readdirSync(testImagesDir);
    testImages.forEach(image => {
      const sourcePath = path.join(testImagesDir, image);
      const destPath = path.join(absoluteUploadsDir, image);
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ Imagen de prueba copiada: ${image}`);
      }
    });
  }
  
  console.log('\n✅ Configuración de uploads completada exitosamente');
  console.log(`\nAsegúrate de que tu servidor esté sirviendo archivos estáticos desde:`);
  console.log(`app.use('/uploads', express.static('${absoluteUploadsDir}'));`);
  
} catch (error) {
  console.error('❌ Error al configurar carpeta de uploads:', error.message);
  console.error('\nPosibles soluciones:');
  console.error('1. Ejecuta el script con permisos de administrador/sudo');
  console.error('2. Crea manualmente la carpeta:', absoluteUploadsDir);
  console.error('3. Verifica los permisos de la carpeta padre');
  process.exit(1);
}