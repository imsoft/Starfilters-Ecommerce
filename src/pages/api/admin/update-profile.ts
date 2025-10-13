import type { APIRoute } from 'astro';
import { query } from '@/config/database';
import { requireAdmin } from '@/lib/auth-utils';
import { getAdminUserByEmail } from '@/lib/database';

export const POST: APIRoute = async ({ request, cookies }) => {
  // Verificar autenticación de administrador
  const authResult = await requireAdmin(cookies);
  if (authResult.redirect) {
    return new Response(null, {
      status: 302,
      headers: { Location: authResult.redirect }
    });
  }

  try {
    const formData = await request.formData();
    const username = formData.get('username') as string;
    const fullName = formData.get('full_name') as string;
    const email = formData.get('email') as string;

    const user = authResult.user;
    if (!user) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/login?error=unauthorized' }
      });
    }

    // Obtener el admin_user actual
    const adminUser = await getAdminUserByEmail(user.email);
    if (!adminUser) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/login?error=unauthorized' }
      });
    }

    console.log('📋 Actualizando perfil del admin:', { id: adminUser.id, email: user.email });

    // Verificar si el nuevo email ya está en uso por otro usuario
    if (email !== user.email) {
      const existingAdmin = await getAdminUserByEmail(email);

      if (existingAdmin && existingAdmin.id !== adminUser.id) {
        return new Response(null, {
          status: 302,
          headers: { Location: '/admin/profile?error=email_in_use' }
        });
      }
    }

    // Actualizar el perfil
    const updateResult = await query(
      'UPDATE admin_users SET username = ?, full_name = ?, email = ?, updated_at = NOW() WHERE id = ?',
      [username, fullName || null, email, adminUser.id]
    ) as any;

    console.log('📊 Resultado de actualización:', updateResult);

    if (updateResult.affectedRows === 0) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/admin/profile?error=update_failed' }
      });
    }

    // Si el email cambió, actualizar el token
    if (email !== user.email) {
      // Obtener el token actual
      const authToken = cookies.get('auth-token')?.value;
      if (authToken) {
        try {
          const tokenData = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());
          const newTokenData = { ...tokenData, email };
          const newToken = `header.${Buffer.from(JSON.stringify(newTokenData)).toString('base64')}.signature`;
          
          cookies.set('auth-token', newToken, {
            path: '/',
            httpOnly: true,
            secure: import.meta.env.PROD,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 días
          });
        } catch (tokenError) {
          console.error('Error actualizando token:', tokenError);
        }
      }
    }

    console.log('✅ Perfil actualizado exitosamente');

    return new Response(null, {
      status: 302,
      headers: { Location: '/admin/profile?success=updated' }
    });

  } catch (error) {
    console.error('❌ Error actualizando perfil:', error);
    return new Response(null, {
      status: 302,
      headers: { Location: '/admin/profile?error=update_failed' }
    });
  }
};

