import type { APIRoute } from 'astro';
import { createCheckoutPaymentIntent, validateCheckoutData, type CheckoutData, type DiscountData } from '@/lib/payment-utils';
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

    // Obtener carrito del body (enviado desde el cliente)
    const cartItems = body.items || [];
    
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'El carrito está vacío' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar stock antes de crear el Payment Intent
    for (const item of cartItems) {
      if (!item.uuid) {
        return new Response(JSON.stringify({ 
          error: 'Datos inválidos',
          details: ['Item del carrito sin UUID']
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const product = await getProductByUuid(item.uuid);
      if (!product) {
        return new Response(JSON.stringify({ 
          error: 'Producto no encontrado',
          details: [`El producto ${item.name || item.uuid} no existe`]
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (product.stock < item.quantity) {
        return new Response(JSON.stringify({ 
          error: 'Stock insuficiente',
          details: [`No hay suficiente stock para ${item.name || product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`]
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Obtener datos de descuento si existen
    const discountData: DiscountData | undefined = body.discountCode ? {
      code: body.discountCode.code,
      discountCodeId: body.discountCode.discountCodeId,
      amount: body.discountCode.amount,
    } : undefined;

    // Crear Payment Intent
    const result = await createCheckoutPaymentIntent(
      checkoutData,
      body.shippingMethod || 'standard',
      user.id,
      discountData,
      cartItems // Pasar items del carrito
    );

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
