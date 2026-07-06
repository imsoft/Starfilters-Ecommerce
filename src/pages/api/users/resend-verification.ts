import type { APIRoute } from 'astro';
import { getUserByEmail, updateUser } from '@/lib/database';
import { generateVerificationToken, validateEmail } from '@/lib/auth';
import { sendEmail, createVerificationEmail } from '@/lib/email';

export const prerender = false;

/**
 * POST - Reenviar el correo de verificación de cuenta.
 *
 * Responde de forma genérica (success: true) aunque el correo no exista,
 * para no revelar qué direcciones están registradas.
 */
export const POST: APIRoute = async ({ request, url }) => {
  const json = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const lang: 'es' | 'en' = body?.lang === 'en' ? 'en' : 'es';

    if (!email || !validateEmail(email)) {
      return json({ success: false, message: 'Email inválido' }, 400);
    }

    const user = await getUserByEmail(email);

    // Respuesta genérica: no revelar si la cuenta existe
    if (!user) {
      return json({ success: true });
    }

    if (user.email_verified) {
      return json({ success: true, alreadyVerified: true });
    }

    // Asegurar que el usuario tenga un token vigente
    let token = user.verification_token;
    if (!token) {
      token = generateVerificationToken();
      await updateUser(user.id, { verification_token: token });
    }

    const verifyUrl = `${url.origin}${lang === 'en' ? '/en' : ''}/verify-email?token=${token}`;
    const emailData = createVerificationEmail(user.first_name, verifyUrl, lang);
    emailData.to = user.email;

    const sent = await sendEmail(emailData);
    if (!sent) {
      return json({ success: false, message: 'No se pudo enviar el correo. Intenta más tarde.' }, 500);
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error reenviando correo de verificación:', error);
    return json({ success: false, message: 'Error interno del servidor' }, 500);
  }
};
