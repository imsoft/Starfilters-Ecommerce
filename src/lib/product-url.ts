/**
 * URL pública de un producto.
 *
 * Las fichas viven en /productos/<slug> y /en/products/<slug_en>, legibles
 * para personas y buscadores. Las URLs viejas (/product/<uuid> y
 * /product/variant-N) siguen funcionando con redirección 301 a la nueva.
 *
 * Sin dependencias de servidor: lo usan componentes y también el sitemap.
 */

export interface ProductoConSlug {
  uuid: string;
  slug?: string | null;
  slug_en?: string | null;
}

export const urlDeProducto = (p: ProductoConSlug, lang: 'es' | 'en' = 'es'): string => {
  if (lang === 'en') {
    const slug = p.slug_en || p.slug;
    return slug ? `/en/products/${slug}` : `/en/product/${p.uuid}`;
  }
  return p.slug ? `/productos/${p.slug}` : `/product/${p.uuid}`;
};

/** Texto → slug: minúsculas, sin acentos, guiones. */
export const slugDe = (texto: string): string =>
  String(texto || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
