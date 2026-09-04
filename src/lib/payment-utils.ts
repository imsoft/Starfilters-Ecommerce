import { createPaymentIntent } from './stripe';
import { getShippingCost, getDeliveryDays } from './delivery-options';
import type { DeliveryMethod } from './delivery-options';
import { getCart } from './cart';
import type { CartItem } from './cart';
import { getExchangeRate } from './currency-service';
import { createCheckoutDraft, attachPaymentIntentToDraft } from './checkout-drafts';
import type { DraftItem } from './checkout-drafts';

// Datos fiscales para la factura. TODOS son opcionales: el cliente puede
// comprar sin facturar, y si pide factura el admin recibe lo que haya
// capturado (nada aquí bloquea el pago).
export interface BillingData {
  businessName?: string;   // Razón social
  rfc?: string;
  taxRegime?: string;      // Régimen fiscal
  cfdiUse?: string;        // Uso de CFDI
  postalCode?: string;     // CP del domicilio fiscal
  email?: string;          // Correo al que enviar la factura
}

// Interface para datos del checkout
export interface CheckoutData {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  company?: string;
  apartment?: string;
  billing?: BillingData | null;
  // Idioma en el que se hizo la compra. El webhook corre después del pago y no
  // sabe de qué página vino, así que el idioma tiene que viajar con el pedido.
  lang?: 'es' | 'en';
}

// Interface para datos de descuento
export interface DiscountData {
  code: string;
  discountCodeId: number;
  amount: number;
}

// Los métodos de entrega, sus tiempos y sus costos viven en delivery-options.ts
// (fuente única compartida con el checkout ES/EN).
export type { DeliveryMethod };

// Interface para datos de envío
export interface ShippingData {
  method: DeliveryMethod;
  cost: number;
  days: string;
}

// Calcular costos de envío
export const calculateShipping = (method: DeliveryMethod, subtotalMXN: number = 0): ShippingData => ({
  method,
  cost: getShippingCost(method, subtotalMXN),
  days: getDeliveryDays(method),
});

// Calcular impuestos (IVA 16% en México)
export const calculateTax = (subtotal: number): number => {
  return subtotal * 0.16; // 16% IVA
};

/** Redondea a centavos evitando el error binario (1.005 → 1.01, no 1.00). */
export const aCentavos = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Calcular el total del pedido en la moneda en la que se va a cobrar.
 *
 * Las tarifas de envío y el umbral de envío gratis están definidos en pesos
 * (son las tarifas reales de las paqueterías), así que para un cobro en
 * dólares se convierten con la tasa del día. Así hay una sola fuente de
 * verdad y no dos listas de precios que mantener.
 */
export const calculateOrderTotal = async (
  cartItems: CartItem[],
  shippingMethod: DeliveryMethod,
  discountAmount: number = 0,
  targetCurrency: 'MXN' | 'USD' = 'MXN',
  /**
   * Tarifa de envío en MXN y SIN IVA que ya cotizó el servidor con Pakke.
   * Solo aplica a 'paqueteria': ahí el precio depende del destino y del bulto,
   * así que la tarifa fija no sirve. Nunca se toma del navegador —el servidor
   * vuelve a cotizar— porque si no, cualquiera podría pedir envío en cero.
   */
  shippingOverrideMXN?: number | null
): Promise<{
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  exchangeRate?: number;
}> => {
  // Hace falta la tasa si hay que convertir algo: productos en otra moneda o
  // un cobro en dólares (las tarifas de envío están en pesos).
  const hasUSDItems = cartItems.some(item => item.currency === 'USD');
  const exchangeRate = (hasUSDItems || targetCurrency === 'USD')
    ? await getExchangeRate()
    : undefined;

  /** Lleva un importe a la moneda de cobro */
  const convertir = (monto: number, monedaOrigen: 'MXN' | 'USD'): number => {
    if (monedaOrigen === targetCurrency) return monto;
    if (!exchangeRate) return monto;
    return monedaOrigen === 'USD' ? monto * exchangeRate : monto / exchangeRate;
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const moneda = item.currency === 'USD' ? 'USD' : 'MXN';
    return sum + convertir(item.price, moneda) * item.quantity;
  }, 0);

  const discount = discountAmount;
  const subtotalAfterDiscount = Math.max(0, subtotal - discount);

  // El envío se decide en pesos (tarifas reales) y se convierte si hace falta
  const subtotalEnMXN = targetCurrency === 'MXN'
    ? subtotalAfterDiscount
    : subtotalAfterDiscount * (exchangeRate || 1);
  const shippingMXN =
    shippingMethod === 'paqueteria' && typeof shippingOverrideMXN === 'number' && shippingOverrideMXN >= 0
      ? shippingOverrideMXN
      : calculateShipping(shippingMethod, subtotalEnMXN).cost;
  const shipping = convertir(shippingMXN, 'MXN');

  // Todo a centavos ANTES de sumar. Si no, el IVA sale con seis decimales,
  // Stripe redondea el total por su cuenta y los renglones que ve el cliente
  // (subtotal + envío + IVA) no suman lo que se le cobró, a veces por un
  // centavo. Cada importe se redondea por separado y el total es la suma de
  // los importes ya redondeados: así siempre cuadra a la vista.
  const subtotalR = aCentavos(subtotal);
  const discountR = aCentavos(discount);
  const subtotalAfterDiscountR = Math.max(0, aCentavos(subtotalR - discountR));
  const shippingR = aCentavos(shipping);
  // El flete es un servicio gravado: el IVA se calcula sobre mercancía + envío.
  const taxR = aCentavos(calculateTax(subtotalAfterDiscountR + shippingR));
  const totalR = aCentavos(subtotalAfterDiscountR + shippingR + taxR);

  return {
    subtotal: subtotalR,
    discount: discountR,
    shipping: shippingR,
    tax: taxR,
    total: totalR,
    exchangeRate
  };
};

