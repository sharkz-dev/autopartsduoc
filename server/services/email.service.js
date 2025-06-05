const nodemailer = require('nodemailer');

/**
 * Configuración del transporter de nodemailer
 */
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Plantilla base para emails con diseño consistente
 */
const getEmailTemplate = (title, content, footerNote = '') => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
          🚗 AutoParts
        </h1>
        <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">
          Tu tienda especializada en repuestos automotrices
        </p>
      </div>
      
      <!-- Contenido -->
      <div style="padding: 30px; background-color: #ffffff;">
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px; font-weight: 600;">
          ${title}
        </h2>
        
        ${content}
        
        ${footerNote ? `
          <div style="margin-top: 30px; padding: 20px; background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 4px;">
            <p style="margin: 0; color: #4b5563; font-size: 14px;">
              <strong>💡 Nota:</strong> ${footerNote}
            </p>
          </div>
        ` : ''}
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f9fafb; padding: 25px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h3 style="color: #374151; font-size: 18px; margin-bottom: 15px;">¿Necesitas ayuda?</h3>
          <div style="display: inline-block; margin: 0 15px;">
            <a href="mailto:${process.env.FROM_EMAIL}" style="color: #3b82f6; text-decoration: none; font-weight: 500;">
              📧 ${process.env.FROM_EMAIL}
            </a>
          </div>
          <div style="display: inline-block; margin: 0 15px;">
            <span style="color: #6b7280;">📞 +56 2 2345 6789</span>
          </div>
        </div>
        
        <div style="text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            © 2024 AutoParts. Todos los derechos reservados.<br>
            Este email fue enviado porque tienes una cuenta activa en nuestra plataforma.
          </p>
        </div>
      </div>
    </div>
  `;
};

/**
 * Envía un email
 */
exports.sendEmail = async (options) => {
  try {
    const message = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || undefined
    };

    const info = await transporter.sendMail(message);
    
    console.log('Email enviado exitosamente: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error al enviar email:', error);
    throw new Error('No se pudo enviar el email');
  }
};

/**
 * Envía un email de bienvenida según el rol del usuario
 */
exports.sendWelcomeEmail = async (user) => {
  try {
    let welcomeContent = '';
    let subject = '';
    let footerNote = '';

    if (user.role === 'distributor') {
      subject = '🎉 Bienvenido a AutoParts - Cuenta de Distribuidor Creada';
      welcomeContent = `
        <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
          ¡Hola <strong>${user.name}</strong>! 👋
        </p>
        
        <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
          Te damos la bienvenida a <strong>AutoParts</strong>, tu nueva plataforma B2B para la distribución de repuestos automotrices.
        </p>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
          <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">
            ⏳ Estado de tu cuenta: Pendiente de Aprobación
          </h3>
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            Tu solicitud está siendo revisada por nuestro equipo. Te notificaremos por email una vez que sea aprobada.
          </p>
        </div>
        
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">
            🏢 Beneficios de ser Distribuidor AutoParts:
          </h3>
          <ul style="color: #374151; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Precios mayoristas especiales</li>
            <li style="margin-bottom: 8px;">Descuentos por volumen personalizados</li>
            <li style="margin-bottom: 8px;">Línea de crédito empresarial</li>
            <li style="margin-bottom: 8px;">Soporte técnico especializado</li>
            <li style="margin-bottom: 8px;">Acceso prioritario a nuevos productos</li>
          </ul>
        </div>
        
        <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
          Mientras tanto, puedes navegar por nuestro catálogo y familiarizarte con la plataforma.
        </p>
      `;
      footerNote = 'Una vez aprobada tu cuenta, recibirás un email con instrucciones para acceder a las funcionalidades exclusivas para distribuidores.';
    } else {
      subject = '🎉 ¡Bienvenido a AutoParts!';
      welcomeContent = `
        <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
          ¡Hola <strong>${user.name}</strong>! 👋
        </p>
        
        <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
          Te damos la bienvenida a <strong>AutoParts</strong>, tu tienda especializada en repuestos automotrices de alta calidad.
        </p>
        
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 16px;">
            🛒 ¿Qué puedes hacer ahora?
          </h3>
          <ul style="color: #374151; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Explorar nuestro amplio catálogo de productos</li>
            <li style="margin-bottom: 8px;">Usar filtros avanzados para encontrar repuestos específicos</li>
            <li style="margin-bottom: 8px;">Realizar compras seguras con múltiples métodos de pago</li>
            <li style="margin-bottom: 8px;">Recibir ofertas especiales y descuentos exclusivos</li>
            <li style="margin-bottom: 8px;">Hacer seguimiento de tus pedidos en tiempo real</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/products" 
             style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
            🔍 Explorar Productos
          </a>
        </div>
        
        <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
          ¡Estamos emocionados de tenerte como parte de la familia AutoParts!
        </p>
      `;
      footerNote = 'Recuerda completar tu perfil para una mejor experiencia de compra personalizada.';
    }

    const options = {
      to: user.email,
      subject: subject,
      text: `Bienvenido a AutoParts, ${user.name}. Tu cuenta ha sido creada exitosamente.`,
      html: getEmailTemplate('¡Cuenta creada exitosamente!', welcomeContent, footerNote)
    };

    return await exports.sendEmail(options);
  } catch (error) {
    console.error('Error al enviar email de bienvenida:', error);
  }
};

/**
 * Envía un email de confirmación de compra mejorado
 */
exports.sendOrderConfirmationEmail = async (order, user) => {
  try {
    // Determinar tipo de orden y personalizar mensaje
    const isB2B = order.orderType === 'B2B';
    const orderTypeLabel = isB2B ? 'Orden Mayorista (B2B)' : 'Orden Retail (B2C)';
    
    // Formatear productos
    const productsList = order.items.map(item => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: 500; color: #1f2937;">${item.product.name}</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">
            SKU: ${item.product.sku || 'N/A'} | 
            Categoría: ${item.product.category?.name || 'Sin categoría'}
          </div>
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <span style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-weight: 500;">
            ${item.quantity}
          </span>
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500;">
          $${item.price.toLocaleString('es-CL')}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #1e40af;">
          $${(item.price * item.quantity).toLocaleString('es-CL')}
        </td>
      </tr>
    `).join('');

    // Formatear información de envío
    let shippingInfo = '';
    if (order.shipmentMethod === 'delivery') {
      shippingInfo = `
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">
            🚚 Dirección de Envío
          </h3>
          <p style="margin: 0; color: #374151; line-height: 1.6;">
            <strong>${order.shippingAddress.street}</strong><br>
            ${order.shippingAddress.city}, ${order.shippingAddress.state}<br>
            ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}
          </p>
        </div>
      `;
    } else {
      shippingInfo = `
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 16px;">
            🏪 Retiro en Tienda
          </h3>
          <p style="margin: 0; color: #374151; line-height: 1.6;">
            <strong>${order.pickupLocation?.name || 'Tienda Principal'}</strong><br>
            ${order.pickupLocation?.address || 'Dirección por confirmar'}
          </p>
          ${order.pickupLocation?.scheduledDate ? `
            <p style="margin: 10px 0 0 0; color: #374151;">
              <strong>Fecha programada:</strong> ${new Date(order.pickupLocation.scheduledDate).toLocaleDateString('es-CL')}
            </p>
          ` : ''}
        </div>
      `;
    }

    // Determinar método de pago y mensaje
    let paymentMethodInfo = '';
    switch (order.paymentMethod) {
      case 'webpay':
        paymentMethodInfo = `
          <div style="background-color: #ecfdf5; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <span style="color: #065f46; font-weight: 500;">💳 Webpay (Tarjeta de Crédito/Débito)</span>
            ${order.isPaid ? '<div style="color: #065f46; font-size: 14px; margin-top: 5px;">✅ Pago confirmado</div>' : ''}
          </div>
        `;
        break;
      case 'bankTransfer':
        paymentMethodInfo = `
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <span style="color: #92400e; font-weight: 500;">🏦 Transferencia Bancaria</span>
            <div style="color: #92400e; font-size: 14px; margin-top: 5px;">
              ⏳ Pendiente de confirmación de pago
            </div>
          </div>
        `;
        break;
      case 'cash':
        paymentMethodInfo = `
          <div style="background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <span style="color: #1e40af; font-weight: 500;">💵 Pago en Efectivo</span>
            <div style="color: #1e40af; font-size: 14px; margin-top: 5px;">
              💰 ${order.shipmentMethod === 'pickup' ? 'Pago al retirar' : 'Pago contra entrega'}
            </div>
          </div>
        `;
        break;
    }

    const content = `
      <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
        ¡Hola <strong>${user.name}</strong>! 👋
      </p>
      
      <p style="color: #374151; line-height: 1.6; margin-bottom: 25px;">
        Hemos recibido tu orden exitosamente. A continuación encontrarás todos los detalles:
      </p>
      
      <!-- Información de la orden -->
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e2e8f0;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Número de Orden</p>
            <p style="margin: 5px 0 0 0; color: #1f2937; font-weight: 600; font-size: 16px;">#${order._id}</p>
          </div>
          <div>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Fecha de Orden</p>
            <p style="margin: 5px 0 0 0; color: #1f2937; font-weight: 500;">${new Date(order.createdAt).toLocaleDateString('es-CL', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
          <div>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Tipo de Orden</p>
            <p style="margin: 5px 0 0 0; color: #1f2937; font-weight: 500;">${orderTypeLabel}</p>
          </div>
          <div>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Estado Actual</p>
            <p style="margin: 5px 0 0 0; color: #1f2937; font-weight: 500; text-transform: capitalize;">${order.status}</p>
          </div>
        </div>
      </div>
      
      ${shippingInfo}
      
      <!-- Método de pago -->
      <h3 style="color: #1f2937; font-size: 18px; margin: 30px 0 15px 0;">💳 Método de Pago</h3>
      ${paymentMethodInfo}
      
      <!-- Productos -->
      <h3 style="color: #1f2937; font-size: 18px; margin: 30px 0 15px 0;">📦 Productos Ordenados</h3>
      <div style="overflow-x: auto; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <thead>
            <tr style="background-color: #f8fafc;">
              <th style="padding: 15px 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Producto</th>
              <th style="padding: 15px 8px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Cantidad</th>
              <th style="padding: 15px 8px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Precio Unit.</th>
              <th style="padding: 15px 8px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${productsList}
          </tbody>
        </table>
      </div>
      
      <!-- Resumen de precios -->
      <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin: 30px 0; border: 1px solid #e2e8f0;">
        <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 20px 0;">💰 Resumen de Costos</h3>
        <div style="space-y: 10px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #6b7280;">Subtotal productos:</span>
            <span style="color: #1f2937; font-weight: 500;">$${order.itemsPrice.toLocaleString('es-CL')}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #6b7280;">IVA (${order.taxRate || 19}%):</span>
            <span style="color: #1f2937; font-weight: 500;">$${order.taxPrice.toLocaleString('es-CL')}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #6b7280;">Envío:</span>
            <span style="color: #1f2937; font-weight: 500;">
              ${order.shippingPrice === 0 ? 'Gratuito' : `$${order.shippingPrice.toLocaleString('es-CL')}`}
            </span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 15px 0 0 0; border-top: 2px solid #1e40af;">
            <span style="color: #1f2937; font-weight: 600; font-size: 18px;">Total:</span>
            <span style="color: #1e40af; font-weight: 700; font-size: 20px;">$${order.totalPrice.toLocaleString('es-CL')}</span>
          </div>
        </div>
      </div>
      
      <!-- Próximos pasos -->
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
        <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">
          📋 Próximos Pasos
        </h3>
        <ul style="color: #374151; margin: 0; padding-left: 20px;">
          ${order.paymentMethod === 'bankTransfer' ? `
            <li style="margin-bottom: 8px;">Realizaremos la confirmación de tu transferencia bancaria</li>
          ` : ''}
          <li style="margin-bottom: 8px;">Procesaremos tu orden y prepararemos los productos</li>
          <li style="margin-bottom: 8px;">Te notificaremos cuando tu orden esté lista para ${order.shipmentMethod === 'pickup' ? 'retirar' : 'envío'}</li>
          <li style="margin-bottom: 8px;">Podrás hacer seguimiento del estado en tu cuenta</li>
        </ul>
      </div>
      
      <p style="color: #374151; line-height: 1.6; margin-top: 30px;">
        ¡Gracias por confiar en AutoParts para tus necesidades automotrices! 🚗
      </p>
    `;

    let footerNote = 'Puedes hacer seguimiento de tu orden en cualquier momento desde tu cuenta en AutoParts.';
    if (order.paymentMethod === 'bankTransfer') {
      footerNote = 'Recuerda que una vez confirmemos tu transferencia bancaria, procederemos inmediatamente con tu orden.';
    }

    const options = {
      to: user.email,
      subject: `🎉 Orden Confirmada #${order._id} - AutoParts`,
      text: `Tu orden #${order._id} ha sido confirmada. Total: $${order.totalPrice.toFixed(2)}`,
      html: getEmailTemplate('¡Orden confirmada exitosamente!', content, footerNote)
    };

    return await exports.sendEmail(options);
  } catch (error) {
    console.error('Error al enviar email de confirmación de orden:', error);
  }
};

