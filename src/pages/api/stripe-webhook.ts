import type { APIRoute } from 'astro';
import { verifyWebhookSignature, STRIPE_CONFIG } from '@/lib/stripe';
import { clearCart } from '@/lib/cart';
import { createOrder, createOrderItem } from '@/lib/database';
import { query } from '@/config/database';
import { sendEmail, createOrderConfirmationEmail, createNewOrderNotificationEmail } from '@/lib/email';
import { recordDiscountCodeUsage } from '@/lib/discount-codes';
import { adjustBindProductInventory } from '@/lib/bind';
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

// Manejar pago exitoso
async function handlePaymentSucceeded(paymentIntent: any) {
  try {
    console.log('Payment succeeded:', paymentIntent.id);
    const metadata = paymentIntent.metadata;
    
    // Generar número de orden único
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // 1. Crear la orden en la base de datos
    const orderId = await createOrder({
      order_number: orderNumber,
      customer_name: metadata.customer_name,
      customer_email: metadata.customer_email,
      total_amount: paymentIntent.amount / 100, // Convertir de centavos a dólares
      status: 'processing',
      shipping_address: metadata.shipping_address,
      user_id: metadata.user_id ? parseInt(metadata.user_id) : null
    });

    console.log('✅ Orden creada con ID:', orderId, 'Número:', orderNumber);

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

        // 3. Actualizar inventario en base de datos local
        await query(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );

        // 4. Obtener bind_id del producto para ajustar inventario en Bind
        const productData = await query(
          'SELECT bind_id FROM products WHERE id = ?',
          [item.product_id]
        ) as RowDataPacket[];

        if (productData && productData.length > 0) {
          const bindId = productData[0].bind_id;

          // 5. Ajustar inventario en Bind usando POST /api/Inventory (delta negativo)
          if (bindId) {
            try {
              const bindResult = await adjustBindProductInventory(bindId, item.quantity, orderNumber);
              if (bindResult.success) {
                console.log(`✅ Inventario ajustado en Bind para ${item.name}: -${item.quantity} unidades (Orden: ${orderNumber})`);
              } else {
                console.error(`⚠️ Error al ajustar inventario en Bind para ${item.name}:`, bindResult.error);
              }
            } catch (error) {
              console.error(`⚠️ Error al ajustar inventario en Bind para ${item.name}:`, error);
              // No lanzamos el error para no afectar el resto del proceso
            }
          } else {
            console.log(`ℹ️ Producto ${item.name} no tiene bind_id, omitiendo ajuste en Bind`);
          }
        }
      }

      console.log('✅ Items de orden guardados y inventario actualizado (DB local y Bind)');
    }

    // 3. Registrar uso del código de descuento si existe
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
        // No lanzamos el error para no afectar el resto del proceso
      }
    }

    console.log('✅ Orden procesada correctamente:', {
      order_id: orderId,
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      email: metadata.customer_email
    });

    // 4. Enviar email de confirmación
    if (metadata.cart_items) {
      const items = JSON.parse(metadata.cart_items);
      const orderDate = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const emailData = createOrderConfirmationEmail(
        metadata.customer_name,
        orderNumber, // Usar el mismo número de orden generado arriba
        orderDate,
        paymentIntent.amount / 100,
        items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        metadata.shipping_address
      );
      
      emailData.to = metadata.customer_email;
      
      const emailSent = await sendEmail(emailData);
      
      if (emailSent) {
        console.log('✅ Email de confirmación enviado al comprador');
      } else {
        console.log('⚠️ Error al enviar email de confirmación al comprador');
      }

      // 5. Enviar email al vendedor (admin)
      const adminEmail = process.env.ADMIN_EMAIL || import.meta.env.ADMIN_EMAIL;
      if (adminEmail) {
        const adminEmailData = createNewOrderNotificationEmail(
          orderNumber,
          orderDate,
          metadata.customer_name,
          metadata.customer_email,
          paymentIntent.amount / 100,
          items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          metadata.shipping_address
        );
        
        adminEmailData.to = adminEmail;
        
        const adminEmailSent = await sendEmail(adminEmailData);
        
        if (adminEmailSent) {
          console.log('✅ Email de notificación enviado al vendedor');
        } else {
          console.log('⚠️ Error al enviar email de notificación al vendedor');
        }
      } else {
        console.log('⚠️ ADMIN_EMAIL no configurado, no se enviará email al vendedor');
      }
    }

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
