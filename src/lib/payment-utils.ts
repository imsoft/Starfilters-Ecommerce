import { createPaymentIntent, formatPriceForStripe, STRIPE_CONFIG } from './stripe';
import { getCart } from './cart';
import type { CartItem } from './cart';

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

// Calcular total del pedido
export const calculateOrderTotal = (
  cartItems: CartItem[],
  shippingMethod: 'standard' | 'express'
): {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
} => {
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = calculateShipping(shippingMethod).cost;
  const tax = calculateTax(subtotal);
  const total = subtotal + shipping + tax;

  return {
    subtotal,
    shipping,
    tax,
    total
  };
};

// Crear Payment Intent para el checkout
export const createCheckoutPaymentIntent = async (
  checkoutData: CheckoutData,
  shippingMethod: 'standard' | 'express' = 'standard'
): Promise<{ client_secret: string; payment_intent_id: string; order_total: number }> => {
  try {
    // Obtener carrito actual
    const cart = getCart();
    
    if (cart.items.length === 0) {
      throw new Error('El carrito está vacío');
    }

    // Calcular totales
    const orderTotals = calculateOrderTotal(cart.items, shippingMethod);

    // Crear metadata para el Payment Intent
    const metadata = {
      customer_email: checkoutData.email,
      customer_name: `${checkoutData.firstName} ${checkoutData.lastName}`,
      shipping_address: `${checkoutData.address}, ${checkoutData.city}, ${checkoutData.state} ${checkoutData.postalCode}, ${checkoutData.country}`,
      shipping_method: shippingMethod,
      items_count: cart.items.length.toString(),
      subtotal: orderTotals.subtotal.toString(),
      shipping_cost: orderTotals.shipping.toString(),
      tax_amount: orderTotals.tax.toString(),
    };

    // Crear Payment Intent
    const paymentIntent = await createPaymentIntent({
      amount: orderTotals.total,
      currency: STRIPE_CONFIG.currency,
      metadata,
      customer_email: checkoutData.email,
      customer_name: `${checkoutData.firstName} ${checkoutData.lastName}`,
    });

    return {
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.payment_intent_id,
      order_total: orderTotals.total,
    };
  } catch (error) {
    console.error('Error creating checkout payment intent:', error);
    throw new Error('Error al crear el intento de pago');
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
export const generateOrderSummary = (
  cartItems: CartItem[],
  shippingMethod: 'standard' | 'express' = 'standard'
) => {
  const orderTotals = calculateOrderTotal(cartItems, shippingMethod);
  const shippingData = calculateShipping(shippingMethod);
  
  return {
    items: formatCartForCheckout(cartItems),
    subtotal: orderTotals.subtotal,
    shipping: {
      method: shippingData.method,
      cost: shippingData.cost,
      days: shippingData.days,
    },
    tax: orderTotals.tax,
    total: orderTotals.total,
    currency: STRIPE_CONFIG.currency,
  };
};
