/**
 * Cambio de estado de una orden
 *
 * Antes esta lógica estaba escrita dos veces —en la página de detalle del
 * panel y en /api/orders/update-status— y las dos copias ya habían empezado a
 * separarse: una mandaba la moneda al correo y la otra no, y ninguna de las
 * dos podía guardar el número de guía. Ahora las dos entran por aquí.
 */

import {
  getOrderById,
  getOrderItems,
  updateOrderStatus,
  updateOrderShipping,
  recordOrderStatusChange,
} from './database';
import { sendEmail, createOrderStatusUpdateEmail } from './email';

export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const isOrderStatus = (value: unknown): value is OrderStatus =>
  typeof value === 'string' && (ORDER_STATUSES as readonly string[]).includes(value);

export interface ChangeOrderStatusInput {
  orderId: number;
  newStatus: string;
  // Solo aplican al pasar a "enviado" por paquetería.
  carrier?: string | null;
  trackingNumber?: string | null;
  // Permite guardar el avance sin avisarle al cliente (por ejemplo, al
  // corregir un estado que se marcó por error).
  notifyCustomer?: boolean;
  // Quién hizo el cambio, para el historial. "Sistema" cuando no viene de una
  // persona.
  changedBy?: string | null;
}

export interface ChangeOrderStatusResult {
  ok: boolean;
  // 'not_found' | 'invalid_status' | 'unchanged' | 'update_failed'
  reason?: string;
  emailSent?: boolean;
}

export const changeOrderStatus = async ({
  orderId,
  newStatus,
  carrier,
  trackingNumber,
  notifyCustomer = true,
  changedBy,
}: ChangeOrderStatusInput): Promise<ChangeOrderStatusResult> => {
  if (!isOrderStatus(newStatus)) {
    return { ok: false, reason: 'invalid_status' };
  }

  const order = await getOrderById(orderId);
  if (!order) {
    return { ok: false, reason: 'not_found' };
  }

  const oldStatus = order.status;

  // Guardar guía y paquetería aunque el estado no cambie: puede que solo se
  // esté corrigiendo un número mal capturado.
  const guardarEnvio = carrier !== undefined || trackingNumber !== undefined;
  if (guardarEnvio) {
    await updateOrderShipping(orderId, {
      carrier: carrier ?? order.shipping_carrier ?? null,
      trackingNumber: trackingNumber ?? order.tracking_number ?? null,
    });
  }

  if (oldStatus === newStatus) {
    return { ok: true, reason: 'unchanged' };
  }

  const actualizado = await updateOrderStatus(orderId, newStatus);
  if (!actualizado) {
    return { ok: false, reason: 'update_failed' };
  }

  // El historial no debe tumbar el cambio: la orden ya avanzó.
  try {
    await recordOrderStatusChange(orderId, oldStatus, newStatus, changedBy);
  } catch (error) {
    console.error('⚠️ No se pudo registrar el cambio en el historial:', error);
  }

  if (!notifyCustomer) {
    return { ok: true, emailSent: false };
  }

  // El correo nunca tumba el cambio de estado: la orden ya avanzó y un fallo
  // de Resend no debe deshacerlo ni provocar un reintento.
  let emailSent = false;
  try {
    const items = await getOrderItems(orderId);

    const orderDate = order.created_at
      ? new Date(order.created_at).toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : new Date().toLocaleDateString('es-MX');

    const emailData = createOrderStatusUpdateEmail(
      order.customer_name,
      order.order_number,
      oldStatus,
      newStatus,
      orderDate,
      items.map((item) => ({
        name: item.product_name,
        quantity: item.quantity,
        price: item.price,
      })),
      order.total_amount,
      // La guía recién capturada gana sobre la que ya tenía la orden.
      trackingNumber ?? order.tracking_number ?? undefined,
      order.currency,
      // Se le escribe en el idioma en el que compró.
      order.customer_language === 'en' ? 'en' : 'es'
    );

    emailData.to = order.customer_email;
    emailSent = await sendEmail(emailData);

    console.log(emailSent
      ? `✅ Email de cambio de estado enviado al comprador (${oldStatus} → ${newStatus})`
      : '⚠️ No se pudo enviar el email de cambio de estado');
  } catch (error) {
    console.error('⚠️ Error enviando el email de cambio de estado:', error);
  }

  return { ok: true, emailSent };
};
