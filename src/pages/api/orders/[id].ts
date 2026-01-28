import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-utils';
import { deleteOrder, getOrderById } from '@/lib/database';

export const prerender = false;

/**
 * DELETE - Eliminar una orden
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
          message: 'ID de orden inválido',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar que la orden existe
    const order = await getOrderById(id);
    if (!order) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Orden no encontrada',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`🗑️ Intentando eliminar orden ID: ${id}`);

    const success = await deleteOrder(id);

    if (!success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No se pudo eliminar la orden',
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
        message: 'Orden eliminada exitosamente',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error en DELETE /api/orders/[id]:', error);
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
