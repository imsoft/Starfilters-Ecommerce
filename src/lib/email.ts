// Configuración de email con Resend
import { Resend } from 'resend';
import type { BillingData } from './payment-utils';
import type { DeliveryMethod } from './delivery-options';
import { getDeliveryOption, getDeliveryLabel, isPickupMethod } from './delivery-options';
import { resolverPaqueteria } from './carriers';
import { desgloseDeOrden } from './order-breakdown';

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

/**
 * Paleta de los correos
 *
 * Los correos traían su propio azul (#155DFC), Arial y grises de otra escala,
 * así que no se parecían al sitio. Estos valores son los tokens de global.css
 * traducidos a hex: los clientes de correo no entienden oklch ni variables CSS.
 *   --primary   oklch(0.623 0.214 259.815) → #3b82f6
 *   --foreground oklch(0.141 0.005 285.823) → #09090b
 *   --muted-foreground oklch(0.552 0.016 285.938) → #71717a
 *   --border    oklch(0.92 0.004 286.32)   → #e4e4e7
 *   --muted     oklch(0.967 0.001 286.375) → #f4f4f5
 */
const BRAND = {
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  primaryTint: '#eff6ff',
  primaryDeep: '#1e40af',
  accent: '#dbeafe',
  foreground: '#09090b',
  mutedForeground: '#71717a',
  border: '#e4e4e7',
  muted: '#f4f4f5',
  background: '#ffffff',
};

// El stack del sitio, pero sin ui-sans-serif ni system-ui: varios clientes de
// correo no los resuelven y caen a Times.
const EMAIL_FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

// Los mismos colores que el panel usa para el estado de una orden.
const ESTADO_BADGE: Record<string, { bg: string; fg: string }> = {
  pending:    { bg: '#fef9c3', fg: '#854d0e' },
  processing: { bg: '#dbeafe', fg: '#1e40af' },
  shipped:    { bg: '#f3e8ff', fg: '#6b21a8' },
  delivered:  { bg: '#dcfce7', fg: '#166534' },
  cancelled:  { bg: '#fee2e2', fg: '#991b1b' },
};

// MySQL devuelve las columnas DECIMAL como CADENA, no como número. Llamar
// .toFixed() sobre ellas lanza "total.toFixed is not a function" y tumbaba el
// correo de cambio de estado en todos los casos. Se normaliza aquí, que es
// donde se formatea el dinero, para que ningún llamador tenga que acordarse.
// Con separador de miles: "$10,141.06", no "$10141.06". Es el formato de
// todo el sitio; los correos eran el único lugar sin él.
const money = (value: unknown): string => {
  const numero = typeof value === 'number' ? value : Number(value);
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(Number.isFinite(numero) ? numero : 0);
};

/**
 * Desglose del pedido para el pie de los correos.
 *
 * Los correos saltaban del renglón del producto al total: un pedido de
 * $5,070.53 terminaba en "Total: $6,051.94" sin decir de dónde salía la
 * diferencia (envío e IVA). Se muestra el desglose que guardó la orden; los
 * pedidos anteriores a esas columnas no lo tienen y siguen mostrando solo el
 * total, que es lo único que se sabe con certeza.
 */
export interface DesgloseCorreo {
  subtotal?: number | string | null;
  discount?: number | string | null;
  shipping?: number | string | null;
  tax?: number | string | null;
}

interface EtiquetasDesglose {
  subtotal: string;
  discount: string;
  shipping: string;
  free: string;
  tax: string;
  total: string;
  /** Para pedidos sin desglose guardado: nombra la diferencia sin inventarla. */
  extras: string;
}

const hayNumero = (v: unknown): boolean =>
  v !== null && v !== undefined && Number.isFinite(Number(v));

/** Renglones del desglose en HTML. Vacío si la orden no lo trae guardado. */
const desgloseHtml = (
  d: DesgloseCorreo | null | undefined,
  et: EtiquetasDesglose,
  currency: string
): string => {
  if (!d || !hayNumero(d.subtotal)) return '';
  const fila = (etiqueta: string, valor: string) =>
    `<p style="margin: 4px 0; color: ${BRAND.mutedForeground};">${etiqueta}: <span style="color: ${BRAND.foreground};">${valor}</span></p>`;

  const partes = [fila(et.subtotal, `$${money(d.subtotal)} ${currency}`)];
  if (hayNumero(d.discount) && Number(d.discount) > 0) {
    partes.push(fila(et.discount, `-$${money(d.discount)} ${currency}`));
  }
  partes.push(fila(et.shipping, Number(d.shipping) > 0 ? `$${money(d.shipping)} ${currency}` : et.free));
  if (hayNumero(d.tax)) partes.push(fila(et.tax, `$${money(d.tax)} ${currency}`));
  return partes.join('\n            ');
};

