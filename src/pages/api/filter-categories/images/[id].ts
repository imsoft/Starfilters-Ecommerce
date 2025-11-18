import type { APIRoute } from 'astro';
import { deleteCategoryImage } from '@/lib/filter-category-service';

/**
 * DELETE - Eliminar una imagen de una categoría
 */
export const DELETE: APIRoute = async ({ params }) => {
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
    console.error('Error en DELETE /api/filter-categories/images/[id]:', error);
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
