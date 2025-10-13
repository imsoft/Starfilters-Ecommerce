// Sistema de gestión del carrito de compras

export interface CartItem {
  uuid: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  color?: string;
  size?: string;
  category?: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

// Clave para localStorage
const CART_STORAGE_KEY = 'starfilters_cart';

// Obtener carrito desde localStorage
export const getCart = (): Cart => {
  if (typeof window === 'undefined') {
    return { items: [], total: 0, itemCount: 0 };
  }

  try {
    const cartData = localStorage.getItem(CART_STORAGE_KEY);
    if (cartData) {
      const cart = JSON.parse(cartData) as Cart;
      return {
        ...cart,
        total: calculateTotal(cart.items),
        itemCount: calculateItemCount(cart.items)
      };
    }
  } catch (error) {
    console.error('Error al leer carrito:', error);
  }

  return { items: [], total: 0, itemCount: 0 };
};

// Guardar carrito en localStorage
export const saveCart = (cart: Cart): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    
    // Disparar evento personalizado para actualizar UI
    window.dispatchEvent(new CustomEvent('cartUpdated', { 
      detail: cart 
    }));
  } catch (error) {
    console.error('Error al guardar carrito:', error);
  }
};

// Calcular total del carrito
export const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// Calcular cantidad total de items
export const calculateItemCount = (items: CartItem[]): number => {
  return items.reduce((count, item) => count + item.quantity, 0);
};

// Agregar producto al carrito
export const addToCart = (product: Omit<CartItem, 'quantity'>, quantity: number = 1): Cart => {
  const cart = getCart();
  
  // Buscar si el producto ya existe en el carrito
  const existingItemIndex = cart.items.findIndex(item => 
    item.uuid === product.uuid && 
    item.color === product.color && 
    item.size === product.size
  );

  if (existingItemIndex >= 0) {
    // Si existe, aumentar cantidad
    cart.items[existingItemIndex].quantity += quantity;
  } else {
    // Si no existe, agregar nuevo item
    cart.items.push({ ...product, quantity });
  }

  // Recalcular totales
  cart.total = calculateTotal(cart.items);
  cart.itemCount = calculateItemCount(cart.items);

  // Guardar en localStorage
  saveCart(cart);

  return cart;
};

// Remover producto del carrito
export const removeFromCart = (productUuid: string, color?: string, size?: string): Cart => {
  const cart = getCart();
  
  cart.items = cart.items.filter(item => 
    !(item.uuid === productUuid && item.color === color && item.size === size)
  );

  // Recalcular totales
  cart.total = calculateTotal(cart.items);
  cart.itemCount = calculateItemCount(cart.items);

  // Guardar en localStorage
  saveCart(cart);

  return cart;
};

// Actualizar cantidad de un producto
export const updateQuantity = (productUuid: string, quantity: number, color?: string, size?: string): Cart => {
  const cart = getCart();
  
  const itemIndex = cart.items.findIndex(item => 
    item.uuid === productUuid && item.color === color && item.size === size
  );

  if (itemIndex >= 0) {
    if (quantity <= 0) {
      // Si la cantidad es 0 o negativa, remover el item
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }
  }

  // Recalcular totales
  cart.total = calculateTotal(cart.items);
  cart.itemCount = calculateItemCount(cart.items);

  // Guardar en localStorage
  saveCart(cart);

  return cart;
};

// Limpiar carrito
export const clearCart = (): Cart => {
  const emptyCart: Cart = { items: [], total: 0, itemCount: 0 };
  saveCart(emptyCart);
  return emptyCart;
};

// Formatear precio en moneda mexicana
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(price);
};
