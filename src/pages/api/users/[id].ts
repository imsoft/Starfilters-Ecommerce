import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-utils';
import { deleteUser, getUserById } from '@/lib/database';

export const prerender = false;

/**
 * DELETE - Eliminar un usuario
 */
export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    // Verificar autenticación de administrador
    const authResult = await requireAdmin(cookies);
    if (authResult.redirect || !authResult.isAdmin) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No autorizado',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const id = parseInt(params.id || '0');

    if (!id || isNaN(id)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'ID de usuario inválido',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar que el usuario existe
    const user = await getUserById(id);
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Usuario no encontrado',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`🗑️ Intentando eliminar usuario ID: ${id}`);

    const success = await deleteUser(id);

    if (!success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No se pudo eliminar el usuario',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuario eliminado exitosamente',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error en DELETE /api/users/[id]:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error interno del servidor',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
