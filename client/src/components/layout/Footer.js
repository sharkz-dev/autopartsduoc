import React from 'react';
import { Link } from 'react-router-dom';
import { 
  TruckIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  HeartIcon,
  StarIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  ClockIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-float" style={{animationDelay: '3s'}}></div>
      </div>
      
      <div className="relative">
       
              

        {/* Contenido principal del footer */}
        <div className="container mx-auto px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Logo y descripción */}
            <div className="lg:col-span-1 space-y-6">
              <div className="space-y-4">
                <Link to="/" className="flex items-center space-x-3 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <TruckIcon className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                      AutoParts
                    </h2>
                    <span className="text-xs text-blue-300">Innovación Automotriz</span>
                  </div>
                </Link>
                
                <p className="text-blue-100 leading-relaxed">
                  La plataforma más innovadora para comprar repuestos de autos con 
                  garantía de calidad, tecnología avanzada y la mejor experiencia del mercado.
                </p>
              </div>
              
              {/* Redes sociales mejoradas */}
              <div className="space-y-4">
                <h4 className="font-semibold text-white">Síguenos</h4>
                <div className="flex space-x-4">
                  {[
                    { 
                      href: "https://facebook.com", 
                      icon: "📘", 
                      name: "Facebook",
                      color: "hover:bg-blue-600"
                    },
                    { 
                      href: "https://instagram.com", 
                      icon: "📷", 
                      name: "Instagram",
                      color: "hover:bg-pink-600"
                    },
                    { 
                      href: "https://twitter.com", 
                      icon: "🐦", 
                      name: "Twitter",
                      color: "hover:bg-sky-500"
                    },
                    { 
                      href: "https://youtube.com", 
                      icon: "📺", 
                      name: "YouTube",
                      color: "hover:bg-red-600"
                    },
                    { 
                      href: "https://tiktok.com", 
                      icon: "🎵", 
                      name: "TikTok",
                      color: "hover:bg-black"
                    }
                  ].map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-xl transition-all duration-300 hover:scale-110 hover:shadow-lg ${social.color} border border-white/20`}
                      title={social.name}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Enlaces de navegación */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                Navegación
              </h3>
              <ul className="space-y-3">
                {[
                  { to: "/", label: "🏠 Inicio" },
                  { to: "/catalog", label: "🛒 Catálogo" },
                  { to: "/catalog?featured=true", label: "⭐ Destacados" },
                  { to: "/catalog?onSale=true", label: "🔥 Ofertas" },
                  { to: "/about", label: "ℹ️ Nosotros" },
                  { to: "/contact", label: "📞 Contacto" }
                ].map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-blue-100 hover:text-white transition-colors duration-300 flex items-center group"
                    >
                      <span className="group-hover:translate-x-1 transition-transform duration-300">
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categorías populares */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                Categorías Populares
              </h3>
              <ul className="space-y-3">
                {[
                  { to: "/catalog?category=motor", label: "🔧 Motor" },
                  { to: "/catalog?category=frenos", label: "🛑 Frenos" },
                  { to: "/catalog?category=suspension", label: "🚗 Suspensión" },
                  { to: "/catalog?category=transmision", label: "⚙️ Transmisión" },
                  { to: "/catalog?category=electrico", label: "⚡ Eléctrico" },
                  { to: "/catalog?category=carroceria", label: "🚘 Carrocería" }
                ].map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-blue-100 hover:text-white transition-colors duration-300 flex items-center group"
                    >
                      <span className="group-hover:translate-x-1 transition-transform duration-300">
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Información de contacto y servicios */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                Contacto & Servicios
              </h3>
              
              {/* Información de contacto */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPinIcon className="h-5 w-5 text-blue-300 mt-1 flex-shrink-0" />
                  <div className="text-blue-100">
                    <p className="font-medium">Oficina Central</p>
                    <p className="text-sm">Av. Providencia 1234</p>
                    <p className="text-sm">Santiago, Chile</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <PhoneIcon className="h-5 w-5 text-blue-300 flex-shrink-0" />
                  <div className="text-blue-100">
                    <p className="font-medium">+56 2 2345 6789</p>
                    <p className="text-sm">Lun - Vie: 9:00 - 18:00</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="h-5 w-5 text-blue-300 flex-shrink-0" />
                  <div className="text-blue-100">
                    <p className="font-medium">ventas@autoparts.com</p>
                    <p className="text-sm">Respuesta en 24hrs</p>
                  </div>
                </div>
              </div>
              
              {/* Servicios destacados */}
              <div className="space-y-3">
                <h4 className="font-semibold text-white text-sm">🚀 Nuestros Servicios</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { icon: "🚚", text: "Envío 24-48hrs" },
                    { icon: "🛡️", text: "Garantía Total" },
                    { icon: "💳", text: "Pago Seguro" },
                    { icon: "📞", text: "Soporte 24/7" }
                  ].map((service, index) => (
                    <div key={index} className="flex items-center space-x-2 text-blue-100">
                      <span>{service.icon}</span>
                      <span>{service.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de garantías y certificaciones */}
        <div className="border-t border-white/10">
          <div className="container mx-auto px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              {[
                {
                  icon: <ShieldCheckIcon className="h-8 w-8" />,
                  title: "Garantía Total",
                  description: "100% productos originales"
                },
                {
                  icon: <TruckIcon className="h-8 w-8" />,
                  title: "Envío Rápido",
                  description: "24-48 horas a todo Chile"
                },
                {
                  icon: <CreditCardIcon className="h-8 w-8" />,
                  title: "Pago Seguro",
                  description: "Múltiples métodos de pago"
                },
                {
                  icon: <ClockIcon className="h-8 w-8" />,
                  title: "Soporte 24/7",
                  description: "Atención personalizada"
                }
              ].map((feature, index) => (
                <div key={index} className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                  <div className="text-blue-300">
                    {feature.icon}
                  </div>
                  <h4 className="font-semibold text-white">{feature.title}</h4>
                  <p className="text-xs text-blue-200">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer inferior */}
        <div className="border-t border-white/10">
          <div className="container mx-auto px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-blue-200">
                <p className="flex items-center">
                  &copy; {new Date().getFullYear()} AutoParts. Todos los derechos reservados.
                </p>
                <div className="flex items-center space-x-4">
                  <Link to="/privacy" className="hover:text-white transition-colors">
                    Política de Privacidad
                  </Link>
                  <span className="text-white/30">•</span>
                  <Link to="/terms" className="hover:text-white transition-colors">
                    Términos de Uso
                  </Link>
                  <span className="text-white/30">•</span>
                  <Link to="/cookies" className="hover:text-white transition-colors">
                    Cookies
                  </Link>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <p className="text-sm text-blue-200 flex items-center">
                  Hecho con <HeartIcon className="h-4 w-4 text-red-400 mx-1" /> en Chile
                </p>
                
                {/* Métodos de pago */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-blue-300">Pagos:</span>
                  <div className="flex space-x-1">
                    {['💳', '🏦', '📱'].map((payment, index) => (
                      <span key={index} className="text-lg">{payment}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botón volver arriba */}
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50 flex items-center justify-center group"
          title="Volver arriba"
        >
          <ArrowUpIcon className="h-5 w-5 group-hover:-translate-y-1 transition-transform duration-300" />
        </button>
      </div>
    </footer>
  );
};

export default Footer;