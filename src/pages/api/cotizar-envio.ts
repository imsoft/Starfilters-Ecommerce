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
import { query } from '@/config/database';
import { cotizarEnvio, armarPaquete, pakkeConfigurado, PAQUETE_POR_DEFECTO } from '@/lib/pakke';
import type { Paquete } from '@/lib/pakke';

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

    // Medidas reales de los productos del carrito. Los que aún no las tengan
    // capturadas entran con el paquete por defecto.
    const uuids = items.map((i) => i.uuid).filter(Boolean) as string[];
    const porUuid = new Map<string, Partial<Paquete>>();

    if (uuids.length > 0) {
      const filas = (await query(
        `SELECT uuid, package_length_cm, package_width_cm, package_height_cm, package_weight_kg
           FROM products
          WHERE uuid IN (${uuids.map(() => '?').join(',')})`,
        uuids
      )) as any[];

      for (const f of filas) {
        porUuid.set(String(f.uuid), {
          Length: Number(f.package_length_cm) || PAQUETE_POR_DEFECTO.Length,
          Width: Number(f.package_width_cm) || PAQUETE_POR_DEFECTO.Width,
          Height: Number(f.package_height_cm) || PAQUETE_POR_DEFECTO.Height,
          Weight: Number(f.package_weight_kg) || PAQUETE_POR_DEFECTO.Weight,
        });
      }
    }

    const paquete = armarPaquete(
      items.map((i) => ({
        cantidad: Number(i.cantidad ?? i.quantity ?? 1),
        paquete: i.uuid ? porUuid.get(i.uuid) : null,
      }))
    );

    // Cuántos productos van con medidas inventadas: sirve para avisar en el
    // admin que faltan datos, sin estorbar al comprador.
    const sinMedidas = uuids.filter((u) => !porUuid.has(u)).length;

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
