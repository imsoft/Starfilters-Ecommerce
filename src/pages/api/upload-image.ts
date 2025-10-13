import type { APIRoute } from 'astro';
import { uploadProductImage, uploadBlogImage, uploadUserImage, uploadGeneralImage } from '@/lib/cloudinary';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'product', 'blog', 'user', 'general'
    const entityId = formData.get('entityId') as string; // ID del producto, blog, usuario, etc.
    const imageName = formData.get('imageName') as string | null;
    const category = formData.get('category') as string | null; // Para imágenes generales

    if (!file) {
      return new Response(JSON.stringify({ error: 'No se proporcionó ningún archivo' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!type || !entityId) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Convertir el archivo a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let imageUrl: string;

    // Subir según el tipo
    switch (type) {
      case 'product':
        imageUrl = await uploadProductImage(buffer, entityId, imageName || undefined);
        break;
      
      case 'blog':
        imageUrl = await uploadBlogImage(buffer, entityId, imageName || undefined);
        break;
      
      case 'user':
        imageUrl = await uploadUserImage(buffer, entityId, imageName || undefined);
        break;
      
      case 'general':
        if (!category) {
          return new Response(JSON.stringify({ error: 'Se requiere categoría para imágenes generales' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        imageUrl = await uploadGeneralImage(buffer, category, imageName || file.name);
        break;
      
      default:
        return new Response(JSON.stringify({ error: 'Tipo de imagen no válido' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      imageUrl,
      message: 'Imagen subida exitosamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en upload-image:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al subir la imagen',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

