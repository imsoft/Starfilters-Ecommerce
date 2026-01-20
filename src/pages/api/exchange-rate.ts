import type { APIRoute } from 'astro';

/**
 * Endpoint para obtener la tasa de cambio USD a MXN
 * Incluye caché de 1 hora para evitar demasiadas llamadas a la API
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    // Intentar obtener de la API de exchangerate-api.com (gratis)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener tasa de cambio');
    }

    const data = await response.json();
    const rate = data.rates.MXN;

    if (!rate || typeof rate !== 'number') {
      throw new Error('Tasa MXN no disponible');
    }

    // Obtener fecha de última actualización
    const lastUpdate = data.date || new Date().toISOString().split('T')[0];

    return new Response(
      JSON.stringify({
        success: true,
        rate: rate,
        lastUpdate: lastUpdate,
        timestamp: Date.now(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // Cachear por 1 hora en el cliente
          'Cache-Control': 'public, max-age=3600'
        }
      }
    );
  } catch (error) {
    console.error('❌ Error obteniendo tasa de cambio:', error);
    
    // Tasa de respaldo (actualizar periódicamente)
    const fallbackRate = 17.0;
    
    return new Response(
      JSON.stringify({
        success: false,
        rate: fallbackRate,
        lastUpdate: null,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Error desconocido',
        usingFallback: true
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // Cachear menos tiempo si hay error
        }
      }
    );
  }
};
