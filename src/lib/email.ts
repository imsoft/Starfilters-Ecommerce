// Configuración de email con Resend
import { Resend } from 'resend';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

// Inicializar Resend
function getResendInstance(): Resend | null {
  const resendApiKey = process.env.RESEND_API_KEY || import.meta.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    console.warn('⚠️ RESEND_API_KEY no configurada. Los emails no se enviarán realmente.');
    return null;
  }

  try {
    return new Resend(resendApiKey);
  } catch (error) {
    console.error('❌ Error inicializando Resend:', error);
    return null;
  }
}

// Lazy initialization - crear instancia solo cuando se necesite
let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (!resendInstance) {
    resendInstance = getResendInstance();
  }
  return resendInstance;
}

// Función para enviar emails usando Resend
export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    const resend = getResend();
    
    if (!resend) {
      console.warn('⚠️ Resend no está configurado. Email no enviado:', {
        to: emailData.to,
        subject: emailData.subject
      });
      return false;
    }

    if (!emailData.to) {
      console.error('❌ No se proporcionó destinatario para el email');
      return false;
    }

    // Obtener configuración de remitente
    const resendFromEmail = process.env.RESEND_FROM_EMAIL || import.meta.env.RESEND_FROM_EMAIL || 'noreply@starfilters.com';
    const resendFromName = process.env.RESEND_FROM_NAME || import.meta.env.RESEND_FROM_NAME || 'Star Filters';
    const fromEmail = emailData.from || resendFromEmail;
    const from = `${resendFromName} <${fromEmail}>`;

    console.log('📧 Enviando email con Resend:');
    console.log('📮 Para:', emailData.to);
    console.log('📝 Asunto:', emailData.subject);
    console.log('📤 Desde:', from);

    const result = await resend.emails.send({
      from: from,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });

    if (result.error) {
      console.error('❌ Error al enviar email con Resend:', result.error);
      return false;
    }

    console.log('✅ Email enviado exitosamente con Resend. ID:', result.data?.id);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    return false;
  }
};

