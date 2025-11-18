import type { APIRoute } from 'astro';
import { uploadCategoryPrimaryImage, uploadCategoryCarouselImage } from '@/lib/cloudinary';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
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

    // Convertir el archivo a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir a Cloudinary según el tipo
    let imageUrl: string;
    const categoryIdNum = parseInt(categoryId);

    if (imageType === 'primary') {
      imageUrl = await uploadCategoryPrimaryImage(buffer, categoryIdNum, file.name);
    } else {
      imageUrl = await uploadCategoryCarouselImage(buffer, categoryIdNum, file.name);
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
