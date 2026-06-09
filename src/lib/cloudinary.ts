import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';
import { writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Configurar Cloudinary
const cloudName = import.meta.env.CLOUDINARY_CLOUD_NAME;
const apiKey = import.meta.env.CLOUDINARY_API_KEY;
const apiSecret = import.meta.env.CLOUDINARY_API_SECRET;

// Validar que las credenciales estén configuradas
if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ ERROR: Credenciales de Cloudinary no configuradas');
  console.error('   CLOUDINARY_CLOUD_NAME:', cloudName ? '✅' : '❌ FALTA');
  console.error('   CLOUDINARY_API_KEY:', apiKey ? '✅' : '❌ FALTA');
  console.error('   CLOUDINARY_API_SECRET:', apiSecret ? '✅' : '❌ FALTA');
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
});

// Tipos para las opciones de subida
export interface UploadOptions {
  folder: string;
  public_id?: string;
  overwrite?: boolean;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
}

/**
 * Sube una imagen a Cloudinary
 * @param file - Buffer o ruta del archivo
 * @param options - Opciones de subida
 * @returns URL segura de la imagen subida
 */
export async function uploadImage(
  file: Buffer | string,
  options: UploadOptions
): Promise<string> {
  try {
    // Validar credenciales antes de intentar subir
    const cloudName = import.meta.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = import.meta.env.CLOUDINARY_API_KEY;
    const apiSecret = import.meta.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      const missing = [];
      if (!cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
      if (!apiKey) missing.push('CLOUDINARY_API_KEY');
      if (!apiSecret) missing.push('CLOUDINARY_API_SECRET');
      throw new Error(`Credenciales de Cloudinary faltantes: ${missing.join(', ')}`);
    }

    // Convertir Buffer a base64 string
    const fileToUpload: string = Buffer.isBuffer(file)
      ? `data:image/png;base64,${file.toString('base64')}`
      : file;

    console.log('📤 Subiendo a Cloudinary:', {
      folder: options.folder,
      public_id: options.public_id,
      cloud_name: cloudName
    });

    const result: UploadApiResponse = await cloudinary.uploader.upload(
      fileToUpload,
      {
        folder: options.folder,
        public_id: options.public_id,
        overwrite: options.overwrite ?? true,
        resource_type: options.resource_type ?? 'image',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' }
        ]
      }
    );

    console.log('✅ Imagen subida exitosamente:', result.secure_url);
    return result.secure_url;
  } catch (error: any) {
    console.error('❌ Error subiendo imagen a Cloudinary:', error);
    console.error('   Detalles:', error.message);
    if (error.http_code) {
      console.error('   HTTP Code:', error.http_code);
    }
    if (error.message) {
      throw new Error(`Error al subir la imagen: ${error.message}`);
    }
    throw new Error('Error al subir la imagen');
  }
}

/**
 * Sube un VIDEO a Cloudinary usando subida por chunks (upload_large).
 *
 * A diferencia de uploadImage (que usa un data-URI en base64, limitado a ~10 MB),
 * esta función escribe el buffer a un archivo temporal y lo sube en partes,
 * lo que permite manejar videos grandes de forma confiable.
 *
 * @param file - Buffer del video
 * @param options - Carpeta y public_id de destino
 * @returns URL segura del video subido
 */
export async function uploadVideo(
  file: Buffer,
  options: { folder: string; public_id?: string; overwrite?: boolean }
): Promise<string> {
  // Validar credenciales antes de intentar subir
  const cloudName = import.meta.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = import.meta.env.CLOUDINARY_API_KEY;
  const apiSecret = import.meta.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    const missing = [];
    if (!cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
    if (!apiKey) missing.push('CLOUDINARY_API_KEY');
    if (!apiSecret) missing.push('CLOUDINARY_API_SECRET');
    throw new Error(`Credenciales de Cloudinary faltantes: ${missing.join(', ')}`);
  }

  // Escribir a un archivo temporal para poder subir por chunks
  const tmpPath = join(tmpdir(), `hero-vid-${Date.now()}.tmp`);
  await writeFile(tmpPath, file);

  console.log('📤 Subiendo video a Cloudinary (chunked):', {
    folder: options.folder,
    public_id: options.public_id,
    cloud_name: cloudName,
    size_mb: (file.length / (1024 * 1024)).toFixed(1),
  });

  try {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.upload_large(
        tmpPath,
        {
          folder: options.folder,
          public_id: options.public_id,
          overwrite: options.overwrite ?? true,
          resource_type: 'video',
          chunk_size: 6_000_000, // 6 MB por chunk (mínimo permitido: 5 MB)
        },
        (err, res) => {
          if (err) return reject(err);
          if (!res?.secure_url) return reject(new Error('Cloudinary no devolvió una URL'));
          resolve(res as UploadApiResponse);
        }
      );
    });

    console.log('✅ Video subido exitosamente:', result.secure_url);
    return result.secure_url;
  } catch (error: any) {
    console.error('❌ Error subiendo video a Cloudinary:', error?.message || error);
    if (error?.http_code) console.error('   HTTP Code:', error.http_code);
    throw new Error(`Error al subir el video: ${error?.message || 'desconocido'}`);
  } finally {
    // Limpiar el archivo temporal sin importar el resultado
    await unlink(tmpPath).catch(() => {});
  }
}

/**
 * Sube una imagen de producto
 * @param file - Buffer o ruta del archivo
 * @param productId - ID del producto
 * @param imageName - Nombre de la imagen (opcional)
 * @returns URL segura de la imagen subida
 */
