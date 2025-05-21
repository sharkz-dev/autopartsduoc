import React, { useState } from 'react';
import axios from 'axios';

const SimpleImageTest = () => {
  const [file, setFile] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    setDebugInfo('Iniciando upload...\n');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // Intenta subir directamente a la ruta de productos
      setDebugInfo(prev => prev + `Subiendo archivo ${file.name} (${file.size} bytes)\n`);
      const response = await axios.post('/api/products/test-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setDebugInfo(prev => prev + `Respuesta recibida: ${JSON.stringify(response.data)}\n`);
      setUploadedImage(response.data);
    } catch (err) {
      console.error('Error al subir:', err);
      setError(err.message);
      setDebugInfo(prev => prev + `ERROR: ${err.message}\n`);
      
      if (err.response) {
        setDebugInfo(prev => prev + `Detalles: ${JSON.stringify(err.response.data)}\n`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Probar si podemos acceder directamente a archivos existentes
  const testExistingFiles = async () => {
    setDebugInfo(prev => prev + 'Probando acceso a archivos existentes...\n');
    
    // Lista de posibles nombres de archivo para probar
    const testFiles = [
      'product_placeholder.png',
      'category_placeholder.png',
      'test.jpg',
      'test-image.jpg'
    ];
    
    const results = {};
    
    for (const file of testFiles) {
      try {
        // Intentar hacer una petición HEAD para verificar si el archivo existe
        await axios.head(`/uploads/${file}`);
        results[file] = 'Accesible ✅';
        setDebugInfo(prev => prev + `Archivo '${file}' encontrado y accesible ✅\n`);
      } catch (err) {
        results[file] = 'No accesible ❌';
        setDebugInfo(prev => prev + `Archivo '${file}' no accesible ❌\n`);
      }
    }
    
    setDebugInfo(prev => prev + 'Prueba de archivos completada\n');
    return results;
  };

  // Probar diferentes rutas de API
  const testApiEndpoints = async () => {
    setDebugInfo(prev => prev + 'Probando endpoints de API...\n');
    
    const endpoints = [
      '/api/products',
      '/api/categories',
      '/api/users/distributors'
    ];
    
    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        // Intentar hacer una petición GET para verificar si el endpoint responde
        await axios.get(endpoint);
        results[endpoint] = 'Accesible ✅';
        setDebugInfo(prev => prev + `Endpoint '${endpoint}' responde correctamente ✅\n`);
      } catch (err) {
        results[endpoint] = `Error: ${err.message} ❌`;
        setDebugInfo(prev => prev + `Endpoint '${endpoint}' error: ${err.message} ❌\n`);
      }
    }
    
    setDebugInfo(prev => prev + 'Prueba de endpoints completada\n');
    return results;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow-md">
      <h2 className="text-2xl font-bold mb-4">Test Simple de Imágenes</h2>
      
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Subir una imagen</h3>
          <div className="mb-4">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="w-full border p-2 rounded"
            />
          </div>
          
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            {loading ? 'Subiendo...' : 'Subir Imagen'}
          </button>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">
              <p className="font-bold">Error:</p>
              <p>{error}</p>
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Herramientas de diagnóstico</h3>
          <div className="space-y-2">
            <button
              onClick={testExistingFiles}
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
            >
              Probar archivos existentes
            </button>
            
            <button
              onClick={testApiEndpoints}
              className="w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600"
            >
              Probar endpoints API
            </button>
          </div>
        </div>
      </div>
      
      {/* Log de depuración */}
      {debugInfo && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Log de depuración</h3>
          <pre className="bg-gray-100 p-4 rounded h-32 overflow-auto text-xs">
            {debugInfo}
          </pre>
        </div>
      )}
      
      {/* Resultado de la imagen subida */}
      {uploadedImage && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Imagen subida</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="bg-gray-50 p-4 rounded border">
                <p><strong>Nombre:</strong> {uploadedImage.fileName}</p>
                <p><strong>Ruta:</strong> {uploadedImage.filePath}</p>
                <p><strong>URL:</strong> {uploadedImage.url}</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Probando visualización con diferentes rutas:</h4>
              
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">/uploads/{uploadedImage.fileName}:</p>
                  <div className="border rounded p-2 bg-gray-50 h-40 flex items-center justify-center">
                    <img 
                      src={`/uploads/${uploadedImage.fileName}`} 
                      alt="Test 1" 
                      className="max-h-full max-w-full"
                      onError={(e) => { 
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/150?text=Error';
                        setDebugInfo(prev => prev + `ERROR: No se pudo cargar imagen con ruta /uploads/${uploadedImage.fileName}\n`); 
                      }}
                      onLoad={() => setDebugInfo(prev => prev + `✅ Imagen cargada correctamente con ruta /uploads/${uploadedImage.fileName}\n`)}
                    />
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">uploads/{uploadedImage.fileName}:</p>
                  <div className="border rounded p-2 bg-gray-50 h-40 flex items-center justify-center">
                    <img 
                      src={`uploads/${uploadedImage.fileName}`} 
                      alt="Test 2" 
                      className="max-h-full max-w-full"
                      onError={(e) => { 
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/150?text=Error';
                        setDebugInfo(prev => prev + `ERROR: No se pudo cargar imagen con ruta uploads/${uploadedImage.fileName}\n`); 
                      }}
                      onLoad={() => setDebugInfo(prev => prev + `✅ Imagen cargada correctamente con ruta uploads/${uploadedImage.fileName}\n`)}
                    />
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">URL completa (con localhost):</p>
                  <div className="border rounded p-2 bg-gray-50 h-40 flex items-center justify-center">
                    <img 
                      src={`http://localhost:5000/uploads/${uploadedImage.fileName}`} 
                      alt="Test 3" 
                      className="max-h-full max-w-full"
                      onError={(e) => { 
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/150?text=Error';
                        setDebugInfo(prev => prev + `ERROR: No se pudo cargar imagen con URL completa http://localhost:5000/uploads/${uploadedImage.fileName}\n`); 
                      }}
                      onLoad={() => setDebugInfo(prev => prev + `✅ Imagen cargada correctamente con URL completa http://localhost:5000/uploads/${uploadedImage.fileName}\n`)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleImageTest;