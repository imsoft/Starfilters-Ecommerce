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
  const quality = options?.quality ?? 'auto:best';

  // Cloudinary: insertar transformaciones después de /upload/
  const uploadIndex = url.indexOf('/upload/') + '/upload/'.length;
  const before = url.slice(0, uploadIndex);
  const after = url.slice(uploadIndex);

  // c_limit en vez de c_fill: nunca escala la imagen por encima de su tamaño
  // original (estirar una fuente pequeña la vuelve borrosa y encima Cloudinary
  // la recomprime). Si la fuente es menor al ancho pedido, se sirve tal cual.
  const transformations = `c_limit,w_${width},q_${quality},f_auto`;
  return `${before}${transformations}/${after}`;
}

/**
 * URL para la foto de portada de un caso de éxito.
 *
 * Antes esto forzaba un banner de 1920x640 (c_fill) y encima pasaba la foto por
 * el escalado con IA de Cloudinary (e_upscale). Con las fotos que sube el
 * cliente eso salía mal por partida doble: la del caso de Guadalajara mide
 * 391x528 —es VERTICAL—, así que el recorte a 3:1 tiraba la mayor parte de la
 * imagen y ampliaba el resto casi 5x; de ahí que se viera "con zoom". Y
 * e_upscale añadía cerca de un segundo de espera y duplicaba el peso.
 *
 * Ahora se sirve la foto completa, sin recortar y sin ampliarla por encima de
 * su tamaño original (c_limit). La página la centra y la muestra entera, sea
 * horizontal o vertical.
 */
export function getHeroImageUrl(
  url: string | null | undefined,
  options?: { width?: number }
): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;

  const width = options?.width ?? 1200;

  const uploadIndex = url.indexOf('/upload/') + '/upload/'.length;
  const before = url.slice(0, uploadIndex);
  const after = url.slice(uploadIndex);

  return `${before}c_limit,w_${width},q_auto,f_auto/${after}`;
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
