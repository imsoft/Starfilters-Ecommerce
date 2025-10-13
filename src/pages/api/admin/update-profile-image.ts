import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-utils';
import { getAdminUserByEmail } from '@/lib/database';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { query } from '@/config/database';

export const POST: APIRoute = async ({ request, cookies }) => {
  const authResult = await requireAdmin(cookies);
  if (authResult.redirect) {
    return new Response(null, { status: 302, headers: { Location: authResult.redirect } });
  }

  try {
    const formData = await request.formData();
    const profileImage = formData.get('profile_image') as File;

    if (!profileImage) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No se proporcionó ninguna imagen' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validar tipo de archivo
    if (!profileImage.type.startsWith('image/')) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'El archivo debe ser una imagen válida' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validar tamaño (máximo 5MB)
    if (profileImage.size > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'La imagen debe ser menor a 5MB' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = authResult.user;
    if (!user) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Usuario no autenticado' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Obtener el admin_user por email para tener el ID correcto
    const adminUser = await getAdminUserByEmail(user.email);
    if (!adminUser) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Usuario administrador no encontrado' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('📋 Admin user encontrado:', { id: adminUser.id, email: adminUser.email });

    // Convertir archivo a buffer
    const arrayBuffer = await profileImage.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('📤 Subiendo imagen a Cloudinary...');

    // Subir a Cloudinary
    const uploadResult = await uploadToCloudinary(
      buffer,
      `starfilters-ecommerce/admin/profile/${adminUser.id}`,
      'profile_image'
    );

    if (!uploadResult.success || !uploadResult.url) {
      console.error('❌ Error subiendo a Cloudinary:', uploadResult.error);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Error al subir la imagen a Cloudinary: ' + (uploadResult.error || 'Error desconocido')
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Imagen subida a Cloudinary:', uploadResult.url);
    console.log('💾 Actualizando base de datos...');

    // Actualizar en la base de datos directamente
    const updateResult = await query(
      'UPDATE admin_users SET profile_image = ?, updated_at = NOW() WHERE id = ?',
      [uploadResult.url, adminUser.id]
    ) as any;

    console.log('📊 Resultado de actualización:', updateResult);

    if (updateResult.affectedRows === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Error al actualizar la imagen en la base de datos' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Imagen de perfil actualizada exitosamente');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Imagen de perfil actualizada exitosamente',
      image_url: uploadResult.url
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error en la API de actualización de imagen de perfil:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Error interno del servidor: ' + (error instanceof Error ? error.message : 'Error desconocido')
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
