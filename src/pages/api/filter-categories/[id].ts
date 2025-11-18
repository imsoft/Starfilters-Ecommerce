import type { APIRoute } from 'astro';
import { updateCategory } from '@/lib/filter-category-service';

/**
 * PATCH - Actualizar campos específicos de una categoría (como main_image)
 */
export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const id = parseInt(params.id || '0');

    if (!id || isNaN(id)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'ID de categoría inválido',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await request.json();
    const { main_image } = body;

    if (main_image !== undefined) {
      const success = await updateCategory(id, {
        main_image: main_image || null,
      });

      if (!success) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'No se pudo actualizar la categoría',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Categoría actualizada exitosamente',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error en PATCH /api/filter-categories/[id]:', error);
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
