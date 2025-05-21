import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productService } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { 
  ShoppingCartIcon, 
  CheckIcon, 
  XMarkIcon,
  TagIcon,
  TruckIcon,
  StarIcon
} from '@heroicons/react/24/solid';
import { Swiper, SwiperSlide } from 'swiper/react';
// Cambio en la forma de importar los módulos de Swiper
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import ProductRating from '../../components/catalog/ProductRating';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const { addToCart, cartType, calculateProductPrice } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  
  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await productService.getProduct(id);
        setProduct(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar producto:', err);
        setError('No se pudo cargar el producto');
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const incrementQuantity = () => {
    if (product && quantity < product.stockQuantity) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p>{error || 'Producto no encontrado'}</p>
          <Link to="/catalog" className="font-medium underline">
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  // Determinar el precio base según el tipo de carrito (B2B o B2C)
  const basePrice = cartType === 'B2B' && product.wholesalePrice 
    ? product.wholesalePrice 
    : product.price;

  // Verificar si el producto está en oferta
  const isOnSale = product.onSale && product.discountPercentage > 0;
  
  // Calcular precio con descuento según tipo de cliente
  let salePrice = null;
  if (isOnSale) {
    if (cartType === 'B2B' && product.wholesalePrice) {
      // Para B2B: Aplicar el descuento al precio mayorista
      const discountAmount = product.wholesalePrice * (product.discountPercentage / 100);
      salePrice = Math.round(product.wholesalePrice - discountAmount);
    } else {
      // Para B2C: Usar el precio de oferta guardado o calcularlo
      salePrice = product.salePrice || Math.round(product.price - (product.price * (product.discountPercentage / 100)));
    }
  }
  
  // Determinar precio final a mostrar
  const displayPrice = isOnSale ? salePrice : basePrice;

  // Formatear precios con separador de miles
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  // Verificar si hay imágenes disponibles
  const hasImages = product.images && product.images.length > 0;
  const defaultImage = 'https://via.placeholder.com/600x400?text=No+Image';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="mb-8">
        <ol className="flex text-sm text-gray-500">
          <li className="flex items-center">
            <Link to="/" className="hover:text-blue-600">Inicio</Link>
            <span className="mx-2">/</span>
          </li>
          <li className="flex items-center">
            <Link to="/catalog" className="hover:text-blue-600">Catálogo</Link>
            <span className="mx-2">/</span>
          </li>
          {product.category && (
            <li className="flex items-center">
              <Link to={`/catalog?category=${product.category._id}`} className="hover:text-blue-600">
                {product.category.name}
              </Link>
              <span className="mx-2">/</span>
            </li>
          )}
          <li className="text-gray-800 font-medium truncate">{product.name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Imágenes del producto */}
        <div>
          {hasImages ? (
            <>
              <Swiper
                spaceBetween={10}
                navigation={true}
                thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                modules={[FreeMode, Navigation, Thumbs]}
                className="rounded-lg overflow-hidden mb-4 relative"
              >
                {/* Badge de descuento */}
                {isOnSale && (
                  <div className="absolute top-0 right-0 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-bl-lg z-10 shadow-md">
                    -{product.discountPercentage}% OFERTA
                  </div>
                )}
                
                {product.images.map((image, index) => (
                  <SwiperSlide key={index}>
                    <div className="h-80 flex items-center justify-center bg-gray-100">
                      <img
                        src={`/uploads/${image}`}
                        alt={`${product.name} - Imagen ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Miniaturas */}
              {product.images.length > 1 && (
                <Swiper
                  onSwiper={setThumbsSwiper}
                  spaceBetween={10}
                  slidesPerView={4}
                  freeMode={true}
                  watchSlidesProgress={true}
                  modules={[FreeMode, Navigation, Thumbs]}
                  className="thumbs-swiper"
                >
                  {product.images.map((image, index) => (
                    <SwiperSlide key={index}>
                      <div className="h-20 cursor-pointer border border-gray-200 rounded overflow-hidden">
                        <img
                          src={`/uploads/${image}`}
                          alt={`Miniatura ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </>
          ) : (
            <div className="h-80 flex items-center justify-center bg-gray-100 rounded-lg">
              <img
                src={defaultImage}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>

        {/* Detalles del producto */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          
          <div className="flex items-center mb-4">
            <div className="flex items-center mr-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(product.avgRating)
                      ? 'text-yellow-500'
                      : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {product.avgRating ? product.avgRating.toFixed(1) : 'Sin valoraciones'}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              SKU: {product.sku}
            </span>
          </div>
          
          <div className="border-t border-b border-gray-200 py-4 mb-6">
            {/* Precio */}
            <div className="mb-4">
              {isOnSale ? (
                <div>
                  <div className="flex items-center mb-1">
                    <span className="text-3xl font-bold text-red-600 mr-2">
                      {formatPrice(displayPrice)}
                    </span>
                    <span className="text-lg text-gray-500 line-through">
                      {formatPrice(basePrice)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <TagIcon className="h-5 w-5 text-red-600 mr-1" />
                    <span className="text-red-600 font-medium">
                      ¡Ahorras {formatPrice(basePrice - displayPrice)}!
                    </span>
                  </div>
                  {cartType === 'B2B' && product.wholesalePrice ? (
                    <div className="mt-1 text-sm text-gray-600">
                      Precio mayorista con descuento del {product.discountPercentage}%
                    </div>
                  ) : (
                    product.saleEndDate && (
                      <div className="mt-1 text-sm text-gray-500">
                        Oferta válida hasta: {new Date(product.saleEndDate).toLocaleDateString()}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(displayPrice)}
                </span>
              )}
              
              {cartType === 'B2B' && product.wholesalePrice ? (
                <p className="text-sm text-gray-500 mt-1">Precio mayorista (B2B)</p>
              ) : null}
            </div>
            
            {/* Disponibilidad */}
            <div className="flex items-center mb-4">
              {product.stockQuantity > 0 ? (
                <div className="flex items-center text-green-600">
                  <CheckIcon className="h-5 w-5 mr-1" />
                  <span>En stock ({product.stockQuantity} disponibles)</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <XMarkIcon className="h-5 w-5 mr-1" />
                  <span>Agotado</span>
                </div>
              )}
            </div>
            
            {/* Marca y distribuidor */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Marca</p>
                <p className="font-medium">{product.brand}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Distribuidor</p>
                <Link 
                  to={`/catalog?distributor=${product.distributor?._id}`} 
                  className="font-medium text-blue-600 hover:underline"
                >
                  {product.distributor?.companyName || product.distributor?.name || 'N/A'}
                </Link>
              </div>
              {product.partNumber && (
                <div>
                  <p className="text-sm text-gray-500">Número de Parte</p>
                  <p className="font-medium">{product.partNumber}</p>
                </div>
              )}
            </div>
            
            {/* Cantidad y botón de compra */}
            {product.stockQuantity > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className={`px-3 py-2 ${
                      quantity <= 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={product.stockQuantity}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 1 && val <= product.stockQuantity) {
                        setQuantity(val);
                      }
                    }}
                    className="w-12 text-center border-0 focus:ring-0"
                  />
                  <button
                    onClick={incrementQuantity}
                    disabled={quantity >= product.stockQuantity}
                    className={`px-3 py-2 ${
                      quantity >= product.stockQuantity ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    +
                  </button>
                </div>
                
                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition"
                >
                  <ShoppingCartIcon className="h-5 w-5 mr-2" />
                  Añadir al carrito
                </button>
              </div>
            )}
          </div>
          
          {/* Envío */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <div className="flex items-start">
              <TruckIcon className="h-6 w-6 text-blue-600 mr-3 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Información de envío</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Envío a todo el país. Los pedidos realizados antes de las 15:00 hrs. son despachados el mismo día.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs para detalles adicionales */}
      <div className="mb-12">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-6 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Descripción detallada
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`py-4 px-6 font-medium text-sm ${
                activeTab === 'specs'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Especificaciones
            </button>
            <button
              onClick={() => setActiveTab('compatibility')}
              className={`py-4 px-6 font-medium text-sm ${
                activeTab === 'compatibility'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Compatibilidad
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 px-6 font-medium text-sm ${
                activeTab === 'reviews'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Valoraciones
            </button>
          </nav>
        </div>
        
        <div className="py-6">
          {activeTab === 'details' && (
            <div className="prose max-w-none">
              <p>{product.description}</p>
            </div>
          )}
          
          {activeTab === 'specs' && (
            <div className="overflow-hidden bg-white border border-gray-200 rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500 bg-gray-50 text-left">Marca</th>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.brand}</td>
                  </tr>
                  <tr>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500 bg-gray-50 text-left">SKU</th>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.sku}</td>
                  </tr>
                  {product.partNumber && (
                    <tr>
                      <th className="px-6 py-4 text-sm font-medium text-gray-500 bg-gray-50 text-left">Número de parte</th>
                      <td className="px-6 py-4 text-sm text-gray-900">{product.partNumber}</td>
                    </tr>
                  )}
                  <tr>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500 bg-gray-50 text-left">Categoría</th>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.category?.name || 'N/A'}</td>
                  </tr>
                  {/* Se pueden agregar más especificaciones aquí */}
                </tbody>
              </table>
            </div>
          )}
          
          {activeTab === 'compatibility' && (
            <div>
              {product.compatibleModels && product.compatibleModels.length > 0 ? (
                <div className="overflow-hidden bg-white border border-gray-200 rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modelo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Año</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {product.compatibleModels.map((model, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{model.make}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{model.model}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{model.year}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No hay información de compatibilidad disponible para este producto.</p>
              )}
            </div>
          )}
          
          {activeTab === 'reviews' && (
            <div>
              <ProductRating product={product} />
            </div>
          )}
        </div>
      </div>

      {/* Productos relacionados se cargarían aquí */}
    </div>
  );
};

export default ProductDetailsPage;