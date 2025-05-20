import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { ShoppingCartIcon, StarIcon } from '@heroicons/react/24/solid';

const ProductCard = ({ product }) => {
  const { addToCart, cartType } = useCart();
  
  // Determinar el precio según el tipo de carrito (B2B o B2C)
  const displayPrice = cartType === 'B2B' && product.wholesalePrice 
    ? product.wholesalePrice 
    : product.price;

  const defaultImage = 'https://via.placeholder.com/300x300?text=No+Image';
  
  // Formatear el precio con separador de miles y 2 decimales
  const formattedPrice = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP'
  }).format(displayPrice);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1">
      <Link to={`/product/${product._id}`} className="block">
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
              <p className="text-lg font-bold text-blue-600">
                {formattedPrice}
              </p>
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
              Distribuidor: {product.distributor?.companyName || 'N/A'}
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

export default ProductCard;