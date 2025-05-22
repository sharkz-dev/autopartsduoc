const nodemailer = require('nodemailer');

/**
 * Configuración del transporter de nodemailer
 */
const transporter = nodemailer.createTransporter({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Envía un email
 * @param {Object} options - Opciones del email
 * @param {string} options.to - Destinatario
 * @param {string} options.subject - Asunto
 * @param {string} options.text - Texto plano
 * @param {string} options.html - HTML (opcional)
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
    
    console.log('Email enviado: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error al enviar email:', error);
    throw new Error('No se pudo enviar el email');
  }
};

/**
 * Envía un email de confirmación de registro
 * @param {Object} user - Usuario recién registrado
 * @param {string} user.email - Email del usuario
 * @param {string} user.name - Nombre del usuario
 */
exports.sendWelcomeEmail = async (user) => {
  try {
    const options = {
      to: user.email,
      subject: 'Bienvenido a AutoRepuestos',
      text: `Hola ${user.name},\n\nGracias por registrarte en AutoRepuestos. Tu cuenta ha sido creada correctamente.\n\nSaludos,\nEl equipo de AutoRepuestos`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">¡Bienvenido a AutoRepuestos!</h2>
          <p>Hola ${user.name},</p>
          <p>Gracias por registrarte en AutoRepuestos. Tu cuenta ha sido creada correctamente.</p>
          <p>Ya puedes empezar a explorar nuestro catálogo y realizar compras.</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 5px;">
            <p style="margin: 0;">Si tienes alguna pregunta, no dudes en contactarnos:</p>
            <p style="margin: 5px 0;"><a href="mailto:info@autorepuestos.com" style="color: #3b82f6;">info@autorepuestos.com</a></p>
          </div>
          <p style="margin-top: 20px;">Saludos,<br>El equipo de AutoRepuestos</p>
        </div>
      `
    };

    return await exports.sendEmail(options);
  } catch (error) {
    console.error('Error al enviar email de bienvenida:', error);
  }
};

/**
 * Envía un email de confirmación de compra
 * @param {Object} order - Orden creada
 * @param {Object} user - Usuario que realizó la compra
 */
exports.sendOrderConfirmationEmail = async (order, user) => {
  try {
    // Crear lista de productos en la orden
    const productsList = order.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.product.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${item.price.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const options = {
      to: user.email,
      subject: `AutoRepuestos - Confirmación de Orden #${order._id}`,
      text: `
        Hola ${user.name},

        Gracias por tu compra en AutoRepuestos. A continuación encontrarás los detalles de tu orden:

        Número de Orden: ${order._id}
        Fecha: ${new Date(order.createdAt).toLocaleString()}
        Total: $${order.totalPrice.toFixed(2)}

        Estado de la Orden: ${order.status}

        Dirección de Envío:
        ${order.shippingAddress?.street || 'Retiro en tienda'}
        ${order.shippingAddress ? `${order.shippingAddress.city}, ${order.shippingAddress.state}` : ''}
        ${order.shippingAddress ? `${order.shippingAddress.postalCode}` : ''}
        ${order.shippingAddress ? `${order.shippingAddress.country}` : ''}

        Método de Pago: ${order.paymentMethod}

        Productos:
        ${order.items.map(item => `${item.product.name} x ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`).join('\n')}

        Subtotal: $${order.itemsPrice.toFixed(2)}
        Impuestos: $${order.taxPrice.toFixed(2)}
        Envío: $${order.shippingPrice.toFixed(2)}
        Total: $${order.totalPrice.toFixed(2)}

        Te enviaremos una actualización cuando tu orden sea enviada.

        Gracias por tu compra,
        El equipo de AutoRepuestos
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Confirmación de Orden</h2>
          <p>Hola ${user.name},</p>
          <p>Gracias por tu compra en AutoRepuestos. A continuación encontrarás los detalles de tu orden:</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Número de Orden:</strong> ${order._id}</p>
            <p><strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            <p><strong>Estado de la Orden:</strong> ${order.status}</p>
          </div>
          
          ${order.shippingAddress ? `
            <h3 style="color: #4b5563;">Dirección de Envío</h3>
            <p>
              ${order.shippingAddress.street}<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.state}<br>
              ${order.shippingAddress.postalCode}<br>
              ${order.shippingAddress.country}
            </p>
          ` : `
            <h3 style="color: #4b5563;">Retiro en Tienda</h3>
            <p>Tu orden está lista para ser retirada en nuestra tienda.</p>
          `}
          
          <h3 style="color: #4b5563;">Método de Pago</h3>
          <p>${order.paymentMethod}</p>
          
          <h3 style="color: #4b5563;">Productos</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Producto</th>
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Cantidad</th>
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Precio</th>
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${productsList}
            </tbody>
          </table>
          
          <div style="margin-top: 20px; text-align: right;">
            <p><strong>Subtotal:</strong> $${order.itemsPrice.toFixed(2)}</p>
            <p><strong>Impuestos:</strong> $${order.taxPrice.toFixed(2)}</p>
            <p><strong>Envío:</strong> $${order.shippingPrice.toFixed(2)}</p>
            <p style="font-size: 18px; color: #3b82f6;"><strong>Total:</strong> $${order.totalPrice.toFixed(2)}</p>
          </div>
          
          <p style="margin-top: 20px;">Te enviaremos una actualización cuando tu orden sea enviada.</p>
          
          <p style="margin-top: 20px;">Gracias por tu compra,<br>El equipo de AutoRepuestos</p>
        </div>
      `
    };

    return await exports.sendEmail(options);
  } catch (error) {
    console.error('Error al enviar email de confirmación de orden:', error);
  }
};

