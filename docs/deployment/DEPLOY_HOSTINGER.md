# 🚀 GUÍA DE DEPLOYMENT - Hostinger

## 📋 REQUISITOS PREVIOS

### ✅ Hosting
- Hostinger con plan que incluya:
  - Node.js
  - MySQL
  - SSL/HTTPS
  - Acceso SSH (opcional pero recomendado)

### 📦 Archivos Necesarios
- Credenciales de Hostinger FTP
- Credenciales de base de datos MySQL
- Variables de entorno

---

## 🔧 PASO 1: CONFIGURAR BASE DE DATOS

### 1.1 Crear Base de Datos en Hostinger
1. Accede al **Panel de Control de Hostinger**
2. Ve a **Bases de Datos MySQL**
3. Crea una nueva base de datos:
   - Nombre: `starfilters_db`
   - Usuario: (tu_usuario)
   - Contraseña: (generar una segura)
4. **Guarda estas credenciales**

### 1.2 Importar Schema
1. Exporta tu base de datos local:
```bash
mysqldump -u tu_usuario -p starfilters_db > starfilters_db.sql
```

2. Importa en Hostinger:
   - Ve a phpMyAdmin en el panel de Hostinger
   - Selecciona tu base de datos
   - Ve a "Importar"
   - Sube el archivo `starfilters_db.sql`

---

## 📝 PASO 2: CONFIGURAR VARIABLES DE ENTORNO

### 2.1 Crear Archivo .env en Hostinger

Crea un archivo `.env` en la raíz de tu proyecto con:

```env
# Base de Datos
DB_HOST=localhost
DB_USER=tu_usuario_hostinger
DB_PASSWORD=tu_contraseña_hostinger
DB_NAME=starfilters_db
DB_PORT=3306

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro
JWT_EXPIRES_IN=7d

# Node
NODE_ENV=production

# Stripe
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
```

---

## 🚀 PASO 3: SUBIR ARCHIVOS

### 3.1 Opción A: Vía FTP (Cliente FTP)

1. **Instala un cliente FTP** (FileZilla, Cyberduck, etc.)

2. **Configuración FTP:**
   - Host: ftp.tudominio.com
   - Usuario: (tu_usuario_hostinger)
   - Contraseña: (tu_contraseña)
   - Puerto: 21

3. **Estructura de archivos a subir:**
```
public_html/
├── .env                    # Variables de entorno
├── dist/                   # Build de producción
├── node_modules/           # Dependencias
├── package.json
├── package-lock.json
├── .htaccess              # Configuración Apache
└── server.js              # Script de inicio
```

### 3.2 Opción B: Vía SSH (Recomendado)

1. **Conectar por SSH:**
```bash
ssh usuario@tu_ip_hostinger
```

2. **Navegar al directorio del sitio:**
```bash
cd public_html
```

3. **Clonar el repositorio:**
```bash
git clone https://github.com/tu-usuario/Starfilters-Ecommerce.git .
```

4. **Instalar dependencias:**
```bash
npm install
```

---

## 🏗️ PASO 4: BUILD Y CONFIGURACIÓN

### 4.1 Build del Proyecto
```bash
# En el servidor
cd public_html
pnpm install
pnpm build
```

### 4.2 Crear Script de Inicio (server.js)

Crea un archivo `server.js` en la raíz:

```javascript
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { handler as ssrHandler } from './dist/server/entry.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Servir archivos estáticos
app.use(express.static(join(__dirname, 'dist/client')));

// SSR handler
app.use(ssrHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 4.3 Configurar .htaccess

Crea `.htaccess` en `public_html`:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.php?/$1 [QSA,L]

# Habilitar compresión
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache de navegador
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/pdf "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/x-shockwave-flash "access plus 1 month"
  ExpiresByType image/x-icon "access plus 1 year"
  ExpiresDefault "access plus 2 days"
</IfModule>
```

---

## 🔒 PASO 5: CONFIGURAR SSL/HTTPS

1. **En el panel de Hostinger:**
   - Ve a **SSL/TLS**
   - Habilita el certificado SSL (Let's Encrypt es gratuito)
   - Espera a que se genere

2. **Forzar HTTPS en .htaccess:**
```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## ⚙️ PASO 6: CONFIGURAR NODE.JS

1. **Panel de Hostinger → Node.js Selector:**
   - Versión de Node.js: **18.x o 20.x**
   - Application root: `public_html`
   - Application startup file: `server.js`
   - Application URL: `https://tudominio.com`

2. **Reinicia la aplicación**

---

## 🔔 PASO 7: CONFIGURAR WEBHOOKS DE STRIPE

1. **Ir a Dashboard de Stripe → Webhooks**
2. **Agregar endpoint:**
   - URL: `https://tudominio.com/api/stripe-webhook`
   - Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`
3. **Copiar el Webhook Secret**
4. **Actualizar .env con el nuevo secret**

---

## ✅ PASO 8: VERIFICACIONES

### 8.1 Verificar Funcionamiento
- ✅ Sitio carga: `https://tudominio.com`
- ✅ Login funciona
- ✅ Productos se muestran
- ✅ Checkout funciona
- ✅ Webhooks de Stripe funcionan

### 8.2 Verificar Logs
```bash
# Ver logs de Node.js
tail -f ~/logs/nodejs/error.log

# Ver logs de Apache
tail -f ~/logs/error_log
```

---

---

## ⚠️ PROBLEMAS COMUNES

### Error: "Cannot find module"
- **Solución:** Instalar dependencias con `npm install --production`

### Error: "Port 8080 already in use"
- **Solución:** Cambiar PORT en .env a otro puerto

### Error: "Database connection failed"
- **Solución:** Verificar credenciales en .env

### Stripe webhooks no funcionan
- **Solución:** Verificar que la URL sea HTTPS y accesible públicamente

---

## 📞 SOPORTE

Si tienes problemas:
1. Revisa los logs de Hostinger
2. Verifica que todas las variables de entorno estén correctas
3. Contacta soporte de Hostinger
4. Revisa la documentación en `docs/VPS_UPDATE_FILTER_CATEGORIES.md` para troubleshooting
