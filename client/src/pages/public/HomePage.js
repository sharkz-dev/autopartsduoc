import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../../utils/imageHelpers';
import { productService, statsService, categoryService } from '../../services/api';
import ProductCard from '../../components/catalog/ProductCard';
import { 
  ChevronRightIcon, 
  TruckIcon, 
  IdentificationIcon, 
  ShieldCheckIcon, 
  BuildingStorefrontIcon, 
  TagIcon,
  SparklesIcon,
  BoltIcon,
  StarIcon,
  PlayIcon,
  ArrowTrendingUpIcon,
  CubeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

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
        
        // Cargar productos en oferta
        const onSaleResponse = await productService.getProductsOnSale({ 
          limit: 12,
          sort: '-discountPercentage'
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-600 rounded-full animate-ping"></div>
          </div>
          <p className="text-gray-600 font-medium">Cargando experiencia automotriz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center space-y-4 p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-red-600 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-modern btn-primary"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
<div className="min-h-[70vh]">
  {/* Hero Section Innovador */}
  <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
    {/* Elementos decorativos de fondo */}
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-10 left-10 w-40 h-40 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-float"></div>
      <div className="absolute top-20 right-10 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-10 left-1/3 w-56 h-56 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-float" style={{ animationDelay: '4s' }}></div>
    </div>

    <div className="relative container mx-auto px-4 py-6 lg:py-10">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8 animate-slide-in-up">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-purple-300">
              <SparklesIcon className="h-5 w-5" />
              <span className="text-sm font-medium tracking-wide">INNOVACIÓN AUTOMOTRIZ</span>
            </div>
            <h1 className="text-hero bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              El futuro de los repuestos está aquí
            </h1>
            <p className="text-xl text-purple-100 leading-relaxed">
              Descubre la nueva era de compra automotriz con tecnología avanzada, 
              productos certificados y la mejor experiencia del mercado.
            </p>
          </div>

          {/* Botón centrado */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link to="/catalog" className="btn-modern btn-accent group">
              <BoltIcon className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
              Explorar Catálogo
            </Link>
          </div>

          {/* Stats modernos */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-purple-700/30">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{(stats.productCount || 0).toLocaleString()}</div>
              <div className="text-sm text-purple-300">Productos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">24/7</div>
              <div className="text-sm text-purple-300">Soporte</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">99%</div>
              <div className="text-sm text-purple-300">Satisfacción</div>
            </div>
          </div>
        </div>

        {/* Imagen derecha */}
        <div className="relative animate-scale-in">
          <div className="relative z-10">
            <img
              src="/images/hero-modern.jpg"
              alt="Repuestos modernos"
              className="w-full h-auto rounded-3xl shadow-2xl"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent rounded-3xl"></div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>
    </div>
  </section>
      {/* Ofertas Especiales Destacadas */}
      {onSaleProducts.length > 0 && (
        <section className="py-20 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-20 left-20 w-64 h-64 bg-red-400 rounded-full mix-blend-multiply filter blur-xl"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-400 rounded-full mix-blend-multiply filter blur-xl"></div>
          </div>
          
          <div className="relative container mx-auto px-4">
            <div className="text-center mb-16 space-y-4">
              <div className="flex items-center justify-center space-x-2 text-red-600">
                <TagIcon className="h-6 w-6 animate-pulse" />
                <span className="text-sm font-bold tracking-wide uppercase">Ofertas Limitadas</span>
              </div>
              <h2 className="text-title bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">
                🔥 Deals que no puedes perderte
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Aprovecha descuentos increíbles en productos seleccionados. ¡Solo por tiempo limitado!
              </p>
            </div>
            
            <div className="grid-auto-fit mb-12">
              {onSaleProducts.slice(0, 8).map((product, index) => (
                <div 
                  key={product._id} 
                  className="animate-slide-in-up hover-lift"
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <Link to="/catalog?onSale=true" className="btn-modern btn-accent">
                Ver Todas las Ofertas
                <ArrowTrendingUpIcon className="h-5 w-5 ml-2" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Categorías con diseño innovador */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <CubeIcon className="h-6 w-6" />
              <span className="text-sm font-bold tracking-wide uppercase">Categorías</span>
            </div>
            <h2 className="text-title text-gray-800">
              Encuentra exactamente lo que necesitas
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explora nuestra amplia gama de categorías organizadas para que encuentres 
              el repuesto perfecto para tu vehículo.
            </p>
          </div>
          
          <div className="grid-auto-fill">
            {categories.map((category, index) => (
              <Link
                key={category._id}
                to={`/catalog?category=${category._id}`}
                className="group neo-card hover-lift p-6 text-center animate-scale-in"
                style={{animationDelay: `${index * 0.1}s`}}
              >
               <div className="w-20 h-20 mx-auto mb-4 relative">
                  <div className="w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center group-hover:from-purple-200 group-hover:to-blue-200 transition-all duration-300 overflow-hidden">
                    <img
                      src={category.image ? getImageUrl(category.image) : '/placeholder-category.png'}
                      alt={category.name}
                      className="w-full h-full object-cover rounded-2xl"
                      onError={(e) => {
                        e.target.src = '/placeholder-category.png';
                      }}
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity animate-pulse"></div>
                </div>
                <h3 className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">
                  {category.name}
                </h3>
                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRightIcon className="h-4 w-4 mx-auto text-purple-600" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Productos Destacados */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-16">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-purple-600">
                <StarIcon className="h-6 w-6" />
                <span className="text-sm font-bold tracking-wide uppercase">Destacados</span>
              </div>
              <h2 className="text-title text-gray-800">
                Los favoritos de nuestros clientes
              </h2>
              <p className="text-gray-600 max-w-lg">
                Productos seleccionados por su calidad, popularidad y excelentes valoraciones.
              </p>
            </div>
            <Link
              to="/catalog?featured=true"
              className="btn-modern btn-ghost hidden md:flex"
            >
              Ver todos
              <ChevronRightIcon className="h-4 w-4 ml-2" />
            </Link>
          </div>
          
          <div className="grid-auto-fit">
            {featuredProducts.map((product, index) => (
              <div 
                key={product._id} 
                className="animate-slide-in-up hover-lift"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12 md:hidden">
            <Link to="/catalog?featured=true" className="btn-modern btn-ghost">
              Ver todos los destacados
            </Link>
          </div>
        </div>
      </section>

      {/* Beneficios con diseño moderno */}
      <section className="py-20 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '3s'}}></div>
        </div>
        
        <div className="relative container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <div className="flex items-center justify-center space-x-2 text-purple-300">
              <ShieldCheckIcon className="h-6 w-6" />
              <span className="text-sm font-bold tracking-wide uppercase">¿Por qué elegirnos?</span>
            </div>
            <h2 className="text-title text-white">
              La diferencia que nos hace únicos
            </h2>
            <p className="text-purple-100 max-w-2xl mx-auto">
              Combinamos tecnología de vanguardia con experiencia automotriz para ofrecerte 
              la mejor experiencia de compra.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <TruckIcon className="h-8 w-8" />,
                title: "Envío Ultra Rápido",
                description: "Entrega en 24-48 hrs con tracking en tiempo real y seguro premium.",
                color: "from-green-400 to-emerald-500"
              },
              {
                icon: <IdentificationIcon className="h-8 w-8" />,
                title: "100% Originales",
                description: "Productos certificados con garantía de autenticidad y trazabilidad completa.",
                color: "from-blue-400 to-cyan-500"
              },
              {
                icon: <ShieldCheckIcon className="h-8 w-8" />,
                title: "Garantía Total",
                description: "Protección completa con garantía extendida y soporte técnico especializado.",
                color: "from-purple-400 to-pink-500"
              },
              {
                icon: <BuildingStorefrontIcon className="h-8 w-8" />,
                title: "Experiencia Premium",
                description: "Plataforma inteligente con IA para recomendaciones personalizadas.",
                color: "from-yellow-400 to-orange-500"
              }
            ].map((benefit, index) => (
              <div 
                key={index} 
                className="glass-card p-6 text-center group hover-lift animate-slide-in-up"
                style={{animationDelay: `${index * 0.2}s`}}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${benefit.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-purple-200 transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-purple-100 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="space-y-4">
              <h2 className="text-title">
                ¿Listo para la revolución automotriz?
              </h2>
              <p className="text-xl text-purple-100">
                Únete a miles de clientes que ya experimentan el futuro de los repuestos automotrices.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/catalog" className="btn-modern btn-accent">
                <BoltIcon className="h-5 w-5 mr-2" />
                Comenzar Ahora
              </Link>
            </div>
            
            <div className="pt-8 border-t border-purple-400/30">
              <p className="text-sm text-purple-200">
                ✨ Más de 10,000 clientes satisfechos • 🚀 Envíos a todo Chile • 🛡️ Garantía total
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;