/** El mismo desglose para la versión de texto plano. */
const desgloseTexto = (
  d: DesgloseCorreo | null | undefined,
  et: EtiquetasDesglose,
  currency: string
): string => {
  if (!d || !hayNumero(d.subtotal)) return '';
  const lineas = [`${et.subtotal}: $${money(d.subtotal)} ${currency}`];
  if (hayNumero(d.discount) && Number(d.discount) > 0) {
    lineas.push(`${et.discount}: -$${money(d.discount)} ${currency}`);
  }
  lineas.push(`${et.shipping}: ${Number(d.shipping) > 0 ? `$${money(d.shipping)} ${currency}` : et.free}`);
  if (hayNumero(d.tax)) lineas.push(`${et.tax}: $${money(d.tax)} ${currency}`);
  return lineas.join('\n    ');
};

// El aviso interno siempre va en español, así que sus etiquetas son fijas.
const ETIQUETAS_DESGLOSE_ES: EtiquetasDesglose = {
  subtotal: 'Subtotal',
  discount: 'Descuento',
  shipping: 'Envío',
  free: 'Gratis',
  tax: 'IVA (16%)',
  total: 'Total',
  extras: 'Envío e impuestos',
};

/**
 * Los pedidos anteriores a las columnas de desglose no tienen subtotal
 * guardado, así que el correo saltaba del renglón del producto al total y la
 * diferencia quedaba sin explicar: parecía una suma mal hecha.
 *
 * No se puede reconstruir cuánto fue envío y cuánto impuesto —ese dato nunca
 * se guardó—, pero sí decir a cuánto asciende la diferencia, que es lo que
 * faltaba para que el correo cuadre a la vista.
 */