/**
 * Envía un email de actualización de estado de orden
 */
exports.sendOrderStatusUpdateEmail = async (order, user) => {
  try {
    let statusInfo = {};
    
    switch (order.status) {
      case 'processing':
        statusInfo = {
          title: '⚙️ Tu orden está en proceso',
          message: 'Hemos comenzado a procesar tu orden y preparar los productos.',
          color: '#3b82f6',
          bgColor: '#f0f9ff',
          nextSteps: [
            'Verificación de stock y calidad de productos',
            'Preparación y empaquetado de tu orden',
            'Coordinación de envío o notificación para retiro'
          ]
        };
        break;
        
      case 'shipped':
        statusInfo = {
          title: '🚚 Tu orden ha sido enviada',
          message: 'Tu orden está en camino y será entregada pronto.',
          color: '#10b981',
          bgColor: '#ecfdf5',
          nextSteps: [
            'Tu paquete está en tránsito',
            'Recibirás notificaciones de seguimiento',
            'Preparate para recibir tu orden'
          ]
        };
        break;
        
      case 'ready_for_pickup':
        statusInfo = {
          title: '🏪 Tu orden está lista para retiro',
          message: 'Tu orden está preparada y esperándote en nuestra tienda.',
          color: '#8b5cf6',
          bgColor: '#faf5ff',
          nextSteps: [
            'Dirígete a nuestra tienda cuando gustes',
            'Trae tu documento de identidad',
            'Ten a mano el número de orden para agilizar el proceso'
          ]
        };
        break;
        
      case 'delivered':
        statusInfo = {
          title: '✅ Tu orden ha sido entregada',
          message: '¡Tu orden ha sido entregada exitosamente! ¡Gracias por tu compra!',
          color: '#047857',
          bgColor: '#ecfdf5',
          nextSteps: [
            'Revisa que todos los productos estén en perfectas condiciones',
            'Guarda tu factura para garantías',
            'Déjanos una reseña sobre tu experiencia'
          ]
        };
        break;
        
      case 'cancelled':
        statusInfo = {
          title: '❌ Tu orden ha sido cancelada',
          message: 'Lamentamos que hayas tenido que cancelar tu orden.',
          color: '#ef4444',
          bgColor: '#fef2f2',
          nextSteps: [
            'Si realizaste un pago, procesaremos el reembolso',
            'Cualquier consulta, contacta a nuestro equipo',
            'Esperamos verte pronto nuevamente'
          ]
        };
        break;
        
      default:
        statusInfo = {
          title: `📋 Actualización de tu orden`,
          message: `El estado de tu orden ha sido actualizado a: ${order.status}`,
          color: '#6b7280',
          bgColor: '#f9fafb',
          nextSteps: ['Revisa los detalles de tu orden en tu cuenta']
        };
    }

    const content = `
      <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
        ¡Hola <strong>${user.name}</strong>! 👋
      </p>
      
      <div style="background-color: ${statusInfo.bgColor}; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid ${statusInfo.color};">
        <h3 style="color: ${statusInfo.color}; margin: 0 0 10px 0; font-size: 20px;">
          ${statusInfo.title}
        </h3>
        <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6;">
          ${statusInfo.message}
        </p>
      </div>
      
      <!-- Información de la orden -->
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e2e8f0;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">📋 Detalles de la Orden</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Número de Orden</p>
            <p style="margin: 5px 0 0 0; color: #1f2937; font-weight: 600;">#${order._id}</p>
          </div>
          <div>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Total</p>
            <p style="margin: 5px 0 0 0; color: #1f2937; font-weight: 600;">${order.totalPrice.toLocaleString('es-CL')}</p>
          </div>
          <div>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Método de Envío</p>
            <p style="margin: 5px 0 0 0; color: #1f2937; font-weight: 500;">
              ${order.shipmentMethod === 'delivery' ? '🚚 Envío a domicilio' : '🏪 Retiro en tienda'}
            </p>
          </div>
          <div>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Estado Actualizado</p>
            <p style="margin: 5px 0 0 0; color: ${statusInfo.color}; font-weight: 600; text-transform: capitalize;">
              ${order.status}
            </p>
          </div>
        </div>
      </div>
      
      ${order.trackingNumber ? `
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">📦 Información de Seguimiento</h3>
          <p style="margin: 0; color: #374151;">
            <strong>Número de seguimiento:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${order.trackingNumber}</code>
          </p>
        </div>
      ` : ''}
      
      <!-- Próximos pasos -->
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">📋 Próximos Pasos</h3>
        <ul style="color: #374151; margin: 0; padding-left: 20px;">
          ${statusInfo.nextSteps.map(step => `<li style="margin-bottom: 8px;">${step}</li>`).join('')}
        </ul>
      </div>
      
      <p style="color: #374151; line-height: 1.6; margin-top: 30px;">
        Gracias por elegir AutoParts. ¡Estamos aquí para ayudarte! 🚗
      </p>
    `;

    const options = {
      to: user.email,
      subject: `🔄 ${statusInfo.title.replace(/🔄|⚙️|🚚|🏪|✅|❌|📋/, '')} - Orden #${order._id} - AutoParts`,
      text: `Tu orden #${order._id} ha sido actualizada a: ${order.status}`,
      html: getEmailTemplate('Actualización de tu orden', content, 'Puedes revisar todos los detalles de tu orden iniciando sesión en tu cuenta de AutoParts.')
    };

    return await exports.sendEmail(options);
  } catch (error) {
    console.error('Error al enviar email de actualización de estado:', error);
  }
};

