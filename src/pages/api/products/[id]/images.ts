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

    console.log(`📷 Obteniendo imágenes del producto ${productId}...`);
    const images = await getProductImages(productId);
    console.log(`📷 Imágenes encontradas en BD: ${images.length}`);

    const mappedImages = images.map(img => {
      // MySQL puede retornar is_primary como 0/1, true/false, o número
      const isPrimary = img.is_primary === 1 || img.is_primary === true || img.is_primary === '1';
      return {
        id: img.id,
        url: img.image_url,
        isPrimary: isPrimary,
        altText: img.alt_text,
        sortOrder: img.sort_order
      };
    });

    console.log(`📷 Imágenes mapeadas:`, mappedImages.length);
    console.log(`📷 Detalles:`, mappedImages.map(img => ({ id: img.id, url: img.url.substring(0, 50) + '...', isPrimary: img.isPrimary })));

    return new Response(JSON.stringify({ 
      success: true, 
      images: mappedImages
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
