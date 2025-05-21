const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const accessAsync = promisify(fs.access);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);

// @route   GET /api/debug/server-config
// @desc    Obtener información de configuración del servidor para diagnóstico
// @access  Public (sólo para desarrollo)
router.get('/server-config', async (req, res) => {
  try {
    const uploadPath = process.env.FILE_UPLOAD_PATH || './uploads';
    const absolutePath = path.resolve(uploadPath);
    
    let folderExists = false;
    let writeable = false;
    
    try {
      await accessAsync(absolutePath, fs.constants.F_OK);
      folderExists = true;
      
      // Verificar permisos de escritura
      await accessAsync(absolutePath, fs.constants.W_OK);
      writeable = true;
    } catch (err) {
      console.error('Error al verificar carpeta de uploads:', err);
    }
    
    res.json({
      env: process.env.NODE_ENV || 'development',
      uploadPath,
      absolutePath,
      folderExists,
      writeable,
      serverUrl: `${req.protocol}://${req.get('host')}`,
      staticMiddleware: true // Simplificado ya que sabemos que está configurado
    });
  } catch (err) {
    console.error('Error al obtener configuración:', err);
    res.status(500).json({ error: 'Error al obtener configuración del servidor' });
  }
});

// @route   GET /api/debug/images-list
// @desc    Obtener lista de imágenes disponibles
// @access  Public (sólo para desarrollo)
router.get('/images-list', async (req, res) => {
  try {
    const uploadPath = process.env.FILE_UPLOAD_PATH || './uploads';
    const absolutePath = path.resolve(uploadPath);
    
    // Verificar si la carpeta existe
    try {
      await accessAsync(absolutePath, fs.constants.F_OK);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: `La carpeta de uploads no existe: ${absolutePath}`,
        images: []
      });
    }
    
    // Leer directorio
    const files = await readdirAsync(absolutePath);
    
    // Filtrar solo archivos de imagen
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const images = [];
    
    for (const file of files) {
      try {
        const filePath = path.join(absolutePath, file);
        const stats = await statAsync(filePath);
        
        if (stats.isFile() && imageExtensions.includes(path.extname(file).toLowerCase())) {
          images.push(file);
        }
      } catch (err) {
        console.error(`Error procesando archivo ${file}:`, err);
      }
    }
    
    res.json({
      success: true,
      count: images.length,
      images
    });
  } catch (err) {
    console.error('Error al obtener lista de imágenes:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener lista de imágenes',
      images: []
    });
  }
});

// @route   POST /api/debug/upload-test
// @desc    Subir imagen de prueba
// @access  Public (sólo para desarrollo)
router.post('/upload-test', async (req, res) => {
  try {
    console.log('Recibiendo solicitud de upload-test');
    console.log('req.files:', req.files);
    
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        error: 'No se ha subido ningún archivo'
      });
    }
    
    const file = req.files.file;
    
    // Verificar que es una imagen
    if (!file.mimetype.startsWith('image')) {
      return res.status(400).json({
        success: false,
        error: 'Por favor, sube solo imágenes'
      });
    }
    
    // Crear nombre de archivo personalizado para prueba
    const filename = `debug_${Date.now()}${path.extname(file.name)}`;
    
    // Configurar ruta de subida
    const uploadPath = process.env.FILE_UPLOAD_PATH || './uploads';
    const absolutePath = path.resolve(uploadPath);
    const filePath = path.join(absolutePath, filename);
    
    // Verificar que la carpeta existe
    try {
      await accessAsync(absolutePath, fs.constants.F_OK | fs.constants.W_OK);
    } catch (err) {
      // Intentar crear la carpeta si no existe
      try {
        fs.mkdirSync(absolutePath, { recursive: true });
        console.log('Carpeta uploads creada:', absolutePath);
      } catch (mkdirErr) {
        return res.status(500).json({
          success: false,
          error: `No se pudo crear la carpeta de uploads: ${absolutePath}`,
          details: mkdirErr.message
        });
      }
    }
    
    // Mover archivo
    file.mv(filePath, async (err) => {
      if (err) {
        console.error('Error al mover archivo:', err);
        return res.status(500).json({
          success: false,
          error: 'Error al subir imagen',
          details: err.message
        });
      }
      
      // Verificar que el archivo se haya creado correctamente
      try {
        await accessAsync(filePath, fs.constants.F_OK);
        
        res.status(200).json({
          success: true,
          filename,
          path: filePath,
          url: `/uploads/${filename}`,
          size: file.size,
          mimetype: file.mimetype
        });
      } catch (err) {
        res.status(500).json({
          success: false,
          error: 'El archivo se movió pero no se puede acceder a él',
          details: err.message
        });
      }
    });
  } catch (err) {
    console.error('Error general al subir imagen:', err);
    res.status(500).json({
      success: false,
      error: 'Error al procesar la solicitud de subida',
      details: err.message
    });
  }
});

module.exports = router;