# 🚀 Guía Rápida: Subir a Hostinger

## ✅ Archivos Preparados

Ya se han generado los siguientes archivos necesarios:
- ✅ `.env.production.example` - Template de variables de entorno
- ✅ `.htaccess` - Configuración Apache
- ✅ `server.js` - Script de inicio del servidor
- ✅ `package.json` actualizado con script `start`

---

## 📋 PASOS PARA SUBIR A HOSTINGER

### 1️⃣ Preparar Base de Datos

1. **En el panel de Hostinger:**
   - Ve a **Bases de Datos MySQL**
   - Crea una nueva base de datos: `starfilters_db`
   - Anota: usuario, contraseña, host (generalmente `localhost`)

2. **Exportar base de datos local:**
   ```bash
   mysqldump -u tu_usuario -p starfilters_db > starfilters_db.sql
   ```

3. **Importar en Hostinger:**
   - Ve a **phpMyAdmin** en el panel
   - Selecciona tu base de datos
   - Ve a "Importar" → Sube `starfilters_db.sql`

---

### 2️⃣ Subir Archivos al Servidor

#### Opción A: Vía FTP (FileZilla)

1. **Conectar:**
   - Host: `ftp.tudominio.com` o IP del servidor
   - Usuario: (tu usuario Hostinger)
   - Contraseña: (tu contraseña)
   - Puerto: 21

2. **Subir a `public_html/`:**
   ```
   public_html/
   ├── .env                    # (crear desde .env.production.example)
   ├── dist/                   # Carpeta del build
   ├── node_modules/          # (instalar en servidor)
   ├── package.json
   ├── package-lock.json
   ├── pnpm-lock.yaml
   ├── .htaccess              # ✅ Ya creado
   ├── server.js              # ✅ Ya creado
   └── (otros archivos necesarios)
   ```

#### Opción B: Vía SSH (Recomendado)

```bash
# 1. Conectar por SSH
ssh usuario@tu_ip_hostinger

# 2. Ir al directorio
cd public_html

# 3. Clonar repositorio
git clone https://github.com/imsoft/Starfilters-Ecommerce.git .

# 4. Instalar dependencias
pnpm install

# 5. Build
pnpm build
```

---

### 3️⃣ Configurar Variables de Entorno

1. **En el servidor, crear `.env` desde el template:**
   ```bash
   cp .env.production.example .env
   ```

2. **Editar `.env` con tus credenciales de Hostinger:**
   ```env
   # Base de Datos
   DB_HOST=localhost
   DB_USER=tu_usuario_hostinger
   DB_PASSWORD=tu_contraseña_hostinger
   DB_NAME=starfilters_db
   DB_PORT=3306

   # JWT (genera uno seguro)
   JWT_SECRET=tu_jwt_secret_super_seguro_minimo_32_caracteres
   JWT_EXPIRES_IN=7d

   # Node
   NODE_ENV=production

   # Stripe (claves LIVE)
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLIC_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=tu_cloud_name
   CLOUDINARY_API_KEY=tu_api_key
   CLOUDINARY_API_SECRET=tu_api_secret

   # Email
   SMTP_HOST=smtp.hostinger.com
   SMTP_PORT=587
   SMTP_USER=noreply@tudominio.com
   SMTP_PASS=tu_contraseña_email
   FROM_EMAIL=noreply@tudominio.com

   # Aplicación
   PUBLIC_SITE_URL=https://tudominio.com
   PORT=8080
   ```

---

### 4️⃣ Configurar Node.js en Hostinger

1. **Panel de Hostinger → Node.js Selector:**
   - Versión: **Node.js 18.x o 20.x**
   - Application root: `public_html`
   - Application startup file: `server.js`
   - Application URL: `https://tudominio.com`

2. **Reiniciar la aplicación**

---

### 5️⃣ Configurar SSL/HTTPS

1. **Panel de Hostinger → SSL/TLS:**
   - Activa el certificado SSL (Let's Encrypt es gratuito)
   - Espera a que se genere

2. **El `.htaccess` ya incluye redirección a HTTPS** ✅

---

### 6️⃣ Configurar Webhooks de Stripe

1. **Dashboard de Stripe → Webhooks:**
   - URL: `https://tudominio.com/api/stripe-webhook`
   - Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copia el Webhook Secret
   - Actualiza `STRIPE_WEBHOOK_SECRET` en `.env`

---

## ✅ Verificaciones Finales

- [ ] Sitio carga: `https://tudominio.com`
- [ ] Login funciona
- [ ] Productos se muestran
- [ ] Checkout funciona
- [ ] Webhooks de Stripe funcionan
- [ ] Base de datos conectada

---

## 🆘 Solución de Problemas

### Error: "Cannot find module"
```bash
# En el servidor
cd public_html
pnpm install
```

### Error: "Port 8080 already in use"
- Cambia `PORT` en `.env` a otro puerto (ej: 3000)
- Actualiza en Node.js Selector

### Error: "Database connection failed"
- Verifica credenciales en `.env`
- Asegúrate de que la BD existe en Hostinger

### Ver logs
```bash
# Logs de Node.js
tail -f ~/logs/nodejs/error.log

# Logs de Apache
tail -f ~/logs/error_log
```

---

## 📚 Documentación Completa

Para más detalles, consulta:
- `docs/deployment/DEPLOY_HOSTINGER.md` - Guía detallada
- `docs/deployment/HOSTINGER_CHECKLIST.md` - Checklist interactivo

