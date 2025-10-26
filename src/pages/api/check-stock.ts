import type { APIRoute } from 'astro';
import { getProductByUuid } from '@/lib/database';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const uuid = url.searchParams.get('uuid');
    const requestedQuantity = parseInt(url.searchParams.get('quantity') || '1');

    if (!uuid) {
      return new Response(JSON.stringify({ 
        error: 'UUID de producto requerido' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const product = await getProductByUuid(uuid);

    if (!product) {
      return new Response(JSON.stringify({ 
        error: 'Producto no encontrado' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const available = product.stock >= requestedQuantity;

    return new Response(JSON.stringify({
      available,
      stock: product.stock,
      requested: requestedQuantity,
      canAddToCart: product.stock > 0 && available
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error checking stock:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
