import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-utils';
import { getProductImages } from '@/lib/database';

export const GET: APIRoute = async ({ params, cookies }) => {
  const authResult = await requireAdmin(cookies);
  if (authResult.redirect) {
    return new Response(JSON.stringify({ success: false, message: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { id } = params;
    const productId = parseInt(id || '0');

    if (!productId || isNaN(productId)) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'ID de producto inválido' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const images = await getProductImages(productId);

    return new Response(JSON.stringify({ 
      success: true, 
      images: images.map(img => ({
        id: img.id,
        url: img.image_url,
        isPrimary: img.is_primary === 1 || img.is_primary === true,
        altText: img.alt_text,
        sortOrder: img.sort_order
      }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error obteniendo imágenes del producto:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Error interno del servidor: ' + (error instanceof Error ? error.message : 'Error desconocido')
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
