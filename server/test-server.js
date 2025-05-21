const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testServer() {
  console.log('Probando conexión con el servidor...\n');
  
  try {
    // Probar ruta básica
    console.log('1. Probando ruta base del API...');
    try {
      await axios.get(`${BASE_URL}/api/categories`);
      console.log('✅ API funcionando correctamente');
    } catch (error) {
      console.log('❌ Error en API:', error.message);
    }
    
    // Probar rutas de debug
    console.log('\n2. Probando rutas de debug...');
    try {
      const configResponse = await axios.get(`${BASE_URL}/api/debug/server-config`);
      console.log('✅ Ruta server-config funcionando');
      console.log('   Configuración:', configResponse.data);
    } catch (error) {
      console.log('❌ Error en server-config:', error.response?.status, error.message);
    }
    
    console.log('\n3. Probando lista de imágenes...');
    try {
      const imagesResponse = await axios.get(`${BASE_URL}/api/debug/images-list`);
      console.log('✅ Ruta images-list funcionando');
      console.log('   Imágenes encontradas:', imagesResponse.data.count);
    } catch (error) {
      console.log('❌ Error en images-list:', error.response?.status, error.message);
    }
    
    console.log('\n4. Verificando carpeta uploads...');
    const fs = require('fs');
    const path = require('path');
    const uploadsPath = path.join(__dirname, 'uploads');
    
    if (fs.existsSync(uploadsPath)) {
      console.log('✅ Carpeta uploads existe en:', uploadsPath);
      const files = fs.readdirSync(uploadsPath);
      console.log('   Archivos en uploads:', files.length);
    } else {
      console.log('❌ Carpeta uploads NO existe');
      console.log('   Creando carpeta...');
      fs.mkdirSync(uploadsPath, { recursive: true });
      console.log('✅ Carpeta creada');
    }
    
  } catch (error) {
    console.error('Error general:', error.message);
  }
}

// Ejecutar pruebas
testServer();