/**
 * Cliente de Pakke — cotización de envíos por paquetería.
 *
 * Hasta ahora "Envío por paquetería" era una tarifa fija de $350 sin relación
 * con el destino ni con el tamaño del paquete: un filtro voluminoso a Tijuana
 * costaba lo mismo que uno chico a Zapopan. Aquí se piden las tarifas reales.
 *
 * Documentación: https://docs.pakke.com (colección de Postman)
 *   Producción : https://seller.pakke.mx/api/v1
 *   Pruebas    : https://api-seller-sandbox.pakke.mx/api/v1
 *
 * El token va en el header `Authorization` TAL CUAL, sin el prefijo "Bearer",
 * y caduca si se regenera desde el perfil de Pakke.
 *
 * Este módulo es solo de servidor: la llave nunca debe llegar al navegador.
 * El checkout lo consume a través de /api/cotizar-envio.
 */

const BASE_PROD = 'https://seller.pakke.mx/api/v1';
const BASE_SANDBOX = 'https://api-seller-sandbox.pakke.mx/api/v1';

const getBaseUrl = () =>
  (import.meta.env.PAKKE_ENV ?? process.env.PAKKE_ENV) === 'production' ? BASE_PROD : BASE_SANDBOX;

const getToken = () => (import.meta.env.PAKKE_API_KEY ?? process.env.PAKKE_API_KEY ?? '').trim();

/** Código postal del almacén desde el que sale toda la mercancía (Zapopan). */
export const getZipCodeFrom = () =>
  (import.meta.env.PAKKE_ZIP_FROM ?? process.env.PAKKE_ZIP_FROM ?? '45019').trim();

/** true si hay llave configurada. Sin ella el checkout usa la tarifa fija. */
export const pakkeConfigurado = () => getToken().length > 0;

export interface Paquete {
  /** Centímetros */
  Length: number;
  Width: number;
  Height: number;
  /** Kilogramos */
  Weight: number;
}

/** Una opción de envío tal como la devuelve Pakke, ya normalizada. */
export interface OpcionEnvio {
  courierCode: string;
  courierName: string;
  serviceId: string;
  serviceName: string;
  /** Precio final CON IVA, en MXN. Solo informativo. */
  total: number;
  /**
   * Precio SIN IVA. Es el que usa el checkout: ahí el IVA se calcula sobre
   * (productos + envío), igual que con las tarifas fijas de $250/$350. Si se
   * usara `total`, que ya trae IVA, al comprador se le cobraría el 16% dos
   * veces sobre el envío.
   */
  subtotal: number;
  /** Texto listo para mostrar: "3-5 días hab." */
  diasTexto: string;
  diasEstimados: number | null;
  /** Pakke marca la opción más conveniente */
  mejorOpcion: boolean;
}

interface RespuestaRates {
  Pakke?: Array<Record<string, any>>;
}

/**
 * Paquete por defecto, para cuando un producto todavía no tiene capturadas sus
 * medidas. Sin esto la cotización fallaría y el cliente se quedaría sin poder
 * comprar; es preferible cotizar con una caja estándar y ajustar después.
 */
export const PAQUETE_POR_DEFECTO: Paquete = {
  Length: Number(import.meta.env.PAKKE_DEFAULT_LENGTH ?? process.env.PAKKE_DEFAULT_LENGTH ?? 60),
  Width: Number(import.meta.env.PAKKE_DEFAULT_WIDTH ?? process.env.PAKKE_DEFAULT_WIDTH ?? 60),
  Height: Number(import.meta.env.PAKKE_DEFAULT_HEIGHT ?? process.env.PAKKE_DEFAULT_HEIGHT ?? 30),
  Weight: Number(import.meta.env.PAKKE_DEFAULT_WEIGHT ?? process.env.PAKKE_DEFAULT_WEIGHT ?? 5),
};

