# ✅ Verificación Completa de Integración Stripe

## 📋 Checklist de Configuración

### 1. Variables de Entorno

Verifica que en tu archivo `.env` tengas:

```env
# Stripe - Claves de API
STRIPE_SECRET_KEY=sk_live_... (o sk_test_... para pruebas)
STRIPE_PUBLISHABLE_KEY=pk_live_... (o pk_test_... para pruebas)
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (debe coincidir con STRIPE_PUBLISHABLE_KEY)

# Stripe - Webhook
STRIPE_WEBHOOK_SECRET=whsec_... (obtenido del dashboard de Stripe)

# Stripe - Configuración
STRIPE_CURRENCY=MXN
```

**⚠️ IMPORTANTE:**
- En producción usa claves `sk_live_` y `pk_live_`
- En desarrollo usa claves `sk_test_` y `pk_test_`
- El `STRIPE_WEBHOOK_SECRET` es diferente para test y live

### 2. Configuración del Webhook en Stripe Dashboard

1. Ve a: https://dashboard.stripe.com/webhooks
2. Crea un nuevo endpoint webhook con:
   - **URL**: `https://tu-dominio.com/api/stripe-webhook`
   - **Eventos a escuchar**:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payment_intent.canceled`
3. Copia el **Signing secret** (empieza con `whsec_`) y úsalo en `STRIPE_WEBHOOK_SECRET`

### 3. Verificar Versión de API de Stripe

En `src/lib/stripe.ts` línea 5:
```typescript
apiVersion: '2024-12-18.acacia',
```

Asegúrate de usar una versión compatible. Puedes verificar en: https://stripe.com/docs/api/versioning

---

## 🔄 Flujo Completo de Pago

### Paso 1: Usuario agrega productos al carrito
- ✅ Funciona: `src/lib/cart.ts`
- ✅ Almacenamiento: LocalStorage del navegador

### Paso 2: Usuario va a checkout
- ✅ Página: `/checkout`
- ✅ Archivo: `src/pages/checkout/index.astro`
- ✅ Validación de datos de envío

### Paso 3: Crear Payment Intent
- ✅ Endpoint: `/api/create-payment-intent`
- ✅ Archivo: `src/pages/api/create-payment-intent.ts`
- ✅ Validaciones:
  - Usuario autenticado
  - Carrito no vacío
  - Stock disponible
  - Datos de checkout válidos
- ✅ Crea Payment Intent en Stripe con metadata completa

### Paso 4: Mostrar formulario de pago
- ✅ Componente: `src/components/ui/StripePaymentForm.tsx`
- ✅ Usa `@stripe/stripe-js` y `@stripe/react-stripe-js`
- ✅ Carga con `client_secret` del Payment Intent

### Paso 5: Usuario completa el pago
- ✅ Stripe procesa el pago
- ✅ Redirige a `/purchase-success` si es exitoso

### Paso 6: Webhook procesa el pago exitoso
- ✅ Endpoint: `/api/stripe-webhook`
- ✅ Archivo: `src/pages/api/stripe-webhook.ts`
- ✅ Evento: `payment_intent.succeeded`
- ✅ Acciones:
  1. Crea orden en base de datos
  2. Crea items de la orden
  3. Actualiza stock en BD local
  4. Actualiza stock en Bind (si tiene bind_id)
  5. Registra uso de código de descuento
  6. Envía email de confirmación
  7. Limpia carrito

---

## 🧪 Pruebas Recomendadas

### Prueba 1: Pago Exitoso
1. Agrega productos al carrito
2. Ve a checkout
3. Completa datos de envío
4. Usa tarjeta de prueba: `4242 4242 4242 4242`
5. Fecha: cualquier fecha futura
6. CVC: cualquier 3 dígitos
7. Verifica que:
   - ✅ Redirige a `/purchase-success`
   - ✅ Se crea la orden en BD
   - ✅ Se actualiza el stock
   - ✅ Se envía email de confirmación

### Prueba 2: Pago Fallido
1. Usa tarjeta de prueba: `4000 0000 0000 0002`
2. Verifica que:
   - ✅ Muestra mensaje de error
   - ✅ No se crea orden
   - ✅ No se actualiza stock

### Prueba 3: Stock Insuficiente
1. Agrega más productos de los disponibles
2. Intenta crear Payment Intent
3. Verifica que:
   - ✅ Retorna error de stock insuficiente
   - ✅ No crea Payment Intent

### Prueba 4: Webhook
1. Usa Stripe CLI para probar webhook localmente:
   ```bash
   stripe listen --forward-to localhost:4321/api/stripe-webhook
   ```
2. O verifica en Stripe Dashboard que los eventos lleguen correctamente

---

## 🔍 Verificación de Código

### Archivos Clave a Revisar

1. **`src/lib/stripe.ts`**
   - ✅ Configuración de Stripe
   - ✅ Funciones de Payment Intent
   - ✅ Verificación de webhook

2. **`src/lib/payment-utils.ts`**
   - ✅ Cálculo de totales
   - ✅ Creación de Payment Intent con metadata
   - ✅ Validación de datos

3. **`src/pages/api/create-payment-intent.ts`**
   - ✅ Autenticación
   - ✅ Validación de stock
   - ✅ Creación de Payment Intent

4. **`src/pages/api/stripe-webhook.ts`**
   - ✅ Verificación de firma
   - ✅ Manejo de eventos
   - ✅ Creación de orden
   - ✅ Actualización de stock
   - ✅ Envío de email

5. **`src/components/ui/StripePaymentForm.tsx`**
   - ✅ Integración con Stripe Elements
   - ✅ Manejo de errores
   - ✅ Redirección después de pago

6. **`src/pages/checkout/index.astro`**
   - ✅ Formulario de checkout
   - ✅ Carga de formulario de pago
   - ✅ Manejo de descuentos

---

## ⚠️ Problemas Comunes y Soluciones

### Problema 1: "No se puede crear Payment Intent"
- **Causa**: Claves de Stripe incorrectas o faltantes
- **Solución**: Verifica variables de entorno

### Problema 2: "Webhook no funciona"
- **Causa**: URL incorrecta o secreto incorrecto
- **Solución**: 
  - Verifica URL en Stripe Dashboard
  - Verifica `STRIPE_WEBHOOK_SECRET` en `.env`
  - Asegúrate de que el endpoint sea accesible públicamente

### Problema 3: "Pago exitoso pero no se crea orden"
- **Causa**: Webhook no está recibiendo eventos
- **Solución**: 
  - Verifica logs del servidor
  - Verifica que el webhook esté configurado correctamente
  - Revisa que el evento `payment_intent.succeeded` esté habilitado

### Problema 4: "Error al actualizar stock en Bind"
- **Causa**: Producto sin `bind_id` o error en API de Bind
- **Solución**: 
  - Verifica que el producto tenga `bind_id`
  - Revisa logs para ver el error específico
  - El proceso continúa aunque falle (no bloquea la orden)

---

## 📊 Monitoreo

### Logs a Revisar

1. **Creación de Payment Intent**:
   ```
   ✅ Payment Intent creado: pi_xxx
   ```

2. **Webhook recibido**:
   ```
   Webhook event received: payment_intent.succeeded
   ```

3. **Orden creada**:
   ```
   ✅ Orden creada con ID: 123
   ```

4. **Stock actualizado**:
   ```
   ✅ Stock actualizado en Bind para producto X: Y unidades
   ```

5. **Email enviado**:
   ```
   ✅ Email de confirmación enviado
   ```

---

## ✅ Estado Actual del Sistema

- ✅ Configuración de Stripe
- ✅ Creación de Payment Intent
- ✅ Formulario de pago con Stripe Elements
- ✅ Webhook para procesar pagos
- ✅ Creación de órdenes
- ✅ Actualización de stock (BD local y Bind)
- ✅ Códigos de descuento
- ✅ Envío de emails
- ✅ Página de éxito
- ✅ Validación de stock antes de pago
- ✅ Manejo de errores

---

## 🚀 Próximos Pasos

1. **Probar en modo test** con tarjetas de prueba
2. **Configurar webhook en producción**
3. **Verificar que todas las variables de entorno estén configuradas**
4. **Probar flujo completo end-to-end**
5. **Monitorear logs después del primer pago real**

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs del servidor
2. Verifica el dashboard de Stripe para ver eventos
3. Revisa que todas las variables de entorno estén correctas
4. Verifica que el webhook esté configurado y funcionando

