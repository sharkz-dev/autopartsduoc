import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { getProductImageUrl, handleImageError } from '../../utils/imageHelpers';
import { 
  ShoppingCartIcon, 
  StarIcon, 
  TagIcon,
  EyeIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';
import { HeartIcon } from '@heroicons/react/24/solid';

const ProductCard = ({ product }) => {
  const { canAccessWholesalePrices, isApprovedDistributor } = useAuth();
  const { addToCart, cartType } = useCart();

  // Lógica actualizada: Determinar precio a mostrar según el usuario
  const getPriceInfo = () => {
    const hasWholesaleAccess = canAccessWholesalePrices();
    const showWholesalePrice = hasWholesaleAccess && product.wholesalePrice;
    
    // Precio base que se mostrará
    let displayPrice = product.price;
    let originalPrice = null;
    let priceLabel = 'Precio';
    let savings = 0;
    
    // Si el usuario puede acceder a precios mayoristas y el producto los tiene
    if (showWholesalePrice) {
      displayPrice = product.wholesalePrice;
      originalPrice = product.price;
      priceLabel = 'Precio Mayorista';
      savings = product.price - product.wholesalePrice;
    }
    
    // Manejar ofertas
    let finalPrice = displayPrice;
    let isOnSale = product.onSale && product.discountPercentage > 0;
    let salePrice = null;
    
    if (isOnSale) {
      if (showWholesalePrice) {
        // Aplicar descuento al precio mayorista
        salePrice = Math.round(product.wholesalePrice * (1 - product.discountPercentage / 100));
      } else {
        // Usar precio de oferta normal o calcularlo
        salePrice = product.salePrice || Math.round(product.price * (1 - product.discountPercentage / 100));
      }
      finalPrice = salePrice;
    }
    
    return {
      finalPrice,
      originalPrice: isOnSale ? displayPrice : originalPrice,
      isOnSale,
      discountPercentage: product.discountPercentage,
      priceLabel,
      savings: isOnSale ? (displayPrice - finalPrice) : savings,
      showWholesalePrice,
      hasWholesaleAccess
    };
  };

  const priceInfo = getPriceInfo();

  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  return (
    <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:-translate-y-2">
      {/* Imagen del producto */}
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <img
          src={getProductImageUrl(product)}
          alt={product.name}
          onError={handleImageError}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-2">
          {/* Badge de oferta */}
          {priceInfo.isOnSale && (
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
              -{priceInfo.discountPercentage}% OFF
            </div>
          )}
          
          {/* Badge de producto destacado */}
          {product.featured && (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center">
              <SparklesIcon className="h-3 w-3 mr-1" />
              Destacado
            </div>
          )}
          
          {/* Badge de precio mayorista */}
          {priceInfo.showWholesalePrice && (
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              Mayorista
            </div>
          )}
        </div>
        
        {/* Badge de stock */}
        <div className="absolute top-3 right-3">
          {product.stockQuantity > 0 ? (
            <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              En Stock
            </div>
          ) : (
            <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Agotado
            </div>
          )}
        </div>

        {/* Overlay con acciones */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex space-x-3">
            <Link
              to={`/product/${product._id}`}
              className="bg-white/90 backdrop-blur-sm p-3 rounded-full hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl"
              title="Ver detalles"
            >
              <EyeIcon className="h-5 w-5 text-gray-700" />
            </Link>
            
            {product.stockQuantity > 0 && (
              <button
                onClick={handleAddToCart}
                className="bg-blue-500 hover:bg-blue-600 p-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
                title="Agregar al carrito"
              >
                <ShoppingCartIcon className="h-5 w-5 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido del producto */}
      <div className="p-6 space-y-4">
        {/* Categoría y marca */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{product.category?.name || 'Sin categoría'}</span>
          <span className="font-medium text-blue-600">{product.brand}</span>
        </div>

        {/* Nombre del producto */}
        <Link to={`/product/${product._id}`}>
          <h3 className="font-bold text-gray-900 text-lg line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                className={`h-4 w-4 ${
                  star <= Math.round(product.avgRating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            ({product.avgRating ? product.avgRating.toFixed(1) : '0.0'})
          </span>
        </div>

        {/* Sección de precios actualizada */}
        <div className="space-y-2">
          {/* Precios */}
          <div className="space-y-1">
            {priceInfo.isOnSale ? (
              // Producto en oferta
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-red-600">
                    {formatPrice(priceInfo.finalPrice)}
                  </span>
                  <span className="text-lg text-gray-500 line-through">
                    {formatPrice(priceInfo.originalPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-600 text-sm font-medium">
                    Ahorras {formatPrice(priceInfo.savings)}
                  </span>
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
                    -{priceInfo.discountPercentage}%
                  </span>
                </div>
              </div>
            ) : (
              // Producto sin oferta
              <div className="space-y-1">
                <span className="text-2xl font-bold text-gray-900">
                  {formatPrice(priceInfo.finalPrice)}
                </span>
                
                {/* Mostrar precio minorista como referencia para distribuidores */}
                {priceInfo.showWholesalePrice && priceInfo.originalPrice && (
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500">
                      Precio minorista: {formatPrice(priceInfo.originalPrice)}
                    </div>
                    <div className="text-green-600 text-sm font-medium">
                      Ahorras {formatPrice(priceInfo.savings)} ({Math.round((priceInfo.savings / priceInfo.originalPrice) * 100)}%)
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SKU */}
        <div className="text-xs text-gray-500">
          SKU: {product.sku}
        </div>

        {/* Botón de agregar al carrito */}
        <div className="pt-4">
          {product.stockQuantity > 0 ? (
            <button
              onClick={handleAddToCart}
              className="w-full btn-modern btn-primary group"
            >
              <ShoppingCartIcon className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
              Agregar al carrito
            </button>
          ) : (
            <button
              disabled
              className="w-full btn-modern bg-gray-300 text-gray-500 cursor-not-allowed"
            >
              Producto agotado
            </button>
          )}
        </div>

        {/* Información adicional para distribuidores */}
        {priceInfo.showWholesalePrice && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Modo: {cartType}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;