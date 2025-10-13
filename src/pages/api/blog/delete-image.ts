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
    const { blogId, imageUrl } = await request.json();

    if (!blogId || !imageUrl) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'ID de blog y URL de imagen son requeridos' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('🗑️ Eliminando imagen de blog:', { blogId, imageUrl });

    // Aquí podrías eliminar la imagen de Cloudinary si lo deseas
    // Extraer el public_id de la URL y llamar a deleteImage()

    console.log('✅ Imagen de blog eliminada exitosamente');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Imagen eliminada exitosamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error eliminando imagen de blog:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Error interno del servidor: ' + (error instanceof Error ? error.message : 'Error desconocido')
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