/**
 * Envía un email de actualización de estado de orden
 * @param {Object} order - Orden actualizada
 * @param {Object} user - Usuario dueño de la orden
 */
exports.sendOrderStatusUpdateEmail = async (order, user) => {
  try {
    let statusText;
    let statusColor;

    switch (order.status) {
      case 'processing':
        statusText = 'Tu orden está siendo procesada';
        statusColor = '#3b82f6'; // Azul
        break;
      case 'shipped':
        statusText = 'Tu orden ha sido enviada';
        statusColor = '#10b981'; // Verde
        break;
      case 'delivered':
        statusText = 'Tu orden ha sido entregada';
        statusColor = '#047857'; // Verde oscuro
        break;
      case 'ready_for_pickup':
        statusText = 'Tu orden está lista para retiro';
        statusColor = '#10b981'; // Verde
        break;
      case 'cancelled':
        statusText = 'Tu orden ha sido cancelada';
        statusColor = '#ef4444'; // Rojo
        break;
      default:
        statusText = `Estado de tu orden: ${order.status}`;
        statusColor = '#6b7280'; // Gris
    }

    const options = {
      to: user.email,
      subject: `AutoRepuestos - Actualización de Orden #${order._id}`,
      text: `
        Hola ${user.name},

        Queremos informarte que el estado de tu orden #${order._id} ha sido actualizado a: ${order.status}.

        ${order.status === 'shipped' ? `Tu orden está en camino y será entregada pronto.` : ''}
        ${order.status === 'ready_for_pickup' ? `Tu orden está lista para ser retirada en nuestra tienda.` : ''}
        ${order.status === 'delivered' ? `Tu orden ha sido entregada. ¡Gracias por tu compra!` : ''}
        ${order.status === 'cancelled' ? `Lamentamos que hayas cancelado tu orden. Si tienes alguna pregunta, no dudes en contactarnos.` : ''}

        Puedes revisar los detalles completos de tu orden en tu cuenta.

        Saludos,
        El equipo de AutoRepuestos
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${statusColor};">${statusText}</h2>
          <p>Hola ${user.name},</p>
          <p>Queremos informarte que el estado de tu orden <strong>#${order._id}</strong> ha sido actualizado a: <strong>${order.status}</strong>.</p>
          
          ${order.status === 'shipped' ? `
            <p>Tu orden está en camino y será entregada pronto.</p>
            ${order.trackingNumber ? `<p>Número de seguimiento: <strong>${order.trackingNumber}</strong></p>` : ''}
          ` : ''}
          
          ${order.status === 'ready_for_pickup' ? `
            <p>Tu orden está lista para ser retirada en nuestra tienda.</p>
            <p>Por favor, acércate durante nuestro horario de atención con tu número de orden.</p>
          ` : ''}
          
          ${order.status === 'delivered' ? `
            <p>Tu orden ha sido entregada. ¡Gracias por tu compra!</p>
            <p>Esperamos que disfrutes de tus productos. No dudes en dejarnos una reseña sobre tu experiencia.</p>
          ` : ''}
          
          ${order.status === 'cancelled' ? `
            <p>Lamentamos que hayas cancelado tu orden. Si tienes alguna pregunta, no dudes en contactarnos.</p>
          ` : ''}
          
          <div style="margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 5px;">
            <p style="margin: 0;">Puedes revisar los detalles completos de tu orden en tu cuenta.</p>
          </div>
          
          <p style="margin-top: 20px;">Saludos,<br>El equipo de AutoRepuestos</p>
        </div>
      `
    };

    return await exports.sendEmail(options);
  } catch (error) {
    console.error('Error al enviar email de actualización de estado:', error);
  }
};

module.exports = exports;