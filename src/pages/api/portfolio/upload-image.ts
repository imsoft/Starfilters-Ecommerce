import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-utils';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { generateUUID } from '@/lib/database';

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

    if (!image) {
      return new Response(JSON.stringify({ success: false, message: 'No se proporcionó ninguna imagen' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!image.type.startsWith('image/')) {
      return new Response(JSON.stringify({ success: false, message: 'El archivo debe ser una imagen válida' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (image.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ success: false, message: 'La imagen debe ser menor a 10MB' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const imageName = `project_${Date.now()}`;
    const projectUuid = generateUUID();

    const uploadResult = await uploadToCloudinary(
      buffer,
      `starfilters-ecommerce/portfolio/${projectUuid}`,
      imageName
    );

    if (!uploadResult.success || !uploadResult.url) {
      return new Response(JSON.stringify({ success: false, message: 'Error al subir la imagen' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, url: uploadResult.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
