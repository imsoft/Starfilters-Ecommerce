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
 * URL para imágenes de banner a todo lo ancho (heros de casos de éxito, etc.).
 *
 * Varias fotos del cliente están subidas pequeñas (la del caso de Guadalajara
 * mide 765px) y el hero las estira a ~1900px. Medido sobre esa foto, escalando
 * cada opción al tamaño en que se muestra:
 *
 *   sin transformar ....................... nitidez 253
 *   c_fill + e_sharpen (lo que había) ......         98   ← peor que no tocarla
 *   e_upscale (IA de Cloudinary) ..........         415
 *   e_upscale + e_sharpen:100 .............       ~1000
 *
 * De ahí que se use el escalado por IA y después el enfoque. No sustituye a
 * subir una foto grande, pero la diferencia es visible.
 */
export function getHeroImageUrl(
  url: string | null | undefined,
  options?: { width?: number; height?: number }
): string {
  return construirHero(url, options, true);
}

/**
 * Misma imagen sin el escalado por IA. e_upscale es un complemento con cuota
 * mensual: si se agota, esa URL falla y hay que poder caer a esta.
 */
export function getHeroImageFallbackUrl(
  url: string | null | undefined,
  options?: { width?: number; height?: number }
): string {
  return construirHero(url, options, false);
}

function construirHero(
  url: string | null | undefined,
  options: { width?: number; height?: number } | undefined,
  conIA: boolean
): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;

  const width = options?.width ?? 1920;
  const height = options?.height ?? 640;

  const uploadIndex = url.indexOf('/upload/') + '/upload/'.length;
  const before = url.slice(0, uploadIndex);
  const after = url.slice(uploadIndex);

  // c_fill + g_auto recorta hacia la zona relevante de la foto
  const encuadre = `c_fill,g_auto,w_${width},h_${height},e_sharpen:100,q_auto:best,f_auto`;
  return conIA ? `${before}e_upscale/${encuadre}/${after}` : `${before}${encuadre}/${after}`;
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
