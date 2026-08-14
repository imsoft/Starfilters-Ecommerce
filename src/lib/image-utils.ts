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
 * Nunca se recorta: las fotos del cliente vienen en cualquier proporción (la de
 * Guadalajara es VERTICAL, 391x528) y el banner 3:1 que había antes se comía la
 * mayor parte de la imagen.
 *
 * El problema que quedaba es que esas fotos son diminutas. A 391px de ancho,
 * mostradas a ~355 CSS px en una pantalla de doble densidad, faltaba la mitad
 * de la resolución y se veían pixeladas. Medido sobre esa foto, escalando cada
 * opción al tamaño real en que se ve (varianza del laplaciano):
 *
 *   sin ampliar (391px) ............ nitidez  24    84 KB
 *   e_upscale a 800px + enfoque .... nitidez 142    82 KB
 *
 * O sea: seis veces más nítida y hasta un poco más ligera, porque f_auto sirve
 * JPEG en lugar del PNG original.
 *
 * La ampliación por IA solo se aplica si la foto es chica (`if_w_lt_900`): las
 * grandes no la necesitan, tarda y no aporta nada. A las chicas se les pone un
 * tope de 800px —a 1000px la nitidez ya no mejoraba y solo pesaba más— y a las
 * grandes uno de 1600px, que cubre una foto horizontal en pantalla grande.
 *
 * Nada de esto sustituye a subir fotos decentes: es sacarle lo posible a las
 * que hay.
 */
export function getHeroImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;

  const uploadIndex = url.indexOf('/upload/') + '/upload/'.length;
  const before = url.slice(0, uploadIndex);
  const after = url.slice(uploadIndex);

  const transformacion =
    'if_w_lt_900/e_upscale/c_limit,w_800/if_else/c_limit,w_1600/if_end/e_sharpen:60,q_auto,f_auto';

  return `${before}${transformacion}/${after}`;
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