/**
 * Envía un email de aprobación de distribuidor
 */
exports.sendDistributorApprovalEmail = async (distributor) => {
  try {
    const content = `
      <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
        ¡Hola <strong>${distributor.name}</strong>! 🎉
      </p>
      
      <div style="background-color: #ecfdf5; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
        <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 20px;">
          ✅ ¡Tu cuenta de distribuidor ha sido aprobada!
        </h3>
        <p style="color: #065f46; margin: 0; font-size: 16px; line-height: 1.6;">
          Tu solicitud para ser distribuidor AutoParts ha sido aprobada exitosamente.
        </p>
      </div>
      
      <!-- Información de la cuenta aprobada -->
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e2e8f0;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">🏢 Información de tu Cuenta</h3>
        <div style="space-y: 10px;">
          <div style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #6b7280;">Empresa:</span>
            <span style="color: #1f2937; font-weight: 500; margin-left: 10px;">${distributor.distributorInfo?.companyName}</span>
          </div>
          <div style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #6b7280;">RUT:</span>
            <span style="color: #1f2937; font-weight: 500; margin-left: 10px;">${distributor.distributorInfo?.companyRUT}</span>
          </div>
          <div style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #6b7280;">Límite de Crédito:</span>
            <span style="color: #1f2937; font-weight: 500; margin-left: 10px;">${distributor.distributorInfo?.creditLimit?.toLocaleString('es-CL') || '0'}</span>
          </div>
          <div style="padding: 8px 0;">
            <span style="color: #6b7280;">Descuento Mayorista:</span>
            <span style="color: #10b981; font-weight: 600; margin-left: 10px;">${distributor.distributorInfo?.discountPercentage || 0}%</span>
          </div>
        </div>
      </div>
      
      <!-- Beneficios activados -->
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">🎯 Beneficios Activados</h3>
        <ul style="color: #374151; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">✅ Acceso a precios mayoristas exclusivos</li>
          <li style="margin-bottom: 8px;">✅ Descuentos automáticos en todas las compras</li>
          <li style="margin-bottom: 8px;">✅ Línea de crédito empresarial disponible</li>
          <li style="margin-bottom: 8px;">✅ Panel de control de distribuidor</li>
          <li style="margin-bottom: 8px;">✅ Soporte técnico prioritario</li>
          <li style="margin-bottom: 8px;">✅ Acceso anticipado a nuevos productos</li>
        </ul>
      </div>
      
      <!-- Acciones recomendadas -->
      <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 16px;">🚀 Primeros Pasos Recomendados</h3>
        <ol style="color: #92400e; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Inicia sesión en tu cuenta para ver los nuevos precios</li>
          <li style="margin-bottom: 8px;">Explora el catálogo con precios mayoristas</li>
          <li style="margin-bottom: 8px;">Actualiza la información de facturación empresarial</li>
          <li style="margin-bottom: 8px;">Contacta a tu ejecutivo de cuenta asignado</li>
        </ol>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
           style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
          🔑 Acceder a mi Cuenta
        </a>
      </div>
      
      <p style="color: #374151; line-height: 1.6; margin-top: 30px;">
        ¡Bienvenido a la familia de distribuidores AutoParts! Estamos emocionados de trabajar contigo. 🤝
      </p>
    `;

    const options = {
      to: distributor.email,
      subject: '🎉 ¡Cuenta de Distribuidor Aprobada! - AutoParts',
      text: `Tu cuenta de distribuidor AutoParts ha sido aprobada. Ya puedes acceder a precios mayoristas.`,
      html: getEmailTemplate('¡Felicidades! Tu cuenta ha sido aprobada', content, 'Si tienes alguna pregunta sobre tu nueva cuenta de distribuidor, nuestro equipo de soporte B2B está listo para ayudarte.')
    };

    return await exports.sendEmail(options);
  } catch (error) {
    console.error('Error al enviar email de aprobación de distribuidor:', error);
  }
};

