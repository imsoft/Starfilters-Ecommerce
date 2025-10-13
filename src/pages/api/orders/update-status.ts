import type { APIRoute } from 'astro';
import { updateOrderStatus } from '@/lib/database';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { orderId, status } = await request.json();

    if (!orderId || !status) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar que el estado sea válido
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return new Response(JSON.stringify({ error: 'Estado no válido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Actualizar el estado de la orden
    const success = await updateOrderStatus(orderId, status);

    if (success) {
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Estado actualizado correctamente'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: 'No se pudo actualizar el estado' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Error en update-status:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al actualizar el estado',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

