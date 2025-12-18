import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-utils';
import { deleteProduct } from '@/lib/product-service';

export const prerender = false;

/**
 * DELETE - Eliminar un producto
 */
export const DELETE: APIRoute = async ({ params, cookies }) => {
  // Verificar autenticación de administrador
  const authResult = await requireAdmin(cookies);
  if (authResult.redirect) {
    return new Response(
      JSON.stringify({ success: false, message: 'No autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const id = parseInt(params.id || '0');

    if (!id || isNaN(id)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'ID de producto inválido',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const success = await deleteProduct(id);

    if (!success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No se pudo eliminar el producto',
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
        message: 'Producto eliminado exitosamente',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error en DELETE /api/products/[id]:', error);
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