// Template para email de confirmación de orden
export const createOrderConfirmationEmail = (
  customerName: string,
  orderNumber: string,
  orderDate: string,
  total: number,
  items: Array<{ name: string; quantity: number; price: number }>,
  shippingAddress: string
): EmailData => {
  const subject = `Confirmación de Pedido #${orderNumber} - Star Filters`;
  
  const itemsList = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong>${item.name}</strong><br>
        <span style="color: #6b7280; font-size: 14px;">Cantidad: ${item.quantity}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .order-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .order-items { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
        .shipping { background: #e0e7ff; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>¡Gracias por tu compra!</h1>
        </div>
        <div class="content">
          <h2>Hola ${customerName},</h2>
          <p>Tu pedido ha sido confirmado y se está procesando.</p>
          
          <div class="order-info">
            <h3>Detalles del Pedido</h3>
            <p><strong>Número de Pedido:</strong> ${orderNumber}</p>
            <p><strong>Fecha:</strong> ${orderDate}</p>
          </div>
          
          <h3>Productos:</h3>
          <table class="order-items">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Producto</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>
          
          <div class="total">
            <p>Total: $${total.toFixed(2)} MXN</p>
          </div>
          
          <div class="shipping">
            <h4>Dirección de Envío:</h4>
            <p>${shippingAddress}</p>
          </div>
          
          <p>Te notificaremos cuando tu pedido sea enviado.</p>
        </div>
        <div class="footer">
          <p>© 2024 Star Filters. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    ¡Gracias por tu compra!
    
    Hola ${customerName},
    
    Tu pedido ha sido confirmado:
    
    Número de Pedido: ${orderNumber}
    Fecha: ${orderDate}
    
    Productos:
    ${items.map(item => `- ${item.name} x${item.quantity}: $${(item.price * item.quantity).toFixed(2)}`).join('\n')}
    
    Total: $${total.toFixed(2)} MXN
    
    Dirección de Envío:
    ${shippingAddress}
    
    Te notificaremos cuando tu pedido sea enviado.
    
    © 2024 Star Filters
  `;
  
  return {
    to: '',
    subject,
    html,
    text
  };
};

// Template para email de reset de contraseña
export const createPasswordResetEmail = (userFirstName: string, resetUrl: string): EmailData => {
  const subject = 'Recuperar contraseña - Star Filters';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { 
          display: inline-block; 
          background-color: #6366f1; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          font-weight: bold;
          margin: 20px 0;
        }
        .warning { color: #ef4444; font-size: 14px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Recuperar Contraseña</h1>
        </div>
        <div class="content">
          <h2>Hola ${userFirstName},</h2>
          <p>Recibimos una solicitud para cambiar tu contraseña en Star Filters.</p>
          <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Cambiar Contraseña</a>
          </div>
          
          <p>O copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px;">
            ${resetUrl}
          </p>
          
          <div class="warning">
            <p><strong>⚠️ Importante:</strong></p>
            <ul>
              <li>Este enlace expira en 1 hora</li>
              <li>Solo puede usarse una vez</li>
              <li>Si no solicitaste este cambio, ignora este email</li>
            </ul>
          </div>
        </div>
        <div class="footer">
          <p>© 2024 Star Filters. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    Hola ${userFirstName},
    
    Recibimos una solicitud para cambiar tu contraseña en Star Filters.
    
    Usa este enlace para crear una nueva contraseña:
    ${resetUrl}
    
    Este enlace expira en 1 hora y solo puede usarse una vez.
    
    Si no solicitaste este cambio, ignora este email.
    
    © 2024 Star Filters
  `;
  
  return {
    to: '',
    subject,
    html,
    text
  };
};

// Template para email al vendedor cuando se crea una nueva orden
export const createNewOrderNotificationEmail = (
  orderNumber: string,
  orderDate: string,
  customerName: string,
  customerEmail: string,
  total: number,
  items: Array<{ name: string; quantity: number; price: number }>,
  shippingAddress: string
): EmailData => {
  const subject = `Nueva Orden #${orderNumber} - Star Filters`;
  
  const itemsList = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong>${item.name}</strong><br>
        <span style="color: #6b7280; font-size: 14px;">Cantidad: ${item.quantity}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');
  
  const siteUrl = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://starfilters.mx';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .order-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .order-items { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
        .shipping { background: #e0e7ff; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .customer-info { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .button { 
          display: inline-block; 
          background-color: #6366f1; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          font-weight: bold;
          margin: 20px 0;
        }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛒 Nueva Orden Recibida</h1>
        </div>
        <div class="content">
          <h2>Nueva orden de compra</h2>
          <p>Has recibido una nueva orden que requiere tu atención.</p>
          
          <div class="order-info">
            <h3>Detalles de la Orden</h3>
            <p><strong>Número de Pedido:</strong> ${orderNumber}</p>
            <p><strong>Fecha:</strong> ${orderDate}</p>
            <p><strong>Total:</strong> $${total.toFixed(2)} MXN</p>
          </div>
          
          <div class="customer-info">
            <h3>Información del Cliente</h3>
            <p><strong>Nombre:</strong> ${customerName}</p>
            <p><strong>Email:</strong> ${customerEmail}</p>
          </div>
          
          <h3>Productos:</h3>
          <table class="order-items">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Producto</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>
          
          <div class="shipping">
            <h4>Dirección de Envío:</h4>
            <p>${shippingAddress}</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${siteUrl}/admin/orders" class="button">Ver Orden en Panel</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2024 Star Filters. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    Nueva Orden Recibida
    
    Has recibido una nueva orden:
    
    Número de Pedido: ${orderNumber}
    Fecha: ${orderDate}
    Total: $${total.toFixed(2)} MXN
    
    Cliente:
    Nombre: ${customerName}
    Email: ${customerEmail}
    
    Productos:
    ${items.map(item => `- ${item.name} x${item.quantity}: $${(item.price * item.quantity).toFixed(2)}`).join('\n')}
    
    Dirección de Envío:
    ${shippingAddress}
    
    Ver orden en: ${siteUrl}/admin/orders
    
    © 2024 Star Filters
  `;
  
  return {
    to: '',
    subject,
    html,
    text
  };
};

// Template para email al comprador cuando cambia el estado de la orden
export const createOrderStatusUpdateEmail = (
  customerName: string,
  orderNumber: string,
  oldStatus: string,
  newStatus: string,
  orderDate: string,
  items: Array<{ name: string; quantity: number; price: number }>,
  total: number,
  trackingNumber?: string
): EmailData => {
  // Color primary de la aplicación: oklch(0.623 0.214 259.815) ≈ #6B46C1
  const primaryColor = '#6B46C1';
  
  const statusMessages: Record<string, { title: string; message: string; color: string }> = {
    processing: {
      title: 'Tu pedido está siendo procesado',
      message: 'Tu pedido ha sido confirmado y está siendo preparado para el envío.',
      color: primaryColor
    },
    shipped: {
      title: '¡Tu pedido ha sido enviado!',
      message: 'Tu pedido está en camino. ' + (trackingNumber ? `Número de rastreo: ${trackingNumber}` : ''),
      color: '#10b981'
    },
    delivered: {
      title: '¡Tu pedido ha sido entregado!',
      message: 'Tu pedido ha llegado a su destino. ¡Esperamos que disfrutes tus productos!',
      color: '#059669'
    },
    cancelled: {
      title: 'Tu pedido ha sido cancelado',
      message: 'Tu pedido ha sido cancelado. Si tienes alguna pregunta, por favor contáctanos.',
      color: '#ef4444'
    }
  };

  const statusInfo = statusMessages[newStatus] || {
    title: 'Actualización de tu pedido',
    message: `El estado de tu pedido ha cambiado de "${oldStatus}" a "${newStatus}".`,
    color: primaryColor
  };

  const subject = `Actualización de Pedido #${orderNumber} - Star Filters`;
  
  const itemsList = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong>${item.name}</strong><br>
        <span style="color: #6b7280; font-size: 14px;">Cantidad: ${item.quantity}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');
  
  const siteUrl = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://starfilters.mx';
  const logoUrl = `${siteUrl}/logos/logo-starfilters.png`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${statusInfo.color}; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header-logo { max-width: 180px; height: auto; margin-bottom: 15px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: bold; color: white; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .order-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .order-items { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .status-badge { 
          display: inline-block; 
          padding: 8px 16px; 
          background-color: ${statusInfo.color}; 
          color: white !important; 
          border-radius: 20px; 
          font-weight: bold;
          margin: 10px 0;
        }
        .button { 
          display: inline-block; 
          background-color: ${primaryColor}; 
          color: white !important; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
        }
        .button:hover {
          background-color: #5B3AA8;
        }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="Star Filters" class="header-logo" />
          <h1>${statusInfo.title}</h1>
        </div>
        <div class="content">
          <h2>Hola ${customerName},</h2>
          <p>${statusInfo.message}</p>
          
          <div class="order-info">
            <h3>Detalles del Pedido</h3>
            <p><strong>Número de Pedido:</strong> ${orderNumber}</p>
            <p><strong>Fecha:</strong> ${orderDate}</p>
            <p><strong>Estado:</strong> <span class="status-badge">${newStatus.toUpperCase()}</span></p>
            ${trackingNumber ? `<p><strong>Número de Rastreo:</strong> ${trackingNumber}</p>` : ''}
          </div>
          
          <h3>Productos:</h3>
          <table class="order-items">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Producto</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>
          
          <div style="text-align: right; margin-top: 20px;">
            <p style="font-size: 18px; font-weight: bold;">Total: $${total.toFixed(2)} MXN</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${siteUrl}/pedidos" class="button">Ver Mis Pedidos</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2024 Star Filters. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    ${statusInfo.title}
    
    Hola ${customerName},
    
    ${statusInfo.message}
    
    Detalles del Pedido:
    Número: ${orderNumber}
    Fecha: ${orderDate}
    Estado: ${newStatus.toUpperCase()}
    ${trackingNumber ? `Número de Rastreo: ${trackingNumber}` : ''}
    
    Productos:
    ${items.map(item => `- ${item.name} x${item.quantity}: $${(item.price * item.quantity).toFixed(2)}`).join('\n')}
    
    Total: $${total.toFixed(2)} MXN
    
    Ver tus pedidos: ${siteUrl}/pedidos
    
    © 2024 Star Filters
  `;
  
  return {
    to: '',
    subject,
    html,
    text
  };
};
