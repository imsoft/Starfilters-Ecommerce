import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-utils';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { getBlogPostByUuid, updateBlogPost } from '@/lib/database';

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
    const blogId = formData.get('blogId') as string;

    if (!image) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No se proporcionó ninguna imagen' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!blogId) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'ID de blog no proporcionado' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validar tipo de archivo (MIME type)
    const isValidMimeType = image.type.startsWith('image/');
    
    // Validar extensión del archivo
    const fileName = image.name.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValidMimeType && !hasValidExtension) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'El archivo debe ser una imagen válida (JPG, JPEG, PNG, GIF o WEBP)' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validar tamaño (5MB)
    if (image.size > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'La imagen debe ser menor a 5MB' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Obtener el blog post para obtener el UUID (si blogId es numérico, buscar por ID)
    let blogPost = await getBlogPostByUuid(blogId, true);
    
    // Si no se encontró por UUID, intentar buscar por ID numérico
    if (!blogPost) {
      const { getBlogPostById } = await import('@/lib/database');
      blogPost = await getBlogPostById(parseInt(blogId));
    }

    if (!blogPost) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Artículo del blog no encontrado' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const blogUuid = blogPost.uuid;
    console.log('📤 Subiendo imagen de blog:', { blogId, blogUuid, fileName: image.name });

    // Convertir archivo a buffer
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir a Cloudinary usando el UUID del blog
    const imageName = `featured_${Date.now()}`;
    const uploadResult = await uploadToCloudinary(
      buffer,
      `starfilters-ecommerce/blog/${blogUuid}`,
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

    console.log('✅ Imagen de blog subida exitosamente:', uploadResult.url);

    // Actualizar automáticamente la base de datos con la URL de la imagen
    try {
      const updatedPost = await updateBlogPost(blogUuid, {
        title: blogPost.title,
        title_en: blogPost.title_en,
        slug: blogPost.slug,
        slug_en: blogPost.slug_en,
        excerpt: blogPost.excerpt,
        excerpt_en: blogPost.excerpt_en,
        content: blogPost.content,
        content_en: blogPost.content_en,
        category: blogPost.category,
        author: blogPost.author,
        status: blogPost.status,
        publish_date: blogPost.publish_date || undefined,
        tags: blogPost.tags,
        featured_image_url: uploadResult.url, // Guardar la URL en la BD
        meta_title: blogPost.meta_title,
        meta_title_en: blogPost.meta_title_en,
        meta_description: blogPost.meta_description,
        meta_description_en: blogPost.meta_description_en
      });

      if (updatedPost) {
        console.log('✅ URL de imagen guardada en la base de datos');
      } else {
        console.warn('⚠️ No se pudo actualizar la base de datos, pero la imagen se subió correctamente');
      }
    } catch (dbError) {
      console.error('❌ Error actualizando la base de datos:', dbError);
      // No fallar la respuesta si la imagen se subió correctamente
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Imagen subida exitosamente',
      url: uploadResult.url
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error en la API de subida de imagen de blog:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Error interno del servidor: ' + (error instanceof Error ? error.message : 'Error desconocido')
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
