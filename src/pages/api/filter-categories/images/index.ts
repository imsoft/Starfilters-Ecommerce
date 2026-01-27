import type { APIRoute } from 'astro';
import { addCategoryImage, getCategoryImages } from '@/lib/filter-category-service';

/**
 * POST - Agregar una imagen de carrusel a una categoría
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  // Verificar autenticación de administrador
  const { requireAdmin } = await import('@/lib/auth-utils');
  const authResult = await requireAdmin(cookies);
  if (authResult.redirect) {
    return new Response(
      JSON.stringify({ success: false, message: 'No autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { categoryId, imageUrl, isPrimary = false } = body;

    if (!categoryId || !imageUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Faltan parámetros requeridos (categoryId, imageUrl)',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar que no haya más de 4 imágenes de carrusel
    const existingImages = await getCategoryImages(categoryId);
    const carouselImages = existingImages.filter(img => !img.is_primary);
    
    if (!isPrimary && carouselImages.length >= 4) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Ya has alcanzado el límite de 4 imágenes de carrusel',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Agregar la imagen
    const imageId = await addCategoryImage({
      category_id: categoryId,
      image_url: imageUrl,
      alt_text: null,
      is_primary: isPrimary,
      sort_order: carouselImages.length + 1,
    });

    if (!imageId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No se pudo agregar la imagen',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Imagen agregada exitosamente',
        imageId,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error en POST /api/filter-categories/images:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error interno del servidor',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

