import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  StarIcon, 
  ShieldCheckIcon, 
  TruckIcon, 
  CogIcon,
  UsersIcon,
  GlobeAmericasIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ChevronRightIcon,
  PlayIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const AboutPage = () => {
  const [activeTab, setActiveTab] = useState('story');
  const [statsAnimated, setStatsAnimated] = useState(false);
  const [visibleCards, setVisibleCards] = useState(new Set());
  const [showVideoModal, setShowVideoModal] = useState(false);
  

  const YOUTUBE_VIDEO_ID = 'dQw4w9WgXcQ'; 

  // Función para extraer ID de YouTube de una URL completa
  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  
  // Función para scroll suave a sección
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showVideoModal) {
        setShowVideoModal(false);
      }
    };

    if (showVideoModal) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showVideoModal]);

  // Estadísticas animadas
  const stats = [
    { icon: <UsersIcon className="h-8 w-8" />, number: 15000, suffix: '+', label: 'Clientes Satisfechos', color: 'from-blue-500 to-cyan-500' },
    { icon: <CogIcon className="h-8 w-8" />, number: 50000, suffix: '+', label: 'Repuestos en Stock', color: 'from-purple-500 to-pink-500' },
    { icon: <GlobeAmericasIcon className="h-8 w-8" />, number: 25, suffix: '', label: 'Años de Experiencia', color: 'from-green-500 to-emerald-500' },
    { icon: <TruckIcon className="h-8 w-8" />, number: 98, suffix: '%', label: 'Entregas a Tiempo', color: 'from-orange-500 to-red-500' }
  ];

  // Valores de la empresa
  const values = [
    {
      icon: <ShieldCheckIcon className="h-12 w-12" />,
      title: 'Calidad Garantizada',
      description: 'Solo trabajamos con las mejores marcas y proveedores certificados para asegurar la máxima calidad.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <TruckIcon className="h-12 w-12" />,
      title: 'Entrega Rápida',
      description: 'Sistema de logística optimizado para entregas en 24-48 horas en todo el territorio nacional.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: <AcademicCapIcon className="h-12 w-12" />,
      title: 'Experiencia Técnica',
      description: 'Equipo de especialistas con más de 25 años de experiencia en el sector automotriz.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: <UsersIcon className="h-12 w-12" />,
      title: 'Atención Personalizada',
      description: 'Asesoramiento técnico especializado para encontrar exactamente lo que necesitas.',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  // Equipo de trabajo
  const team = [
    {
      name: 'Javier Jara',
      position: 'CEO & Fundador',
      experience: '25 años',
      specialty: 'Estrategia y Desarrollo',
      image: 'https://sdmntprwestus3.oaiusercontent.com/files/00000000-7e7c-61fd-8915-0228153ad5d9/raw?se=2025-06-05T06%3A20%3A27Z&sp=r&sv=2024-08-04&sr=b&scid=71324247-c732-59ae-86ca-dd3ec0a88c57&skoid=04233560-0ad7-493e-8bf0-1347c317d021&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-06-04T17%3A26%3A43Z&ske=2025-06-05T17%3A26%3A43Z&sks=b&skv=2024-08-04&sig=5zIda/E3SeS54%2B5mzE2xRHQ4WxDFL/Q1KACEnaX2XXM%3D'
    },
    {
      name: 'Narayani Garcia',
      position: 'Directora Técnica',
      experience: '20 años',
      specialty: 'Ingeniería Automotriz',
      image: 'https://sdmntprsouthcentralus.oaiusercontent.com/files/00000000-8130-61f7-bdc6-d16136927f07/raw?se=2025-06-05T06%3A20%3A27Z&sp=r&sv=2024-08-04&sr=b&scid=5da5878d-8abc-568d-88b1-707b5d7d5a09&skoid=04233560-0ad7-493e-8bf0-1347c317d021&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-06-04T17%3A28%3A00Z&ske=2025-06-05T17%3A28%3A00Z&sks=b&skv=2024-08-04&sig=qAreIm87vNTeKUvwvo7ruy7fCcGw4ztnJQHmvjrpyyo%3D'
    },
    {
      name: 'Pablo Hernández',
      position: 'Gerente de Operaciones',
      experience: '18 años',
      specialty: 'Logística y Distribución',
      image: 'https://sdmntprsouthcentralus.oaiusercontent.com/files/00000000-7de0-61f7-9d2a-425fd6b01a8c/raw?se=2025-06-05T06%3A20%3A27Z&sp=r&sv=2024-08-04&sr=b&scid=4571b275-366c-5da8-ba5f-f1441e43ab9a&skoid=04233560-0ad7-493e-8bf0-1347c317d021&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-06-05T04%3A29%3A34Z&ske=2025-06-06T04%3A29%3A34Z&sks=b&skv=2024-08-04&sig=qEzCxpfK1SJDULm3/IIA8jlqJ%2BkvgBDd1lKGYCKiGTU%3D'
    },
    {
      name: 'Ana Martínez',
      position: 'Jefa de Atención al Cliente',
      experience: '15 años',
      specialty: 'Servicio y Soporte',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face'
    }
  ];

  // Timeline de la empresa
  const timeline = [
    { year: '1999', title: 'Fundación', description: 'Inicio como pequeño taller familiar especializado en repuestos europeos.' },
    { year: '2005', title: 'Expansión Digital', description: 'Lanzamiento de nuestra primera plataforma de ventas online.' },
    { year: '2010', title: 'Certificación Internacional', description: 'Obtención de certificaciones ISO y alianzas con marcas premium.' },
    { year: '2015', title: 'Cobertura Nacional', description: 'Ampliación de cobertura a todo Chile con centros de distribución.' },
    { year: '2020', title: 'Transformación Tecnológica', description: 'Implementación de IA y automatización en procesos.' },
    { year: '2024', title: 'Líder del Mercado', description: 'Reconocidos como la empresa líder en repuestos automotrices de Chile.' }
  ];

  // Animación de números
  const useCountUp = (end, duration = 2000) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
      if (!statsAnimated) return;
      
      let startTime;
      const animate = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        setCount(Math.floor(progress * end));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }, [end, duration, statsAnimated]);
    
    return count;
  };

  // Efecto de scroll para animaciones
  useEffect(() => {
    const handleScroll = () => {
      const statsSection = document.getElementById('stats-section');
      if (statsSection) {
        const rect = statsSection.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setStatsAnimated(true);
        }
      }

      // Animar cards de valores
      values.forEach((_, index) => {
        const card = document.getElementById(`value-card-${index}`);
        if (card) {
          const rect = card.getBoundingClientRect();
          if (rect.top < window.innerHeight - 100) {
            setVisibleCards(prev => new Set([...prev, index]));
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const StatCard = ({ stat, index }) => {
    const animatedNumber = useCountUp(stat.number);
    
    return (
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r opacity-75 rounded-2xl blur group-hover:blur-md transition-all duration-300" 
             style={{background: `linear-gradient(135deg, ${stat.color.split(' ')[1]}, ${stat.color.split(' ')[3]})`}}></div>
        <div className="relative bg-white rounded-2xl p-8 shadow-xl group-hover:shadow-2xl transition-all duration-300 border border-gray-100">
          <div className={`w-16 h-16 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
            {stat.icon}
          </div>
          <div className="text-4xl font-black text-gray-900 mb-2">
            {animatedNumber.toLocaleString()}{stat.suffix}
          </div>
          <div className="text-gray-600 font-medium">{stat.label}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-40 h-40 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-float"></div>
          <div className="absolute top-40 right-20 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 left-1/3 w-56 h-56 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-float" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="relative container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-6">
              <div className="flex items-center justify-center space-x-2 text-blue-300">
                <WrenchScrewdriverIcon className="h-8 w-8" />
                <span className="text-lg font-bold tracking-widest uppercase">Sobre Nosotros</span>
              </div>
              
              <h1 className="text-6xl md:text-7xl font-black leading-tight">
                <span className="bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                  Más que repuestos,
                </span>
                <br />
                <span className="text-white">somos tu socio</span>
              </h1>
              
              <p className="text-2xl text-blue-100 leading-relaxed max-w-3xl mx-auto">
                Durante más de 25 años hemos sido el aliado confiable de miles de conductores, 
                talleres y empresas en toda Chile, proporcionando repuestos de la más alta calidad.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button 
                onClick={() => setShowVideoModal(true)}
                className="group bg-white text-blue-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 flex items-center space-x-3 shadow-xl hover:shadow-2xl"
              >
                <PlayIcon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                <span>Ver Video Corporativo</span>
              </button>
              
              <button 
                onClick={() => scrollToSection('content-tabs')}
                className="group border-2 border-white text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white hover:text-blue-900 transition-all duration-300 flex items-center space-x-3"
              >
                <span>Conocer Más</span>
                <ChevronRightIcon className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section id="stats-section" className="py-20 -mt-16 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <StatCard key={index} stat={stat} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Navegación por pestañas */}
      <section id="content-tabs" className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Pestañas */}
            <div className="flex flex-wrap justify-center mb-16 bg-white rounded-2xl p-2 shadow-xl">
              {[
                { id: 'story', label: 'Nuestra Historia', icon: <BuildingOfficeIcon className="h-5 w-5" /> },
                { id: 'values', label: 'Valores', icon: <StarIcon className="h-5 w-5" /> },
                { id: 'team', label: 'Equipo', icon: <UsersIcon className="h-5 w-5" /> },
                { id: 'timeline', label: 'Cronología', icon: <ClockIcon className="h-5 w-5" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Contenido de pestañas */}
            <div className="min-h-[500px]">
              {activeTab === 'story' && (
                <div className="space-y-12 animate-fade-in">
                  <div className="text-center space-y-6">
                    <h2 className="text-4xl font-bold text-gray-900">Nuestra Historia</h2>
                    <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                      Comenzamos como un pequeño taller familiar en 1999, con la visión de democratizar 
                      el acceso a repuestos automotrices de calidad en Chile.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold text-gray-900">Del garaje al liderazgo nacional</h3>
                      <p className="text-gray-600 leading-relaxed">
                        Lo que comenzó como una pasión por los automóviles en un pequeño garaje, 
                        se ha transformado en la empresa líder de repuestos automotrices de Chile. 
                        Nuestra historia está marcada por la innovación constante, la búsqueda 
                        incansable de la calidad y el compromiso inquebrantable con nuestros clientes.
                      </p>
                      
                      <div className="space-y-4">
                        <Link to="/catalog" className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 transition-colors">
                          <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                          <span>Más de 50,000 referencias en stock permanente</span>
                        </Link>
                        <Link to="/catalog" className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 transition-colors">
                          <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                          <span>Red de distribución en todo el territorio nacional</span>
                        </Link>
                        <div className="flex items-center space-x-3">
                          <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">Alianzas estratégicas con las mejores marcas mundiales</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">Tecnología de vanguardia en gestión de inventarios</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
                        <img 
                          src="https://www.c3carecarcenter.com/wp-content/uploads/2025/05/Imagenes-de-Familia-de-3-El-Auto-Perfecto-para-2025-1038x576.webp"
                          alt="Instalaciones AutoParts"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-6 -right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-2xl shadow-xl">
                        <div className="text-3xl font-bold">25+</div>
                        <div className="text-sm opacity-90">Años de experiencia</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'values' && (
                <div className="space-y-12 animate-fade-in">
                  <div className="text-center space-y-6">
                    <h2 className="text-4xl font-bold text-gray-900">Nuestros Valores</h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                      Estos principios guían cada decisión que tomamos y cada servicio que brindamos.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {values.map((value, index) => (
                      <div
                        key={index}
                        id={`value-card-${index}`}
                        className={`relative group transform transition-all duration-700 ${
                          visibleCards.has(index) ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                        }`}
                        style={{transitionDelay: `${index * 200}ms`}}
                      >
                        <div className="bg-white rounded-3xl p-8 shadow-xl group-hover:shadow-2xl transition-all duration-300 border border-gray-100 group-hover:border-blue-200">
                          <div className={`w-20 h-20 bg-gradient-to-r ${value.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                            {value.icon}
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-4">{value.title}</h3>
                          <p className="text-gray-600 leading-relaxed">{value.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'team' && (
                <div className="space-y-12 animate-fade-in">
                  <div className="text-center space-y-6">
                    <h2 className="text-4xl font-bold text-gray-900">Nuestro Equipo</h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                      Profesionales apasionados por la excelencia y comprometidos con tu satisfacción.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {team.map((member, index) => (
                      <div key={index} className="group">
                        <div className="bg-white rounded-3xl p-6 shadow-xl group-hover:shadow-2xl transition-all duration-300 text-center">
                          <div className="relative inline-block mb-6">
                            <img 
                              src={member.image}
                              alt={member.name}
                              className="w-24 h-24 rounded-full object-cover mx-auto group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-white rounded-full"></div>
                            </div>
                          </div>
                          
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                          <p className="text-blue-600 font-semibold mb-2">{member.position}</p>
                          <p className="text-sm text-gray-500 mb-2">{member.experience} de experiencia</p>
                          <p className="text-sm text-gray-600">{member.specialty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="space-y-12 animate-fade-in">
                  <div className="text-center space-y-6">
                    <h2 className="text-4xl font-bold text-gray-900">Nuestra Cronología</h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                      Un recorrido por los hitos más importantes de nuestra empresa.
                    </p>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                    
                    <div className="space-y-12">
                      {timeline.map((event, index) => (
                        <div key={index} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                          <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
                              <div className="text-3xl font-bold text-blue-600 mb-2">{event.year}</div>
                              <h3 className="text-xl font-bold text-gray-900 mb-3">{event.title}</h3>
                              <p className="text-gray-600">{event.description}</p>
                            </div>
                          </div>
                          
                          <div className="relative z-10">
                            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full border-4 border-white shadow-lg"></div>
                          </div>
                          
                          <div className="w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contacto CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">¿Listo para ser parte de nuestra historia?</h2>
              <p className="text-xl text-blue-100">
                Únete a miles de clientes satisfechos que confían en nosotros para mantener sus vehículos en perfectas condiciones.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/20 transition-all duration-300 cursor-pointer">
                <a href="tel:+56223456789" className="block">
                  <PhoneIcon className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Llámanos</h3>
                  <p className="text-blue-100">+56 2 2345 6789</p>
                </a>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/20 transition-all duration-300 cursor-pointer">
                <a href="mailto:info@AutoParts.com" className="block">
                  <EnvelopeIcon className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Escríbenos</h3>
                  <p className="text-blue-100">info@AutoParts.com</p>
                </a>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/20 transition-all duration-300 cursor-pointer">
                <a 
                  href="https://maps.google.com/?q=Av.+Providencia+1234,+Santiago" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <MapPinIcon className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Visítanos</h3>
                  <p className="text-blue-100">Av. Providencia 1234, Santiago</p>
                </a>
              </div>
            </div>
            
            <div className="pt-8">
              <Link 
                to="/contact"
                className="inline-block bg-white text-blue-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 shadow-xl hover:shadow-2xl"
              >
                Contactar Ahora
              </Link>
            </div>
          </div>
        </div>
      </section>

      {showVideoModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Cerrar modal al hacer clic en el fondo
            if (e.target === e.currentTarget) {
              setShowVideoModal(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header del modal */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-gray-900">Video Corporativo AutoParts</h3>
                <p className="text-gray-600">Descubre nuestra historia y compromiso con la excelencia</p>
              </div>
              <button 
                onClick={() => setShowVideoModal(false)}
                className="flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200"
                title="Cerrar video (Esc)"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            {/* Contenedor del video */}
            <div className="relative">
              <div className="aspect-video bg-black">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0&showinfo=0&modestbranding=1`}
                  title="Video Corporativo AutoParts"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
              
              {/* Overlay con información adicional */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold text-lg">AutoParts - Más que repuestos</h4>
                    <p className="text-sm opacity-90">25 años de experiencia al servicio de Chile</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {/* Botón para abrir en YouTube */}
                    <a
                      href={`https://www.youtube.com/watch?v=${YOUTUBE_VIDEO_ID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      <span>Ver en YouTube</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer del modal con información adicional */}
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-blue-600">25+</div>
                  <div className="text-sm text-gray-600">Años de experiencia</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-purple-600">50K+</div>
                  <div className="text-sm text-gray-600">Repuestos en stock</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-green-600">15K+</div>
                  <div className="text-sm text-gray-600">Clientes satisfechos</div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-500">
                  Presiona <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Esc</kbd> para cerrar o haz clic fuera del video
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estilos CSS agregados al final del componente */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-10px) rotate(1deg); }
            66% { transform: translateY(5px) rotate(-1deg); }
          }
          
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          
          .animate-fade-in {
            animation: fade-in 0.6s ease-out forwards;
          }

          /* Estilos para el teclado */
          kbd {
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
          }
        `}
      </style>
    </div>
  );
};

export default AboutPage;