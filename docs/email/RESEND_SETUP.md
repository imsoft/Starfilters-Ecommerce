# 📧 Configuración de Resend para Envío de Emails

## ✅ Integración Completada

Resend ha sido integrado exitosamente en el proyecto. Ahora todos los emails se envían a través de Resend en lugar de solo loguearse en consola.

**📌 Configuración Actual:** El proyecto está configurado para usar Resend con Google Workspace. Los correos se envían desde direcciones de Google Workspace pero utilizando la infraestructura de Resend para mejor entregabilidad.

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
RESEND_FROM_NAME=Star Filters
```

**⚠️ IMPORTANTE:**
- `RESEND_FROM_EMAIL` debe ser un email del dominio verificado en Resend
- El dominio debe estar verificado en Resend (ver paso 3)
- Puedes usar cualquier email del dominio verificado (ej: `noreply@`, `ventas@`, `info@`, etc.)

### 3. Verificar Dominio en Resend (Google Workspace)

Si tu dominio está en Google Workspace, sigue estos pasos:

1. Ve a **Domains** en el dashboard de Resend
2. Agrega tu dominio (ej: `starfilters.com` o `starfilters.mx`)
3. Resend te proporcionará registros DNS que debes agregar:
   - **SPF**: Registro TXT para autenticación
   - **DKIM**: Registro CNAME para firma digital
   - **DMARC**: Registro TXT (opcional pero recomendado)

4. **Agregar registros DNS en Google Workspace:**
   - Ve a [Google Admin Console](https://admin.google.com)
   - Navega a **Apps** → **Google Workspace** → **Gmail** → **Autenticación de email**
   - O ve directamente a la configuración DNS de tu dominio
   - Agrega los registros que Resend te proporciona
   - **Nota:** Los registros de Resend NO interfieren con los de Google Workspace, pueden coexistir

5. Espera a que Resend verifique el dominio (puede tomar 5-30 minutos)
6. Una vez verificado, puedes usar cualquier email de ese dominio

**💡 Ventajas de usar Resend con Google Workspace:**
- Mejor entregabilidad que SMTP directo
- Analytics y tracking de emails
- Manejo automático de rebotes y spam
- API moderna y fácil de usar
- Los emails aparecen como enviados desde tu dominio de Google Workspace

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
- Verifica que la API key esté activa en el dashboard de Resend

### Error: "Domain not verified"
- Verifica tu dominio en Resend (debe aparecer como "Verified")
- Usa un email del dominio verificado en `RESEND_FROM_EMAIL`
- Verifica que los registros DNS estén correctamente configurados
- Si usas Google Workspace, asegúrate de que los registros de Resend estén agregados además de los de Google

### Emails no se envían
- Verifica los logs del servidor:
  ```bash
  pm2 logs starfilters-app | grep "📧"
  ```
- Revisa que `RESEND_API_KEY` esté en el `.env`
- Verifica que el dominio esté verificado en Resend
- Revisa el dashboard de Resend para ver si hay errores específicos

### Emails van a spam
- Verifica que los registros SPF, DKIM y DMARC estén correctamente configurados
- Asegúrate de que el contenido del email no tenga palabras spam
- Verifica la reputación del dominio en Resend
- Considera configurar DMARC para mejor autenticación

### Conflicto con Google Workspace
- Los registros DNS de Resend y Google Workspace pueden coexistir
- Resend usa sus propios registros para autenticación, no interfiere con Gmail
- Si tienes problemas, verifica que ambos conjuntos de registros estén presentes

## 📝 Notas

- Los emails se envían de forma asíncrona
- Si falla el envío, se loguea el error pero no se bloquea el proceso
- Los emails tienen diseño responsive y se ven bien en todos los clientes
- **Google Workspace + Resend:** Esta configuración permite usar la infraestructura de Resend mientras mantienes tu dominio de Google Workspace. Los destinatarios verán los emails como enviados desde tu dominio de Google Workspace, pero con mejor entregabilidad gracias a Resend.

## 🔄 Flujo de Email con Google Workspace

```
Aplicación → Resend API → Infraestructura de Resend → Destinatario
                ↓
         Usa dominio verificado de Google Workspace
         (ej: noreply@starfilters.mx)
```

**Beneficios:**
- ✅ Mejor entregabilidad que SMTP directo
- ✅ Analytics y tracking
- ✅ Manejo automático de rebotes
- ✅ Los emails aparecen desde tu dominio de Google Workspace
- ✅ No necesitas configurar SMTP en la aplicación

