import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-utils';
import { deleteBlogPost, getBlogPostByUuid } from '@/lib/database';

export const POST: APIRoute = async ({ request, cookies }) => {
  // Verificar autenticación
  const adminCheck = await requireAdmin(cookies);
  if (!adminCheck.isAdmin) {
    return new Response(JSON.stringify({
      success: false,
      message: 'No autorizado'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { uuid } = await request.json();

    if (!uuid) {
      return new Response(JSON.stringify({
        success: false,
        message: 'UUID del artículo es requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener el post para verificar que existe (incluir borradores para admin)
    const post = await getBlogPostByUuid(uuid, true);

    if (!post) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Artículo no encontrado'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Eliminar el post por ID
    const deleted = await deleteBlogPost(post.id);

    if (deleted) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Artículo eliminado exitosamente'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        message: 'Error al eliminar el artículo'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error en el endpoint de eliminación:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
