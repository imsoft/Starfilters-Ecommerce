import { createPaymentIntent } from './stripe';
import { getCart } from './cart';
import type { CartItem } from './cart';
import { getExchangeRate } from './currency-service';

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
}

// Interface para datos de descuento
export interface DiscountData {
  code: string;
  discountCodeId: number;
  amount: number;
}

// Interface para datos de envío
export interface ShippingData {
  method: 'standard' | 'express';
  cost: number;
  days: string;
}

// Calcular costos de envío
export const calculateShipping = (method: 'standard' | 'express'): ShippingData => {
  const shippingOptions = {
    standard: { cost: 5.00, days: '4-10 días hábiles' },
    express: { cost: 16.00, days: '2-5 días hábiles' }
  };
  
  return {
    method,
    ...shippingOptions[method]
  };
};

// Calcular impuestos (IVA 16% en México)
export const calculateTax = (subtotal: number): number => {
  return subtotal * 0.16; // 16% IVA
};

// Calcular total del pedido (convierte USD a MXN automáticamente)
export const calculateOrderTotal = async (
  cartItems: CartItem[],
  shippingMethod: 'standard' | 'express',
  discountAmount: number = 0
): Promise<{
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  exchangeRate?: number;
}> => {
  // Obtener tasa de cambio si hay productos en USD
  const hasUSDItems = cartItems.some(item => item.currency === 'USD');
  let exchangeRate: number | undefined;

  if (hasUSDItems) {
    exchangeRate = await getExchangeRate();
    console.log(`💱 Tasa de cambio obtenida: ${exchangeRate} MXN por USD`);
  }

  // Calcular subtotal convirtiendo USD a MXN si es necesario
  const subtotal = cartItems.reduce((sum, item) => {
    let priceInMXN = item.price;
    if (item.currency === 'USD' && exchangeRate) {
      priceInMXN = item.price * exchangeRate;
      console.log(`💱 Convertido: ${item.name} - $${item.price} USD = $${priceInMXN.toFixed(2)} MXN`);
    }
    return sum + (priceInMXN * item.quantity);
  }, 0);

  const discount = discountAmount;
  const subtotalAfterDiscount = Math.max(0, subtotal - discount);
  const shipping = calculateShipping(shippingMethod).cost;
  const tax = calculateTax(subtotalAfterDiscount);
  const total = subtotalAfterDiscount + shipping + tax;

  return {
    subtotal,
    discount,
    shipping,
    tax,
    total,
    exchangeRate
  };
};

// Crear Payment Intent para el checkout
export const createCheckoutPaymentIntent = async (
  checkoutData: CheckoutData,
  shippingMethod: 'standard' | 'express' = 'standard',
  userId?: number,
  discountData?: DiscountData,
  cartItems?: CartItem[] // Items del carrito pasados como parámetro
): Promise<{ client_secret: string; payment_intent_id: string; order_total: number }> => {
  try {
    // Obtener items del carrito: primero del parámetro, luego de getCart() como fallback
    let items: CartItem[] = [];
    
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

    // Calcular totales con descuento si existe (convierte USD a MXN automáticamente)
    const discountAmount = discountData?.amount || 0;
    const orderTotals = await calculateOrderTotal(items, shippingMethod, discountAmount);

    // Serializar items del carrito para el metadata
    const cartItemsJSON = JSON.stringify(
      items.map(item => ({
        product_id: item.product_id,
        uuid: item.uuid,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        currency: item.currency,
        image_url: item.image_url,
        size: item.size
      }))
    );

    // Crear metadata para el Payment Intent
    const metadata: Record<string, string> = {
      customer_email: checkoutData.email,
      customer_name: `${checkoutData.firstName} ${checkoutData.lastName}`,
      shipping_address: `${checkoutData.address}, ${checkoutData.city}, ${checkoutData.state} ${checkoutData.postalCode}, ${checkoutData.country}`,
      shipping_method: shippingMethod,
      items_count: items.length.toString(),
      subtotal: orderTotals.subtotal.toFixed(2),
      shipping_cost: orderTotals.shipping.toFixed(2),
      tax_amount: orderTotals.tax.toFixed(2),
      cart_items: cartItemsJSON,
    };

    // Agregar campos opcionales
    if (userId) {
      metadata.user_id = userId.toString();
    }
    if (discountData) {
      metadata.discount_code = discountData.code;
      metadata.discount_code_id = discountData.discountCodeId.toString();
      metadata.discount_amount = discountData.amount.toString();
    }
    if (orderTotals.exchangeRate) {
      metadata.exchange_rate = orderTotals.exchangeRate.toFixed(4);
      metadata.currency_note = 'Precios en USD fueron convertidos a MXN';
    }

    // Siempre cobrar en MXN (los precios USD ya fueron convertidos)
    const stripeCurrency = 'mxn' as const;

    // Crear Payment Intent en MXN
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

    return {
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
  shippingMethod: 'standard' | 'express' = 'standard',
  discountAmount: number = 0
) => {
  const orderTotals = await calculateOrderTotal(cartItems, shippingMethod, discountAmount);
  const shippingData = calculateShipping(shippingMethod);

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
