/**
 * Helpers para manejar traducciones de productos y categorías
 */

import { getLangFromUrl } from '@/i18n/utils';

/**
 * Obtiene el nombre de un producto según el idioma
 */
export function getProductName(product: { name: string; name_en?: string | null }, lang: string = 'es'): string {
  if (lang === 'en' && product.name_en) {
    return product.name_en;
  }
  return product.name;
}

/**
 * Obtiene la descripción de un producto según el idioma
 */
export function getProductDescription(product: { description: string; description_en?: string | null }, lang: string = 'es'): string {
  if (lang === 'en' && product.description_en) {
    return product.description_en;
  }
  return product.description || '';
}

/**
 * Obtiene la categoría de un producto según el idioma
 */
export function getProductCategory(product: { category: string; category_en?: string | null }, lang: string = 'es'): string {
  if (lang === 'en' && product.category_en) {
    return product.category_en;
  }
  return product.category || (lang === 'en' ? 'Uncategorized' : 'Sin categoría');
}

/**
 * Obtiene el nombre de una categoría según el idioma
 */
export function getCategoryName(category: { name: string; name_en?: string | null }, lang: string = 'es'): string {
  if (lang === 'en' && category.name_en) {
    return category.name_en;
  }
  return category.name;
}

/**
 * Obtiene la descripción de una categoría según el idioma
 */
export function getCategoryDescription(category: { description?: string | null; description_en?: string | null }, lang: string = 'es'): string | undefined {
  if (lang === 'en' && category.description_en) {
    return category.description_en;
  }
  return category.description || undefined;
}