// Item de carrito con datos ya resueltos en el servidor (precio de BD,
// variante y destino BIND). El precio del cliente NUNCA se usa para cobrar.
export interface ResolvedCartItem extends CartItem {
  variant_id?: number | null;
  bind_target?: string | null;
  // Producto real al que pertenece una variante ("variant-N"): su product_id
  // es el id de la variante, que no sirve para enlazar la orden al producto.
  parent_product_id?: number | null;
}

// Crear Payment Intent para el checkout
export const createCheckoutPaymentIntent = async (
  checkoutData: CheckoutData,
  shippingMethod: DeliveryMethod = 'pickup-gdl',
  userId?: number,
  discountData?: DiscountData,
  cartItems?: ResolvedCartItem[], // Items con precios resueltos en el servidor
  // Moneda del cobro: la decide el idioma del sitio (español MXN, inglés USD)
  chargeCurrency: 'MXN' | 'USD' = 'MXN',
  /** Tarifa de paquetería en MXN sin IVA, ya cotizada por el servidor. */
  shippingOverrideMXN?: number | null
): Promise<{ client_secret: string; payment_intent_id: string; order_total: number; currency: 'MXN' | 'USD' }> => {
  try {
    // Obtener items del carrito: primero del parámetro, luego de getCart() como fallback
    let items: ResolvedCartItem[] = [];

    if (cartItems && cartItems.length > 0) {
      items = cartItems;
    } else {
      // Fallback: intentar obtener del localStorage (solo funciona en cliente)
      const cart = getCart();
      items = cart.items;
    }

    if (items.length === 0) {
      throw new Error('El carrito está vacío');
    }

    // Totales ya en la moneda del cobro
    const discountAmount = discountData?.amount || 0;
    const orderTotals = await calculateOrderTotal(items, shippingMethod, discountAmount, chargeCurrency, shippingOverrideMXN);

    // Guardar el carrito completo como borrador en la BD. El metadata de
    // Stripe limita cada valor a 500 caracteres, así que el carrito
    // serializado no cabe ahí (2+ items superan el límite y Stripe rechaza
    // el Payment Intent); el webhook lo recupera por draft_uuid.
    const tasa = orderTotals.exchangeRate;
    const redondear = (n: number) => Math.round(n * 100) / 100;

    const draftItems: DraftItem[] = items.map(item => {
      const monedaItem = item.currency === 'USD' ? 'USD' : 'MXN';
      const priceMXN = monedaItem === 'USD' && tasa
        ? redondear(item.price * tasa)
        : item.price;
      // Precio unitario en la moneda del cobro: con él los renglones de la
      // orden cuadran con el total que se cobró
      let priceCharge = item.price;
      if (monedaItem !== chargeCurrency && tasa) {
        priceCharge = monedaItem === 'USD'
          ? redondear(item.price * tasa)
          : redondear(item.price / tasa);
      }
      return {
        product_id: item.product_id,
        uuid: item.uuid,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        currency: item.currency || 'MXN',
        price_mxn: priceMXN,
        price_charge: priceCharge,
        charge_currency: chargeCurrency,
        image_url: item.image_url || null,
        size: item.size || null,
        variant_id: item.variant_id ?? null,
        bind_target: item.bind_target ?? null,
        parent_product_id: item.parent_product_id ?? null,
      };
    });

    const draft = await createCheckoutDraft({
      checkout: checkoutData,
      shippingMethod,
      items: draftItems,
      totals: orderTotals,
      discount: discountData
        ? { code: discountData.code, discountCodeId: discountData.discountCodeId, amount: discountData.amount }
        : null,
    }, userId);

    // Metadata mínimo: referencia al borrador + datos cortos de contexto
    const metadata: Record<string, string> = {
      draft_uuid: draft.uuid,
      customer_email: checkoutData.email,
      customer_name: `${checkoutData.firstName} ${checkoutData.lastName}`,
      shipping_method: shippingMethod,
      items_count: items.length.toString(),
      currency: chargeCurrency,
    };
    if (userId) {
      metadata.user_id = userId.toString();
    }
    if (discountData) {
      metadata.discount_code = discountData.code;
    }

    const stripeCurrency = chargeCurrency.toLowerCase() as 'mxn' | 'usd';

    // Crear Payment Intent en la moneda elegida
    const paymentIntent = await createPaymentIntent({
      amount: orderTotals.total,
      currency: stripeCurrency,
      metadata,
      customer_email: checkoutData.email,
      customer_name: `${checkoutData.firstName} ${checkoutData.lastName}`,
    });

    if (!paymentIntent.client_secret) {
      throw new Error('Stripe no devolvió client_secret en el Payment Intent');
    }

    await attachPaymentIntentToDraft(draft.uuid, paymentIntent.payment_intent_id);

    return {
      currency: chargeCurrency,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.payment_intent_id,
      order_total: orderTotals.total,
    };
  } catch (error) {
    console.error('❌ Error creating checkout payment intent:', error);
    
    // Si es un error de Stripe, incluir más detalles
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as any;
      console.error('Stripe error type:', stripeError.type);
      console.error('Stripe error message:', stripeError.message);
      console.error('Stripe error code:', stripeError.code);
      throw new Error(`Error de Stripe: ${stripeError.message || 'Error desconocido'}`);
    }
    
    // Re-lanzar el error original si es una instancia de Error
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error(error instanceof Error ? error.message : 'Error al crear el intento de pago');
  }
};

