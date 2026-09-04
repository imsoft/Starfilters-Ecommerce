/**
 * Desglose de un pedido: subtotal, descuento, envío e IVA.
 *
 * Los pedidos nuevos lo traen guardado (subtotal_amount, discount_amount,
 * shipping_amount, tax_amount). Los anteriores a esas columnas solo tienen el
 * total, y la página decía "este pedido es anterior al desglose": el cliente
 * veía un producto de $101 y un total de $287 sin nada en medio.
 *
 * Pero el cobro siempre siguió la misma regla —IVA del 16 % sobre mercancía
 * más envío—, así que a partir del total se recupera el envío exacto:
 *
 *   total = (subtotal − descuento + envío) × 1.16
 *   envío = total ÷ 1.16 − (subtotal − descuento)
 *
 * Para un pedido de $101.00 con total $287.29: 287.29 ÷ 1.16 = 247.66, menos
 * 101.00 = $146.66 de envío (la tarifa real que se cotizó) y $39.63 de IVA.
 * Cuadra al centavo y es lo mismo que el comprador vio al pagar.
 */

export interface Desglose {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  /** 'guardado' si venía en la orden; 'reconstruido' si se calculó del total. */
  origen: 'guardado' | 'reconstruido';
}

export const IVA = 0.16;

const aCentavos = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;
const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export interface EntradaDesglose {
  /** Suma de los renglones: precio × cantidad, en la moneda del pedido. */
  subtotalRenglones: number;
  /** Total cobrado. */
  total: unknown;
  /** Columnas guardadas en la orden (pueden venir null o como texto). */
  guardado?: {
    subtotal?: unknown;
    discount?: unknown;
    shipping?: unknown;
    tax?: unknown;
  } | null;
  /** Descuento registrado en discount_code_usage, si la orden no lo guardó. */
  descuentoRegistrado?: number | null;
}

/**
 * Devuelve el desglose guardado o, si no existe, el reconstruido desde el
 * total. Devuelve null solo cuando los números no cierran (el total es menor
 * que la mercancía, por ejemplo): ahí es mejor no inventar renglones.
 */
export const desgloseDeOrden = (e: EntradaDesglose): Desglose | null => {
  const total = num(e.total);
  if (total === null) return null;

  const guardadoSubtotal = num(e.guardado?.subtotal);
  if (guardadoSubtotal !== null) {
    return {
      subtotal: guardadoSubtotal,
      discount: num(e.guardado?.discount) ?? 0,
      shipping: num(e.guardado?.shipping) ?? 0,
      tax: num(e.guardado?.tax) ?? 0,
      total,
      origen: 'guardado',
    };
  }

  const subtotal = aCentavos(e.subtotalRenglones);
  const discount = aCentavos(Math.max(0, e.descuentoRegistrado ?? 0));
  const neto = aCentavos(subtotal - discount);
  const base = aCentavos(total / (1 + IVA));
  let shipping = aCentavos(base - neto);

  // Un centavo de redondeo no es envío; una diferencia negativa real
  // significa que los datos no son de fiar.
  if (shipping < 0) {
    if (shipping > -0.03) shipping = 0;
    else return null;
  }
  const tax = aCentavos(total - neto - shipping);
  if (tax < 0) return null;

  return { subtotal, discount, shipping, tax, total, origen: 'reconstruido' };
};
