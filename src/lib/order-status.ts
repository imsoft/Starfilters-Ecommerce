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
import { getOrderNotificationEmails } from './site-settings-service';

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
  // Manda el aviso del cambio al comprador y a los correos de
  // /admin/settings/notificaciones. Puede apagarse al corregir un estado que se
  // marcó por error.
  notify?: boolean;
  // Quién hizo el cambio, para el historial. "Sistema" cuando no viene de una
  // persona.
  changedBy?: string | null;
}

export interface ChangeOrderStatusResult {
  ok: boolean;
  // 'not_found' | 'invalid_status' | 'unchanged' | 'update_failed'
  reason?: string;
  // Se informan por separado: puede salir el del comprador y fallar el del
  // equipo, o al revés.
  customerEmailSent?: boolean;
  teamEmailSent?: boolean;
}

export const changeOrderStatus = async ({
  orderId,
  newStatus,
  carrier,
  trackingNumber,
  notify = true,
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

  if (!notify) {
    return { ok: true, customerEmailSent: false, teamEmailSent: false };
  }

  // Dos avisos con el mismo hecho, escritos para quien los lee: al comprador
  // en su idioma ("tu pedido va en camino") y al equipo en español, diciendo
  // de quién es el pedido y con el enlace al panel.
  //
  // Ninguno de los dos tumba el cambio de estado: la orden ya avanzó y un
  // fallo de Resend no debe deshacerlo ni provocar un reintento del webhook.
  let customerEmailSent = false;
  let teamEmailSent = false;

  try {
    const items = await getOrderItems(orderId);

    const lineas = items.map((item) => ({
      name: item.product_name,
      quantity: item.quantity,
      price: item.price,
    }));

    // La guía recién capturada gana sobre la que ya tenía la orden.
    const guia = trackingNumber ?? order.tracking_number ?? undefined;

    const fechaEn = (locale: string) =>
      order.created_at
        ? new Date(order.created_at).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : new Date().toLocaleDateString(locale);

    const idiomaCliente = order.customer_language === 'en' ? 'en' : 'es';

    // --- Al comprador -------------------------------------------------------
    if (order.customer_email) {
      try {
        const paraCliente = createOrderStatusUpdateEmail(
          order.customer_name,
          order.order_number,
          oldStatus,
          newStatus,
          fechaEn(idiomaCliente === 'en' ? 'en-US' : 'es-MX'),
          lineas,
          order.total_amount,
          guia,
          order.currency,
          idiomaCliente,
          'cliente'
        );
        paraCliente.to = order.customer_email;
        customerEmailSent = await sendEmail(paraCliente);
        console.log(customerEmailSent
          ? `✅ Aviso enviado al comprador (${oldStatus} → ${newStatus})`
          : '⚠️ No se pudo enviar el aviso al comprador');
      } catch (error) {
        console.error('⚠️ Error enviando el aviso al comprador:', error);
      }
    }

    // --- Al equipo ----------------------------------------------------------
    const destinatarios = await getOrderNotificationEmails();
    if (destinatarios.length === 0) {
      console.log('⚠️ Sin correos en /admin/settings/notificaciones; no se avisa al equipo');
    } else {
      try {
        const paraEquipo = createOrderStatusUpdateEmail(
          order.customer_name,
          order.order_number,
          oldStatus,
          newStatus,
          fechaEn('es-MX'),
          lineas,
          order.total_amount,
          guia,
          order.currency,
          // El equipo lee en español, sin importar el idioma de la compra.
          'es',
          'equipo'
        );
        paraEquipo.to = destinatarios;
        teamEmailSent = await sendEmail(paraEquipo);
        console.log(teamEmailSent
          ? `✅ Aviso enviado a ${destinatarios.length} destinatario(s) del equipo (${oldStatus} → ${newStatus})`
          : '⚠️ No se pudo enviar el aviso al equipo');
      } catch (error) {
        console.error('⚠️ Error enviando el aviso al equipo:', error);
      }
    }
  } catch (error) {
    console.error('⚠️ Error preparando los avisos de cambio de estado:', error);
  }

  return { ok: true, customerEmailSent, teamEmailSent };
};