const diferenciaSinDesglose = (
  items: Array<{ quantity: number; price: unknown }>,
  total: unknown,
  et: EtiquetasDesglose,
  currency: string
): { html: string; texto: string } => {
  // Misma regla que las páginas del pedido (lib/order-breakdown.ts): del total
  // se recupera el envío y el IVA. Aquí no se conoce el descuento, así que si
  // los números no cierran se nombra la diferencia sin inventar renglones.
  const suma = items.reduce(
    (acumulado, item) => acumulado + Number(item.quantity || 0) * (Number(item.price) || 0), 0);
  const d = desgloseDeOrden({ subtotalRenglones: suma, total });
  const fila = (etiqueta: string, valor: string) =>
    `<p style="margin: 4px 0; color: ${BRAND.mutedForeground};">${etiqueta}: <span style="color: ${BRAND.foreground};">${valor}</span></p>`;
  if (d && (d.shipping > 0 || d.tax > 0)) {
    return {
      html: [
        fila(et.subtotal, `$${money(d.subtotal)} ${currency}`),
        fila(et.shipping, d.shipping > 0 ? `$${money(d.shipping)} ${currency}` : et.free),
        fila(et.tax, `$${money(d.tax)} ${currency}`),
      ].join('\n            '),
      texto: `${et.subtotal}: $${money(d.subtotal)} ${currency}\n${et.shipping}: ${d.shipping > 0 ? '$' + money(d.shipping) + ' ' + currency : et.free}\n${et.tax}: $${money(d.tax)} ${currency}`,
    };
  }
  const diferencia = (Number(total) || 0) - suma;
  if (!(diferencia > 0.5)) return { html: '', texto: '' };
  return {
    html: fila(et.subtotal, `$${money(suma)} ${currency}`) + `\n            ` + fila(et.extras, `$${money(diferencia)} ${currency}`),
    texto: `${et.subtotal}: $${money(suma)} ${currency}\n${et.extras}: $${money(diferencia)} ${currency}`,
  };
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
  items: Array<{ name: string; quantity: number; price: number; code?: string | null; size?: string | null }>,
  shippingAddress: string,
  // Los pedidos pueden cobrarse en pesos o en dólares
  currency: 'MXN' | 'USD' = 'MXN',
  // Idioma del cliente: quien compraba en /en recibía la confirmación en español.
  lang: 'es' | 'en' = 'es',
  // Desglose del cobro, para que el total no aparezca sin explicación.
  desglose?: DesgloseCorreo | null,
  // Forma de entrega. Un pedido para recoger no tiene "dirección de envío" ni
  // se "envía": se recoge en sucursal, y el correo debe decirlo así.
  deliveryMethod?: DeliveryMethod | null
): EmailData => {
  const opcionEntrega = deliveryMethod ? getDeliveryOption(deliveryMethod) : undefined;
  const esRecoger = deliveryMethod ? isPickupMethod(deliveryMethod) : false;
  const direccionMostrada = esRecoger && opcionEntrega?.address?.text ? opcionEntrega.address.text : shippingAddress;
  const plazo = opcionEntrega?.days[lang === 'en' ? 'en' : 'es'] || '';
  const isEn = lang === 'en';
  const t = isEn ? {
    subject: (n: string) => `Order confirmation #${n} - Star Filters`,
    thanks: 'Thank you for your order',
    confirmed: 'Your order is confirmed and we are getting it ready.',
    greeting: (name: string) => `Hi ${name},`,
    orderDetails: 'Order details',
    orderNumber: 'Order number',
    date: 'Date',
    products: 'Products',
    product: 'Product',
    total: 'Total',
    quantity: 'Quantity',
    shippingAddress: 'Shipping address',
    pickupAt: 'Pick up at',
    willShip: 'We will let you know when your order ships.',
    willBeReady: 'We will let you know when your order is ready for pickup.',
    availability: 'Availability',
    viewOrders: 'View my orders',
    subtotal: 'Subtotal',
    discount: 'Discount',
    shipping: 'Shipping',
    free: 'Free',
    extras: 'Shipping & taxes',
    tax: 'VAT (16%)',
    rights: 'All rights reserved.',
  } : {
    subject: (n: string) => `Confirmación de Pedido #${n} - Star Filters`,
    thanks: '¡Gracias por tu compra!',
    confirmed: 'Tu pedido ha sido confirmado y se está procesando.',
    greeting: (name: string) => `Hola ${name},`,
    orderDetails: 'Detalles del Pedido',
    orderNumber: 'Número de Pedido',
    date: 'Fecha',
    products: 'Productos',
    product: 'Producto',
    total: 'Total',
    quantity: 'Cantidad',
    shippingAddress: 'Dirección de Envío',
    pickupAt: 'Recoger en',
    willShip: 'Te avisaremos cuando tu pedido sea enviado.',
    willBeReady: 'Te avisaremos cuando tu pedido esté listo para recoger.',
    availability: 'Disponible',
    viewOrders: 'Ver Mis Pedidos',
    subtotal: 'Subtotal',
    discount: 'Descuento',
    shipping: 'Envío',
    free: 'Gratis',
    extras: 'Envío e impuestos',
    tax: 'IVA (16%)',
    rights: 'Todos los derechos reservados.',
  };
  // Paleta de colores de la aplicación
  const color50 = BRAND.primaryTint;
  const color100 = BRAND.accent;
  const color500 = BRAND.primary;
  const color600 = BRAND.primary;
  const color700 = BRAND.primaryHover;
  
  const subject = t.subject(orderNumber);
  
  const itemsList = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid ${BRAND.border};">
        <strong>${item.name}</strong>${item.size ? `<br><span style="color: ${BRAND.mutedForeground}; font-size: 13px;">Modelo: ${escapeHtml(String(item.size))}</span>` : ''}${item.code ? `<br><span style="color: ${BRAND.mutedForeground}; font-size: 13px;">Código: ${escapeHtml(String(item.code))}</span>` : ''}<br>
        <span style="color: ${BRAND.mutedForeground}; font-size: 14px;">${t.quantity}: ${item.quantity}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid ${BRAND.border}; text-align: right;">
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
        body { font-family: ${EMAIL_FONT}; line-height: 1.6; color: ${BRAND.foreground}; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${BRAND.accent}; color: ${BRAND.foreground}; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; border-bottom: 1px solid ${BRAND.border}; }
        .header-logo { max-width: 180px; height: auto; margin-bottom: 15px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: bold; color: ${BRAND.foreground}; }
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
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: ${BRAND.mutedForeground}; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="Star Filters" class="header-logo" />
          <h1>${t.thanks}</h1>
        </div>
        <div class="content">
          <h2>${t.greeting(customerName)}</h2>
          <p>${t.confirmed}</p>
          
          <div class="order-info">
            <h3>${t.orderDetails}</h3>
            <p><strong>${t.orderNumber}:</strong> ${orderNumber}</p>
            <p><strong>${t.date}:</strong> ${orderDate}</p>
          </div>
          
          <h3>${t.products}:</h3>
          <table class="order-items">
            <thead>
              <tr style="background-color: ${BRAND.muted};">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid ${BRAND.border};">${t.product}</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid ${BRAND.border};">${t.total}</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>
          
          <div class="total">
            ${desgloseHtml(desglose, t, currency) || diferenciaSinDesglose(items, total, t, currency).html}
            <p style="font-weight: bold; margin-top: 10px; border-top: 1px solid ${BRAND.border}; padding-top: 10px;">${t.total}: $${money(total)} ${currency}</p>
          </div>
          
          <div class="shipping">
            <h4>${esRecoger ? t.pickupAt : t.shippingAddress}:</h4>
            <p>${escapeHtml(direccionMostrada)}</p>
            ${esRecoger && plazo ? `<p style="margin-top: 6px; color: ${BRAND.mutedForeground};">${t.availability}: ${escapeHtml(plazo)}</p>` : ''}
          </div>
          
          <p>${esRecoger ? t.willBeReady : t.willShip}</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${siteUrl}/orders" class="button">${t.viewOrders}</a>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Star Filters. ${t.rights}</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    ${t.thanks}
    
    ${t.greeting(customerName)}
    
    ${t.confirmed}
    
    ${t.orderNumber}: ${orderNumber}
    ${t.date}: ${orderDate}
    
    ${t.products}:
    ${items.map(item => `- ${item.name}${item.size ? ` · ${item.size}` : ''}${item.code ? ` (código ${item.code})` : ''} x${item.quantity}: $${money(Number(item.price) * item.quantity)}`).join('\n')}
    
    ${desgloseTexto(desglose, t, currency) || diferenciaSinDesglose(items, total, t, currency).texto}
    ${t.total}: $${money(total)} ${currency}
    
    ${esRecoger ? t.pickupAt : t.shippingAddress}:
    ${direccionMostrada}${esRecoger && plazo ? `\n    ${t.availability}: ${plazo}` : ''}
    
    ${esRecoger ? t.willBeReady : t.willShip}
    
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
export const createPasswordResetEmail = (
  userFirstName: string,
  resetUrl: string,
  // Quien pedía su contraseña desde /en/forgot-password recibía el correo en
  // español: esta plantilla era la única de cuenta sin idioma.
  lang: 'es' | 'en' = 'es'
): EmailData => {
  const isEn = lang === 'en';
  const t = isEn ? {
    subject: 'Reset your password - Star Filters',
    heading: 'Reset your password',
    greeting: (name: string) => `Hi ${name},`,
    intro: 'We received a request to change your Star Filters password.',
    cta: 'Click the button below to set a new one:',
    button: 'Change password',
    copyLink: 'Or copy and paste this link into your browser:',
    expires: 'This link expires in 1 hour',
    onceOnly: 'It can only be used once',
    ignore: 'If you did not request this, you can ignore this email',
    plainCta: 'Use this link to set a new password:',
    rights: 'All rights reserved.',
  } : {
    subject: 'Recuperar contraseña - Star Filters',
    heading: 'Recuperar Contraseña',
    greeting: (name: string) => `Hola ${name},`,
    intro: 'Recibimos una solicitud para cambiar tu contraseña en Star Filters.',
    cta: 'Haz clic en el siguiente botón para crear una nueva contraseña:',
    button: 'Cambiar Contraseña',
    copyLink: 'O copia y pega este enlace en tu navegador:',
    expires: 'Este enlace expira en 1 hora',
    onceOnly: 'Solo puede usarse una vez',
    ignore: 'Si no solicitaste este cambio, ignora este email',
    plainCta: 'Usa este enlace para crear una nueva contraseña:',
    rights: 'Todos los derechos reservados.',
  };
  // Paleta de colores de la aplicación
  const color50 = BRAND.primaryTint;
  const color100 = BRAND.accent;
  const color600 = BRAND.primary;
  const color700 = BRAND.primaryHover;
  
  const subject = t.subject;
  const siteUrl = import.meta.env.PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || import.meta.env.SITE_URL || process.env.SITE_URL || 'https://starfilters.mx';
  const logoUrl = `${siteUrl}/logos/logo-starfilters.png`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: ${EMAIL_FONT}; line-height: 1.6; color: ${BRAND.foreground}; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${BRAND.accent}; color: ${BRAND.foreground}; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; border-bottom: 1px solid ${BRAND.border}; }
        .header-logo { max-width: 180px; height: auto; margin-bottom: 15px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: bold; color: ${BRAND.foreground}; }
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
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: ${BRAND.mutedForeground}; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="Star Filters" class="header-logo" />
          <h1>${t.heading}</h1>
        </div>
        <div class="content">
          <h2>${t.greeting(userFirstName)}</h2>
          <p>${t.intro}</p>
          <p>${t.cta}</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">${t.button}</a>
          </div>
          
          <p>${t.copyLink}</p>
          <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px;">
            ${resetUrl}
          </p>
          
          <div class="warning">
            <p><strong>⚠️ Importante:</strong></p>
            <ul>
              <li>${t.expires}</li>
              <li>${t.onceOnly}</li>
              <li>${t.ignore}</li>
            </ul>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Star Filters. ${t.rights}</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    ${t.greeting(userFirstName)}
    
    ${t.intro}
    
    ${t.plainCta}
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
  const color50 = BRAND.primaryTint;
  const color600 = BRAND.primary;
  const color700 = BRAND.primaryHover;

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
        body { font-family: ${EMAIL_FONT}; line-height: 1.6; color: ${BRAND.foreground}; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${BRAND.accent}; color: ${BRAND.foreground}; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; border-bottom: 1px solid ${BRAND.border}; }
        .header-logo { max-width: 180px; height: auto; margin-bottom: 15px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: bold; color: ${BRAND.foreground}; }
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
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: ${BRAND.mutedForeground}; }
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

          <p style="font-size: 14px; color: ${BRAND.mutedForeground}; margin-top: 20px;">${ignore}</p>
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
  items: Array<{ name: string; quantity: number; price: number; code?: string | null; size?: string | null }>,
  shippingAddress: string,
  // Los pedidos pueden cobrarse en pesos o en dólares
  currency: 'MXN' | 'USD' = 'MXN',
  extras: OrderNotificationExtras = {},
  // Desglose del cobro, igual que en los correos al comprador.
  desglose?: DesgloseCorreo | null
): EmailData => {
  // Paleta de colores de la aplicación
  const color50 = BRAND.primaryTint;
  const color100 = BRAND.accent;
  const color600 = BRAND.primary;
  const color700 = BRAND.primaryHover;
  
  const subject = `Nueva Orden #${orderNumber} - Star Filters`;
  
  const itemsList = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid ${BRAND.border};">
        <strong>${item.name}</strong>${item.size ? `<br><span style="color: ${BRAND.mutedForeground}; font-size: 13px;">Modelo: ${escapeHtml(String(item.size))}</span>` : ''}${item.code ? `<br><span style="color: ${BRAND.mutedForeground}; font-size: 13px;">Código: ${escapeHtml(String(item.code))}</span>` : ''}<br>
        <span style="color: ${BRAND.mutedForeground}; font-size: 14px;">Cantidad: ${item.quantity}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid ${BRAND.border}; text-align: right;">
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
                  <td style="padding: 6px 0; color: ${BRAND.foreground}; font-size: 14px; font-weight: bold;">${escapeHtml(field.value as string)}</td>
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
        body { font-family: ${EMAIL_FONT}; line-height: 1.6; color: ${BRAND.foreground}; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${BRAND.accent}; color: ${BRAND.foreground}; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; border-bottom: 1px solid ${BRAND.border}; }
        .header-logo { max-width: 180px; height: auto; margin-bottom: 15px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: bold; color: ${BRAND.foreground}; }
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
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: ${BRAND.mutedForeground}; }
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
            ${desgloseHtml(desglose, ETIQUETAS_DESGLOSE_ES, currency) || diferenciaSinDesglose(items, total, ETIQUETAS_DESGLOSE_ES, currency).html}
            <p style="border-top: 1px solid ${BRAND.border}; padding-top: 8px; margin-top: 8px;"><strong>Total:</strong> $${money(total)} ${currency}</p>
          </div>
          
          <div class="customer-info">
            <h3>Información del Cliente</h3>
            <p><strong>Nombre:</strong> ${customerName}</p>
            <p><strong>Email:</strong> ${customerEmail}</p>
          </div>
          
          <h3>Productos:</h3>
          <table class="order-items">
            <thead>
              <tr style="background-color: ${BRAND.muted};">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid ${BRAND.border};">Producto</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid ${BRAND.border};">Total</th>
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
    ${desgloseTexto(desglose, ETIQUETAS_DESGLOSE_ES, currency) || diferenciaSinDesglose(items, total, ETIQUETAS_DESGLOSE_ES, currency).texto}
    Total: $${money(total)} ${currency}
    
    Cliente:
    Nombre: ${customerName}
    Email: ${customerEmail}
    
    Productos:
    ${items.map(item => `- ${item.name}${item.size ? ` · ${item.size}` : ''}${item.code ? ` (código ${item.code})` : ''} x${item.quantity}: $${money(Number(item.price) * item.quantity)}`).join('\n')}
    
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
  items: Array<{ name: string; quantity: number; price: number; code?: string | null; size?: string | null }>,
  total: number,
  trackingNumber?: string,
  currency: 'MXN' | 'USD' = 'MXN',
  // Con qué paquetería va. Sin esto el correo decía "Número de rastreo: 125"
  // sin indicar con quién ni dónde consultarlo.
  carrier?: string | null,
  // Idioma del cliente. Los pedidos hechos en /en recibían el aviso en español.
  lang: 'es' | 'en' = 'es',
  // A quién va dirigido. El mismo aviso no se puede escribir igual para el
  // comprador ("tu pedido va en camino") que para el equipo, que necesita
  // saber de quién es el pedido y entrar al panel.
  destinatario: 'cliente' | 'equipo' = 'cliente',
  // Desglose guardado en la orden. Sin él el correo saltaba del renglón del
  // producto al total, y la diferencia (envío e IVA) no se explicaba.
  desglose?: DesgloseCorreo | null,
  // Forma de entrega: un pedido para recoger no "va en camino", queda listo
  // para recoger en sucursal.
  deliveryMethod?: DeliveryMethod | null
): EmailData => {
  const opcionEntrega = deliveryMethod ? getDeliveryOption(deliveryMethod) : undefined;
  const esRecoger = deliveryMethod ? isPickupMethod(deliveryMethod) : false;
  const direccionRecoger = opcionEntrega?.address?.text || '';
  const plazoRecoger = opcionEntrega?.days[lang === 'en' ? 'en' : 'es'] || '';
  const paraEquipo = destinatario === 'equipo';
  // Paleta de colores de la aplicación
  const color50 = BRAND.primaryTint;
  const color100 = BRAND.accent;
  const color500 = BRAND.primary;
  const color600 = BRAND.primary;
  const color700 = BRAND.primaryHover;
  const color800 = BRAND.primaryDeep;

  const isEn = lang === 'en';
  const t = isEn ? {
    subject: (n: string) => `Order #${n} update - Star Filters`,
    greeting: (name: string) => `Hi ${name},`,
    orderDetails: 'Order details',
    orderNumber: 'Order number',
    date: 'Date',
    status: 'Status',
    tracking: 'Tracking number',
    carrier: 'Carrier',
    trackHere: 'Track your shipment',
    products: 'Products',
    product: 'Product',
    total: 'Total',
    quantity: 'Quantity',
    viewOrders: 'View my orders',
    subtotal: 'Subtotal',
    discount: 'Discount',
    shipping: 'Shipping',
    free: 'Free',
    extras: 'Shipping & taxes',
    tax: 'VAT (16%)',
    rights: 'All rights reserved.',
  } : {
    subject: (n: string) => `Actualización de Pedido #${n} - Star Filters`,
    greeting: (name: string) => `Hola ${name},`,
    orderDetails: 'Detalles del Pedido',
    orderNumber: 'Número de Pedido',
    date: 'Fecha',
    status: 'Estado',
    tracking: 'Número de Rastreo',
    carrier: 'Paquetería',
    trackHere: 'Rastrear mi envío',
    products: 'Productos',
    product: 'Producto',
    total: 'Total',
    quantity: 'Cantidad',
    viewOrders: 'Ver Mis Pedidos',
    subtotal: 'Subtotal',
    discount: 'Descuento',
    shipping: 'Envío',
    free: 'Gratis',
    extras: 'Envío e impuestos',
    tax: 'IVA (16%)',
    rights: 'Todos los derechos reservados.',
  };

  // Los estados también se traducen: "SHIPPED" en un correo en español se leía
  // como error del sistema.
  const ESTADO_TEXTO: Record<string, { es: string; en: string }> = {
    pending:    { es: 'Pendiente',   en: 'Pending' },
    processing: { es: 'En proceso',  en: 'Processing' },
    shipped:    { es: 'Enviado',     en: 'Shipped' },
    delivered:  { es: 'Entregado',   en: 'Delivered' },
    cancelled:  { es: 'Cancelado',   en: 'Cancelled' },
  };
  const estadoLegible = (estado: string) =>
    ESTADO_TEXTO[estado] ? ESTADO_TEXTO[estado][isEn ? 'en' : 'es'] : estado;
  
  // Color primary para botones y elementos principales
  const primaryColor = color600;
  
  // Paquetería y enlace de rastreo, si se reconoce.
  const paqueteria = resolverPaqueteria(carrier, trackingNumber);

  const statusMessages: Record<string, { title: string; message: string }> = isEn ? {
    processing: {
      title: 'Your order is being prepared',
      message: esRecoger ? 'Your order is confirmed and we are getting it ready for pickup.' : 'Your order is confirmed and we are getting it ready to ship.'
    },
    shipped: esRecoger ? {
      title: 'Your order is ready for pickup',
      message: `You can pick it up at ${direccionRecoger}.` + (plazoRecoger ? ` Availability: ${plazoRecoger}.` : '')
    } : {
      title: 'Your order is on its way',
      message: 'Your order has shipped. ' + (paqueteria ? `It is travelling with ${paqueteria.nombre}. ` : '') + (trackingNumber ? `Tracking number: ${trackingNumber}` : '')
    },
    delivered: {
      title: 'Your order has been delivered',
      message: 'Your order has arrived. We hope everything is just right.'
    },
    cancelled: {
      title: 'Your order has been cancelled',
      message: 'Your order has been cancelled. If you have any questions, please get in touch.'
    }
  } : {
    processing: {
      title: 'Tu pedido está siendo procesado',
      message: esRecoger ? 'Tu pedido ha sido confirmado y lo estamos preparando para que lo recojas.' : 'Tu pedido ha sido confirmado y está siendo preparado para el envío.'
    },
    shipped: esRecoger ? {
      title: '¡Tu pedido está listo para recoger!',
      message: `Puedes pasar por él a ${direccionRecoger}.` + (plazoRecoger ? ` Disponible: ${plazoRecoger}.` : '')
    } : {
      title: '¡Tu pedido ha sido enviado!',
      message: 'Tu pedido está en camino. ' + (paqueteria ? `Va con ${paqueteria.nombre}. ` : '') + (trackingNumber ? `Número de rastreo: ${trackingNumber}` : '')
    },
    delivered: {
      title: '¡Tu pedido ha sido entregado!',
      message: 'Tu pedido ha llegado a su destino. ¡Esperamos que disfrutes tus productos!'
    },
    cancelled: {
      title: 'Tu pedido ha sido cancelado',
      message: 'Tu pedido ha sido cancelado. Si tienes alguna pregunta, por favor contáctanos.'
    }
  };

  const statusInfo = statusMessages[newStatus] || {
    title: isEn ? 'Your order was updated' : 'Actualización de tu pedido',
    message: isEn
      ? `Your order changed from "${estadoLegible(oldStatus)}" to "${estadoLegible(newStatus)}".`
      : `El estado de tu pedido ha cambiado de "${estadoLegible(oldStatus)}" a "${estadoLegible(newStatus)}".`
  };

  // El chip del estado usa los mismos colores que el panel.
  const badge = ESTADO_BADGE[newStatus] || { bg: BRAND.accent, fg: BRAND.primaryDeep };

  const subject = paraEquipo
    ? `Pedido #${orderNumber} → ${estadoLegible(newStatus)} (${customerName})`
    : t.subject(orderNumber);
  
  const itemsList = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid ${BRAND.border};">
        <strong>${item.name}</strong>${item.size ? `<br><span style="color: ${BRAND.mutedForeground}; font-size: 13px;">Modelo: ${escapeHtml(String(item.size))}</span>` : ''}${item.code ? `<br><span style="color: ${BRAND.mutedForeground}; font-size: 13px;">Código: ${escapeHtml(String(item.code))}</span>` : ''}<br>
        <span style="color: ${BRAND.mutedForeground}; font-size: 14px;">${t.quantity}: ${item.quantity}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid ${BRAND.border}; text-align: right;">
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
        body { font-family: ${EMAIL_FONT}; line-height: 1.6; color: ${BRAND.foreground}; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${BRAND.accent}; color: ${BRAND.foreground}; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; border-bottom: 1px solid ${BRAND.border}; }
        .header-logo { max-width: 180px; height: auto; margin-bottom: 15px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: bold; color: ${BRAND.foreground}; }
        .content { background-color: ${color50}; padding: 30px; border-radius: 0 0 8px 8px; }
        .order-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .order-items { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .status-badge { 
          display: inline-block; 
          padding: 6px 14px; 
          background-color: ${badge.bg}; 
          color: ${badge.fg} !important; 
          border-radius: 9999px; 
          font-weight: 600;
          font-size: 14px;
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
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: ${BRAND.mutedForeground}; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="Star Filters" class="header-logo" />
          <h1>${paraEquipo ? `Pedido #${orderNumber}` : statusInfo.title}</h1>
        </div>
        <div class="content">
          <h2>${paraEquipo ? `Pedido de ${customerName}` : t.greeting(customerName)}</h2>
          <p>${paraEquipo ? `Este pedido pasó a <strong>${estadoLegible(newStatus)}</strong>.` : statusInfo.message}</p>
          
          <div class="order-info">
            <h3>${t.orderDetails}</h3>
            <p><strong>${t.orderNumber}:</strong> ${orderNumber}</p>
            <p><strong>${t.date}:</strong> ${orderDate}</p>
            <p><strong>${t.status}:</strong> <span class="status-badge">${estadoLegible(newStatus)}</span></p>
            ${esRecoger && direccionRecoger ? `<p><strong>${isEn ? 'Pick up at' : 'Recoger en'}:</strong> ${escapeHtml(direccionRecoger)}</p>` : ''}
            ${!esRecoger && paqueteria ? `<p><strong>${t.carrier}:</strong> ${escapeHtml(paqueteria.nombre)}</p>` : ''}
            ${!esRecoger && trackingNumber ? `<p><strong>${t.tracking}:</strong> ${
              paqueteria?.url
                ? `<a href="${paqueteria.url}" style="color: ${BRAND.primary}; font-weight: bold;">${escapeHtml(trackingNumber)}</a>`
                : escapeHtml(trackingNumber)
            }</p>` : ''}
            ${!esRecoger && paqueteria?.url ? `<p style="margin-top: 14px;"><a href="${paqueteria.url}" style="display: inline-block; background-color: ${BRAND.primary}; color: #ffffff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">${t.trackHere}</a></p>` : ''}
          </div>
          
          <h3>${t.products}:</h3>
          <table class="order-items">
            <thead>
              <tr style="background-color: ${BRAND.muted};">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid ${BRAND.border};">${t.product}</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid ${BRAND.border};">${t.total}</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>
          
          <div style="text-align: right; margin-top: 20px;">
            ${desgloseHtml(desglose, t, currency) || diferenciaSinDesglose(items, total, t, currency).html}
            <p style="font-size: 18px; font-weight: bold; margin-top: 10px; border-top: 1px solid ${BRAND.border}; padding-top: 10px;">${t.total}: $${money(total)} ${currency}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${paraEquipo ? `${siteUrl}/admin/orders` : `${siteUrl}/orders`}" class="button">${paraEquipo ? 'Ver la orden en el panel' : t.viewOrders}</a>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Star Filters. ${t.rights}</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    ${paraEquipo ? `Pedido #${orderNumber} → ${estadoLegible(newStatus)}` : statusInfo.title}
    
    ${paraEquipo ? `Pedido de ${customerName}` : t.greeting(customerName)}
    
    ${paraEquipo ? `Este pedido pasó a ${estadoLegible(newStatus)}.` : statusInfo.message}
    
    ${t.orderDetails}:
    ${t.orderNumber}: ${orderNumber}
    ${t.date}: ${orderDate}
    ${t.status}: ${estadoLegible(newStatus)}
    ${esRecoger && direccionRecoger ? `${isEn ? 'Pick up at' : 'Recoger en'}: ${direccionRecoger}` : ''}
    ${!esRecoger && paqueteria ? `${t.carrier}: ${paqueteria.nombre}` : ''}
    ${!esRecoger && trackingNumber ? `${t.tracking}: ${trackingNumber}` : ''}
    ${!esRecoger && paqueteria?.url ? `${t.trackHere}: ${paqueteria.url}` : ''}
    
    ${t.products}:
    ${items.map(item => `- ${item.name}${item.size ? ` · ${item.size}` : ''}${item.code ? ` (código ${item.code})` : ''} x${item.quantity}: $${money(Number(item.price) * item.quantity)}`).join('\n')}
    
    ${desgloseTexto(desglose, t, currency) || diferenciaSinDesglose(items, total, t, currency).texto}
    ${t.total}: $${money(total)} ${currency}
    
    ${t.viewOrders}: ${siteUrl}/orders
    
    © ${new Date().getFullYear()} Star Filters
  `;
  
  return {
    to: '',
    subject,
    html,
    text
  };
};
