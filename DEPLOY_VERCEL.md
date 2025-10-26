# 🚀 GUÍA DE DEPLOYMENT - Vercel (RECOMENDADO)

## ✅ ¿Por qué Vercel?

- ✅ **100% GRATIS** para proyectos personales
- ✅ Deploy automático con Git
- ✅ SSL automático y gratuito
- ✅ CDN global ultra-rápido
- ✅ Soporte nativo para Astro
- ✅ Variables de entorno seguras
- ✅ Deploys instantáneos
- ✅ Logs en tiempo real
- ✅ Ambiente de desarrollo separado

---

## 📝 PASO 1: PREPARACIÓN

### 1.1 Verificar que todo esté en GitHub
```bash
git status
git push origin main
```

### 1.2 Instalar Vercel CLI
```bash
npm install -g vercel
```

---

## 🌐 PASO 2: DEPLOY INICIAL

### 2.1 Login en Vercel
```bash
vercel login
```

### 2.2 Deploy del Proyecto
```bash
# Desde la raíz del proyecto
cd /Users/brangarciaramos/Proyectos/imSoft/sitios-web/starfilters-ecommerce

# Deploy inicial (preview)
vercel

# Deploy a producción
vercel --prod
```

**Elige las opciones por defecto cuando te lo pida.**

---

## 🔑 PASO 3: CONFIGURAR VARIABLES DE ENTORNO

### 3.1 Ir a Dashboard de Vercel
1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto **starfilters-ecommerce**
3. Ve a **Settings** → **Environment Variables**

### 3.2 Agregar Variables

**Configuración de Base de Datos:**
```
DB_HOST = tu_host_mysql
DB_USER = tu_usuario_mysql
DB_PASSWORD = tu_contraseña_mysql
DB_NAME = starfilters_db
DB_PORT = 3306
```

**JWT:**
```
JWT_SECRET = tu_jwt_secret_super_seguro_minimo_32_caracteres
JWT_EXPIRES_IN = 7d
```

**Stripe:**
```
STRIPE_SECRET_KEY = sk_live_...
STRIPE_PUBLIC_KEY = pk_live_...
STRIPE_WEBHOOK_SECRET = whsec_...
```

**Cloudinary:**
```
CLOUDINARY_CLOUD_NAME = tu_cloud_name
CLOUDINARY_API_KEY = tu_api_key
CLOUDINARY_API_SECRET = tu_api_secret
```

**Email:**
```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = tu_email@gmail.com
SMTP_PASS = tu_app_password
FROM_EMAIL = noreply@tudominio.com
```

**Aplicación:**
```
NODE_ENV = production
PUBLIC_SITE_URL = https://tu-proyecto.vercel.app
```

### 3.3 Aplicar Variables
- Marca todas para **Production**
- Click en **Save**

---

## 🔔 PASO 4: CONFIGURAR WEBHOOKS DE STRIPE

### 4.1 Obtener URL de tu Proyecto en Vercel
1. En el dashboard de Vercel, ve a **Deployments**
2. Copia la URL de producción (ej: `https://starfilters-ecommerce.vercel.app`)

### 4.2 Configurar Webhook en Stripe
1. Ve a: https://dashboard.stripe.com/webhooks
2. Click en **Add endpoint**
3. URL: `https://tu-proyecto.vercel.app/api/stripe-webhook`
4. Selecciona eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click en **Add endpoint**
6. Copia el **Signing secret**

### 4.3 Agregar Webhook Secret en Vercel
1. Volver a **Environment Variables** en Vercel
2. Actualizar `STRIPE_WEBHOOK_SECRET` con el nuevo secret
3. **Redeploy** el proyecto

---

## 🌍 PASO 5: CONECTAR DOMINIO (OPCIONAL)

### 5.1 Agregar Dominio
1. En Vercel dashboard → **Settings** → **Domains**
2. Click en **Add**
3. Ingresa tu dominio: `tudominio.com`
4. Sigue las instrucciones para configurar DNS

### 5.2 Configurar DNS en Hostinger
En el panel de Hostinger DNS:
```
Tipo: A
Nombre: @
Valor: 76.76.21.21

Tipo: CNAME
Nombre: www
Valor: cname.vercel-dns.com
```

### 5.3 Actualizar URL en Variables de Entorno
```
PUBLIC_SITE_URL = https://tudominio.com
```

---

## 🔄 PASO 6: CONFIGURAR DEPLOY AUTOMÁTICO

### 6.1 Conectar GitHub
1. En Vercel dashboard → **Settings** → **Git**
2. Click en **Connect Git Provider**
3. Selecciona **GitHub**
4. Autoriza Vercel a acceder a tu repositorio
5. Selecciona el repo: `Starfilters-Ecommerce`

### 6.2 Configurar Deploy Automático
Ahora **cada push a main** hará deploy automáticamente ✅

---

## 🧪 PASO 7: TESTING

### 7.1 Verificar Sitio
- Abre: `https://tu-proyecto.vercel.app`
- Verifica que todo funcione correctamente

### 7.2 Test de Funcionalidades
- [ ] Login funciona
- [ ] Productos se muestran
- [ ] Agregar al carrito funciona
- [ ] Checkout funciona
- [ ] Pago con Stripe funciona
- [ ] Webhooks funcionan

---

## 📊 PASO 8: MONITOREO

### 8.1 Ver Logs en Tiempo Real
```bash
vercel logs tu-proyecto.vercel.app --follow
```

### 8.2 Ver Analytics
- Dashboard de Vercel → **Analytics**
- Mide rendimiento, velocidad, etc.

---

## 🎉 ¡LISTO!

Tu sitio está en producción en: `https://tu-proyecto.vercel.app`

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error de Build
```bash
# Ver logs de build
vercel logs --follow

# Hacer build local para debug
pnpm build
```

### Error de Base de Datos
- Verificar que las credenciales sean correctas
- Verificar que el host MySQL permita conexiones externas

### Webhooks no Funcionan
- Verificar que la URL sea HTTPS
- Verificar que `STRIPE_WEBHOOK_SECRET` esté correcto
- Revisar logs: `vercel logs --follow`

---

## 📚 RECURSOS

- Documentación Vercel: https://vercel.com/docs
- Documentación Astro + Vercel: https://docs.astro.build/en/guides/integrations-guide/vercel/
- Soporte: https://vercel.com/support

---

## ✅ VENTAJAS SOBRE HOSTINGER

| Característica | Vercel | Hostinger |
|----------------|--------|-----------|
| Deploy automático | ✅ | ❌ |
| SSL gratuito | ✅ | ⚠️ Limitado |
| CDN global | ✅ | ❌ |
| Soporte Astro | ✅ Nativo | ⚠️ Complejo |
| Deploys instantáneos | ✅ | ❌ |
| Ambiente desarrollo | ✅ | ❌ |
| **PRECIO** | **GRATIS** | **$/mes** |
