import type { APIRoute } from 'astro';
import { changeOrderStatus } from '@/lib/order-status';
import { requireAdminApi } from '@/lib/auth-utils';

export const POST: APIRoute = async ({ request, cookies }) => {
  const noAutorizado = await requireAdminApi(cookies);
  if (noAutorizado) return noAutorizado;

  try {
    const { orderId, status, trackingNumber, carrier, notify } = await request.json();

    if (!orderId || !status) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const resultado = await changeOrderStatus({
      orderId,
      newStatus: status,
      trackingNumber,
      carrier,
      notify,
    });

    if (!resultado.ok) {
      const respuestas: Record<string, { status: number; error: string }> = {
        invalid_status: { status: 400, error: 'Estado no válido' },
        not_found: { status: 404, error: 'Orden no encontrada' },
        update_failed: { status: 500, error: 'No se pudo actualizar el estado' },
      };
      const respuesta = respuestas[resultado.reason || ''] || { status: 500, error: 'Error desconocido' };
      return new Response(JSON.stringify({ error: respuesta.error }), {
        status: respuesta.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: resultado.reason === 'unchanged'
        ? 'El estado ya es el mismo'
        : 'Estado actualizado correctamente',
      emailSent: resultado.emailSent ?? false,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error actualizando el estado de la orden:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
