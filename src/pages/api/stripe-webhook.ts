import type { APIRoute } from 'astro';
import { verifyWebhookSignature, STRIPE_CONFIG } from '@/lib/stripe';
import { createOrder, createOrderItem, getOrderByPaymentIntentId } from '@/lib/database';
import { query } from '@/config/database';
import { sendEmail, createOrderConfirmationEmail, createNewOrderNotificationEmail } from '@/lib/email';
import { recordDiscountCodeUsage } from '@/lib/discount-codes';
import { adjustBindProductInventory } from '@/lib/bind';
import { getCheckoutDraftByUuid, markDraftCompleted, type CheckoutDraftPayload, type DraftItem } from '@/lib/checkout-drafts';
import type { RowDataPacket } from 'mysql2/promise';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found');
      return new Response('No signature', { status: 400 });
    }

    // Verificar la firma del webhook
    const event = verifyWebhookSignature(body, signature, STRIPE_CONFIG.webhookSecret);

    console.log('Webhook event received:', event.type);

    // Manejar diferentes tipos de eventos
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook error', { status: 400 });
  }
};

// Descuenta stock local: variantes en filter_category_variants, productos en
// products. GREATEST evita dejar stock negativo si hubo sobreventa.
async function decrementLocalStock(item: DraftItem) {
  if (item.variant_id) {
    await query(
      'UPDATE filter_category_variants SET stock = GREATEST(stock - ?, 0) WHERE id = ?',
      [item.quantity, item.variant_id]
    );
  } else {
    await query(
      'UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?',
      [item.quantity, item.product_id]
    );
  }
}

// Ajusta inventario en BIND ERP (mejor esfuerzo, nunca rompe el flujo)
async function adjustBindInventory(bindTarget: string | null, item: { name: string; quantity: number }, orderNumber: string) {
  if (!bindTarget) {
    console.log(`ℹ️ Producto ${item.name} sin destino BIND, omitiendo ajuste`);
    return;
  }
  try {
    const bindResult = await adjustBindProductInventory(bindTarget, item.quantity, orderNumber);
    if (bindResult.success) {
      console.log(`✅ Inventario ajustado en Bind para ${item.name}: -${item.quantity} unidades (Orden: ${orderNumber})`);
    } else {
      console.error(`⚠️ Error al ajustar inventario en Bind para ${item.name}:`, bindResult.error);
    }
  } catch (error) {
    console.error(`⚠️ Error al ajustar inventario en Bind para ${item.name}:`, error);
  }
}

// Envía correos de confirmación (comprador y admin). Nunca lanza: la orden ya
// existe y un fallo de correo no debe provocar reintentos del webhook.
async function sendOrderEmails(
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  totalMXN: number,
  items: Array<{ name: string; quantity: number; price: number }>,
  shippingAddress: string
) {
  try {
    const orderDate = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const emailData = createOrderConfirmationEmail(
      customerName,
      orderNumber,
      orderDate,
      totalMXN,
      items,
      shippingAddress
    );
    emailData.to = customerEmail;

    const emailSent = await sendEmail(emailData);
    console.log(emailSent
      ? '✅ Email de confirmación enviado al comprador'
      : '⚠️ Error al enviar email de confirmación al comprador');

    const adminEmail = process.env.ADMIN_EMAIL || import.meta.env.ADMIN_EMAIL;
    if (adminEmail) {
      const adminEmailData = createNewOrderNotificationEmail(
        orderNumber,
        orderDate,
        customerName,
        customerEmail,
        totalMXN,
        items,
        shippingAddress
      );
      adminEmailData.to = adminEmail;

      const adminEmailSent = await sendEmail(adminEmailData);
      console.log(adminEmailSent
        ? '✅ Email de notificación enviado al vendedor'
        : '⚠️ Error al enviar email de notificación al vendedor');
    } else {
      console.log('⚠️ ADMIN_EMAIL no configurado, no se enviará email al vendedor');
    }
  } catch (error) {
    console.error('⚠️ Error enviando correos de la orden:', error);
  }
}

