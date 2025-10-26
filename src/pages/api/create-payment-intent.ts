import type { APIRoute } from 'astro';
import { createCheckoutPaymentIntent, validateCheckoutData, type CheckoutData } from '@/lib/payment-utils';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { getCart } from '@/lib/cart';
import { getProductByUuid } from '@/lib/database';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Verificar autenticación
    const user = getAuthenticatedUser(cookies);
    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener datos del request
    const body = await request.json();
    const checkoutData: CheckoutData = {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      address: body.address,
      city: body.city,
      state: body.state,
      postalCode: body.postalCode,
      country: body.country,
      phone: body.phone,
      company: body.company,
      apartment: body.apartment,
    };

    // Validar datos
    const validation = validateCheckoutData(checkoutData);
    if (!validation.isValid) {
      return new Response(JSON.stringify({ 
        error: 'Datos inválidos', 
        details: validation.errors 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar stock antes de crear el Payment Intent
    const cart = getCart();
    for (const item of cart.items) {
      const product = await getProductByUuid(item.uuid);
      if (!product) {
        return new Response(JSON.stringify({ 
          error: 'Producto no encontrado',
          details: [`El producto ${item.name} no existe`]
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (product.stock < item.quantity) {
        return new Response(JSON.stringify({ 
          error: 'Stock insuficiente',
          details: [`No hay suficiente stock para ${item.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`]
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Crear Payment Intent
    const result = await createCheckoutPaymentIntent(checkoutData, body.shippingMethod || 'standard', user.id);

    return new Response(JSON.stringify({
      client_secret: result.client_secret,
      payment_intent_id: result.payment_intent_id,
      order_total: result.order_total,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
