/**
 * Servicio de Conversión de Moneda
 *
 * Maneja la conversión de USD a MXN usando tasas de cambio actualizadas
 */

/**
 * Obtener la tasa de cambio actual de USD a MXN
 * Usa una API gratuita para obtener tasas actualizadas
 */
export async function getExchangeRate(): Promise<number> {
  try {
    // Intentar obtener de la API de exchangerate-api.com (gratis)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');

    if (!response.ok) {
      throw new Error('Error al obtener tasa de cambio');
    }

    const data = await response.json();
    const rate = data.rates.MXN;

    if (!rate) {
      throw new Error('Tasa MXN no disponible');
    }

    console.log(`💱 Tasa de cambio USD->MXN: ${rate}`);
    return rate;
  } catch (error) {
    console.error('❌ Error obteniendo tasa de cambio, usando tasa por defecto:', error);
    // Tasa de respaldo (actualizar periódicamente)
    return 17.0;
  }
}

/**
 * Convertir USD a MXN
 */
export async function convertUSDtoMXN(amountUSD: number): Promise<number> {
  const rate = await getExchangeRate();
  return amountUSD * rate;
}

/**
 * Convertir MXN a USD
 */
export async function convertMXNtoUSD(amountMXN: number): Promise<number> {
  const rate = await getExchangeRate();
  return amountMXN / rate;
}

/**
 * Formatear precio en MXN
 */
export function formatMXN(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
}

/**
 * Formatear precio en USD
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Obtener el precio en MXN de una variante
 * Si el precio está en USD, lo convierte automáticamente
 */
export async function getVariantPriceInMXN(
  price: number,
  currency: 'MXN' | 'USD',
  priceUSD?: number | null
): Promise<number> {
  if (currency === 'USD') {
    // Si tenemos price_usd, usarlo; sino usar price
    const usdAmount = priceUSD || price;
    return await convertUSDtoMXN(usdAmount);
  }

  return price;
}

export default {
  getExchangeRate,
  convertUSDtoMXN,
  convertMXNtoUSD,
  formatMXN,
  formatUSD,
  getVariantPriceInMXN,
};