/** Pakke rechaza medidas en cero; se aplica un mínimo de 1. */
const sanear = (p: Paquete): Paquete => ({
  Length: Math.max(1, Math.round(Number(p.Length) || PAQUETE_POR_DEFECTO.Length)),
  Width: Math.max(1, Math.round(Number(p.Width) || PAQUETE_POR_DEFECTO.Width)),
  Height: Math.max(1, Math.round(Number(p.Height) || PAQUETE_POR_DEFECTO.Height)),
  Weight: Math.max(1, Math.ceil(Number(p.Weight) || PAQUETE_POR_DEFECTO.Weight)),
});

const esCodigoPostalValido = (cp: string) => /^\d{5}$/.test(String(cp || '').trim());

/**
 * Cotiza un envío. Devuelve las opciones ordenadas de más barata a más cara.
 *
 * Nunca lanza: si Pakke falla, está caído o no hay llave, devuelve una lista
 * vacía para que el checkout caiga a la tarifa fija en vez de romperse.
 */
export const cotizarEnvio = async (
  zipCodeTo: string,
  paquete: Paquete,
  opciones: { valorAsegurado?: number; timeoutMs?: number } = {}
): Promise<OpcionEnvio[]> => {
  const token = getToken();
  if (!token) {
    console.warn('⚠️ PAKKE_API_KEY no configurada: no se cotiza.');
    return [];
  }
  if (!esCodigoPostalValido(zipCodeTo)) return [];

  const cuerpo = {
    ZipCodeFrom: getZipCodeFrom(),
    ZipCodeTo: String(zipCodeTo).trim(),
    Parcel: sanear(paquete),
    CouponCode: '',
    InsuredAmount: Math.max(0, Math.round(opciones.valorAsegurado ?? 0)),
  };

  const control = new AbortController();
  const timeout = setTimeout(() => control.abort(), opciones.timeoutMs ?? 12000);

  try {
    const res = await fetch(`${getBaseUrl()}/Shipments/rates`, {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
      signal: control.signal,
    });

    if (!res.ok) {
      console.error(`❌ Pakke /Shipments/rates respondió ${res.status}:`, (await res.text()).slice(0, 300));
      return [];
    }

    const datos = (await res.json()) as RespuestaRates;
    const crudas = Array.isArray(datos?.Pakke) ? datos.Pakke : [];

    return crudas
      .map((o) => ({
        courierCode: String(o.CourierCode ?? ''),
        courierName: String(o.CourierName ?? o.CourierCode ?? 'Paquetería'),
        serviceId: String(o.CourierServiceId ?? ''),
        serviceName: String(o.CourierServiceName ?? ''),
        total: Number(o.TotalPrice ?? o.ShipmentAmount ?? 0) || 0,
        subtotal:
          Number(o.ShipmentSubtotalAmount) ||
          // Si Pakke no desglosa, se despeja el IVA del total.
          Math.round(((Number(o.TotalPrice ?? o.ShipmentAmount ?? 0) || 0) / 1.16) * 100) / 100,
        diasTexto: String(o.DeliveryDays ?? ''),
        diasEstimados: Number(o.EstimatedDeliveryDays) || null,
        mejorOpcion: Boolean(o.BestOption),
      }))
      .filter((o) => o.subtotal > 0 && o.serviceId)
      .sort((a, b) => a.subtotal - b.subtotal);
  } catch (error: any) {
    const motivo = error?.name === 'AbortError' ? 'se agotó el tiempo de espera' : error?.message;
    console.error('❌ Error cotizando con Pakke:', motivo);
    return [];
  } finally {
    clearTimeout(timeout);
  }
};

/**
 * Suma los productos del carrito en un solo paquete.
 *
 * Es una aproximación deliberada: los pesos se suman, y de las medidas se toma
 * la mayor de cada eje salvo la altura, que se acumula porque los filtros se
 * estiban uno sobre otro. Pakke cobra por peso volumétrico, así que conviene
 * quedarse corto en el envío real, no en la cotización.
 */
