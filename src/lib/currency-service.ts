/**
 * Servicio de Conversión de Moneda
 *
 * Maneja la conversión de USD a MXN usando tasas de cambio actualizadas
 */

// Caché en memoria para la tasa de cambio (1 hora)
let cachedRate: { rate: number; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora en milisegundos

/**
 * Obtener la tasa de cambio actual de USD a MXN
 * Usa caché para evitar demasiadas llamadas a la API
 */
export async function getExchangeRate(forceRefresh = false): Promise<number> {
  // Verificar caché si no se fuerza actualización
  if (!forceRefresh && cachedRate) {
    const now = Date.now();
    if (now - cachedRate.timestamp < CACHE_DURATION) {
      return cachedRate.rate;
    }
  }

  try {
    // Intentar obtener de nuestro endpoint API primero (para SSR)
    let rate: number;
    
    try {
      // En el servidor, usar la API externa directamente
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      
      if (!response.ok) {
        throw new Error('Error al obtener tasa de cambio');
      }

      const data = await response.json();
      rate = data.rates.MXN;

      if (!rate || typeof rate !== 'number') {
        throw new Error('Tasa MXN no disponible');
      }
    } catch (error) {
      console.error('❌ Error obteniendo tasa de cambio, usando tasa por defecto:', error);
      // Tasa de respaldo (actualizar periódicamente)
      rate = 17.0;
    }

    // Actualizar caché
    cachedRate = {
      rate,
      timestamp: Date.now()
    };

    console.log(`💱 Tasa de cambio USD->MXN: ${rate}`);
    return rate;
  } catch (error) {
    console.error('❌ Error obteniendo tasa de cambio, usando tasa por defecto:', error);
    // Si hay error y no hay caché, usar tasa de respaldo
    const fallbackRate = cachedRate?.rate || 17.0;
    return fallbackRate;
  }
}

/**
 * Obtener tasa de cambio desde el cliente (usando nuestro endpoint API)
 */
export async function getExchangeRateFromClient(): Promise<number> {
  try {
    const response = await fetch('/api/exchange-rate');
    const data = await response.json();
    
    if (data.success && data.rate) {
      return data.rate;
    }
    
    // Si falla, usar tasa de respaldo
    return data.rate || 17.0;
  } catch (error) {
    console.error('❌ Error obteniendo tasa de cambio desde cliente:', error);
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
