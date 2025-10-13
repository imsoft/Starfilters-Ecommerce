import type { APIRoute } from 'astro';
import { verifyWebhookSignature, STRIPE_CONFIG } from '@/lib/stripe';
import { clearCart } from '@/lib/cart';

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
    
    // Aquí puedes:
    // 1. Guardar la orden en la base de datos
    // 2. Enviar email de confirmación
    // 3. Actualizar inventario
    // 4. Limpiar carrito del usuario
    
    // Por ahora, solo logueamos el evento
    console.log('Payment details:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      customer_email: paymentIntent.receipt_email,
      metadata: paymentIntent.metadata,
    });

    // TODO: Implementar lógica de guardado de orden
    // await saveOrderToDatabase(paymentIntent);
    
    // TODO: Enviar email de confirmación
    // await sendOrderConfirmationEmail(paymentIntent);

  } catch (error) {
    console.error('Error handling payment succeeded:', error);
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
