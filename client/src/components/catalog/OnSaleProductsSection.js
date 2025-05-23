import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../../services/api';
import { ShoppingCartIcon, StarIcon } from '@heroicons/react/24/solid';
import { TagIcon } from '@heroicons/react/24/outline';
import { useCart } from '../../context/CartContext';

const OnSaleProductsSection = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart, cartType } = useCart();

  useEffect(() => {
    const fetchOnSaleProducts = async () => {
      try {
        setLoading(true);
        // Obtener los primeros 8 productos en oferta
        const response = await productService.getProductsOnSale({ limit: 8 });
        setProducts(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar productos en oferta:', err);
        setError('No se pudieron cargar los productos en oferta');
        setLoading(false);
      }
    };

    fetchOnSaleProducts();
  }, []);

  if (loading) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null; // No mostrar la sección si no hay productos en oferta
  }

  return (
    <section className="py-8 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <TagIcon className="h-6 w-6 mr-2 text-red-500" />
            Ofertas especiales
          </h2>
          <Link 
            to="/catalog?filter=on-sale" 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Ver todas las ofertas
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product._id} product={product} addToCart={addToCart} cartType={cartType} />
          ))}
        </div>
      </div>
    </section>
  );
};

// Componente de tarjeta de producto con oferta
const ProductCard = ({ product, addToCart, cartType }) => {
  // Determinar el precio según el tipo de carrito (B2B o B2C)
  const regularPrice = cartType === 'B2B' && product.wholesalePrice 
    ? product.wholesalePrice 
    : product.price;

  const discountedPrice = product.onSale ? product.salePrice : regularPrice;
  const discountPercentage = product.discountPercentage;

  const defaultImage = 'https://via.placeholder.com/300x300?text=No+Image';
  
  // Formatear precios con separador de miles
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 relative">
      {/* Badge de descuento */}
      {product.onSale && (
        <div className="absolute top-0 left-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-br z-10">
          -{discountPercentage}%
        </div>
      )}
      
      <Link to={`/product/${product.slug || product._id}`} className="block">
        <div className="h-48 overflow-hidden">
          <img 
            src={product.images && product.images.length > 0 ? `/uploads/${product.images[0]}` : defaultImage} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-lg font-semibold text-gray-800 truncate">{product.name}</h3>
            {product.avgRating > 0 && (
              <div className="flex items-center">
                <StarIcon className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-gray-600 ml-1">{product.avgRating.toFixed(1)}</span>
              </div>
            )}
          </div>
          
          <p className="text-gray-500 text-sm mb-2">
            {product.brand} - {product.category?.name}
          </p>
          
          <p className="text-gray-600 text-sm h-12 overflow-hidden">
            {product.description.slice(0, 80)}...
          </p>
          
          <div className="flex justify-between items-center mt-4">
            <div>
              {product.onSale ? (
                <div>
                  <p className="text-lg font-bold text-red-600">
                    {formatPrice(discountedPrice)}
                  </p>
                  <p className="text-sm text-gray-500 line-through">
                    {formatPrice(regularPrice)}
                  </p>
                </div>
              ) : (
                <p className="text-lg font-bold text-blue-600">
                  {formatPrice(regularPrice)}
                </p>
              )}
              {cartType === 'B2B' && product.wholesalePrice && (
                <p className="text-xs text-gray-500">Precio mayorista</p>
              )}
            </div>
            
            <p className="text-sm text-gray-500">
              {product.stockQuantity > 0 ? (
                `${product.stockQuantity} disponibles`
              ) : (
                <span className="text-red-500">Agotado</span>
              )}
            </p>
          </div>
          
          <div className="mt-3 flex justify-between items-center">
            <span className="text-xs text-gray-500">
              SKU: {product.sku}
            </span>
            
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.preventDefault(); // Evitar navegación
                  e.stopPropagation(); // Evitar propagación
                  addToCart(product, 1);
                }}
                disabled={product.stockQuantity <= 0}
                className={`p-2 rounded-full ${
                  product.stockQuantity > 0
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-300 cursor-not-allowed text-gray-500'
                } transition-colors`}
                title={product.stockQuantity > 0 ? 'Añadir al carrito' : 'Sin stock'}
              >
                <ShoppingCartIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default OnSaleProductsSection;