// Manejar pago exitoso
async function handlePaymentSucceeded(paymentIntent: any) {
  try {
    console.log('Payment succeeded:', paymentIntent.id);
    const metadata = paymentIntent.metadata || {};

    // Idempotencia: Stripe reintenta y puede reenviar el mismo evento. Si ya
    // existe una orden para este Payment Intent, no procesar de nuevo.
    const existingOrder = await getOrderByPaymentIntentId(paymentIntent.id);
    if (existingOrder) {
      console.log(`ℹ️ Orden ${existingOrder.order_number} ya existe para ${paymentIntent.id}, webhook duplicado ignorado`);
      return;
    }

    // Flujo actual: el carrito completo vive en checkout_drafts (el metadata
    // de Stripe está limitado a 500 caracteres por valor y no lo puede llevar)
    const draft = metadata.draft_uuid ? await getCheckoutDraftByUuid(metadata.draft_uuid) : null;

    if (draft) {
      await processOrderFromDraft(paymentIntent, draft, metadata.draft_uuid);
      return;
    }

    // Fallback legacy: Payment Intents creados antes del despliegue del
    // borrador traen el carrito en metadata.cart_items
    if (metadata.cart_items) {
      console.log('ℹ️ Procesando Payment Intent legacy (cart_items en metadata)');
      await processOrderFromLegacyMetadata(paymentIntent);
      return;
    }

    console.error(`⚠️ Payment Intent ${paymentIntent.id} sin draft_uuid ni cart_items; no se puede crear la orden automáticamente`);
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
    throw error; // Re-throw para que Stripe intente de nuevo
  }
}

async function processOrderFromDraft(paymentIntent: any, draft: CheckoutDraftPayload, draftUuid: string) {
  const { checkout, items, discount } = draft;

  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const customerName = `${checkout.firstName} ${checkout.lastName}`;
  const shippingAddress = `${checkout.address}, ${checkout.city}, ${checkout.state} ${checkout.postalCode}, ${checkout.country}`;
  const totalMXN = paymentIntent.amount / 100; // centavos → MXN

  const orderId = await createOrder({
    order_number: orderNumber,
    customer_name: customerName,
    customer_email: checkout.email,
    customer_phone: checkout.phone || undefined,
    total_amount: totalMXN,
    status: 'processing',
    shipping_address: shippingAddress,
    user_id: paymentIntent.metadata?.user_id ? parseInt(paymentIntent.metadata.user_id) : undefined,
    stripe_payment_intent_id: paymentIntent.id,
  });

  console.log('✅ Orden creada con ID:', orderId, 'Número:', orderNumber);

  for (const item of items) {
    // El pago ya se cobró: un item que falle no debe abortar el resto de la
    // orden (se registra el error y se continúa).
    try {
      // Para variantes, product_id trae el id de filter_category_variants,
      // que NO existe en products: violaría la FK de order_items. Se guarda
      // NULL y el nombre/precio quedan en la fila.
      const isVariant = typeof item.uuid === 'string' && item.uuid.startsWith('variant-');
      await createOrderItem({
        order_id: orderId,
        product_id: isVariant ? null : item.product_id,
        quantity: item.quantity,
        price: item.price_mxn, // MXN: consistente con total_amount
        product_name: item.name,
        image_url: item.image_url || undefined
      });

      await decrementLocalStock(item);
      await adjustBindInventory(item.bind_target, item, orderNumber);
    } catch (error) {
      console.error(`⚠️ Error procesando item "${item.name}" de la orden ${orderNumber}:`, error);
    }
  }

  console.log('✅ Items de orden guardados y inventario actualizado (DB local y Bind)');

  if (discount) {
    try {
      await recordDiscountCodeUsage(
        discount.discountCodeId,
        orderId,
        discount.amount,
        paymentIntent.metadata?.user_id ? parseInt(paymentIntent.metadata.user_id) : undefined
      );
      console.log('✅ Uso de código de descuento registrado:', discount.code);
    } catch (error) {
      console.error('⚠️ Error al registrar uso de código de descuento:', error);
    }
  }

  try {
    await markDraftCompleted(draftUuid);
  } catch (error) {
    console.error('⚠️ Error marcando el borrador como completado:', error);
  }

  console.log('✅ Orden procesada correctamente:', {
    order_id: orderId,
    payment_intent_id: paymentIntent.id,
    amount: totalMXN,
    email: checkout.email
  });

  await sendOrderEmails(
    orderNumber,
    customerName,
    checkout.email,
    totalMXN,
    items.map(item => ({ name: item.name, quantity: item.quantity, price: item.price_mxn })),
    shippingAddress
  );
}

