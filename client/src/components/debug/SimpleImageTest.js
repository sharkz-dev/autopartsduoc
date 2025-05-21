import React, { useState, useEffect } from 'react';
import { productService } from '../../services/api';

const SimpleImageTest = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productService.getProducts({ limit: 5 });
        setProducts(response.data.data);
        console.log('Productos cargados:', response.data.data);
      } catch (error) {
        console.error('Error al cargar productos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <div className="p-8">Cargando...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Test de Imágenes</h1>
      
      {products.map((product, index) => (
        <div key={product._id} className="mb-8 p-4 border rounded">
          <h2 className="text-xl font-semibold mb-4">{product.name}</h2>
          
          <div className="mb-4">
            <p className="font-bold">Datos en BD:</p>
            <pre className="bg-gray-100 p-2 rounded text-sm">
              {JSON.stringify(product.images, null, 2)}
            </pre>
          </div>

          {product.images && product.images.length > 0 && (
            <div>
              <p className="font-bold mb-2">Pruebas de imagen:</p>
              
              {/* Prueba 1: Ruta directa */}
              <div className="mb-4">
                <p className="text-sm text-gray-600">1. Ruta directa: /uploads/{product.images[0]}</p>
                <img 
                  src={`/uploads/${product.images[0]}`}
                  alt={`Test 1 - ${product.name}`}
                  className="w-48 h-48 object-cover border"
                  onError={(e) => console.error('Error Test 1:', e.target.src)}
                  onLoad={() => console.log('✅ Test 1 cargada')}
                />
              </div>

              {/* Prueba 2: Con URL base */}
              <div className="mb-4">
                <p className="text-sm text-gray-600">2. Con URL base: http://localhost:5000/uploads/{product.images[0]}</p>
                <img 
                  src={`http://localhost:5000/uploads/${product.images[0]}`}
                  alt={`Test 2 - ${product.name}`}
                  className="w-48 h-48 object-cover border"
                  onError={(e) => console.error('Error Test 2:', e.target.src)}
                  onLoad={() => console.log('✅ Test 2 cargada')}
                />
              </div>

              {/* Prueba 3: Como viene de la BD */}
              <div className="mb-4">
                <p className="text-sm text-gray-600">3. Como viene de BD: {product.images[0]}</p>
                <img 
                  src={product.images[0]}
                  alt={`Test 3 - ${product.name}`}
                  className="w-48 h-48 object-cover border"
                  onError={(e) => console.error('Error Test 3:', e.target.src)}
                  onLoad={() => console.log('✅ Test 3 cargada')}
                />
              </div>

              {/* Prueba 4: Con lógica condicional */}
              <div className="mb-4">
                <p className="text-sm text-gray-600">4. Con lógica condicional</p>
                <img 
                  src={
                    product.images[0].startsWith('http') 
                      ? product.images[0]
                      : product.images[0].startsWith('/uploads/')
                        ? product.images[0]
                        : `/uploads/${product.images[0]}`
                  }
                  alt={`Test 4 - ${product.name}`}
                  className="w-48 h-48 object-cover border"
                  onError={(e) => console.error('Error Test 4:', e.target.src)}
                  onLoad={() => console.log('✅ Test 4 cargada')}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SimpleImageTest;