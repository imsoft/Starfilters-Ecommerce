import type { APIRoute } from 'astro';
import { verifyWebhookSignature, STRIPE_CONFIG } from '@/lib/stripe';
import { clearCart } from '@/lib/cart';
import { createOrder, createOrderItem } from '@/lib/database';
import { query } from '@/config/database';

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

// Manejar pago exitoso
async function handlePaymentSucceeded(paymentIntent: any) {
  try {
    console.log('Payment succeeded:', paymentIntent.id);
    const metadata = paymentIntent.metadata;
    
    // 1. Crear la orden en la base de datos
    const orderId = await createOrder({
      order_number: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      customer_name: metadata.customer_name,
      customer_email: metadata.customer_email,
      total_amount: paymentIntent.amount / 100, // Convertir de centavos a dólares
      status: 'processing',
      shipping_address: metadata.shipping_address,
      user_id: metadata.user_id ? parseInt(metadata.user_id) : null
    });

    console.log('✅ Orden creada con ID:', orderId);

    // 2. Guardar items de la orden
    if (metadata.cart_items) {
      const items = JSON.parse(metadata.cart_items);
      
      for (const item of items) {
        await createOrderItem({
          order_id: orderId,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          product_name: item.name,
          image_url: item.image_url
        });

        // 3. Actualizar inventario
        await query(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }

      console.log('✅ Items de orden guardados y inventario actualizado');
    }

    console.log('✅ Orden procesada correctamente:', {
      order_id: orderId,
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      email: metadata.customer_email
    });

    // TODO: Enviar email de confirmación
    // await sendOrderConfirmationEmail(paymentIntent, orderId);

  } catch (error) {
    console.error('Error handling payment succeeded:', error);
    throw error; // Re-throw para que Stripe intente de nuevo
  }
}

// Manejar pago fallido
async function handlePaymentFailed(paymentIntent: any) {
  try {
    console.log('Payment failed:', paymentIntent.id);
    
    // Aquí puedes:
    // 1. Notificar al usuario
    // 2. Log del error para análisis
    // 3. Intentar pago alternativo si es necesario
    
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
    
    // Aquí puedes:
    // 1. Restaurar inventario si es necesario
    // 2. Notificar al usuario
    // 3. Limpiar datos temporales
    
    console.log('Payment cancellation details:', {
      id: paymentIntent.id,
      cancellation_reason: paymentIntent.cancellation_reason,
      metadata: paymentIntent.metadata,
    });

  } catch (error) {
    console.error('Error handling payment canceled:', error);
  }
}
