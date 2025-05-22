const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Test básico
router.get('/ping', (req, res) => {
  res.json({ message: 'Test endpoint working!' });
});

// Listar archivos en uploads
router.get('/list-uploads', (req, res) => {
  const uploadsPath = path.join(__dirname, '..', 'uploads');
  
  if (!fs.existsSync(uploadsPath)) {
    return res.json({ 
      error: 'Uploads folder does not exist',
      path: uploadsPath 
    });
  }
  
  const files = fs.readdirSync(uploadsPath);
  res.json({ 
    uploadsPath,
    files,
    count: files.length 
  });
});

// Servir imagen de prueba
router.get('/test-image/:filename', (req, res) => {
  const { filename } = req.params;
  const imagePath = path.join(__dirname, '..', 'uploads', filename);
  
  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ error: 'Image not found', path: imagePath });
  }
  
  res.sendFile(imagePath);
});

module.exports = router;