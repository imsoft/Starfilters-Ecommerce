// Configuración de email con Resend
import { Resend } from 'resend';
import type { BillingData } from './payment-utils';
import type { DeliveryMethod } from './delivery-options';
import { getDeliveryOption, getDeliveryLabel, isPickupMethod } from './delivery-options';

// Datos extra del pedido para el correo interno. Todos opcionales: los pedidos
// viejos (y el flujo legacy del webhook) no los traen y el correo debe salir
// igual.
export interface OrderNotificationExtras {
  // Datos fiscales capturados en el checkout. null/undefined = no pidió factura.
  billing?: BillingData | null;
  deliveryMethod?: DeliveryMethod | null;
  customerPhone?: string | null;
  // Instrucciones fijas que el admin configura en /admin/settings/notificaciones
  internalNote?: string;
}

// MySQL devuelve las columnas DECIMAL como CADENA, no como número. Llamar
// .toFixed() sobre ellas lanza "total.toFixed is not a function" y tumbaba el
// correo de cambio de estado en todos los casos. Se normaliza aquí, que es
// donde se formatea el dinero, para que ningún llamador tenga que acordarse.
const money = (value: unknown): string => {
  const numero = typeof value === 'number' ? value : Number(value);
  return (Number.isFinite(numero) ? numero : 0).toFixed(2);
};

