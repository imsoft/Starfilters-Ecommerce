/**
 * Cotiza el envío por paquetería con Pakke para el carrito del cliente.
 *
 * El checkout llama aquí cuando el comprador elige "Envío por paquetería" y
 * escribe su código postal. La llave de Pakke se queda en el servidor.
 *
 * Si Pakke no está configurado, falla o no devuelve opciones, la respuesta
 * llega con `opciones: []` y el checkout mantiene la tarifa fija: nunca se
 * bloquea una compra porque la paquetería no conteste.
 */
import type { APIRoute } from 'astro';
import { cotizarEnvio, armarPaqueteDesdeBD, pakkeConfigurado } from '@/lib/pakke';

export const prerender = false;

interface ItemEntrada {
  uuid?: string;
  id?: number;
  cantidad?: number;
  quantity?: number;
}

export const POST: APIRoute = async ({ request }) => {
  const json = (cuerpo: unknown, status = 200) =>
    new Response(JSON.stringify(cuerpo), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    const body = await request.json().catch(() => ({}));
    const codigoPostal = String(body?.codigoPostal ?? body?.postalCode ?? '').trim();
    const items: ItemEntrada[] = Array.isArray(body?.items) ? body.items : [];
    const valorAsegurado = Number(body?.valorAsegurado ?? 0) || 0;

    if (!/^\d{5}$/.test(codigoPostal)) {
      return json({ error: 'Código postal inválido', opciones: [] }, 400);
    }

    if (!pakkeConfigurado()) {
      // No es un error del comprador: el checkout seguirá con la tarifa fija.
      return json({ opciones: [], motivo: 'pakke-no-configurado' });
    }

    // El bulto se arma en un solo lugar (lib/pakke) para que la cotización que
    // ve el comprador y la que recalcula el servidor al cobrar coincidan.
    const { paquete, sinMedidas } = await armarPaqueteDesdeBD(
      items.map((i) => ({ uuid: i.uuid, cantidad: Number(i.cantidad ?? i.quantity ?? 1) }))
    );

    const opciones = await cotizarEnvio(codigoPostal, paquete, { valorAsegurado });

    return json({
      opciones,
      paquete,
      sinMedidas,
      motivo: opciones.length === 0 ? 'sin-opciones' : undefined,
    });
  } catch (error: any) {
    console.error('❌ Error en /api/cotizar-envio:', error?.message);
    // Se responde 200 con lista vacía a propósito: el checkout debe poder
    // continuar con la tarifa fija aunque esto falle.
    return json({ opciones: [], motivo: 'error' });
  }
};
