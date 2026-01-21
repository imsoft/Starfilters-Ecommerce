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

/**
 * Obtiene el precio y moneda de un producto según el idioma
 * Español → MXN (usa price)
 * Inglés → USD (usa price_usd si existe, sino price convertido)
 */
export function getProductPriceAndCurrency(
  product: { 
    price: number; 
    price_usd?: number | null; 
    currency?: 'MXN' | 'USD' | null 
  }, 
  lang: string = 'es'
): { price: number; currency: 'MXN' | 'USD' } {
  if (lang === 'en') {
    // En inglés, preferir USD
    if (product.price_usd && product.price_usd > 0) {
      return { price: product.price_usd, currency: 'USD' };
    }
    // Si el producto está marcado como USD pero no tiene price_usd, usar price
    if (product.currency === 'USD') {
      return { price: product.price, currency: 'USD' };
    }
    // Si no tiene precio USD, convertir MXN a USD (aproximado)
    // Nota: Esto debería mejorarse con tasa de cambio real
    return { price: product.price / 17, currency: 'USD' };
  }
  
  // En español, usar MXN
  // Si el producto está en USD, usar price_usd para la conversión (se convertirá en las páginas)
  if (product.currency === 'USD') {
    // Si tiene price_usd, usarlo (será convertido a MXN en las páginas)
    if (product.price_usd && product.price_usd > 0) {
      return { price: product.price_usd, currency: 'USD' };
    }
    // Si no tiene price_usd pero está marcado como USD, usar price
    return { price: product.price, currency: 'USD' };
  }
  
  // Producto en MXN
  return { price: product.price, currency: 'MXN' };
}

/**
 * Formatea un precio según la moneda
 */
export function formatPriceByCurrency(price: number, currency: 'MXN' | 'USD'): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }
  
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(price);
}
