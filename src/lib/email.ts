// Configuración de email (básica para desarrollo)
// En producción, integrar con servicios como SendGrid, Mailgun, etc.

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Función placeholder para envío de emails
// Por ahora solo logea el email en consola para desarrollo
export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    console.log('📧 ENVÍO DE EMAIL:');
    console.log('📮 Para:', emailData.to);
    console.log('📝 Asunto:', emailData.subject);
    console.log('📄 Contenido HTML:', emailData.html);
    console.log('📄 Contenido texto:', emailData.text || 'N/A');
    console.log('✅ Email "enviado" exitosamente (modo desarrollo)');
    
    return true;
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    return false;
  }
};

// Template para email de reset de contraseña
export const createPasswordResetEmail = (userFirstName: string, resetUrl: string): EmailData => {
  const subject = 'Recuperar contraseña - StarFilters';
  
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
          <p>Recibimos una solicitud para cambiar tu contraseña en StarFilters.</p>
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
          <p>© 2024 StarFilters. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    Hola ${userFirstName},
    
    Recibimos una solicitud para cambiar tu contraseña en StarFilters.
    
    Usa este enlace para crear una nueva contraseña:
    ${resetUrl}
    
    Este enlace expira en 1 hora y solo puede usarse una vez.
    
    Si no solicitaste este cambio, ignora este email.
    
    © 2024 StarFilters
  `;
  
  return {
    to: '',
    subject,
    html,
    text
  };
};
