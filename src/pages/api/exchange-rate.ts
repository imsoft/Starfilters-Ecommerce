import type { APIRoute } from 'astro';
import { getExchangeRate } from '@/lib/currency-service';

export const prerender = false;

/**
 * Tasa USD→MXN para el navegador.
 *
 * Antes este endpoint consultaba al proveedor externo en cada petición, sin
 * caché y sin freno: el servidor cobraba con una tasa (la de su caché de una
 * hora) y el checkout mostraba otra (la del momento), así que el total que
 * veía el comprador podía no coincidir con el que se le cobraba. Ahora sale
 * de la misma caché que usa el servidor para cobrar.
 */
export const GET: APIRoute = async () => {
  const rate = await getExchangeRate();
  return new Response(
    JSON.stringify({ success: true, rate, timestamp: new Date().toISOString() }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    }
  );
};
