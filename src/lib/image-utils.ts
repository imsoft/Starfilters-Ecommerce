/**
 * Obtiene URL de imagen optimizada para alta calidad (Cloudinary).
 * Para URLs de Cloudinary, agrega transformaciones que mejoran nitidez.
 * Para otras URLs, retorna sin cambios.
 */
export function getHighQualityImageUrl(
  url: string | null | undefined,
  options?: { width?: number; quality?: string }
): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com')) return url;

  const width = options?.width ?? 1200;
  const quality = options?.quality ?? 'auto:good';

  // Cloudinary: insertar transformaciones después de /upload/
  const uploadIndex = url.indexOf('/upload/') + '/upload/'.length;
  const before = url.slice(0, uploadIndex);
  const after = url.slice(uploadIndex);

  const transformations = `c_fill,w_${width},q_${quality},f_auto`;
  return `${before}${transformations}/${after}`;
}

// Helper function to get appropriate placeholder image based on product category
export function getProductPlaceholderImage(category?: string): string {
  if (!category) return '/images/products/placeholder-product.svg';
  
  const categoryLower = category.toLowerCase();
  
  if (categoryLower.includes('hepa') || categoryLower.includes('filtro')) {
    return '/images/products/placeholder-hepa-filter.svg';
  }
  
  if (categoryLower.includes('cuarto') || categoryLower.includes('limpio') || categoryLower.includes('cleanroom')) {
    return '/images/products/placeholder-cleanroom.svg';
  }
  
  if (categoryLower.includes('purificación') || categoryLower.includes('purification') || categoryLower.includes('aire')) {
    return '/images/products/placeholder-air-purification.svg';
  }
  
  if (categoryLower.includes('industrial') || categoryLower.includes('sistema')) {
    return '/images/products/placeholder-industrial-filter.svg';
  }
  
  return '/images/products/placeholder-product.svg';
}
