import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-utils';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { addProductImage, getProductImages, generateUUID } from '@/lib/database';

export const POST: APIRoute = async ({ request, cookies }) => {
  const authResult = await requireAdmin(cookies);
  if (authResult.redirect) {
    return new Response(JSON.stringify({ success: false, message: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const productId = formData.get('productId') as string;

    if (!image) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No se proporcionó ninguna imagen' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!productId) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'ID de producto no proporcionado' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validar tipo de archivo
    if (!image.type.startsWith('image/')) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'El archivo debe ser una imagen válida' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validar tamaño (10MB)
    if (image.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'La imagen debe ser menor a 10MB' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('📤 Subiendo imagen de producto:', { productId, fileName: image.name });

    // Convertir archivo a buffer
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir a Cloudinary
    const imageName = `product_${Date.now()}`;
    const uploadResult = await uploadToCloudinary(
      buffer,
      `starfilters-ecommerce/productos/${productId}/imagenes`,
      imageName
    );

    if (!uploadResult.success || !uploadResult.url) {
      console.error('❌ Error subiendo a Cloudinary:', uploadResult.error);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Error al subir la imagen: ' + (uploadResult.error || 'Error desconocido')
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Imagen subida a Cloudinary:', uploadResult.url);

    // Verificar si es la primera imagen (para marcarla como principal)
    // Usar una consulta atómica para evitar condiciones de carrera
    const existingImages = await getProductImages(parseInt(productId));
    const primaryImage = existingImages.find(img => img.is_primary === 1 || img.is_primary === true);
    const isPrimary = existingImages.length === 0 && !primaryImage;

    // Guardar en la base de datos
    const imageId = await addProductImage({
      uuid: generateUUID(),
      product_id: parseInt(productId),
      image_url: uploadResult.url,
      alt_text: image.name || 'Imagen del producto',
      is_primary: isPrimary,
      sort_order: existingImages.length,
    });
    
    console.log(`📷 Imagen guardada - ID: ${imageId}, isPrimary: ${isPrimary}, sortOrder: ${existingImages.length}`);

    if (!imageId) {
      console.error('❌ Error guardando imagen en la base de datos');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Error al guardar la imagen en la base de datos'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Imagen guardada en BD con ID:', imageId);

    // Obtener todas las imágenes actualizadas para retornar el estado completo
    const updatedImages = await getProductImages(parseInt(productId));
    console.log(`📷 Total de imágenes del producto después de subir: ${updatedImages.length}`);

    const mappedAllImages = updatedImages.map(img => {
      const imgIsPrimary = img.is_primary === 1 || img.is_primary === true || img.is_primary === '1';
      return {
        id: img.id.toString(),
        url: img.image_url,
        isPrimary: imgIsPrimary
      };
    });

    console.log(`📷 Retornando ${mappedAllImages.length} imágenes en la respuesta`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Imagen subida exitosamente',
      url: uploadResult.url,
      imageId: imageId.toString(),
      isPrimary: isPrimary,
      allImages: mappedAllImages
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error en la API de subida de imagen:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Error interno del servidor: ' + (error instanceof Error ? error.message : 'Error desconocido')
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
