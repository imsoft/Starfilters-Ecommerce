import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-utils';
import { uploadToCloudinary } from '@/lib/cloudinary';

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

    console.log('✅ Imagen subida exitosamente:', uploadResult.url);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Imagen subida exitosamente',
      url: uploadResult.url,
      imageId: imageName
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
