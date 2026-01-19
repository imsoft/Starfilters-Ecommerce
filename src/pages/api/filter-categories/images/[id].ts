import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-utils';
import { deleteCategoryImage } from '@/lib/filter-category-service';

/**
 * DELETE - Eliminar una imagen de una categoría
 */
export const DELETE: APIRoute = async ({ params, cookies }) => {
  const authResult = await requireAdmin(cookies);
  if (authResult.redirect) {
    return new Response(JSON.stringify({ success: false, message: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const id = parseInt(params.id || '0');

    if (!id || isNaN(id)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'ID de imagen inválido',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('🗑️ Eliminando imagen de categoría ID:', id);
    const success = await deleteCategoryImage(id);

    if (!success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No se pudo eliminar la imagen',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Imagen de categoría eliminada exitosamente');
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Imagen eliminada exitosamente',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error en DELETE /api/filter-categories/images/[id]:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error interno del servidor: ' + (error instanceof Error ? error.message : 'Error desconocido'),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
