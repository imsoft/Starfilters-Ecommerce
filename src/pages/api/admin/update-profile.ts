import type { APIRoute } from 'astro';
import { query } from '@/config/database';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const formData = await request.formData();
    const username = formData.get('username') as string;
    const fullName = formData.get('full_name') as string;
    const email = formData.get('email') as string;

    // Obtener el usuario actual de las cookies
    const authToken = cookies.get('auth_token')?.value;
    if (!authToken) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/login?error=unauthorized' }
      });
    }

    // Decodificar el token para obtener el email actual
    const tokenData = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());
    const currentEmail = tokenData.email;

    // Verificar si el nuevo email ya está en uso por otro usuario
    if (email !== currentEmail) {
      const [existingUser] = await query(
        'SELECT id FROM admin_users WHERE email = ? AND email != ?',
        [email, currentEmail]
      ) as any[];

      if (existingUser) {
        return new Response(null, {
          status: 302,
          headers: { Location: '/admin/profile?error=email_in_use' }
        });
      }
    }

    // Actualizar el perfil
    await query(
      'UPDATE admin_users SET username = ?, full_name = ?, email = ?, updated_at = NOW() WHERE email = ?',
      [username, fullName || null, email, currentEmail]
    );

    // Si el email cambió, actualizar el token
    if (email !== currentEmail) {
      const newTokenData = { ...tokenData, email };
      const newToken = Buffer.from(JSON.stringify(newTokenData)).toString('base64');
      
      cookies.set('auth_token', newToken, {
        path: '/',
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 días
      });
    }

    return new Response(null, {
      status: 302,
      headers: { Location: '/admin/profile?success=updated' }
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    return new Response(null, {
      status: 302,
      headers: { Location: '/admin/profile?error=update_failed' }
    });
  }
};