/**
 * Envía un email de notificación a distribuidor por nueva orden B2B
 */
exports.sendDistributorOrderNotification = async (order, distributor, items) => {
  try {
    const itemsList = items.map(item => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: 500; color: #1f2937;">${item.product.name}</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">
            SKU: ${item.product.sku || 'N/A'}
          </div>
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <span style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-weight: 500;">
            ${item.quantity}
          </span>
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500;">
          ${item.price.toLocaleString('es-CL')}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #1e40af;">
          ${(item.price * item.quantity).toLocaleString('es-CL')}
        </td>
      </tr>
    `).join('');

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const content = `
      <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
        ¡Hola <strong>${distributor.name}</strong>! 👋
      </p>
      
      <div style="background-color: #f0f9ff; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
        <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 20px;">
          📦 Nueva Orden B2B Recibida
        </h3>
        <p style="color: #1e40af; margin: 0; font-size: 16px;">
          Has recibido una nueva orden mayorista que requiere tu atención.
        </p>
      </div>
      
      <!-- Información de la orden -->
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e2e8f0;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">📋 Detalles de la Orden</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Número de Orden</p>
            <p style="margin: 5px 0 0 0; color: #1f2937; font-weight: 600;">#${order._id}</p>
          </div>
          <div>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Fecha y Hora</p>
            <p style="margin: 5px 0 0 0; color: #1f2937; font-weight: 500;">${new Date(order.createdAt).toLocaleDateString('es-CL', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
          <div>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Cliente</p>
            <p style="margin: 5px 0 0 0; color: #1f2937; font-weight: 500;">${order.user?.name || 'Cliente'}</p>
          </div>
          <div>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Método de Envío</p>
            <p style="margin: 5px 0 0 0; color: #1f2937; font-weight: 500;">
              ${order.shipmentMethod === 'delivery' ? '🚚 Envío a domicilio' : '🏪 Retiro en tienda'}
            </p>
          </div>
        </div>
      </div>
      
      <!-- Productos solicitados -->
      <h3 style="color: #1f2937; font-size: 18px; margin: 30px 0 15px 0;">📦 Productos Solicitados</h3>
      <div style="overflow-x: auto; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <thead>
            <tr style="background-color: #f8fafc;">
              <th style="padding: 15px 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Producto</th>
              <th style="padding: 15px 8px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Cantidad</th>
              <th style="padding: 15px 8px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Precio</th>
              <th style="padding: 15px 8px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
        </table>
      </div>
      
      <!-- Total para el distribuidor -->
      <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: right;">
        <p style="margin: 0; color: #065f46; font-size: 18px; font-weight: 700;">
          Total de tus productos: ${subtotal.toLocaleString('es-CL')}
        </p>
      </div>
      
      <!-- Acciones requeridas -->
      <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 16px;">⚡ Acciones Requeridas</h3>
        <ol style="color: #92400e; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Verificar disponibilidad de stock</li>
          <li style="margin-bottom: 8px;">Confirmar tiempo de preparación</li>
          <li style="margin-bottom: 8px;">Actualizar estado de la orden en el panel</li>
          <li style="margin-bottom: 8px;">Coordinar envío o notificar disponibilidad para retiro</li>
        </ol>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/distributor/orders" 
           style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
          🔧 Gestionar Orden
        </a>
      </div>
      
      <p style="color: #374151; line-height: 1.6; margin-top: 30px;">
        Gracias por ser parte de la red de distribuidores AutoParts. ¡Tu pronta respuesta es muy valorada! 🤝
      </p>
    `;

    const options = {
      to: distributor.email,
      subject: `🔔 Nueva Orden B2B #${order._id} - AutoParts Distribuidor`,
      text: `Nueva orden B2B recibida #${order._id}. Total: ${subtotal.toFixed(2)}`,
      html: getEmailTemplate('Nueva orden mayorista recibida', content, 'El procesamiento oportuno de las órdenes ayuda a mantener la satisfacción de nuestros clientes y fortalece nuestra partnership.')
    };

    return await exports.sendEmail(options);
  } catch (error) {
    console.error('Error al enviar notificación a distribuidor:', error);
  }
};

/**
 * Envía un email de recuperación de contraseña
 */
exports.sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    
    const content = `
      <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
        ¡Hola <strong>${user.name}</strong>! 👋
      </p>
      
      <p style="color: #374151; line-height: 1.6; margin-bottom: 25px;">
        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta AutoParts.
      </p>
      
      <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
        <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">
          🔐 Restablecimiento de Contraseña
        </h3>
        <p style="color: #92400e; margin: 0; font-size: 14px;">
          Haz clic en el botón de abajo para crear una nueva contraseña. Este enlace es válido por 1 hora.
        </p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
          🔑 Restablecer Contraseña
        </a>
      </div>
      
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 14px;">🛡️ Consejos de Seguridad</h3>
        <ul style="color: #374151; margin: 0; padding-left: 20px; font-size: 14px;">
          <li style="margin-bottom: 6px;">Usa una contraseña única que no utilices en otros sitios</li>
          <li style="margin-bottom: 6px;">Incluye letras mayúsculas, minúsculas, números y símbolos</li>
          <li style="margin-bottom: 6px;">Considera usar un gestor de contraseñas</li>
          <li style="margin-bottom: 6px;">Si no solicitaste este cambio, ignora este email</li>
        </ul>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 30px;">
        Si tienes problemas con el botón, copia y pega este enlace en tu navegador:<br>
        <code style="background-color: #f3f4f6; padding: 4px 6px; border-radius: 4px; font-size: 12px; word-break: break-all;">
          ${resetUrl}
        </code>
      </p>
      
      <p style="color: #374151; line-height: 1.6; margin-top: 30px;">
        Tu seguridad es importante para nosotros. 🔒
      </p>
    `;

    const options = {
      to: user.email,
      subject: '🔐 Restablecimiento de Contraseña - AutoParts',
      text: `Solicitud de restablecimiento de contraseña. Visita: ${resetUrl}`,
      html: getEmailTemplate('Restablece tu contraseña', content, 'Si no solicitaste este restablecimiento, puedes ignorar este email de forma segura.')
    };

    return await exports.sendEmail(options);
  } catch (error) {
    console.error('Error al enviar email de recuperación de contraseña:', error);
  }
};

