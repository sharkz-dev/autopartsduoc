import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../../utils/imageHelpers';
import { productService, statsService, categoryService } from '../../services/api';
import ProductCard from '../../components/catalog/ProductCard';
import { ChevronRightIcon, TruckIcon, IdentificationIcon, ShieldCheckIcon, BuildingStorefrontIcon, TagIcon } from '@heroicons/react/24/outline';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [onSaleProducts, setOnSaleProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    productCount: 0,
    categoryCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar productos destacados
        const featuredResponse = await productService.getProducts({ featured: true, limit: 8 });
        setFeaturedProducts(featuredResponse.data.data);
        
        // Cargar productos en oferta - Priorizar por mayor descuento
        const onSaleResponse = await productService.getProductsOnSale({ 
          limit: 12,  // Aumentamos el límite para mostrar más ofertas
          sort: '-discountPercentage' // Ordenar por mayor descuento primero
        });
        setOnSaleProducts(onSaleResponse.data.data);
        
        // Cargar categorías principales
        const categoriesResponse = await categoryService.getCategories();
        setCategories(categoriesResponse.data.data.filter(cat => !cat.parent).slice(0, 8));
        
        // Cargar estadísticas públicas
        const statsResponse = await statsService.getPublicStats();
        setStats(statsResponse.data.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar datos de la página principal:', error);
        setError('Error al cargar los datos. Por favor, intente de nuevo más tarde.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4" role="alert">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white rounded-xl overflow-hidden">
        <div className="container mx-auto px-4 py-12 md:py-24 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Encuentre los repuestos de auto que necesita
            </h1>
            <p className="text-xl text-blue-100">
              Miles de productos de calidad para tu vehículo
            </p>
            <div className="flex space-x-4">
              <Link
                to="/catalog"
                className="inline-block bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition"
              >
                Ver Catálogo
              </Link>
              <Link
                to="/about"
                className="inline-block bg-transparent border-2 border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-white hover:text-blue-600 transition"
              >
                Conocer más
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 mt-8 md:mt-0">
            <img
              src="/images/hero-image.jpg"
              alt="Repuestos de auto"
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="bg-gray-100 rounded-lg p-8 shadow-sm">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {(stats.productCount || 0).toLocaleString()}
              </div>
              <p className="text-gray-600">Productos disponibles</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {(stats.categoryCount || 0).toLocaleString()}
              </div>
              <p className="text-gray-600">Categorías de productos</p>
            </div>
          </div>
        </div>
      </section>

      {/* Ofertas Especiales - Sección Destacada */}
      {onSaleProducts.length > 0 && (
        <section className="bg-red-50 rounded-xl p-8 shadow-md border border-red-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-red-600 flex items-center">
              <TagIcon className="h-8 w-8 mr-2 text-red-600" />
              ¡Ofertas Especiales!
            </h2>
            <Link
              to="/catalog?onSale=true"
              className="flex items-center text-red-600 hover:text-red-800 transition font-medium"
            >
              Ver todas las ofertas
              <ChevronRightIcon className="h-5 w-5 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {onSaleProducts.slice(0, 8).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Categorías Populares */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Categorías Populares</h2>
          <Link
            to="/catalog"
            className="flex items-center text-blue-600 hover:text-blue-800 transition"
          >
            Ver todas
            <ChevronRightIcon className="h-5 w-5 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link
              key={category._id}
              to={`/catalog?category=${category._id}`}
              className="group bg-white rounded-lg shadow p-4 text-center hover:shadow-md transition"
            >
              <div className="w-16 h-16 mx-auto mb-3 overflow-hidden rounded-full bg-blue-100">
                <img
                  src={category.image ? getImageUrl(category.image) : '/placeholder-category.png'}
                  alt={category.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-category.png';
                  }}
                />
              </div>
              <h3 className="font-medium text-gray-800 group-hover:text-blue-600 transition">
                {category.name}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Productos Destacados */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Productos Destacados</h2>
          <Link
            to="/catalog?featured=true"
            className="flex items-center text-blue-600 hover:text-blue-800 transition"
          >
            Ver todos
            <ChevronRightIcon className="h-5 w-5 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">¿Por qué elegirnos?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TruckIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Envío Rápido</h3>
            <p className="text-gray-600">Entrega de productos en tiempo récord a todo el país.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <IdentificationIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Productos Originales</h3>
            <p className="text-gray-600">Garantizamos la autenticidad de todos nuestros productos.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Garantía de Calidad</h3>
            <p className="text-gray-600">Todos los productos cuentan con garantía de fábrica.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BuildingStorefrontIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Calidad Garantizada</h3>
            <p className="text-gray-600">Trabajamos solo con productos verificados y de alta calidad.</p>
          </div>
        </div>
      </section>

      {/* Más Ofertas (Mostrar el resto de productos en oferta si hay más de 8) */}
      {onSaleProducts.length > 8 && (
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Más Ofertas Imperdibles</h2>
            <Link
              to="/catalog?onSale=true"
              className="flex items-center text-blue-600 hover:text-blue-800 transition"
            >
              Ver todas
              <ChevronRightIcon className="h-5 w-5 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {onSaleProducts.slice(8, 12).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;