import React, { useState } from 'react';
import { 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  ClockIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ContactPage = () => {
  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    orderNumber: '',
    contactReason: 'general'
  });
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validar formulario
  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('El email es requerido');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Por favor ingresa un email válido');
      return false;
    }
    if (!formData.subject.trim()) {
      toast.error('El asunto es requerido');
      return false;
    }
    if (!formData.message.trim()) {
      toast.error('El mensaje es requerido');
      return false;
    }
    return true;
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Simular envío de formulario (aquí integrarías con tu API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      
      // En una implementación real, harías algo como:
      // await contactService.sendMessage(formData);
      
      setSubmitted(true);
      toast.success('¡Mensaje enviado exitosamente! Te contactaremos pronto.');
      
      // Limpiar formulario
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        orderNumber: '',
        contactReason: 'general'
      });
      
    } catch (error) {
      toast.error('Error al enviar el mensaje. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Contáctanos
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              ¿Tienes alguna pregunta o necesitas ayuda? Estamos aquí para ayudarte. 
              Contáctanos y te responderemos lo antes posible.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Información de Contacto */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-8 h-fit">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Información de Contacto
              </h2>
              
              <div className="space-y-6">
                {/* Dirección */}
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <MapPinIcon className="h-6 w-6 text-blue-600 mt-1" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Dirección</h3>
                    <p className="text-gray-600 mt-1">
                      Av. Providencia 1234<br />
                      Providencia, Santiago<br />
                      Región Metropolitana, Chile
                    </p>
                  </div>
                </div>

                {/* Teléfono */}
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <PhoneIcon className="h-6 w-6 text-blue-600 mt-1" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Teléfono</h3>
                    <p className="text-gray-600 mt-1">
                      <a href="tel:+56223456789" className="hover:text-blue-600">
                        +56 2 2345 6789
                      </a>
                    </p>
                    <p className="text-gray-600">
                      <a href="tel:+56987654321" className="hover:text-blue-600">
                        +56 9 8765 4321 (WhatsApp)
                      </a>
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <EnvelopeIcon className="h-6 w-6 text-blue-600 mt-1" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Email</h3>
                    <p className="text-gray-600 mt-1">
                      <a href="mailto:info@AutoParts.com" className="hover:text-blue-600">
                        info@AutoParts.com
                      </a>
                    </p>
                    <p className="text-gray-600">
                      <a href="mailto:ventas@AutoParts.com" className="hover:text-blue-600">
                        ventas@AutoParts.com
                      </a>
                    </p>
                  </div>
                </div>

                {/* Horarios */}
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-6 w-6 text-blue-600 mt-1" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Horarios de Atención</h3>
                    <div className="text-gray-600 mt-1 space-y-1">
                      <p>Lunes a Viernes: 9:00 - 18:30</p>
                      <p>Sábados: 9:00 - 14:00</p>
                      <p>Domingos: Cerrado</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Redes Sociales */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Síguenos</h3>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                    <span className="sr-only">Facebook</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                    <span className="sr-only">Instagram</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987c6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.735-3.016-1.816-.568-1.081-.568-2.421 0-3.502.568-1.081 1.719-1.816 3.016-1.816 1.297 0 2.448.735 3.016 1.816.568 1.081.568 2.421 0 3.502-.568 1.081-1.719 1.816-3.016 1.816zm7.519 0c-1.297 0-2.448-.735-3.016-1.816-.568-1.081-.568-2.421 0-3.502.568-1.081 1.719-1.816 3.016-1.816 1.297 0 2.448.735 3.016 1.816.568 1.081.568 2.421 0 3.502-.568 1.081-1.719 1.816-3.016 1.816z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                    <span className="sr-only">WhatsApp</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario de Contacto */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {submitted ? (
                // Mensaje de éxito
                <div className="text-center py-12">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                    <CheckCircleIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    ¡Mensaje Enviado!
                  </h2>
                  <p className="text-lg text-gray-600 mb-8">
                    Gracias por contactarnos. Hemos recibido tu mensaje y te responderemos en las próximas 24 horas.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="btn-modern btn-primary"
                  >
                    Enviar Otro Mensaje
                  </button>
                </div>
              ) : (
                // Formulario
                <>
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Envíanos un Mensaje
                    </h2>
                    <p className="text-gray-600">
                      Completa el formulario y nos comunicaremos contigo lo antes posible.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Razón del contacto */}
                    <div>
                      <label htmlFor="contactReason" className="form-label-modern">
                        ¿En qué podemos ayudarte?
                      </label>
                      <select
                        id="contactReason"
                        name="contactReason"
                        value={formData.contactReason}
                        onChange={handleChange}
                        className="form-input-modern"
                      >
                        <option value="general">Consulta General</option>
                        <option value="order">Consulta sobre Pedido</option>
                        <option value="product">Información de Producto</option>
                        <option value="technical">Soporte Técnico</option>
                        <option value="complaint">Reclamo</option>
                        <option value="suggestion">Sugerencia</option>
                        <option value="partnership">Oportunidad de Negocio</option>
                      </select>
                    </div>

                    {/* Nombre y Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="form-label-modern">
                          Nombre Completo *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="form-input-modern"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="form-label-modern">
                          Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="form-input-modern"
                          required
                        />
                      </div>
                    </div>

                    {/* Teléfono y Número de Orden */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="phone" className="form-label-modern">
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+56 9 XXXX XXXX"
                          className="form-input-modern"
                        />
                      </div>
                      
                      {formData.contactReason === 'order' && (
                        <div>
                          <label htmlFor="orderNumber" className="form-label-modern">
                            Número de Pedido
                          </label>
                          <input
                            type="text"
                            id="orderNumber"
                            name="orderNumber"
                            value={formData.orderNumber}
                            onChange={handleChange}
                            placeholder="Ej: #12345678"
                            className="form-input-modern"
                          />
                        </div>
                      )}
                    </div>

                    {/* Asunto */}
                    <div>
                      <label htmlFor="subject" className="form-label-modern">
                        Asunto *
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="form-input-modern"
                        required
                      />
                    </div>

                    {/* Mensaje */}
                    <div>
                      <label htmlFor="message" className="form-label-modern">
                        Mensaje *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={6}
                        value={formData.message}
                        onChange={handleChange}
                        className="form-input-modern"
                        placeholder="Describe tu consulta o mensaje en detalle..."
                        required
                      ></textarea>
                    </div>

                    {/* Botón de envío */}
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className={`w-full btn-modern ${loading ? 'btn-disabled' : 'btn-primary'}`}
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                            Enviando Mensaje...
                          </>
                        ) : (
                          <>
                            <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                            Enviar Mensaje
                          </>
                        )}
                      </button>
                    </div>

                    {/* Nota de privacidad */}
                    <div className="text-sm text-gray-500 text-center pt-4 border-t border-gray-200">
                      <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
                      Tus datos personales serán tratados de acuerdo a nuestra política de privacidad.
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Preguntas Frecuentes
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Aquí encuentras respuestas a las consultas más comunes de nuestros clientes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                question: "¿Cuáles son los métodos de pago disponibles?",
                answer: "Aceptamos Webpay (tarjetas de crédito y débito), transferencias bancarias y efectivo para retiro en tienda."
              },
              {
                question: "¿Cuánto demora el envío?",
                answer: "El envío estándar toma entre 3-5 días hábiles. Para retiro en tienda, tu pedido estará listo en 24 horas."
              },
              {
                question: "¿Tienen garantía los productos?",
                answer: "Sí, todos nuestros productos tienen garantía del fabricante. El tiempo varía según el tipo de repuesto."
              },
              {
                question: "¿Puedo cambiar o devolver un producto?",
                answer: "Tienes 30 días para cambios o devoluciones, siempre que el producto esté en perfectas condiciones."
              },
              {
                question: "¿Ofrecen descuentos por compras mayoristas?",
                answer: "Sí, contamos con precios especiales para distribuidores y talleres. Contacta a nuestro equipo comercial."
              },
              {
                question: "¿Cómo puedo rastrear mi pedido?",
                answer: "Una vez enviado tu pedido, recibirás un email con el código de seguimiento para rastrear tu envío."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;