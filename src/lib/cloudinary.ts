import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: import.meta.env.CLOUDINARY_CLOUD_NAME,
  api_key: import.meta.env.CLOUDINARY_API_KEY,
  api_secret: import.meta.env.CLOUDINARY_API_SECRET,
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
    // Convertir Buffer a base64 string
    const fileToUpload: string = Buffer.isBuffer(file)
      ? `data:image/png;base64,${file.toString('base64')}`
      : file;

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

    return result.secure_url;
  } catch (error) {
    console.error('Error subiendo imagen a Cloudinary:', error);
    throw new Error('Error al subir la imagen');
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
  const folder = `starfilters-ecommerce/products/${productId}`;
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

