import type { APIRoute } from 'astro';
import { query } from '@/config/database';
import bcrypt from 'bcryptjs';
import { getAuthenticatedUser } from '@/lib/auth-utils';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const formData = await request.formData();
    const currentPassword = formData.get('current_password') as string;
    const newPassword = formData.get('new_password') as string;
    const confirmPassword = formData.get('confirm_password') as string;

    // Validar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/admin/profile?error=password_mismatch' }
      });
    }

    // Sesión. Antes se leía la cookie 'auth_token' (el nombre real es
    // 'auth-token', con guion), así que nunca coincidía y cambiar la contraseña
    // siempre mandaba a /login. Además se descodificaba el token sin verificar
    // la firma: bastaba con inventarse una cookie para elegir a qué cuenta
    // apuntaba. getAuthenticatedUser lee la cookie correcta y valida la firma.
    const usuario = getAuthenticatedUser(cookies);
    if (!usuario) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/login?error=unauthorized' }
      });
    }
    const email = usuario.email;

    // Obtener el usuario de la base de datos
    const [user] = await query(
      'SELECT id, password_hash FROM admin_users WHERE email = ?',
      [email]
    ) as any[];

    if (!user) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/login?error=unauthorized' }
      });
    }

    // Verificar la contraseña actual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/admin/profile?error=current_password_incorrect' }
      });
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña
    await query(
      'UPDATE admin_users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, user.id]
    );

    return new Response(null, {
      status: 302,
      headers: { Location: '/admin/profile?success=password_changed' }
    });

  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    return new Response(null, {
      status: 302,
      headers: { Location: '/admin/profile?error=password_failed' }
    });
  }
};

