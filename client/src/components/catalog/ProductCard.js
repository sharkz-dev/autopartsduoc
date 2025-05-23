import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { 
  ShoppingCartIcon, 
  StarIcon, 
  TagIcon, 
  HeartIcon,
  EyeIcon,
  TruckIcon,
  CheckBadgeIcon,
  FireIcon
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutline, EyeIcon as EyeOutline } from '@heroicons/react/24/outline';
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
  const savings = isOnSale ? basePrice - displayPrice : 0;
  
  // Formatear el precio con separador de miles
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  // Obtener URL de la imagen usando el helper
  const imageUrl = getProductImageUrl(product);

  // Calcular rating visual
  const rating = product.avgRating || 0;
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  return (
    <div className="product-card group">
      {/* Contenedor de imagen con aspecto cuadrado */}
      <div className="product-image-container aspect-square relative">
        <Link to={`/product/${product.slug || product._id}`}>
          <img 
            src={imageUrl}
            alt={product.name}
            className="product-image"
            onError={(e) => handleImageError(e)}
            loading="lazy"
          />
        </Link>
        
        {/* Overlay con gradiente sutil */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Badges superiores */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {isOnSale && (
            <div className="flex items-center bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
              <FireIcon className="h-3 w-3 mr-1" />
              -{Math.round(product.discountPercentage)}% OFF
            </div>
          )}
          {product.featured && (
            <div className="flex items-center bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              <CheckBadgeIcon className="h-3 w-3 mr-1" />
              Destacado
            </div>
          )}
          {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
            <div className="bg-gradient-to-r from-orange-400 to-red-400 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              ¡Últimas {product.stockQuantity}!
            </div>
          )}
        </div>

        {/* Badges derechos */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          {cartType === 'B2B' && product.wholesalePrice && (
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              B2B
            </div>
          )}
          {product.stockQuantity > 10 && (
            <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center">
              <TruckIcon className="h-3 w-3 mr-1" />
              Stock
            </div>
          )}
        </div>
        
        {/* Botones de acción flotantes */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart(product, 1);
            }}
            disabled={product.stockQuantity <= 0}
            className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 shadow-xl ${
              product.stockQuantity > 0
                ? 'bg-white/90 text-blue-600 hover:bg-blue-600 hover:text-white hover:scale-110'
                : 'bg-gray-300/90 cursor-not-allowed text-gray-500'
            }`}
            title={product.stockQuantity > 0 ? 'Añadir al carrito' : 'Sin stock'}
          >
            <ShoppingCartIcon className="h-5 w-5" />
          </button>
          
          <Link
            to={`/product/${product.slug || product._id}`}
            className="p-3 rounded-full bg-white/90 text-gray-700 hover:bg-gray-700 hover:text-white backdrop-blur-md transition-all duration-300 shadow-xl hover:scale-110"
            title="Ver detalles"
          >
            <EyeIcon className="h-5 w-5" />
          </Link>
          
          <button
            className="p-3 rounded-full bg-white/90 text-red-500 hover:bg-red-500 hover:text-white backdrop-blur-md transition-all duration-300 shadow-xl hover:scale-110"
            title="Agregar a favoritos"
          >
            <HeartOutline className="h-5 w-5" />
          </button>
        </div>

        {/* Indicador de envío gratis */}
        {displayPrice >= 100000 && (
          <div className="absolute bottom-3 left-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center">
            <TruckIcon className="h-3 w-3 mr-1" />
            Envío Gratis
          </div>
        )}
      </div>
      
      {/* Contenido del producto */}
      <div className="p-5 space-y-3">
        {/* Marca y categoría */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-medium">{product.brand}</span>
          {product.category?.name && (
            <span className="bg-gray-100 px-2 py-1 rounded-full">
              {product.category.name}
            </span>
          )}
        </div>
        
        {/* Nombre del producto */}
        <Link to={`/product/${product.slug || product._id}`}>
          <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2 hover:text-blue-600 transition-colors duration-200">
            {product.name}
          </h3>
        </Link>
        
        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                className={`h-4 w-4 ${
                  star <= fullStars
                    ? 'text-yellow-400'
                    : star === fullStars + 1 && hasHalfStar
                    ? 'text-yellow-400'
                    : 'text-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {rating > 0 ? `(${rating.toFixed(1)})` : 'Sin valoraciones'}
          </span>
        </div>
        
        {/* Descripción corta */}
        <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
          {product.description}
        </p>
        
        {/* Precios */}
        <div className="space-y-1">
          {isOnSale ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-red-600">
                  {formatPrice(displayPrice)}
                </span>
                <span className="text-lg text-gray-500 line-through">
                  {formatPrice(basePrice)}
                </span>
              </div>
              <div className="flex items-center text-sm text-red-600 font-medium">
                <TagIcon className="h-4 w-4 mr-1" />
                Ahorras {formatPrice(savings)}
              </div>
            </div>
          ) : (
            <div className="text-2xl font-bold text-gray-900">
              {formatPrice(displayPrice)}
            </div>
          )}
          
          {cartType === 'B2B' && product.wholesalePrice && (
            <div className="text-xs text-blue-600 font-medium">
              {isOnSale ? 'Precio mayorista con descuento' : 'Precio mayorista'}
            </div>
          )}
        </div>
        
        {/* Stock y SKU */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            {product.stockQuantity > 0 ? (
              <div className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="font-medium">
                  {product.stockQuantity > 10 ? 'En stock' : `${product.stockQuantity} disponibles`}
                </span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                <span className="font-medium">Agotado</span>
              </div>
            )}
          </div>
          <span className="text-gray-500 text-xs">
            SKU: {product.sku}
          </span>
        </div>
        
        {/* Botón de acción principal (móvil) */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addToCart(product, 1);
          }}
          disabled={product.stockQuantity <= 0}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 sm:hidden ${
            product.stockQuantity > 0
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 cursor-not-allowed text-gray-500'
          }`}
        >
          {product.stockQuantity <= 0 ? 'Sin stock' : 'Añadir al carrito'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;