export const armarPaquete = (
  items: Array<{ cantidad: number; paquete?: Partial<Paquete> | null }>
): Paquete => {
  let peso = 0;
  let largo = 0;
  let ancho = 0;
  let alto = 0;

  for (const item of items) {
    const cantidad = Math.max(1, Number(item.cantidad) || 1);
    const p = item.paquete || {};
    const L = Number(p.Length) || PAQUETE_POR_DEFECTO.Length;
    const W = Number(p.Width) || PAQUETE_POR_DEFECTO.Width;
    const H = Number(p.Height) || PAQUETE_POR_DEFECTO.Height;
    const P = Number(p.Weight) || PAQUETE_POR_DEFECTO.Weight;

    peso += P * cantidad;
    largo = Math.max(largo, L);
    ancho = Math.max(ancho, W);
    alto += H * cantidad;
  }

  // Las paqueterías rechazan bultos desproporcionados: 10 piezas de 30 cm
  // darían una caja de 3 metros y la cotización volvería vacía, dejando al
  // comprador con la tarifa fija. Pasado el tope se reparte el alto sobrante
  // a lo ancho, que es lo que se haría de verdad al empacar en varias cajas.
  const ALTO_MAXIMO_CM = 150;
  if (alto > ALTO_MAXIMO_CM) {
    const cajas = Math.ceil(alto / ALTO_MAXIMO_CM);
    alto = Math.ceil(alto / cajas);
    ancho = ancho * cajas;
  }

  return sanear({ Length: largo, Width: ancho, Height: alto, Weight: peso });
};

/**
 * Arma el paquete leyendo las medidas de cada producto en la base de datos.
 *
 * La usan las DOS rutas que cotizan: la que consulta el checkout mientras el
 * comprador elige, y la que recotiza el servidor al cobrar. Si cada una armara
 * el bulto por su cuenta, el precio mostrado y el cobrado podrían no coincidir.
 *
 * Solo servidor: importa la base de datos.
 */
export const armarPaqueteDesdeBD = async (
  items: Array<{ uuid?: string | null; cantidad: number }>
): Promise<{ paquete: Paquete; sinMedidas: number }> => {
  const { query } = await import('@/config/database');
  const { ensureProductColumns } = await import('@/lib/product-service');
  await ensureProductColumns();

  const uuids = items.map((i) => i.uuid).filter(Boolean) as string[];
  const porUuid = new Map<string, Partial<Paquete>>();

  // Una medida del carrito llega como "variant-N": no es un uuid de products,
  // así que antes no encontraba medidas de caja y cotizaba con el bulto por
  // defecto. Las medidas viven en el producto al que pertenece la variante.
  const deProducto = uuids.filter((u) => !u.startsWith('variant-'));
  const deVariante = uuids
    .filter((u) => u.startsWith('variant-'))
    .map((u) => ({ uuid: u, id: Number(u.replace('variant-', '')) }))
    .filter((v) => Number.isFinite(v.id));

  const filas: any[] = [];
  if (deProducto.length > 0) {
    filas.push(...((await query(
      `SELECT uuid, package_length_cm, package_width_cm, package_height_cm, package_weight_kg
         FROM products
        WHERE uuid IN (${deProducto.map(() => '?').join(',')})`,
      deProducto
    )) as any[]));
  }
  if (deVariante.length > 0) {
    const porVariante = (await query(
      `SELECT CONCAT('variant-', fcv.id) AS uuid,
              p.package_length_cm, p.package_width_cm, p.package_height_cm, p.package_weight_kg
         FROM filter_category_variants fcv
         JOIN products p ON p.id = fcv.product_id
        WHERE fcv.id IN (${deVariante.map(() => '?').join(',')})`,
      deVariante.map((v) => v.id)
    )) as any[];
    filas.push(...porVariante);
  }

  if (filas.length > 0) {
    for (const f of filas) {
      // Solo cuenta como "con medidas" si trae al menos el peso: una fila con
      // las cuatro columnas vacías equivale a no tener nada capturado.
      const tieneAlgo =
        Number(f.package_weight_kg) > 0 ||
        Number(f.package_length_cm) > 0 ||
        Number(f.package_width_cm) > 0 ||
        Number(f.package_height_cm) > 0;
      if (!tieneAlgo) continue;

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
      cantidad: i.cantidad,
      paquete: i.uuid ? porUuid.get(i.uuid) : null,
    }))
  );

  return { paquete, sinMedidas: uuids.filter((u) => !porUuid.has(u)).length };
};