// Evita que un dato del cliente (una razón social con "<") rompa el HTML del
// correo.
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export interface EmailData {
  // Una cadena para un destinatario, o un arreglo cuando el correo va a varias
  // personas (las notificaciones internas de pedidos van a una lista que el
  // admin edita desde /admin/settings/notificaciones).
  to: string | string[];
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

    // Un arreglo vacío es tan inválido como una cadena vacía, y Resend lo
    // rechazaría con un error genérico.
    const recipients = Array.isArray(emailData.to)
      ? emailData.to.filter((address) => typeof address === 'string' && address.trim() !== '')
      : emailData.to;

    if (!recipients || (Array.isArray(recipients) && recipients.length === 0)) {
      console.error('❌ No se proporcionó destinatario para el email');
      return false;
    }

    // Obtener configuración de remitente
    const resendFromEmail = process.env.RESEND_FROM_EMAIL || import.meta.env.RESEND_FROM_EMAIL || 'noreply@starfilters.com';
    const resendFromName = process.env.RESEND_FROM_NAME || import.meta.env.RESEND_FROM_NAME || 'Star Filters';
    const fromEmail = emailData.from || resendFromEmail;
    const from = `${resendFromName} <${fromEmail}>`;

    console.log('📧 Enviando email con Resend:');
    console.log('📮 Para:', recipients);
    console.log('📝 Asunto:', emailData.subject);
    console.log('📤 Desde:', from);

    const result = await resend.emails.send({
      from: from,
      to: recipients,
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
  shippingAddress: string,
  // Los pedidos pueden cobrarse en pesos o en dólares
  currency: 'MXN' | 'USD' = 'MXN'
): EmailData => {
  // Paleta de colores de la aplicación
  const color50 = '#EFF6FF';
  const color100 = '#DBEAFE';
  const color500 = '#2B7FFF';
  const color600 = '#155DFC';
  const color700 = '#1447E6';
  
  const subject = `Confirmación de Pedido #${orderNumber} - Star Filters`;
  
  const itemsList = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong>${item.name}</strong><br>
        <span style="color: #6b7280; font-size: 14px;">Cantidad: ${item.quantity}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        $${money(Number(item.price) * item.quantity)}
      </td>
    </tr>
  `).join('');
  
  const siteUrl = import.meta.env.PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || import.meta.env.SITE_URL || process.env.SITE_URL || 'https://starfilters.mx';
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
        .header { background-color: ${color600}; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header-logo { max-width: 180px; height: auto; margin-bottom: 15px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: bold; color: white; }
        .content { background-color: ${color50}; padding: 30px; border-radius: 0 0 8px 8px; }
        .order-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .order-items { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
        .shipping { background: ${color100}; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .button { 
          display: inline-block; 
          background-color: ${color600}; 
          color: white !important; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
        }
        .button:hover {
          background-color: ${color700};
        }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="Star Filters" class="header-logo" />
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
            <p>Total: $${money(total)} ${currency}</p>
          </div>
          
          <div class="shipping">
            <h4>Dirección de Envío:</h4>
            <p>${shippingAddress}</p>
          </div>
          
          <p>Te notificaremos cuando tu pedido sea enviado.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${siteUrl}/orders" class="button">Ver Mis Pedidos</a>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Star Filters. Todos los derechos reservados.</p>
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
    ${items.map(item => `- ${item.name} x${item.quantity}: $${money(Number(item.price) * item.quantity)}`).join('\n')}
    
    Total: $${money(total)} ${currency}
    
    Dirección de Envío:
    ${shippingAddress}
    
    Te notificaremos cuando tu pedido sea enviado.
    
    © ${new Date().getFullYear()} Star Filters
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
  // Paleta de colores de la aplicación
  const color50 = '#EFF6FF';
  const color100 = '#DBEAFE';
  const color600 = '#155DFC';
  const color700 = '#1447E6';
  
  const subject = 'Recuperar contraseña - Star Filters';
  const siteUrl = import.meta.env.PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || import.meta.env.SITE_URL || process.env.SITE_URL || 'https://starfilters.mx';
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
        .header { background-color: ${color600}; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header-logo { max-width: 180px; height: auto; margin-bottom: 15px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: bold; color: white; }
        .content { background-color: ${color50}; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { 
          display: inline-block; 
          background-color: ${color600}; 
          color: white !important; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
        }
        .button:hover {
          background-color: ${color700};
        }
        .warning { color: #ef4444; font-size: 14px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="Star Filters" class="header-logo" />
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
          <p>© ${new Date().getFullYear()} Star Filters. Todos los derechos reservados.</p>
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
    
    © ${new Date().getFullYear()} Star Filters
  `;
  
  return {
    to: '',
    subject,
    html,
    text
  };
};

// Template para el correo de verificación de cuenta (registro)
export const createVerificationEmail = (
  userFirstName: string,
  verifyUrl: string,
  lang: 'es' | 'en' = 'es'
): EmailData => {
  const color50 = '#EFF6FF';
  const color600 = '#155DFC';
  const color700 = '#1447E6';

  const isEn = lang === 'en';
  const subject = isEn ? 'Verify your account - Star Filters' : 'Verifica tu cuenta - Star Filters';
  const siteUrl = import.meta.env.PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || import.meta.env.SITE_URL || process.env.SITE_URL || 'https://starfilters.mx';
  const logoUrl = `${siteUrl}/logos/logo-starfilters.png`;

  const heading = isEn ? 'Verify your account' : 'Verifica tu cuenta';
  const hello = isEn ? `Hello ${userFirstName},` : `Hola ${userFirstName},`;
  const intro = isEn
    ? 'Thanks for creating your account at Star Filters. To activate it, click the button below:'
    : 'Gracias por crear tu cuenta en Star Filters. Para activarla, haz clic en el siguiente botón:';
  const buttonLabel = isEn ? 'Verify my account' : 'Verificar mi cuenta';
  const copyLink = isEn ? 'Or copy and paste this link into your browser:' : 'O copia y pega este enlace en tu navegador:';
  const ignore = isEn
    ? 'If you did not create this account, you can ignore this email.'
    : 'Si tú no creaste esta cuenta, puedes ignorar este correo.';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${color600}; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header-logo { max-width: 180px; height: auto; margin-bottom: 15px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: bold; color: white; }
        .content { background-color: ${color50}; padding: 30px; border-radius: 0 0 8px 8px; }
        .button {
          display: inline-block;
          background-color: ${color600};
          color: white !important;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
        }
        .button:hover {
          background-color: ${color700};
        }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="Star Filters" class="header-logo" />
          <h1>${heading}</h1>
        </div>
        <div class="content">
          <h2>${hello}</h2>
          <p>${intro}</p>

          <div style="text-align: center;">
            <a href="${verifyUrl}" class="button">${buttonLabel}</a>
          </div>

          <p>${copyLink}</p>
          <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px;">
            ${verifyUrl}
          </p>

          <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">${ignore}</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Star Filters. ${isEn ? 'All rights reserved.' : 'Todos los derechos reservados.'}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    ${hello}

    ${intro}

    ${verifyUrl}

    ${ignore}

    © ${new Date().getFullYear()} Star Filters
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
  shippingAddress: string,
  // Los pedidos pueden cobrarse en pesos o en dólares
  currency: 'MXN' | 'USD' = 'MXN',
  extras: OrderNotificationExtras = {}
): EmailData => {
  // Paleta de colores de la aplicación
  const color50 = '#EFF6FF';
  const color100 = '#DBEAFE';
  const color600 = '#155DFC';
  const color700 = '#1447E6';
  
  const subject = `Nueva Orden #${orderNumber} - Star Filters`;
  
  const itemsList = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong>${item.name}</strong><br>
        <span style="color: #6b7280; font-size: 14px;">Cantidad: ${item.quantity}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        $${money(Number(item.price) * item.quantity)}
      </td>
    </tr>
  `).join('');
  
  const siteUrl = import.meta.env.PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || import.meta.env.SITE_URL || process.env.SITE_URL || 'https://starfilters.mx';
  const logoUrl = `${siteUrl}/logos/logo-starfilters.png`;
  
  // ---- Instrucciones de entrega -------------------------------------------
  // Quien prepara el pedido necesita saber de un vistazo si lo manda o si el
  // cliente pasa por él: son operaciones distintas.
  const { deliveryMethod, billing, customerPhone, internalNote } = extras;
  const deliveryOption = deliveryMethod ? getDeliveryOption(deliveryMethod) : undefined;
  const deliveryLabel = deliveryMethod ? getDeliveryLabel(deliveryMethod) : 'No especificado';
  const deliveryDays = deliveryOption?.days.es || '';
  const isPickup = deliveryMethod ? isPickupMethod(deliveryMethod) : false;
  const pickupAddress = deliveryOption?.address?.text || '';

  const deliveryHtml = `
          <div class="shipping">
            <h4 style="margin-top: 0;">📦 Entrega — ${escapeHtml(deliveryLabel)}</h4>
            ${isPickup
              ? `<p style="margin: 6px 0;"><strong>El cliente PASA A RECOGER.</strong> No prepares envío por paquetería.</p>
                 ${pickupAddress ? `<p style="margin: 6px 0;">Sucursal: ${escapeHtml(pickupAddress)}</p>` : ''}`
              : `<p style="margin: 6px 0;"><strong>Enviar a:</strong><br>${escapeHtml(shippingAddress)}</p>`}
            ${deliveryDays ? `<p style="margin: 6px 0;"><strong>Tiempo comprometido:</strong> ${escapeHtml(deliveryDays)}</p>` : ''}
            ${customerPhone ? `<p style="margin: 6px 0;"><strong>Teléfono del cliente:</strong> ${escapeHtml(customerPhone)}</p>` : ''}
          </div>`;

  // ---- Facturación ---------------------------------------------------------
  // Si el cliente capturó datos fiscales van completos aquí, para no tener que
  // entrar al panel. Si no, la leyenda lo dice explícitamente: el silencio se
  // presta a que alguien facture de más o de menos.
  const billingFields: Array<{ label: string; value?: string }> = [
    { label: 'Razón social', value: billing?.businessName },
    { label: 'RFC', value: billing?.rfc },
    { label: 'Régimen fiscal', value: billing?.taxRegime },
    { label: 'Uso de CFDI', value: billing?.cfdiUse },
    { label: 'Código postal fiscal', value: billing?.postalCode },
    { label: 'Enviar la factura a', value: billing?.email },
  ].filter((field) => field.value);

  const requiresInvoice = billingFields.length > 0;
  // `null` = el checkout preguntó y el cliente no quiso factura.
  // `undefined` = nadie preguntó (pedidos del flujo anterior): no podemos
  // afirmar que no la quiere.
  const billingKnown = billing !== undefined;

  const billingHtml = requiresInvoice
    ? `
          <div style="background: #FEF3C7; border-left: 4px solid #D97706; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px; color: #92400E;">🧾 ESTE PEDIDO REQUIERE FACTURA</h4>
            <table style="width: 100%; border-collapse: collapse;">
              ${billingFields.map((field) => `
                <tr>
                  <td style="padding: 6px 0; color: #78350F; font-size: 14px; vertical-align: top; width: 45%;">${escapeHtml(field.label)}</td>
                  <td style="padding: 6px 0; color: #1f2937; font-size: 14px; font-weight: bold;">${escapeHtml(field.value as string)}</td>
                </tr>`).join('')}
            </table>
          </div>`
    : `
          <div style="background: #F3F4F6; border-left: 4px solid #9CA3AF; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin: 0 0 6px; color: #374151;">🧾 Facturación</h4>
            <p style="margin: 0; color: #4B5563; font-size: 14px;">
              ${billingKnown
                ? 'El cliente <strong>NO solicitó factura</strong> en este pedido. No es necesario emitir CFDI.'
                : 'Este pedido no trae datos de facturación. Revísalo en el panel antes de dar por hecho que no requiere CFDI.'}
            </p>
          </div>`;

  const noteHtml = internalNote
    ? `
          <div style="background: white; border: 1px dashed #9CA3AF; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin: 0 0 6px; color: #374151;">📋 Instrucciones internas</h4>
            <p style="margin: 0; color: #4B5563; font-size: 14px; white-space: pre-line;">${escapeHtml(internalNote)}</p>
          </div>`
    : '';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${color600}; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header-logo { max-width: 180px; height: auto; margin-bottom: 15px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: bold; color: white; }
        .content { background-color: ${color50}; padding: 30px; border-radius: 0 0 8px 8px; }
        .order-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .order-items { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
        .shipping { background: ${color100}; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .customer-info { background: ${color100}; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .button { 
          display: inline-block; 
          background-color: ${color600}; 
          color: white !important; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
        }
        .button:hover {
          background-color: ${color700};
        }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="Star Filters" class="header-logo" />
          <h1>🛒 Nueva Orden Recibida</h1>
        </div>
        <div class="content">
          <h2>Nueva orden de compra</h2>
          <p>Has recibido una nueva orden que requiere tu atención.</p>
          
          <div class="order-info">
            <h3>Detalles de la Orden</h3>
            <p><strong>Número de Pedido:</strong> ${orderNumber}</p>
            <p><strong>Fecha:</strong> ${orderDate}</p>
            <p><strong>Total:</strong> $${money(total)} ${currency}</p>
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
          
          ${deliveryHtml}

          ${billingHtml}

          ${noteHtml}
          
          <div style="text-align: center;">
            <a href="${siteUrl}/admin/orders" class="button">Ver Orden en Panel</a>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Star Filters. Todos los derechos reservados.</p>
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
    Total: $${money(total)} ${currency}
    
    Cliente:
    Nombre: ${customerName}
    Email: ${customerEmail}
    
    Productos:
    ${items.map(item => `- ${item.name} x${item.quantity}: $${money(Number(item.price) * item.quantity)}`).join('\n')}
    
    Entrega: ${deliveryLabel}
    ${isPickup
      ? `EL CLIENTE PASA A RECOGER. No prepares envío.${pickupAddress ? `\n    Sucursal: ${pickupAddress}` : ''}`
      : `Enviar a: ${shippingAddress}`}
    ${deliveryDays ? `Tiempo comprometido: ${deliveryDays}` : ''}
    ${customerPhone ? `Teléfono del cliente: ${customerPhone}` : ''}

    Facturación:
    ${requiresInvoice
      ? `ESTE PEDIDO REQUIERE FACTURA\n${billingFields.map((field) => `    - ${field.label}: ${field.value}`).join('\n')}`
      : billingKnown
        ? 'El cliente NO solicitó factura. No es necesario emitir CFDI.'
        : 'Este pedido no trae datos de facturación. Revísalo en el panel.'}
    ${internalNote ? `\n    Instrucciones internas:\n    ${internalNote}` : ''}
    
    Ver orden en: ${siteUrl}/admin/orders
    
    © ${new Date().getFullYear()} Star Filters
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
  trackingNumber?: string,
  currency: 'MXN' | 'USD' = 'MXN'
): EmailData => {
  // Paleta de colores de la aplicación
  const color50 = '#EFF6FF';
  const color100 = '#DBEAFE';
  const color500 = '#2B7FFF';
  const color600 = '#155DFC';
  const color700 = '#1447E6';
  const color800 = '#193CB8';
  
  // Color primary para botones y elementos principales
  const primaryColor = color600;
  
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
        $${money(Number(item.price) * item.quantity)}
      </td>
    </tr>
  `).join('');
  
  const siteUrl = import.meta.env.PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || import.meta.env.SITE_URL || process.env.SITE_URL || 'https://starfilters.mx';
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
          background-color: ${color700};
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
            <p style="font-size: 18px; font-weight: bold;">Total: $${money(total)} ${currency}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${siteUrl}/orders" class="button">Ver Mis Pedidos</a>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Star Filters. Todos los derechos reservados.</p>
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
    ${items.map(item => `- ${item.name} x${item.quantity}: $${money(Number(item.price) * item.quantity)}`).join('\n')}
    
    Total: $${money(total)} ${currency}
    
    Ver tus pedidos: ${siteUrl}/orders
    
    © ${new Date().getFullYear()} Star Filters
  `;
  
  return {
    to: '',
    subject,
    html,
    text
  };
};
