import type { APIRoute } from 'astro';
import { updateCategory, deleteCategory } from '@/lib/filter-category-service';
import { requireAdmin } from '@/lib/auth-utils';

/**
 * PATCH - Actualizar campos específicos de una categoría (como main_image)
 */
export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  try {
    // Verificar autenticación de admin
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

/**
 * DELETE - Eliminar una categoría de filtros
 */
export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    // Verificar autenticación de admin
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
          message: 'ID de categoría inválido',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`🗑️ Intentando eliminar categoría ID: ${id}`);

    const success = await deleteCategory(id);

    if (!success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No se pudo eliminar la categoría',
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
        message: 'Categoría eliminada exitosamente',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error en DELETE /api/filter-categories/[id]:', error);
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