export async function uploadProductImage(
  file: Buffer | string,
  productId: string,
  imageName?: string
): Promise<string> {
  const folder = `starfilters-ecommerce/productos/${productId}/imagenes`;
  const public_id = imageName ? `${imageName}` : undefined;

  return uploadImage(file, {
    folder,
    public_id,
    resource_type: 'image'
  });
}

/**
 * Sube una imagen de blog
 * @param file - Buffer o ruta del archivo
 * @param blogId - ID del blog post
 * @param imageName - Nombre de la imagen (opcional)
 * @returns URL segura de la imagen subida
 */
export async function uploadBlogImage(
  file: Buffer | string,
  blogId: string,
  imageName?: string
): Promise<string> {
  const folder = `starfilters-ecommerce/blog/${blogId}`;
  const public_id = imageName ? `${imageName}` : undefined;

  return uploadImage(file, {
    folder,
    public_id,
    resource_type: 'image'
  });
}

/**
 * Sube una imagen de usuario/perfil
 * @param file - Buffer o ruta del archivo
 * @param userId - ID del usuario
 * @param imageName - Nombre de la imagen (opcional)
 * @returns URL segura de la imagen subida
 */
export async function uploadUserImage(
  file: Buffer | string,
  userId: string,
  imageName?: string
): Promise<string> {
  const folder = `starfilters-ecommerce/users/${userId}`;
  const public_id = imageName ? `${imageName}` : 'avatar';

  return uploadImage(file, {
    folder,
    public_id,
    resource_type: 'image'
  });
}

/**
 * Sube un logo o imagen general
 * @param file - Buffer o ruta del archivo
 * @param category - Categoría de la imagen (logos, banners, etc.)
 * @param imageName - Nombre de la imagen
 * @returns URL segura de la imagen subida
 */
export async function uploadGeneralImage(
  file: Buffer | string,
  category: string,
  imageName: string
): Promise<string> {
  const folder = `starfilters-ecommerce/${category}`;

  return uploadImage(file, {
    folder,
    public_id: imageName,
    resource_type: 'image'
  });
}

/**
 * Sube una imagen general a Cloudinary con resultado estructurado
 * @param file - Buffer del archivo
 * @param folder - Carpeta donde subir la imagen
 * @param imageName - Nombre de la imagen
 * @returns Objeto con success y url
 */
export async function uploadToCloudinary(
  file: Buffer,
  folder: string,
  imageName: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const url = await uploadImage(file, {
      folder,
      public_id: imageName,
      resource_type: 'image'
    });
    
    return {
      success: true,
      url
    };
  } catch (error) {
    console.error('❌ Error en uploadToCloudinary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('   Mensaje de error:', errorMessage);
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Elimina una imagen de Cloudinary
 * @param publicId - ID público de la imagen en Cloudinary
 * @returns true si se eliminó correctamente
 */
export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error eliminando imagen de Cloudinary:', error);
    return false;
  }
}

/**
 * Obtiene el public_id de una URL de Cloudinary
 * @param url - URL de Cloudinary
 * @returns Public ID de la imagen
 */
export function getPublicIdFromUrl(url: string): string {
  // Ejemplo: https://res.cloudinary.com/demo/image/upload/v1234567890/starfilters-ecommerce/products/123/image.jpg
  // Resultado: starfilters-ecommerce/products/123/image
  const parts = url.split('/upload/');
  if (parts.length < 2) return '';
  
  const pathParts = parts[1].split('/');
  // Remover versión si existe (v1234567890)
  const startIndex = pathParts[0].startsWith('v') ? 1 : 0;
  const publicIdWithExtension = pathParts.slice(startIndex).join('/');
  
  // Remover extensión
  return publicIdWithExtension.replace(/\.[^/.]+$/, '');
}

/**
 * Sube una imagen principal de categoría de filtro
 * @param file - Buffer o ruta del archivo
 * @param categoryId - ID de la categoría
 * @param imageName - Nombre de la imagen (opcional)
 * @returns URL segura de la imagen subida
 */
export async function uploadCategoryPrimaryImage(
  file: Buffer | string,
  categoryId: number,
  imageName?: string
): Promise<string> {
  const folder = `starfilters-ecommerce/categorias-filtros/${categoryId}/principal`;
  const public_id = imageName ? imageName.replace(/\.[^/.]+$/, '') : undefined;

  return uploadImage(file, {
    folder,
    public_id,
    resource_type: 'image'
  });
}

/**
 * Sube una imagen de carrusel de categoría de filtro
 * @param file - Buffer o ruta del archivo
 * @param categoryId - ID de la categoría
 * @param imageName - Nombre de la imagen (opcional)
 * @returns URL segura de la imagen subida
 */
export async function uploadCategoryCarouselImage(
  file: Buffer | string,
  categoryId: number,
  imageName?: string
): Promise<string> {
  const folder = `starfilters-ecommerce/categorias-filtros/${categoryId}/carrusel`;
  const public_id = imageName ? imageName.replace(/\.[^/.]+$/, '') : undefined;

  return uploadImage(file, {
    folder,
    public_id,
    resource_type: 'image'
  });
}

/**
 * Obtiene una URL optimizada de Cloudinary
 * @param publicId - ID público de la imagen
 * @param transformations - Transformaciones a aplicar
 * @returns URL optimizada
 */
export function getOptimizedUrl(
  publicId: string,
  transformations?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
  }
): string {
  return cloudinary.url(publicId, {
    transformation: [
      {
        width: transformations?.width,
        height: transformations?.height,
        crop: transformations?.crop || 'fill',
        quality: transformations?.quality || 'auto',
        fetch_format: transformations?.format || 'auto'
      }
    ]
  });
}

export default cloudinary;

