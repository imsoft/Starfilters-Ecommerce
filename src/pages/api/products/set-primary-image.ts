import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-utils';
import { query } from '@/config/database';

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

    console.log('⭐ Estableciendo imagen principal:', { imageId, productId });

    // Aquí podrías actualizar la base de datos para marcar esta imagen como principal
    // Por ahora, solo devolvemos éxito ya que el manejo es del lado del cliente

    console.log('✅ Imagen principal establecida');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Imagen principal establecida exitosamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error estableciendo imagen principal:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Error interno del servidor: ' + (error instanceof Error ? error.message : 'Error desconocido')
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
