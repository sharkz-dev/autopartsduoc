import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { 
  TrashIcon, 
  ShoppingBagIcon,
  ArrowRightIcon,
  ExclamationCircleIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { getProductImageUrl, handleImageError } from '../../utils/imageHelpers';

const CartPage = () => {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    cartType,
    taxRate,
    getSubtotal,
    getTaxAmount,
    getShippingAmount,
    getFinalTotal,
    calculateFinalPrice,
    getPriceInfo
  } = useCart();
  
  const { isAuthenticated, canAccessWholesalePrices } = useAuth();
  const navigate = useNavigate();
  
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  
  // Debug para ver el contenido del carrito
  useEffect(() => {
    console.log("Contenido del carrito:", cartItems);
  }, [cartItems]);
  
  // Formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(value);
  };
  
  // Manejar cambio de cantidad
  const handleQuantityChange = (productId, newQuantity, maxQuantity) => {
    // Validar que la cantidad sea un número positivo y no supere el stock
    newQuantity = Math.max(1, Math.min(maxQuantity, newQuantity));
    updateQuantity(productId, newQuantity);
  };
  
  // Ir al checkout
  const goToCheckout = () => {
    if (isAuthenticated) {
      navigate('/checkout');
    } else {
      navigate('/login', { state: { from: '/checkout' } });
    }
  };
  
  // Aplicar cupón (simulado)
  const applyCoupon = (e) => {
    e.preventDefault();
    
    if (!couponCode.trim()) {
      setCouponError('Por favor ingrese un código de cupón');
      setCouponSuccess('');
      return;
    }
    
    // Simular verificación de cupón
    if (couponCode.toUpperCase() === 'DESCUENTO10') {
      setCouponSuccess('¡Cupón aplicado con éxito! 10% de descuento.');
      setCouponError('');
    } else {
      setCouponError('Código de cupón inválido o expirado');
      setCouponSuccess('');
    }
  };
  
  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Carrito de Compras ({cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'})
      </h1>
      
      {cartItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <ShoppingBagIcon className="h-16 w-16 mx-auto text-gray-400" />
          <h2 className="mt-4 text-lg font-medium text-gray-900">Tu carrito está vacío</h2>
          <p className="mt-2 text-gray-500">
            Parece que aún no has agregado productos a tu carrito.
          </p>
          <Link
            to="/catalog"
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Explorar Catálogo
          </Link>
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Productos del carrito */}
          <div className="lg:col-span-8">
            <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
              <ul className="divide-y divide-gray-200">
                {cartItems.map((item) => {
                  // ✅ USAR LÓGICA CORREGIDA: Obtener información completa de precios
                  const priceInfo = getPriceInfo(item);
                  const finalPrice = calculateFinalPrice(item);
                  
                  return (
                    <li key={item._id} className="p-4 sm:p-6 flex flex-col sm:flex-row">
                      {/* Imagen del producto */}
                      <div className="flex-shrink-0 rounded-lg overflow-hidden w-full sm:w-24 h-24 bg-gray-100 mb-4 sm:mb-0">
                        <img
                          src={getProductImageUrl(item)}
                          alt={item.name}
                          onError={(e) => handleImageError(e)}
                          className="w-full h-full object-center object-cover"
                        />
                      </div>
                      
                      {/* Información del producto */}
                      <div className="flex-1 sm:ml-6 flex flex-col">
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <h3 className="text-base font-medium text-gray-900">
                              <Link to={`/product/${item._id}`} className="hover:text-blue-600">
                                {item.name}
                              </Link>
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Marca: {item.brand}
                            </p>
                            
                            {/* ✅ INFORMACIÓN DE PRECIOS CORREGIDA */}
                            <div className="mt-2 space-y-1">
                              {/* Mostrar tipo de precio */}
                              {priceInfo.isUsingWholesalePrice && (
                                <div className="flex items-center space-x-2">
                                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                                    💼 Precio Mayorista
                                  </span>
                                  {canAccessWholesalePrices() && (
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                                      ✓ Aprobado
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {/* Mostrar precios */}
                              {priceInfo.isOnSale ? (
                                // Producto en oferta
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-lg font-bold text-red-600">
                                      {formatCurrency(finalPrice)}
                                    </span>
                                    <span className="text-sm text-gray-500 line-through">
                                      {formatCurrency(priceInfo.basePrice)}
                                    </span>
                                    <TagIcon className="h-4 w-4 text-red-500" />
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
                                      -{priceInfo.discountPercentage}% OFF
                                    </span>
                                    <span className="text-green-600 text-xs font-medium">
                                      Ahorras {formatCurrency(priceInfo.savings)}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                // Producto sin oferta
                                <div className="space-y-1">
                                  <span className="text-lg font-bold text-gray-900">
                                    {formatCurrency(finalPrice)}
                                  </span>
                                  
                                  {/* Mostrar precio minorista como referencia para distribuidores */}
                                  {priceInfo.isUsingWholesalePrice && priceInfo.originalPrice && (
                                    <div className="space-y-1">
                                      <div className="text-xs text-gray-500">
                                        Precio minorista: {formatCurrency(priceInfo.originalPrice)}
                                      </div>
                                      <div className="text-green-600 text-xs font-medium">
                                        Ahorras {formatCurrency(priceInfo.savings)} ({Math.round((priceInfo.savings / priceInfo.originalPrice) * 100)}%)
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <p className="text-xs text-gray-500">
                                Precio unitario • Total: {formatCurrency(finalPrice * item.quantity)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="ml-4 flex items-start">
                            <p className="text-lg font-bold text-gray-900">
                              {formatCurrency(finalPrice * item.quantity)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Acciones */}
                        <div className="mt-4 flex justify-between items-center">
                          {/* Selector de cantidad */}
                          <div className="flex items-center border rounded">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item._id, item.quantity - 1, item.stockQuantity)}
                              className="p-2 text-gray-600 hover:text-gray-800"
                            >
                              <span className="sr-only">Menos</span>
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <input
                              type="text"
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) {
                                  handleQuantityChange(item._id, val, item.stockQuantity);
                                }
                              }}
                              className="w-12 text-center border-none focus:ring-0 p-1 text-gray-900"
                            />
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item._id, item.quantity + 1, item.stockQuantity)}
                              className="p-2 text-gray-600 hover:text-gray-800"
                              disabled={item.quantity >= item.stockQuantity}
                            >
                              <span className="sr-only">Más</span>
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* Indicador de stock */}
                          {item.quantity >= item.stockQuantity && (
                            <p className="text-xs text-amber-600 flex items-center">
                              <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                              Stock máximo
                            </p>
                          )}
                          
                          {/* Botón eliminar */}
                          <button
                            type="button"
                            onClick={() => removeFromCart(item._id)}
                            className="text-sm font-medium text-red-600 hover:text-red-500 flex items-center"
                          >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              
              {/* Botones de acción */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
                <button
                  type="button"
                  onClick={() => clearCart()}
                  className="text-sm font-medium text-red-600 hover:text-red-500"
                >
                  Vaciar carrito
                </button>
                <Link
                  to="/catalog"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Seguir comprando
                </Link>
              </div>
            </div>
          </div>
          
          {/* Resumen del carrito */}
          <div className="lg:col-span-4">
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Resumen de la orden</h2>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                {/* Cupón */}
                <form onSubmit={applyCoupon}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código de descuento
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Ingresa tu código"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Aplicar
                    </button>
                  </div>
                  {couponError && (
                    <p className="mt-1 text-xs text-red-600">{couponError}</p>
                  )}
                  {couponSuccess && (
                    <p className="mt-1 text-xs text-green-600">{couponSuccess}</p>
                  )}
                </form>
                
                {/* Detalles del costo */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-600">Subtotal</p>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(getSubtotal())}</p>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-600">Impuestos ({taxRate}%)</p>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(getTaxAmount())}</p>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-600">Envío</p>
                    <p className="text-sm font-medium text-gray-900">
                      {getShippingAmount() === 0 
                        ? 'Gratis' 
                        : formatCurrency(getShippingAmount())}
                    </p>
                  </div>
                  {couponSuccess && (
                    <div className="flex justify-between items-center mb-2 text-green-600">
                      <p className="text-sm">Descuento (10%)</p>
                      <p className="text-sm font-medium">-{formatCurrency(getSubtotal() * 0.1)}</p>
                    </div>
                  )}
                </div>
                
                {/* Total */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-base font-medium text-gray-900">Total</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {couponSuccess 
                        ? formatCurrency(getFinalTotal() * 0.9) 
                        : formatCurrency(getFinalTotal())}
                    </p>
                  </div>
                </div>
                
                {/* Información del tipo de carrito */}
                <div className="bg-gray-50 p-4 rounded-md mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Modo de compra: </span>
                      {cartType === 'B2B' ? 'Mayorista (B2B)' : 'Cliente final (B2C)'}
                    </p>
                    {cartType === 'B2B' && (
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                        💼 B2B
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    El modo se asigna automáticamente según tu tipo de cuenta.
                  </p>
                  
                  {/* ✅ INFORMACIÓN ADICIONAL PARA DISTRIBUIDORES */}
                  {cartType === 'B2B' && canAccessWholesalePrices() && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex items-center space-x-1 text-xs text-green-600">
                        <span>✓</span>
                        <span>Distribuidor aprobado - Precios mayoristas aplicados</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Botón de checkout */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <button
                  type="button"
                  onClick={goToCheckout}
                  className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Proceder al pago
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </button>
                {!isAuthenticated && (
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    Deberás iniciar sesión para completar tu compra
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;