import type { APIRoute } from 'astro';
import { updateOrderStatus, getOrderById, getOrderItems } from '@/lib/database';
import { sendEmail, createOrderStatusUpdateEmail } from '@/lib/email';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { orderId, status, trackingNumber } = await request.json();

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

    // Obtener la orden actual para comparar estados
    const order = await getOrderById(orderId);
    if (!order) {
      return new Response(JSON.stringify({ error: 'Orden no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const oldStatus = order.status;

    // Si el estado no cambió, no hacer nada
    if (oldStatus === status) {
      return new Response(JSON.stringify({ 
        success: true,
        message: 'El estado ya es el mismo'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Actualizar el estado de la orden
    const success = await updateOrderStatus(orderId, status);

    if (success) {
      // Enviar email al comprador sobre el cambio de estado
      try {
        const orderItems = await getOrderItems(orderId);
        
        const orderDate = order.created_at 
          ? new Date(order.created_at).toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : new Date().toLocaleDateString('es-MX');

        const emailData = createOrderStatusUpdateEmail(
          order.customer_name,
          order.order_number,
          oldStatus,
          status,
          orderDate,
          orderItems.map(item => ({
            name: item.product_name,
            quantity: item.quantity,
            price: item.price
          })),
          order.total_amount,
          trackingNumber
        );

        emailData.to = order.customer_email;

        const emailSent = await sendEmail(emailData);

        if (emailSent) {
          console.log(`✅ Email de actualización de estado enviado al comprador (${oldStatus} → ${status})`);
        } else {
          console.log('⚠️ Error al enviar email de actualización de estado');
        }
      } catch (emailError) {
        console.error('⚠️ Error al enviar email de actualización de estado:', emailError);
        // No fallar la actualización si el email falla
      }

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