// Payment Intents creados por la versión anterior (carrito en metadata)
async function processOrderFromLegacyMetadata(paymentIntent: any) {
  const metadata = paymentIntent.metadata;

  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const totalMXN = paymentIntent.amount / 100; // centavos → MXN

  const orderId = await createOrder({
    order_number: orderNumber,
    customer_name: metadata.customer_name,
    customer_email: metadata.customer_email,
    total_amount: totalMXN,
    status: 'processing',
    shipping_address: metadata.shipping_address,
    user_id: metadata.user_id ? parseInt(metadata.user_id) : undefined,
    stripe_payment_intent_id: paymentIntent.id,
  });

  console.log('✅ Orden creada con ID:', orderId, 'Número:', orderNumber);

  let items: any[] = [];
  try {
    items = JSON.parse(metadata.cart_items);
  } catch (error) {
    console.error('⚠️ No se pudo parsear metadata.cart_items:', error);
  }

  for (const item of items) {
    try {
      await createOrderItem({
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        product_name: item.name,
        image_url: item.image_url
      });

      await query(
        'UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?',
        [item.quantity, item.product_id]
      );

      const productData = await query(
        'SELECT bind_id FROM products WHERE id = ?',
        [item.product_id]
      ) as RowDataPacket[];
      const bindId = productData && productData.length > 0 ? productData[0].bind_id : null;
      await adjustBindInventory(bindId, item, orderNumber);
    } catch (error) {
      console.error(`⚠️ Error procesando item legacy "${item.name}" de la orden ${orderNumber}:`, error);
    }
  }

  if (metadata.discount_code_id && metadata.discount_amount) {
    try {
      await recordDiscountCodeUsage(
        parseInt(metadata.discount_code_id),
        orderId,
        parseFloat(metadata.discount_amount),
        metadata.user_id ? parseInt(metadata.user_id) : undefined
      );
      console.log('✅ Uso de código de descuento registrado:', metadata.discount_code);
    } catch (error) {
      console.error('⚠️ Error al registrar uso de código de descuento:', error);
    }
  }

  if (items.length > 0) {
    await sendOrderEmails(
      orderNumber,
      metadata.customer_name,
      metadata.customer_email,
      totalMXN,
      items.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
      metadata.shipping_address
    );
  }
}

// Manejar pago fallido
async function handlePaymentFailed(paymentIntent: any) {
  try {
    console.log('Payment failed:', paymentIntent.id);

    console.log('Payment failure details:', {
      id: paymentIntent.id,
      last_payment_error: paymentIntent.last_payment_error,
      metadata: paymentIntent.metadata,
    });

  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

// Manejar pago cancelado
async function handlePaymentCanceled(paymentIntent: any) {
  try {
    console.log('Payment canceled:', paymentIntent.id);

    console.log('Payment cancellation details:', {
      id: paymentIntent.id,
      cancellation_reason: paymentIntent.cancellation_reason,
      metadata: paymentIntent.metadata,
    });

  } catch (error) {
    console.error('Error handling payment canceled:', error);
  }
}
