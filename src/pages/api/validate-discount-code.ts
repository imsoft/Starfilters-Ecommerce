import type { APIRoute } from 'astro';
import { validateDiscountCode } from '@/lib/discount-codes';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { code, subtotal, cartItems } = await request.json();

    if (!code || typeof code !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Código de descuento requerido',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!subtotal || typeof subtotal !== 'number' || subtotal <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Subtotal inválido',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Preparar items del carrito para validación de productos permitidos
    const itemsForValidation = cartItems && Array.isArray(cartItems) 
      ? cartItems.map((item: any) => ({
          product_id: item.product_id,
          uuid: item.uuid
        }))
      : undefined;

    const validation = await validateDiscountCode(code, subtotal, itemsForValidation);

    return new Response(
      JSON.stringify({
        success: validation.valid,
        message: validation.message,
        discountCode: validation.discountCode
          ? {
              id: validation.discountCode.id,
              code: validation.discountCode.code,
              discount_type: validation.discountCode.discount_type,
              discount_value: validation.discountCode.discount_value,
            }
          : undefined,
        discountAmount: validation.discountAmount,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error validating discount code:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error al validar el código de descuento',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
