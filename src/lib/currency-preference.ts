/**
 * Moneda elegida por el visitante.
 *
 * Antes la moneda la decidía el idioma (español = pesos, inglés = dólares),
 * pero eso obligaba a cambiar todo el sitio de idioma solo para ver otros
 * precios. Ahora es una preferencia propia, como en cualquier tienda.
 *
 * Va en cookie y no en localStorage porque los precios se calculan en el
 * servidor: tiene que llegar con la petición para poder renderizarlos ya
 * convertidos.
 */

export type Moneda = 'MXN' | 'USD';

export const COOKIE_MONEDA = 'moneda';

/** Moneda por defecto según el idioma, para quien nunca ha elegido */
export const monedaPorIdioma = (lang: string): Moneda => (lang === 'en' ? 'USD' : 'MXN');

/**
 * Moneda a usar en esta petición: la elegida por el visitante o, si no ha
 * elegido, la que corresponde al idioma.
 */
export const getMoneda = (cookies: { get(name: string): { value: string } | undefined }, lang: string): Moneda => {
  const elegida = cookies.get(COOKIE_MONEDA)?.value?.toUpperCase();
  if (elegida === 'USD' || elegida === 'MXN') return elegida;
  return monedaPorIdioma(lang);
};

/**
 * Convierte un importe a la moneda pedida.
 * `exchangeRate` son pesos por dólar (p. ej. 17.14).
 */
export const convertirMoneda = (
  monto: number,
  desde: Moneda,
  hacia: Moneda,
  exchangeRate: number
): number => {
  if (desde === hacia || !exchangeRate) return monto;
  return desde === 'USD' ? monto * exchangeRate : monto / exchangeRate;
};

/** Precio de un producto en la moneda pedida, prefiriendo el precio capturado */
export const precioEnMoneda = (
  producto: { price: number; price_usd?: number | null; currency?: 'MXN' | 'USD' | null },
  moneda: Moneda,
  exchangeRate: number
): number => {
  if (moneda === 'USD' && producto.price_usd && producto.price_usd > 0) {
    return producto.price_usd;
  }
  const monedaOrigen: Moneda = producto.currency === 'USD' ? 'USD' : 'MXN';
  return convertirMoneda(producto.price, monedaOrigen, moneda, exchangeRate);
};
