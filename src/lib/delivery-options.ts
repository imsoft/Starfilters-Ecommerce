/**
 * Fuente única de los métodos de entrega: etiquetas, tiempos y costos.
 *
 * Antes estos datos vivían por triplicado (checkout ES, checkout EN y
 * payment-utils.ts) y ya se habían desincronizado: el checkout anunciaba
 * "Máximo 8 días hábiles" para zona metropolitana CDMX mientras el correo de
 * confirmación decía "1-3 días hábiles".
 *
 * Este módulo NO debe importar Stripe, la base de datos ni nada del servidor:
 * el <script> del checkout lo carga en el navegador y cualquier dependencia de
 * servidor terminaría en el bundle del cliente.
 *
 * Todo el inventario sale del almacén de Guadalajara, así que cualquier destino
 * en CDMX (recolección o entrega) tarda de 8 a 9 días hábiles.
 */

export type DeliveryMethod =
  | 'standard'
  | 'express'
  | 'pickup-gdl'
  | 'pickup-cdmx'
  | 'metro-gdl'
  | 'metro-cdmx'
  | 'paqueteria';

/** Umbral de envío gratis (MXN). Solo aplica a las entregas metropolitanas. */
export const FREE_SHIPPING_THRESHOLD = 5000;

export interface DeliveryOption {
  value: DeliveryMethod;
  /** Nombre visible de la opción. */
  label: { es: string; en: string };
  /** Tiempo de entrega que se muestra en el checkout y se guarda en el pedido. */
  days: { es: string; en: string };
  /** Costo en MXN antes de aplicar el umbral de envío gratis. */
  cost: number;
  /** Si el costo se vuelve 0 al superar FREE_SHIPPING_THRESHOLD. */
  freeOverThreshold: boolean;
  /** true cuando el cliente recoge y no hace falta pedirle dirección. */
  isPickup: boolean;
  /** Dirección de la sucursal, solo para las opciones de recolección. */
  address?: { text: string; mapUrl: string };
  /** Aclaración secundaria bajo el tiempo de entrega. */
  note?: { es: string; en: string };
}

export const DELIVERY_OPTIONS: DeliveryOption[] = [
  {
    value: 'pickup-gdl',
    label: { es: 'Recoger en Guadalajara', en: 'Pick up in Guadalajara' },
    days: { es: 'Siguiente día a partir de las 11am', en: 'Next day from 11am' },
    cost: 0,
    freeOverThreshold: false,
    isPickup: true,
    address: {
      text: 'Cto. San Eduardo 88-Int. 4, San Juan de Ocotán, 45019 Zapopan, Jal.',
      mapUrl: 'https://maps.app.goo.gl/KKZgepi4V65VYg8E9',
    },
  },
  {
    value: 'pickup-cdmx',
    label: { es: 'Recoger en Ciudad de México', en: 'Pick up in Mexico City' },
    days: { es: 'De 8 a 9 días hábiles', en: '8 to 9 business days' },
    cost: 0,
    freeOverThreshold: false,
    isPickup: true,
    address: {
      text: 'Ventura G.Tena 250, Asturias, Cuauhtémoc, 06890 Ciudad de México, CDMX',
      mapUrl: 'https://maps.app.goo.gl/EUg7SsAdrbB5FLUL6',
    },
  },
  {
    value: 'metro-gdl',
    label: { es: 'Entrega zona metropolitana GDL', en: 'GDL Metro Area Delivery' },
    days: { es: 'Máximo 2 días hábiles', en: 'Up to 2 business days' },
    cost: 250,
    freeOverThreshold: true,
    isPickup: false,
    note: {
      es: 'Gratis en compras de $5,000 MXN o más',
      en: 'Free on orders of $5,000 MXN or more',
    },
  },
  {
    value: 'metro-cdmx',
    label: { es: 'Entrega zona metropolitana CDMX', en: 'CDMX Metro Area Delivery' },
    days: { es: 'De 8 a 9 días hábiles', en: '8 to 9 business days' },
    cost: 250,
    freeOverThreshold: true,
    isPickup: false,
    note: {
      es: 'Gratis en compras de $5,000 MXN o más',
      en: 'Free on orders of $5,000 MXN or more',
    },
  },
  {
    value: 'paqueteria',
    label: { es: 'Envío por paquetería', en: 'Carrier Shipping' },
    days: {
      es: 'Tiempo según paquetería seleccionada',
      en: 'Delivery time depends on carrier',
    },
    // El envío nacional NUNCA es gratis: el umbral solo aplica a zona metropolitana.
    cost: 350,
    freeOverThreshold: false,
    isPickup: false,
  },
];

const OPTIONS_BY_VALUE = new Map(DELIVERY_OPTIONS.map((o) => [o.value, o]));

export function getDeliveryOption(method: DeliveryMethod): DeliveryOption | undefined {
  return OPTIONS_BY_VALUE.get(method);
}

/** Costo de envío en MXN según el método y el subtotal del carrito. */
export function getShippingCost(method: DeliveryMethod, subtotalMXN = 0): number {
  const option = OPTIONS_BY_VALUE.get(method);
  if (!option) return 0;
  if (option.freeOverThreshold && subtotalMXN >= FREE_SHIPPING_THRESHOLD) return 0;
  return option.cost;
}

/** Tiempo de entrega que se muestra al cliente y se guarda en el pedido. */
export function getDeliveryDays(method: DeliveryMethod, lang: 'es' | 'en' = 'es'): string {
  return OPTIONS_BY_VALUE.get(method)?.days[lang] ?? '';
}

/** Nombre visible del método de entrega. */
export function getDeliveryLabel(method: DeliveryMethod, lang: 'es' | 'en' = 'es'): string {
  return OPTIONS_BY_VALUE.get(method)?.label[lang] ?? '';
}

/** true si el método es de recolección en sucursal (no requiere dirección). */
export function isPickupMethod(method: DeliveryMethod): boolean {
  return OPTIONS_BY_VALUE.get(method)?.isPickup ?? false;
}
