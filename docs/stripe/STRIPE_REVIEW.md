# Revisión de Implementación de Stripe

## ✅ Aspectos Positivos

### 1. **Configuración Básica Correcta**
- ✅ Instalación correcta del SDK de Stripe
- ✅ Variables de entorno configuradas (`.env.example`)
- ✅ Uso de Payment Intents (recomendado por Stripe)
- ✅ Implementación de PaymentElement
- ✅ Manejo de webhooks

### 2. **Estructura del Código**
- ✅ Separación de responsabilidades (stripe.ts, payment-utils.ts)
- ✅ Funciones utilitarias para manejo de precios
- ✅ Manejo de errores básico

### 3. **Seguridad**
- ✅ Verificación de webhooks implementada
- ✅ Uso de client_secret correctamente
- ✅ Autenticación requerida para crear payment intents

## ⚠️ Problemas Críticos Encontrados

### 1. **Webhook NO Guarda Órdenes en la Base de Datos** 🚨

**Problema:** El webhook actualmente solo loguea el evento pero NO guarda la orden en la base de datos.

**Archivo:** `src/pages/api/stripe-webhook.ts`

**Código actual:**
```typescript
async function handlePaymentSucceeded(paymentIntent: any) {
  try {
    console.log('Payment succeeded:', paymentIntent.id);
    
    // TODO: Implementar lógica de guardado de orden
    // await saveOrderToDatabase(paymentIntent);
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}
```

**Impacto:** 
- Los pagos se procesan correctamente en Stripe
- Pero NO se crean registros en la tabla `orders` de la base de datos
- Los usuarios NO pueden ver sus órdenes en "Mis Pedidos"
- No hay historial de ventas para el administrador

**Solución Necesaria:**
```typescript
async function handlePaymentSucceeded(paymentIntent: any) {
  try {
    const metadata = paymentIntent.metadata;
    
    // 1. Crear la orden
    const orderId = await createOrder({
      order_number: `ORD-${Date.now()}`,
      customer_name: metadata.customer_name,
      customer_email: metadata.customer_email,
      total_amount: paymentIntent.amount / 100, // Convertir de centavos
      status: 'processing',
      shipping_address: metadata.shipping_address,
      user_id: metadata.user_id ? parseInt(metadata.user_id) : null
    });
    
    // 2. Guardar items de la orden (necesitas los items del metadata)
    // 3. Actualizar inventario
    // 4. Enviar email de confirmación
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}
```

### 2. **Metadata Incompleta en Payment Intent** 🚨

**Problema:** No se está pasando el `user_id` ni los items del carrito al metadata del Payment Intent.

**Archivo:** `src/lib/payment-utils.ts` línea 74

**Código actual:**
```typescript
const metadata = {
  customer_email: checkoutData.email,
  customer_name: `${checkoutData.firstName} ${checkoutData.lastName}`,
  shipping_address: `${checkoutData.address}, ${checkoutData.city}...`,
  shipping_method: shippingMethod,
  items_count: cart.items.length.toString(),
  // FALTA: user_id
  // FALTA: items del carrito
};
```

**Impacto:** El webhook no puede asociar la orden con el usuario ni recrear los items.

**Solución:**
```typescript
// Serializar items del carrito
const cartItemsJSON = JSON.stringify(
  cart.items.map(item => ({
    product_id: item.product_id, // Necesitas agregar esto al CartItem
    quantity: item.quantity,
    price: item.price,
    name: item.name
  }))
);

const metadata = {
  // ... existente ...
  user_id: user.id.toString(), // Agregar user_id
  cart_items: cartItemsJSON, // Serializar items
};
```

### 3. **No Hay Actualización de Inventario** ⚠️

**Problema:** Después de un pago exitoso, no se actualiza el stock de los productos.

