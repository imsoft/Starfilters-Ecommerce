# 📧 Configuración de Resend para Envío de Emails

## ✅ Integración Completada

Resend ha sido integrado exitosamente en el proyecto. Ahora todos los emails se envían a través de Resend en lugar de solo loguearse en consola.

## 🔑 Configuración

### 1. Obtener API Key de Resend

1. Ve a [https://resend.com](https://resend.com)
2. Crea una cuenta o inicia sesión
3. Ve a **API Keys** en el dashboard
4. Crea una nueva API Key
5. Copia la clave (empieza con `re_`)

### 2. Configurar Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```env
# Configuración de Resend
RESEND_API_KEY=re_tu_api_key_aqui
RESEND_FROM_EMAIL=noreply@tu-dominio.com
RESEND_FROM_NAME=StarFilters
```

**⚠️ IMPORTANTE:**
- `RESEND_FROM_EMAIL` debe ser un dominio verificado en Resend
- Si no tienes un dominio verificado, puedes usar el dominio de prueba de Resend: `onboarding@resend.dev` (solo para desarrollo)
- En producción, debes verificar tu dominio en Resend

### 3. Verificar Dominio en Resend

1. Ve a **Domains** en el dashboard de Resend
2. Agrega tu dominio (ej: `starfilters.com`)
3. Agrega los registros DNS que Resend te proporciona
4. Espera a que se verifique (puede tomar unos minutos)
5. Una vez verificado, puedes usar cualquier email de ese dominio

## 📧 Emails que se Envían

### Al Crear una Orden:
- ✅ **Email al comprador**: Confirmación de pedido
- ✅ **Email al vendedor**: Notificación de nueva orden

### Al Cambiar Estado de Orden:
- ✅ **Email al comprador**: Actualización de estado (processing, shipped, delivered, cancelled)

## 🧪 Pruebas

### Modo Desarrollo
Si no tienes `RESEND_API_KEY` configurada, los emails se loguearán en consola pero no se enviarán realmente.

### Modo Producción
Con `RESEND_API_KEY` configurada, los emails se enviarán realmente a través de Resend.

## 📊 Monitoreo

Puedes ver todos los emails enviados en el dashboard de Resend:
- Ve a **Emails** en el dashboard
- Verás el historial de todos los emails enviados
- Puedes ver el estado de cada email (enviado, entregado, rebotado, etc.)

## 🔍 Verificar que Funciona

1. Crea una orden de prueba
2. Verifica los logs del servidor:
   ```
   ✅ Email enviado exitosamente con Resend. ID: abc123...
   ```
3. Revisa el dashboard de Resend para confirmar que el email fue enviado
4. Verifica que el comprador y vendedor recibieron los emails

## ⚠️ Límites de Resend

- **Plan gratuito**: 3,000 emails/mes
- **Plan Pro**: 50,000 emails/mes
- Revisa los límites en: https://resend.com/pricing

## 🆘 Solución de Problemas

### Error: "Invalid API key"
- Verifica que `RESEND_API_KEY` esté correctamente configurada
- Asegúrate de que no tenga espacios extra

### Error: "Domain not verified"
- Verifica tu dominio en Resend
- Usa un email del dominio verificado en `RESEND_FROM_EMAIL`

### Emails no se envían
- Verifica los logs del servidor
- Revisa que `RESEND_API_KEY` esté en el `.env`
- Verifica que el dominio esté verificado en Resend

## 📝 Notas

- Los emails se envían de forma asíncrona
- Si falla el envío, se loguea el error pero no se bloquea el proceso
- Los emails tienen diseño responsive y se ven bien en todos los clientes

