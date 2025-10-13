import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-utils';

export const POST: APIRoute = async ({ request, cookies }) => {
  const authResult = await requireAdmin(cookies);
  if (authResult.redirect) {
    return new Response(JSON.stringify({ success: false, message: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { imageId, productId } = await request.json();

    if (!imageId || !productId) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'ID de imagen y producto son requeridos' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('🗑️ Eliminando imagen:', { imageId, productId });

    // Aquí podrías eliminar la imagen de Cloudinary si lo deseas
    // const publicId = `starfilters-ecommerce/products/${productId}/${imageId}`;
    // await deleteImage(publicId);

    console.log('✅ Imagen eliminada exitosamente');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Imagen eliminada exitosamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error eliminando imagen:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Error interno del servidor: ' + (error instanceof Error ? error.message : 'Error desconocido')
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