**Solución requerida:**
```typescript
// En handlePaymentSucceeded
const items = JSON.parse(metadata.cart_items);
for (const item of items) {
  await query(
    'UPDATE products SET stock = stock - ? WHERE id = ?',
    [item.quantity, item.product_id]
  );
}
```

### 4. **No Se Envía Email de Confirmación** ⚠️

**Problema:** Los clientes no reciben confirmación de su compra.

**Solución requerida:**
```typescript
// Usar la función sendEmail existente
const emailData = {
  to: paymentIntent.receipt_email,
  subject: 'Confirmación de compra - Star Filters',
  html: createOrderConfirmationTemplate(orderData)
};
await sendEmail(emailData);
```

### 5. **Interface CartItem Incompleta** 📝

**Problema:** La interface `CartItem` en `src/lib/cart.ts` no incluye `product_id`.

**Solución:**
```typescript
export interface CartItem {
  uuid: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
  product_id: number; // AGREGAR ESTO
  // ... resto
}
```

### 6. **No Hay Manejo de Reembolsos** ⚠️

**Problema:** Si bien existe la función `createRefund` en `stripe.ts`, no hay UI ni lógica para procesar reembolsos desde el admin.

### 7. **Falta Validación de Inventario Antes del Pago** ⚠️

**Problema:** No se verifica que haya suficiente stock antes de crear el Payment Intent.

**Solución:**
```typescript
// En createCheckoutPaymentIntent
for (const item of cart.items) {
  const product = await getProductByUuid(item.uuid);
  if (!product || product.stock < item.quantity) {
    throw new Error(`Stock insuficiente para ${item.name}`);
  }
}
```

## 📋 Checklist de Implementación Pendiente

- [ ] Guardar órdenes en BD desde el webhook
- [ ] Agregar `user_id` al metadata del Payment Intent
- [ ] Serializar items del carrito en metadata
- [ ] Actualizar inventario después de pago exitoso
- [ ] Enviar email de confirmación de orden
- [ ] Agregar `product_id` al CartItem
- [ ] Validar stock antes de crear Payment Intent
- [ ] Implementar manejo de reembolsos en admin
- [ ] Implementar pruebas de webhook locales con Stripe CLI

## 🔧 Pasos Recomendados para Completar la Implementación

### Paso 1: Actualizar CartItem Interface
```bash
# Editar src/lib/cart.ts
```

### Paso 2: Actualizar Metadata en Payment Intent
```bash
# Editar src/lib/payment-utils.ts línea 74
```

### Paso 3: Implementar Guardado de Órdenes en Webhook
```bash
# Editar src/pages/api/stripe-webhook.ts
```

### Paso 4: Agregar Validación de Stock
```bash
# Editar src/pages/api/create-payment-intent.ts
```

### Paso 5: Probar con Stripe CLI
```bash
# Instalar Stripe CLI
npm install -g stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:4321/api/stripe-webhook
```

## 🌐 Dominios para Payment Element (Producción)

**Importante:** Para que el formulario de pago de Stripe funcione en producción, debes registrar tu dominio en Stripe:

1. Ir a [Payment method domains](https://dashboard.stripe.com/settings/payment_method_domains)
2. Clic en **Add a new domain**
3. Agregar tu dominio (ej: `srv1171123.hstgr.cloud` o `starfilters.mx`)

Sin esto, el Payment Element mostrará un área vacía y dará error 400 en la petición `sessions`.

## 📚 Recursos Útiles

- [Stripe Payment Intents Docs](https://stripe.com/docs/payments/payment-intents)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Payment Method Domains](https://dashboard.stripe.com/settings/payment_method_domains)
- [Testing Stripe Locally](https://stripe.com/docs/stripe-cli)

## ⚡ Prioridades

1. **CRÍTICO**: Guardar órdenes en BD desde el webhook
2. **ALTO**: Agregar user_id y items al metadata
3. **MEDIO**: Actualizar inventario
4. **MEDIO**: Enviar email de confirmación
5. **BAJO**: Implementar reembolsos
