import type { APIRoute } from 'astro';
import { deleteCategoryVariant } from '@/lib/filter-category-service';

/**
 * DELETE - Eliminar una variante de una categoría
 */
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = parseInt(params.id || '0');

    if (!id || isNaN(id)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'ID de variante inválido',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const success = await deleteCategoryVariant(id);

    if (!success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No se pudo eliminar la variante',
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
        message: 'Variante eliminada exitosamente',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error en DELETE /api/filter-categories/variants/[id]:', error);
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
