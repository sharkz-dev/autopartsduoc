import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { ShoppingCartIcon, StarIcon } from '@heroicons/react/24/solid';
import { getProductImageUrl, handleImageError } from '../../utils/imageHelpers';

const ProductCard = ({ product }) => {
  const { addToCart, cartType } = useCart();
  
  // Determinar el precio base según el tipo de cliente (B2B o B2C)
  const basePrice = cartType === 'B2B' && product.wholesalePrice 
    ? product.wholesalePrice 
    : product.price;

  // Verificar si el producto está en oferta y tiene datos válidos
  const isOnSale = product.onSale && product.discountPercentage > 0;
  
  // Calcular el precio con descuento según el tipo de cliente
  let salePrice = null;
  if (isOnSale) {
    if (cartType === 'B2B' && product.wholesalePrice) {
      const discountAmount = product.wholesalePrice * (product.discountPercentage / 100);
      salePrice = Math.round(product.wholesalePrice - discountAmount);
    } else {
      salePrice = product.salePrice || Math.round(product.price - (product.price * (product.discountPercentage / 100)));
    }
  }
  
  // Determinar precio final a mostrar
  const displayPrice = isOnSale ? salePrice : basePrice;


  
  // Formatear el precio con separador de miles
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  // Obtener URL de la imagen usando el helper
  const imageUrl = getProductImageUrl(product);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 relative">
      {/* Badge de descuento */}
      {isOnSale && (
        <div className="absolute top-0 right-0 bg-red-600 text-white font-bold px-3 py-1 rounded-bl-lg z-10 shadow-md">
          -{Math.round(product.discountPercentage)}%
        </div>
      )}
      
      <Link to={`/product/${product._id}`} className="block">
        <div className="h-48 overflow-hidden bg-gray-100">
          <img 
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => handleImageError(e)}
            loading="lazy"
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
              {isOnSale ? (
                <div className="flex flex-col">
                  <p className="text-xl font-bold text-red-600">
                    {formatPrice(displayPrice)}
                  </p>
                  <p className="text-sm text-gray-500 line-through">
                    {formatPrice(basePrice)}
                  </p>
                </div>
              ) : (
                <p className="text-lg font-bold text-blue-600">
                  {formatPrice(displayPrice)}
                </p>
              )}
              {cartType === 'B2B' && product.wholesalePrice && (
                <p className="text-xs text-gray-500">
                  {isOnSale ? 'Precio mayorista con descuento' : 'Precio mayorista'}
                </p>
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
              Distribuidor: {product.distributor?.companyName || 'N/A'}
            </span>
            
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
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

export default ProductCard;