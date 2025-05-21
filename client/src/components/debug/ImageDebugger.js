import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Componente para depurar problemas con las imágenes
const ImageDebugger = () => {
  const [testImage, setTestImage] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serverInfo, setServerInfo] = useState(null);
  const [imagesList, setImagesList] = useState([]);
  const [selectedPath, setSelectedPath] = useState('/uploads/');
  const [customPath, setCustomPath] = useState('');
  const [testImageUrl, setTestImageUrl] = useState('');
  
  // Función para probar diferentes rutas de imagen
  const testImagePath = () => {
    const path = customPath || selectedPath;
    if (!testImage) return;
    
    // Construir URL completa para probar
    const imageUrl = `${path}${testImage}`;
    setTestImageUrl(imageUrl);
  };
  
  // Función para subir una imagen de prueba
  const uploadTestImage = async () => {
    if (!file) return;
    
    setLoading(true);
    setUploadResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Llamar al endpoint de upload de imágenes
      const response = await axios.post('/api/debug/upload-test', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setUploadResult({
        success: true,
        data: response.data
      });
      
      // Actualizar la imagen de prueba con el nombre del archivo recién subido
      setTestImage(response.data.filename);
      
      // Intentar cargar la imagen automáticamente
      setTimeout(() => {
        testImagePath();
      }, 1000);
      
    } catch (error) {
      console.error('Error al subir imagen:', error);
      setUploadResult({
        success: false,
        error: error.response?.data?.error || error.message
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Verificar la configuración del servidor
  const checkServerConfig = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/debug/server-config');
      setServerInfo(response.data);
    } catch (error) {
      console.error('Error al verificar configuración del servidor:', error);
      setServerInfo({
        error: 'No se pudo conectar con el servidor para verificar la configuración'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Obtener lista de imágenes disponibles
  const getImagesList = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/debug/images-list');
      setImagesList(response.data.images || []);
    } catch (error) {
      console.error('Error al obtener lista de imágenes:', error);
      setImagesList([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Función para manejar carga de archivo
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  // Cargar información inicial
  useEffect(() => {
    checkServerConfig();
    getImagesList();
  }, []);
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Depurador de Imágenes</h1>
      
      {/* Información del servidor */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3 flex justify-between">
          Configuración del Servidor
          <button 
            onClick={checkServerConfig}
            className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
          >
            Actualizar
          </button>
        </h2>
        
        {serverInfo ? (
          <div className="bg-gray-50 p-4 rounded border">
            {serverInfo.error ? (
              <p className="text-red-500">{serverInfo.error}</p>
            ) : (
              <div className="space-y-2">
                <p><strong>NODE_ENV:</strong> {serverInfo.env}</p>
                <p><strong>Ruta de uploads:</strong> {serverInfo.uploadPath}</p>
                <p><strong>La carpeta existe:</strong> {serverInfo.folderExists ? '✅ Sí' : '❌ No'}</p>
                <p><strong>Permisos de escritura:</strong> {serverInfo.writeable ? '✅ Sí' : '❌ No'}</p>
                <p><strong>URL base del servidor:</strong> {serverInfo.serverUrl}</p>
                <p><strong>Middleware static:</strong> {serverInfo.staticMiddleware ? '✅ Configurado' : '❌ No configurado'}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-pulse h-32 bg-gray-200 rounded"></div>
        )}
      </div>
      
      {/* Imágenes disponibles */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3 flex justify-between">
          Imágenes Disponibles
          <button 
            onClick={getImagesList}
            className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
          >
            Actualizar Lista
          </button>
        </h2>
        
        {imagesList.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {imagesList.map((image, index) => (
              <div 
                key={index}
                className={`border rounded overflow-hidden cursor-pointer p-2 ${testImage === image ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => {
                  setTestImage(image);
                  setTimeout(() => testImagePath(), 100);
                }}
              >
                <div className="h-24 flex items-center justify-center bg-gray-100 mb-2">
                  <img 
                    src={`/uploads/${image}`}
                    alt={image}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/100x100?text=Error';
                    }}
                  />
                </div>
                <p className="text-xs truncate text-center">{image}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No se encontraron imágenes en el servidor.</p>
        )}
      </div>
      
      {/* Subir imagen de prueba */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-3">Subir Imagen de Prueba</h2>
        
        <div className="flex items-center gap-4 mb-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="flex-1"
          />
          
          <button
            onClick={uploadTestImage}
            disabled={!file || loading}
            className={`px-4 py-2 rounded font-medium ${
              !file || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {loading ? 'Subiendo...' : 'Subir Imagen'}
          </button>
        </div>
        
        {uploadResult && (
          <div className={`p-3 rounded ${uploadResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {uploadResult.success ? (
              <div>
                <p className="font-medium">✅ Imagen subida correctamente</p>
                <p className="text-sm">Nombre: {uploadResult.data.filename}</p>
                <p className="text-sm">Ruta: {uploadResult.data.path}</p>
              </div>
            ) : (
              <div>
                <p className="font-medium">❌ Error al subir imagen</p>
                <p className="text-sm">{uploadResult.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Probar diferentes rutas de imagen */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Probar Rutas de Imagen</h2>
        
        <div className="flex items-center gap-2 mb-4">
          <select
            value={selectedPath}
            onChange={(e) => setSelectedPath(e.target.value)}
            className="border rounded p-2"
          >
            <option value="/uploads/">Ruta: /uploads/</option>
            <option value="uploads/">Ruta: uploads/</option>
            <option value="./uploads/">Ruta: ./uploads/</option>
            <option value="../uploads/">Ruta: ../uploads/</option>
            <option value="http://localhost:5000/uploads/">URL completa con localhost:5000</option>
            <option value="custom">Ruta personalizada...</option>
          </select>
          
          {selectedPath === 'custom' && (
            <input
              type="text"
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              placeholder="Ingresa una ruta personalizada..."
              className="flex-1 border rounded p-2"
            />
          )}
          
          <button
            onClick={testImagePath}
            disabled={!testImage}
            className={`px-4 py-2 rounded font-medium ${
              !testImage
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Probar
          </button>
        </div>
        
        {testImage && (
          <div>
            <p className="mb-2">Probando imagen: <strong>{testImage}</strong></p>
            <p className="mb-2">URL: <strong>{testImageUrl}</strong></p>
            <div className="border rounded p-4 bg-gray-50 flex justify-center">
              <div className="relative">
                <img
                  src={testImageUrl}
                  alt="Test"
                  className="max-h-64 max-w-full"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    document.getElementById('error-message').style.display = 'block';
                  }}
                />
                <div id="error-message" style={{display: 'none'}} className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-red-100 text-red-800 p-4 rounded">
                    ❌ Error al cargar la imagen
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Recomendaciones */}
      <div className="bg-blue-50 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Recomendaciones:</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Asegúrate de que la carpeta <code>uploads</code> exista en la raíz del proyecto del servidor</li>
          <li>Verifica que EXPRESS_STATIC esté configurado correctamente en server.js</li>
          <li>Confirma que FILE_UPLOAD_PATH en .env apunte a la carpeta correcta</li>
          <li>Si usas rutas relativas, asegúrate de que sean relativas al punto de ejecución del servidor</li>
          <li>Verifica los permisos de la carpeta uploads (chmod 755)</li>
          <li>Si estás en desarrollo, revisa la configuración del proxy en el cliente</li>
        </ul>
      </div>
    </div>
  );
};

export default ImageDebugger;