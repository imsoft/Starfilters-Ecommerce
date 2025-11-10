/**
 * Caché simple en memoria para productos de Bind
 * Evita hacer múltiples llamadas a la API en cada carga de página
 */

import type { Product } from './database';

interface CacheEntry {
  data: Product[];
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Obtener productos del caché si están disponibles y no han expirado
 */
export const getFromCache = (key: string): Product[] | null => {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  const now = Date.now();
  const age = now - entry.timestamp;

  if (age > CACHE_DURATION) {
    console.log('🕐 Caché expirado, limpiando...');
    cache.delete(key);
    return null;
  }

  console.log(`✅ Usando caché (edad: ${Math.round(age / 1000)}s)`);
  return entry.data;
};

/**
 * Guardar productos en el caché
 */
export const saveToCache = (key: string, data: Product[]): void => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
  console.log(`💾 Guardado en caché: ${data.length} productos`);
};

/**
 * Limpiar el caché completo
 */
export const clearCache = (): void => {
  cache.clear();
  console.log('🗑️ Caché limpiado');
};

/**
 * Limpiar una entrada específica del caché
 */
export const clearCacheKey = (key: string): void => {
  cache.delete(key);
  console.log(`🗑️ Entrada de caché eliminada: ${key}`);
};
