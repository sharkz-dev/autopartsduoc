import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ImageDiagnostic = () => {
  const [diagnosticResults, setDiagnosticResults] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const results = {};
    
    // 1. Test endpoint básico
    try {
      const pingResponse = await axios.get('/api/test/ping');
      results.testEndpoint = { success: true, data: pingResponse.data };
    } catch (error) {
      results.testEndpoint = { success: false, error: error.message };
    }

    // 2. Listar archivos en uploads
    try {
      const listResponse = await axios.get('/api/test/list-uploads');
      results.uploadsList = { success: true, data: listResponse.data };
    } catch (error) {
      results.uploadsList = { success: false, error: error.message };
    }

    // 3. Obtener un producto con imágenes
    try {
      const productsResponse = await axios.get('/api/products?limit=1');
      const product = productsResponse.data.data[0];
      results.sampleProduct = { success: true, data: product };

      // Si hay un producto con imágenes, probar diferentes formas de cargar la imagen
      if (product && product.images && product.images.length > 0) {
        const imageName = product.images[0];
        results.imageTests = await testImageUrls(imageName);
      }
    } catch (error) {
      results.sampleProduct = { success: false, error: error.message };
    }

    setDiagnosticResults(results);
    setLoading(false);
  };

  const testImageUrls = async (imageName) => {
    const tests = [];
    
    // Test 1: URL relativa con proxy
    tests.push({
      name: 'Proxy URL',
      url: `/uploads/${imageName}`,
      result: await testImageLoad(`/uploads/${imageName}`)
    });

    // Test 2: URL absoluta al servidor
    tests.push({
      name: 'Direct Server URL',
      url: `http://localhost:5000/uploads/${imageName}`,
      result: await testImageLoad(`http://localhost:5000/uploads/${imageName}`)
    });

    // Test 3: A través del endpoint de prueba
    tests.push({
      name: 'Test Endpoint',
      url: `/api/test/test-image/${imageName}`,
      result: await testImageLoad(`/api/test/test-image/${imageName}`)
    });

    return tests;
  };

  const testImageLoad = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ success: true, url });
      img.onerror = () => resolve({ success: false, url });
      img.src = url;
    });
  };

  const uploadTestImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Primero, obtener un producto para actualizar
      const productsResponse = await axios.get('/api/products?limit=1');
      const product = productsResponse.data.data[0];
      
      if (product) {
        const uploadResponse = await axios.put(
          `/api/products/${product._id}/images`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        
        alert('Imagen subida correctamente. Recarga la página para ver los resultados.');
        window.location.reload();
      }
    } catch (error) {
      alert('Error al subir imagen: ' + error.message);
    }
  };

  if (loading) {
    return <div className="p-4">Ejecutando diagnósticos...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Diagnóstico de Imágenes</h2>

      {/* Test Endpoint */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">1. Test Endpoint</h3>
        <div className={`p-3 rounded ${diagnosticResults.testEndpoint?.success ? 'bg-green-100' : 'bg-red-100'}`}>
          {diagnosticResults.testEndpoint?.success ? (
            <div>
              <p className="text-green-800">✅ Endpoint funcionando</p>
              <pre className="text-sm mt-2">{JSON.stringify(diagnosticResults.testEndpoint.data, null, 2)}</pre>
            </div>
          ) : (
            <p className="text-red-800">❌ Error: {diagnosticResults.testEndpoint?.error}</p>
          )}
        </div>
      </div>

      {/* Lista de archivos */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">2. Archivos en carpeta uploads</h3>
        <div className={`p-3 rounded ${diagnosticResults.uploadsList?.success ? 'bg-green-100' : 'bg-red-100'}`}>
          {diagnosticResults.uploadsList?.success ? (
            <div>
              <p className="text-green-800">✅ Carpeta uploads accesible</p>
              <p className="text-sm mt-2">Ruta: {diagnosticResults.uploadsList.data.uploadsPath}</p>
              <p className="text-sm">Archivos encontrados: {diagnosticResults.uploadsList.data.count}</p>
              {diagnosticResults.uploadsList.data.files.length > 0 && (
                <ul className="mt-2 text-sm">
                  {diagnosticResults.uploadsList.data.files.slice(0, 5).map((file, index) => (
                    <li key={index}>- {file}</li>
                  ))}
                  {diagnosticResults.uploadsList.data.files.length > 5 && (
                    <li>... y {diagnosticResults.uploadsList.data.files.length - 5} más</li>
                  )}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-red-800">❌ Error: {diagnosticResults.uploadsList?.error}</p>
          )}
        </div>
      </div>

      {/* Producto de muestra */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">3. Producto de muestra</h3>
        <div className={`p-3 rounded ${diagnosticResults.sampleProduct?.success ? 'bg-green-100' : 'bg-red-100'}`}>
          {diagnosticResults.sampleProduct?.success && diagnosticResults.sampleProduct.data ? (
            <div>
              <p className="text-green-800">✅ Producto encontrado</p>
              <p className="text-sm mt-2">Nombre: {diagnosticResults.sampleProduct.data.name}</p>
              <p className="text-sm">ID: {diagnosticResults.sampleProduct.data._id}</p>
              <p className="text-sm">Imágenes en BD: {JSON.stringify(diagnosticResults.sampleProduct.data.images)}</p>
            </div>
          ) : (
            <p className="text-red-800">❌ Error: {diagnosticResults.sampleProduct?.error || 'No se encontró producto'}</p>
          )}
        </div>
      </div>

      {/* Pruebas de carga de imágenes */}
      {diagnosticResults.imageTests && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">4. Pruebas de carga de imágenes</h3>
          {diagnosticResults.imageTests.map((test, index) => (
            <div key={index} className="mb-3">
              <div className={`p-3 rounded ${test.result.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <p className={test.result.success ? 'text-green-800' : 'text-red-800'}>
                  {test.result.success ? '✅' : '❌'} {test.name}
                </p>
                <p className="text-sm mt-1">URL: {test.url}</p>
                {test.result.success && (
                  <img src={test.url} alt="Test" className="mt-2 w-32 h-32 object-cover border" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subir imagen de prueba */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">5. Subir imagen de prueba</h3>
        <input
          type="file"
          accept="image/*"
          onChange={uploadTestImage}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* Información adicional */}
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h4 className="font-semibold mb-2">Información de depuración:</h4>
        <p className="text-sm">- URL base del cliente: {window.location.origin}</p>
        <p className="text-sm">- ¿Tiene proxy configurado?: Revisa package.json del cliente</p>
        <p className="text-sm">- Puerto del servidor: 5000</p>
      </div>
    </div>
  );
};

export default ImageDiagnostic;