/**
 * Envía un email de stock bajo a administradores
 */
exports.sendLowStockAlert = async (products, adminEmails) => {
  try {
    const productsList = products.map(product => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: 500; color: #1f2937;">${product.name}</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">
            SKU: ${product.sku} | Categoría: ${product.category?.name || 'Sin categoría'}
          </div>
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <span style="background-color: ${product.stockQuantity === 0 ? '#fef2f2' : '#fef3c7'}; color: ${product.stockQuantity === 0 ? '#dc2626' : '#92400e'}; padding: 4px 8px; border-radius: 4px; font-weight: 600;">
            ${product.stockQuantity} unidades
          </span>
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          ${product.stockQuantity === 0 ? 
            '<span style="color: #dc2626; font-weight: 600;">⚠️ Agotado</span>' : 
            '<span style="color: #f59e0b; font-weight: 600;">⚡ Stock Bajo</span>'
          }
        </td>
      </tr>
    `).join('');

    const content = `
      <div style="background-color: #fef2f2; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #dc2626;">
        <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 20px;">
          ⚠️ Alerta de Stock Bajo
        </h3>
        <p style="color: #dc2626; margin: 0; font-size: 16px;">
          ${products.length} producto(s) requieren reposición urgente de inventario.
        </p>
      </div>
      
      <h3 style="color: #1f2937; font-size: 18px; margin: 30px 0 15px 0;">📦 Productos Afectados</h3>
      <div style="overflow-x: auto; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <thead>
            <tr style="background-color: #f8fafc;">
              <th style="padding: 15px 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Producto</th>
              <th style="padding: 15px 8px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Stock Actual</th>
              <th style="padding: 15px 8px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${productsList}
          </tbody>
        </table>
      </div>
      
      <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 16px;">🚀 Acciones Recomendadas</h3>
        <ul style="color: #92400e; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Contactar a proveedores para reposición urgente</li>
          <li style="margin-bottom: 8px;">Actualizar stock en sistema cuando llegue mercadería</li>
          <li style="margin-bottom: 8px;">Considerar productos alternativos para clientes</li>
          <li style="margin-bottom: 8px;">Revisar configuración de alertas de stock mínimo</li>
        </ul>
      </div>
      
      <p style="color: #374151; line-height: 1.6; margin-top: 30px;">
        Esta alerta se genera automáticamente para mantener un inventario óptimo. 📊
      </p>
    `;

    for (const adminEmail of adminEmails) {
      const options = {
        to: adminEmail,
        subject: `⚠️ Alerta de Stock Bajo - ${products.length} Producto(s) - AutoParts`,
        text: `Alerta: ${products.length} productos tienen stock bajo o agotado`,
        html: getEmailTemplate('Alerta de Inventario', content, 'Esta alerta se envía automáticamente cuando los productos alcanzan el stock mínimo configurado.')
      };

      await exports.sendEmail(options);
    }

    console.log(`Alerta de stock bajo enviada a ${adminEmails.length} administrador(es)`);
  } catch (error) {
    console.error('Error al enviar alerta de stock bajo:', error);
  }
};

/**
 * Envía un email de notificación de nueva reseña de producto
 */
exports.sendNewReviewNotification = async (product, review, adminEmails) => {
  try {
    const stars = '⭐'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    
    const content = `
      <div style="background-color: #f0f9ff; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
        <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 20px;">
          📝 Nueva Reseña de Producto
        </h3>
        <p style="color: #1e40af; margin: 0; font-size: 16px;">
          Un cliente ha dejado una nueva reseña en tu catálogo.
        </p>
      </div>
      
      <!-- Información del producto -->
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e2e8f0;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">🔧 Producto Reseñado</h3>
        <div>
          <p style="margin: 0 0 5px 0; color: #1f2937; font-weight: 600; font-size: 18px;">${product.name}</p>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            SKU: ${product.sku} | Categoría: ${product.category?.name || 'Sin categoría'}
          </p>
        </div>
      </div>
      
      <!-- Detalles de la reseña -->
      <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e2e8f0;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">💬 Detalles de la Reseña</h3>
        
        <div style="margin-bottom: 15px;">
          <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">Calificación</p>
          <p style="margin: 0; font-size: 20px;">${stars} (${review.rating}/5)</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">Cliente</p>
          <p style="margin: 0; color: #1f2937; font-weight: 500;">${review.userName || 'Cliente Anónimo'}</p>
        </div>
        
        ${review.comment ? `
          <div>
            <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">Comentario</p>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; border-left: 3px solid #3b82f6;">
              <p style="margin: 0; color: #374151; line-height: 1.6; font-style: italic;">
                "${review.comment}"
              </p>
            </div>
          </div>
        ` : ''}
        
        <div style="margin-top: 15px;">
          <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">Fecha</p>
          <p style="margin: 0; color: #1f2937;">${new Date(review.date).toLocaleDateString('es-CL', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>
      </div>
      
      <!-- Estadísticas del producto -->
      <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 16px;">📊 Estadísticas Actualizadas</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Promedio de Calificaciones</p>
            <p style="margin: 5px 0 0 0; color: #065f46; font-weight: 600; font-size: 16px;">
              ⭐ ${product.avgRating?.toFixed(1) || 'N/A'}/5.0
            </p>
          </div>
          <div>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Total de Reseñas</p>
            <p style="margin: 5px 0 0 0; color: #065f46; font-weight: 600; font-size: 16px;">
              💬 ${product.ratings?.length || 0} reseñas
            </p>
          </div>
        </div>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/products/${product._id}" 
           style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
          👁️ Ver Producto
        </a>
      </div>
      
      <p style="color: #374151; line-height: 1.6; margin-top: 30px;">
        Las reseñas de clientes son valiosas para mejorar nuestros productos y servicios. 🌟
      </p>
    `;

    for (const adminEmail of adminEmails) {
      const options = {
        to: adminEmail,
        subject: `⭐ Nueva Reseña (${review.rating}/5) - ${product.name} - AutoParts`,
        text: `Nueva reseña recibida para ${product.name}. Calificación: ${review.rating}/5`,
        html: getEmailTemplate('Nueva Reseña de Cliente', content, 'Mantente al tanto de la satisfacción de tus clientes revisando regularmente las nuevas reseñas.')
      };

      await exports.sendEmail(options);
    }

    console.log(`Notificación de nueva reseña enviada a ${adminEmails.length} administrador(es)`);
  } catch (error) {
    console.error('Error al enviar notificación de nueva reseña:', error);
  }
};

/**
 * Envía un email de promoción especial a clientes
 */
exports.sendPromotionalEmail = async (users, promotion) => {
  try {
    const content = `
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); padding: 30px; border-radius: 8px; margin: 25px 0; text-align: center;">
        <h3 style="color: #ffffff; margin: 0 0 10px 0; font-size: 24px; font-weight: 700;">
          🎉 ${promotion.title}
        </h3>
        <p style="color: #fef3c7; margin: 0; font-size: 18px; font-weight: 500;">
          ${promotion.subtitle || '¡Oferta especial por tiempo limitado!'}
        </p>
      </div>
      
      <!-- Descripción de la promoción -->
      <div style="margin: 25px 0;">
        <p style="color: #374151; line-height: 1.6; font-size: 16px;">
          ${promotion.description}
        </p>
      </div>
      
      <!-- Detalles de la oferta -->
      ${promotion.discount ? `
        <div style="background-color: #ecfdf5; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center;">
          <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 28px; font-weight: 700;">
            ${promotion.discount}% de Descuento
          </h3>
          <p style="color: #065f46; margin: 0; font-size: 16px;">
            En ${promotion.category || 'productos seleccionados'}
          </p>
        </div>
      ` : ''}
      
      <!-- Código de cupón -->
      ${promotion.couponCode ? `
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border: 2px dashed #3b82f6;">
          <div style="text-align: center;">
            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Código de Cupón</p>
            <p style="margin: 0; color: #1e40af; font-size: 24px; font-weight: 700; font-family: monospace; letter-spacing: 2px;">
              ${promotion.couponCode}
            </p>
            <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">
              Copia este código y úsalo al finalizar tu compra
            </p>
          </div>
        </div>
      ` : ''}
      
      <!-- Validez de la oferta -->
      ${promotion.validUntil ? `
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 25px 0; text-align: center;">
          <p style="margin: 0; color: #92400e; font-weight: 600;">
            ⏰ Válido hasta: ${new Date(promotion.validUntil).toLocaleDateString('es-CL', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric'
            })}
          </p>
        </div>
      ` : ''}
      
      <!-- Productos destacados -->
      ${promotion.featuredProducts && promotion.featuredProducts.length > 0 ? `
        <h3 style="color: #1f2937; font-size: 18px; margin: 30px 0 15px 0;">🔥 Productos en Oferta</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
          ${promotion.featuredProducts.map(product => `
            <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; text-align: center;">
              <h4 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">
                ${product.name}
              </h4>
              <p style="margin: 0 0 8px 0; color: #ef4444; font-weight: 600;">
                ${product.salePrice?.toLocaleString('es-CL') || product.price.toLocaleString('es-CL')}
              </p>
              ${product.salePrice ? `
                <p style="margin: 0; color: #6b7280; font-size: 12px; text-decoration: line-through;">
                  ${product.price.toLocaleString('es-CL')}
                </p>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <!-- Call to action -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}${promotion.link || '/products'}" 
           style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; padding: 18px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 700; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">
          🛒 Comprar Ahora
        </a>
      </div>
      
      <!-- Términos y condiciones -->
      ${promotion.terms ? `
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 25px 0;">
          <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.4;">
            <strong>Términos y condiciones:</strong> ${promotion.terms}
          </p>
        </div>
      ` : ''}
      
      <p style="color: #374151; line-height: 1.6; margin-top: 30px; text-align: center;">
        ¡No dejes pasar esta oportunidad única! 🎯
      </p>
    `;

    const results = [];
    
    for (const user of users) {
      try {
        const personalizedContent = content.replace(/\{name\}/g, user.name);
        
        const options = {
          to: user.email,
          subject: `🔥 ${promotion.title} - AutoParts`,
          text: `${promotion.title}. ${promotion.description}`,
          html: getEmailTemplate(promotion.title, personalizedContent, 'Esta oferta es válida solo por tiempo limitado. ¡Aprovecha ahora!')
        };

        await exports.sendEmail(options);
        results.push({ email: user.email, status: 'sent' });
      } catch (error) {
        console.error(`Error enviando email promocional a ${user.email}:`, error);
        results.push({ email: user.email, status: 'failed', error: error.message });
      }
    }

    console.log(`Email promocional enviado a ${results.filter(r => r.status === 'sent').length}/${users.length} usuarios`);
    return results;
  } catch (error) {
    console.error('Error al enviar email promocional:', error);
    throw error;
  }
};

/**
 * Envía un email de recordatorio de carrito abandonado
 */
exports.sendAbandonedCartReminder = async (user, cartItems) => {
  try {
    const itemsList = cartItems.slice(0, 3).map(item => `
      <div style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #e5e7eb;">
        <div style="flex: 1;">
          <h4 style="margin: 0 0 5px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
            ${item.product.name}
          </h4>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            Cantidad: ${item.quantity} | Precio: ${item.product.price.toLocaleString('es-CL')}
          </p>
        </div>
      </div>
    `).join('');

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    const content = `
      <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
        ¡Hola <strong>${user.name}</strong>! 👋
      </p>
      
      <p style="color: #374151; line-height: 1.6; margin-bottom: 25px;">
        Notamos que dejaste algunos productos increíbles en tu carrito. ¡No queremos que los pierdas!
      </p>
      
      <div style="background-color: #fef3c7; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b; text-align: center;">
        <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 20px;">
          🛒 Tu Carrito te Está Esperando
        </h3>
        <p style="color: #92400e; margin: 0; font-size: 16px;">
          ${totalItems} producto(s) por un valor de ${totalValue.toLocaleString('es-CL')}
        </p>
      </div>
      
      <!-- Productos en el carrito -->
      <h3 style="color: #1f2937; font-size: 18px; margin: 30px 0 15px 0;">📦 Productos en tu Carrito</h3>
      <div style="background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
        ${itemsList}
        ${cartItems.length > 3 ? `
          <div style="padding: 15px; text-align: center; background-color: #f9fafb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              + ${cartItems.length - 3} producto(s) más
            </p>
          </div>
        ` : ''}
      </div>
      
      <!-- Incentivo especial -->
      <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
        <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">
          🎁 Oferta Especial por Tiempo Limitado
        </h3>
        <p style="color: #065f46; margin: 0 0 15px 0; font-size: 16px;">
          Completa tu compra en las próximas 24 horas y obtén:
        </p>
        <ul style="color: #065f46; margin: 0; padding-left: 20px; display: inline-block; text-align: left;">
          <li style="margin-bottom: 5px;">✅ Envío gratuito en compras sobre $50.000</li>
          <li style="margin-bottom: 5px;">✅ 5% de descuento adicional</li>
          <li style="margin-bottom: 5px;">✅ Garantía extendida gratuita</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/cart" 
           style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 18px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 700; font-size: 18px;">
          🛒 Finalizar Compra
        </a>
      </div>
      
      <!-- Testimonios o reseñas -->
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px; text-align: center;">
          ⭐ Lo que dicen nuestros clientes
        </h3>
        <div style="text-align: center; font-style: italic; color: #374151;">
          <p style="margin: 0 0 10px 0; line-height: 1.6;">
            "Excelente calidad y entrega rápida. AutoParts es mi primera opción para repuestos."
          </p>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            - Carlos M., Cliente Verificado
          </p>
        </div>
      </div>
      
      <p style="color: #374151; line-height: 1.6; margin-top: 30px; text-align: center;">
        ¡No dejes que estos productos se agoten! 🏃‍♂️💨
      </p>
    `;

    const options = {
      to: user.email,
      subject: `🛒 ${user.name}, ¡Tus productos te están esperando! - AutoParts`,
      text: `Hola ${user.name}, tienes ${totalItems} productos en tu carrito por ${totalValue.toFixed(2)}. ¡Finaliza tu compra ahora!`,
      html: getEmailTemplate('¡No olvides tu carrito!', content, 'Este recordatorio se envía porque valoramos tu interés en nuestros productos. Puedes cancelar estos recordatorios desde tu cuenta.')
    };

    return await exports.sendEmail(options);
  } catch (error) {
    console.error('Error al enviar recordatorio de carrito abandonado:', error);
  }
};

module.exports = exports;