// Validar datos del checkout
export const validateCheckoutData = (data: CheckoutData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errors.push('Email inválido');
  }

  // Validar nombres
  if (!data.firstName || data.firstName.trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  }

  if (!data.lastName || data.lastName.trim().length < 2) {
    errors.push('El apellido debe tener al menos 2 caracteres');
  }

  // Validar dirección
  if (!data.address || data.address.trim().length < 5) {
    errors.push('La dirección debe tener al menos 5 caracteres');
  }

  if (!data.city || data.city.trim().length < 2) {
    errors.push('La ciudad es requerida');
  }

  if (!data.state || data.state.trim().length < 2) {
    errors.push('El estado es requerido');
  }

  if (!data.postalCode || data.postalCode.trim().length < 4) {
    errors.push('El código postal es requerido');
  }

  if (!data.country || data.country.trim().length < 2) {
    errors.push('El país es requerido');
  }

  // Validar teléfono si se proporciona
  if (data.phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(data.phone.replace(/\s/g, ''))) {
      errors.push('Número de teléfono inválido');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Formatear datos del carrito para mostrar en el checkout
export const formatCartForCheckout = (cartItems: CartItem[]) => {
  return cartItems.map(item => ({
    uuid: item.uuid,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image_url: item.image_url,
    color: item.color,
    size: item.size,
    category: item.category,
    subtotal: item.price * item.quantity,
  }));
};

// Generar resumen del pedido
export const generateOrderSummary = async (
  cartItems: CartItem[],
  shippingMethod: DeliveryMethod = 'pickup-gdl',
  discountAmount: number = 0
) => {
  const orderTotals = await calculateOrderTotal(cartItems, shippingMethod, discountAmount);
  const shippingData = calculateShipping(shippingMethod, orderTotals.subtotal - orderTotals.discount);

  return {
    items: formatCartForCheckout(cartItems),
    subtotal: orderTotals.subtotal,
    discount: orderTotals.discount,
    shipping: {
      method: shippingData.method,
      cost: shippingData.cost,
      days: shippingData.days,
    },
    tax: orderTotals.tax,
    total: orderTotals.total,
    currency: 'MXN', // Siempre MXN (USD se convierte)
    exchangeRate: orderTotals.exchangeRate,
  };
};
