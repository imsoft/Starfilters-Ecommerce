import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-utils';
import { uploadCategoryPrimaryImage, uploadCategoryCarouselImage } from '@/lib/cloudinary';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  // Verificar autenticación de administrador
  const authResult = await requireAdmin(cookies);
  if (authResult.redirect) {
    return new Response(
      JSON.stringify({ success: false, error: 'No autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const categoryId = formData.get('categoryId') as string;
    const imageType = formData.get('imageType') as 'primary' | 'carousel';

    if (!file || !categoryId || !imageType) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Faltan parámetros requeridos'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'El archivo debe ser una imagen'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'La imagen debe ser menor a 10MB'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📤 Subiendo imagen de categoría de filtro:', {
      categoryId,
      imageType,
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(2)} KB`
    });

    // Convertir el archivo a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir a Cloudinary según el tipo
    let imageUrl: string;
    const categoryIdNum = parseInt(categoryId);

    if (imageType === 'primary') {
      imageUrl = await uploadCategoryPrimaryImage(buffer, categoryIdNum, file.name);
      console.log('✅ Imagen principal subida exitosamente:', imageUrl);
    } else {
      imageUrl = await uploadCategoryCarouselImage(buffer, categoryIdNum, file.name);
      console.log('✅ Imagen de carrusel subida exitosamente:', imageUrl);
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: imageUrl
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error al subir imagen:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Error al subir imagen'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
