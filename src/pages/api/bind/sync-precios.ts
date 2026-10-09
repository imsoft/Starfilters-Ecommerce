import type { APIRoute } from 'astro';
import { requireAdminApi } from '@/lib/auth-utils';
import { sincronizarPreciosConBind, sincronizacionTotalActiva } from '@/lib/bind-price-sync';

/**
 * Qué cambiaría (o qué cambió) la sincronización de precios con BIND.
 *
 *   GET /api/bind/sync-precios            → simula: lista sin tocar nada
 *   GET /api/bind/sync-precios?simular=0  → aplica (solo con BIND_PRECIOS_AUTOMATICOS=true)
 *
 * Solo para administradores: expone códigos y precios. Sirve para revisar la
 * lista completa antes de activar el modo espejo en el servidor.
 */
export const GET: APIRoute = async ({ cookies, url }) => {
  const denegado = await requireAdminApi(cookies);
  if (denegado) return denegado;

  const simular = url.searchParams.get('simular') !== '0';
  if (!simular && !sincronizacionTotalActiva()) {
    return new Response(JSON.stringify({ success: false, error: 'El modo espejo no está activo (BIND_PRECIOS_AUTOMATICOS).' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const r = await sincronizarPreciosConBind(simular);
    const fila = (f: typeof r.aplicados[number]) => ({
      origen: f.origen, id: f.id, codigo: f.codigo, nombre: f.nombre,
      sitio: `${f.precioSitio} ${f.monedaSitio}`, bind: `${f.precioBind} MXN`,
      capturadoEnBind: f.monedaNativaBind ? `${f.precioNativoBind} ${f.monedaNativaBind}` : '(sin detalle)',
      cambiaMoneda: f.cambiaMoneda, diferenciaPct: f.diferenciaPct === null ? null : Number(f.diferenciaPct.toFixed(1)),
    });
    return new Response(JSON.stringify({
      success: true,
      simulado: r.simulado,
      modoEspejoActivo: sincronizacionTotalActiva(),
      total: r.aplicados.length,
      cambios: r.aplicados.map(fila),
      omitidos: r.omitidos.map((o) => ({ ...fila(o.fila), motivo: o.motivo })),
    }, null, 2), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error?.message || 'Error consultando BIND' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
