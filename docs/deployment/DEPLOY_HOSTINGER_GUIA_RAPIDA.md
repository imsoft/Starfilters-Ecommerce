# 🚀 Guía Rápida: Subir a Hostinger

## ✅ Archivos Preparados

Ya se han generado los siguientes archivos necesarios:
- ✅ `.env.production.example` - Template de variables de entorno
- ✅ `.htaccess` - Configuración Apache
- ✅ `server.js` - Script de inicio del servidor
- ✅ `package.json` actualizado con script `start`

---

## 📋 OPCIONES DE DEPLOYMENT

Hostinger ofrece **3 formas** de subir tu proyecto. Te recomiendo la **Opción 1 (Git)** por ser la más fácil y automática.

---

## 🎯 OPCIÓN 1: VÍA GIT (RECOMENDADO) ⭐

Esta es la opción más fácil y automática. Hostinger clona tu repositorio y lo despliega automáticamente.

### Pasos:

1. **En el Panel de Hostinger:**
   - Ve a **Sitios web** → **Avanzado** → **GIT**
   - En la sección "Crear un nuevo repositorio"

2. **Configurar el repositorio:**
   - **Repositorio:** `https://github.com/imsoft/Starfilters-Ecommerce.git`
   - **Rama:** `main` (o `master` si usas esa rama)
   - **Directorio:** Déjalo **vacío** (se desplegará en `public_html`)

3. **Hacer clic en "Crear"**

4. **Hostinger automáticamente:**
   - Clona el repositorio
   - Instala dependencias
   - Hace el build

### ⚠️ IMPORTANTE: Configuración Post-Deploy

Después de que Hostinger clone el repositorio, necesitas:

1. **Conectar por SSH:**
   ```bash
   ssh usuario@tu_ip_hostinger
   cd public_html
   ```

2. **Instalar dependencias y hacer build:**
   ```bash
   pnpm install
   pnpm build
   ```

3. **Configurar `.env`:**
   ```bash
   cp .env.production.example .env
   # Editar .env con tus credenciales
   nano .env
   ```

4. **Configurar Node.js en el panel:**
   - Panel → Node.js Selector
   - Application startup file: `server.js`
   - Reiniciar aplicación

### 🔄 Actualizaciones Futuras

Cada vez que hagas `git push` a GitHub, Hostinger puede actualizar automáticamente si configuras webhooks, o puedes hacerlo manualmente desde el panel.

---

## 📤 OPCIÓN 2: VÍA SSH (Manual)

Si prefieres control total o la opción Git no funciona:

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

# 6. Configurar .env
cp .env.production.example .env
# Editar .env con tus credenciales
nano .env
```

---

## 📁 OPCIÓN 3: VÍA FTP (FileZilla)

Si no tienes acceso SSH o prefieres subir archivos manualmente:

1. **Conectar con FileZilla:**
   - Host: `ftp.tudominio.com` o IP del servidor
   - Usuario: (tu usuario Hostinger)
   - Contraseña: (tu contraseña)
   - Puerto: 21

2. **Subir a `public_html/`:**
   - Todos los archivos del proyecto
   - **NO subas** `node_modules` (se instalan en el servidor)

3. **En el servidor (vía SSH o terminal del panel):**
   ```bash
   cd public_html
   pnpm install
   pnpm build
   cp .env.production.example .env
   # Editar .env
   ```

---

## 📝 CONFIGURACIÓN COMÚN (Todas las opciones)

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

### 2️⃣ Configurar Variables de Entorno

**Crear `.env` en el servidor:**

```bash
# En el servidor (vía SSH)
cd public_html
cp .env.production.example .env
nano .env
```

**Editar `.env` con tus credenciales:**

```env
# Base de Datos
DB_HOST=localhost
DB_USER=tu_usuario_hostinger
DB_PASSWORD=tu_contraseña_hostinger
DB_NAME=starfilters_db
DB_PORT=3306

# JWT (genera uno seguro, mínimo 32 caracteres)
JWT_SECRET=tu_jwt_secret_super_seguro_minimo_32_caracteres_123456789
JWT_EXPIRES_IN=7d

# Node
NODE_ENV=production

# Stripe (claves LIVE de producción)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Email (Hostinger)
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

### 3️⃣ Configurar Node.js en Hostinger

1. **Panel de Hostinger → Node.js Selector:**
   - Versión: **Node.js 18.x o 20.x**
   - Application root: `public_html`
   - Application startup file: `server.js`
   - Application URL: `https://tudominio.com`

2. **Reiniciar la aplicación**

---

### 4️⃣ Configurar SSL/HTTPS

1. **Panel de Hostinger → SSL/TLS:**
   - Activa el certificado SSL (Let's Encrypt es gratuito)
   - Espera a que se genere

2. **El `.htaccess` ya incluye redirección a HTTPS** ✅

---

### 5️⃣ Configurar Webhooks de Stripe

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
- Verifica que `DB_HOST` sea `localhost` (no la IP)

### Error: "Git deployment failed"
- Asegúrate de que el repositorio sea público o hayas configurado la clave SSH
- Verifica que el directorio esté vacío antes del primer deploy

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

---

## 💡 Recomendación Final

**Usa la Opción 1 (Git)** porque:
- ✅ Más fácil y rápida
- ✅ Automatiza el proceso
- ✅ Fácil de actualizar (solo hacer `git push`)
- ✅ Menos errores manuales

Solo recuerda configurar `.env` y Node.js después del primer deploy.

