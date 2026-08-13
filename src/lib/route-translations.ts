/**
 * Equivalencias de rutas entre español e inglés.
 *
 * Vivía dentro de LanguageSelector.tsx; se extrajo al unir el cambio de idioma
 * y el de moneda en un solo control del header, para que la lógica no dependa
 * de un componente de React.
 */

/** Rutas fijas: español → inglés */
const RUTAS_ES_A_EN: Record<string, string> = {
  '/productos': '/en/products',
  '/cuartos-limpios': '/en/cleanrooms',
  '/servicios': '/en/services',
  '/filtros': '/en/filters',
  '/contacto': '/en/contact',
  '/contact': '/en/contact',
  '/blog': '/en/blog',
  '/carrito': '/en/cart',
  '/cart': '/en/cart',
  '/checkout': '/en/checkout',
  '/perfil': '/en/profile',
  '/profile': '/en/profile',
  '/pedidos': '/en/orders',
  '/orders': '/en/orders',
  '/login': '/en/login',
  '/signup': '/en/signup',
  '/acerca-de': '/en/about',
  '/accesorios': '/en/products?category=accesorios-cuarto-limpio',
  '/cambiar-contraseña': '/en/change-password',
  '/change-password': '/en/change-password',
  '/forgot-password': '/en/forgot-password',
  '/reset-password': '/en/reset-password',
  '/privacy': '/en/privacy',
  '/terms': '/en/terms',
  '/casos-de-exito': '/en/success-cases',
  '/preguntas-frecuentes': '/en/faq',
  '/soluciones': '/en/solutions',
};

/** Rutas fijas: inglés → español */
const RUTAS_EN_A_ES: Record<string, string> = {
  '/en/products': '/productos',
  '/en/cleanrooms': '/cuartos-limpios',
  '/en/services': '/servicios',
  '/en/filters': '/filtros',
  '/en/contact': '/contacto',
  '/en/cart': '/carrito',
  '/en/checkout': '/checkout',
  '/en/profile': '/profile',
  '/en/blog': '/blog',
  '/en/orders': '/orders',
  '/en/login': '/login',
  '/en/signup': '/signup',
  '/en/about': '/acerca-de',
  '/en/change-password': '/change-password',
  '/en/forgot-password': '/forgot-password',
  '/en/reset-password': '/reset-password',
  '/en/privacy': '/privacy',
  '/en/terms': '/terms',
  '/en/success-cases': '/casos-de-exito',
  '/en/faq': '/preguntas-frecuentes',
  '/en/solutions': '/soluciones',
};

/** Rutas dinámicas (/blog/[uuid], /product/[id]…), por prefijo */
const PREFIJOS_ES_A_EN: [string, string][] = [
  ['/blog/', '/en/blog/'],
  ['/product/', '/en/product/'],
  ['/pedidos/', '/en/orders/'],
  ['/orders/', '/en/orders/'],
  ['/casos-de-exito/', '/en/success-cases/'],
  ['/filtros/', '/en/filters/'],
];

const PREFIJOS_EN_A_ES: [string, string][] = [
  ['/en/blog/', '/blog/'],
  ['/en/product/', '/product/'],
  ['/en/orders/', '/orders/'],
  ['/en/success-cases/', '/casos-de-exito/'],
  ['/en/filters/', '/filtros/'],
];

export const esIngles = (ruta: string): boolean =>
  ruta === '/en' || ruta.startsWith('/en/');

/**
 * Devuelve la misma página en el otro idioma. Si ya está en el idioma pedido,
 * devuelve la ruta sin tocar.
 */
export const traducirRuta = (ruta: string, destino: 'es' | 'en'): string => {
  const enIngles = esIngles(ruta);
  if (destino === 'en' && enIngles) return ruta;
  if (destino === 'es' && !enIngles) return ruta;

  if (destino === 'en') {
    if (ruta === '/' || ruta === '') return '/en';
    if (RUTAS_ES_A_EN[ruta]) return RUTAS_ES_A_EN[ruta];
    for (const [de, a] of PREFIJOS_ES_A_EN) {
      if (ruta.startsWith(de)) return ruta.replace(de, a);
    }
    return `/en${ruta}`;
  }

  if (ruta === '/en') return '/';
  if (RUTAS_EN_A_ES[ruta]) return RUTAS_EN_A_ES[ruta];
  for (const [de, a] of PREFIJOS_EN_A_ES) {
    if (ruta.startsWith(de)) return ruta.replace(de, a);
  }
  return ruta.replace(/^\/en/, '') || '/';
};
