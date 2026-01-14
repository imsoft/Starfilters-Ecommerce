# ✅ CHECKLIST - Deployment en Hostinger

## 📋 ANTES DE EMPEZAR

### Credenciales Necesarias
- [ ] Usuario FTP de Hostinger
- [ ] Contraseña FTP de Hostinger
- [ ] Usuario MySQL de Hostinger
- [ ] Contraseña MySQL de Hostinger
- [ ] Nombre de la base de datos
- [ ] Stripe Secret Key (producción)
- [ ] Stripe Public Key (producción)
- [ ] Stripe Webhook Secret
- [ ] Credenciales de Cloudinary
- [ ] Credenciales de email SMTP

---

## 🔧 PASO 1: BASE DE DATOS

### 1.1 Crear Base de Datos
- [ ] Acceder al panel de Hostinger
- [ ] Ir a "Bases de Datos MySQL"
- [ ] Crear nueva base de datos
- [ ] Anotar: nombre, usuario, contraseña

### 1.2 Exportar Base de Datos Local
```bash
# En tu máquina local
mysqldump -u tu_usuario -p starfilters_db > starfilters_db.sql
```

### 1.3 Importar a Hostinger
- [ ] Acceder a phpMyAdmin en Hostinger
- [ ] Seleccionar la base de datos creada
- [ ] Clic en "Importar"
- [ ] Subir archivo `starfilters_db.sql`
- [ ] Verificar que todas las tablas se crearon

---

## 📤 PASO 2: SUBIR ARCHIVOS

### 2.1 Opción A: Vía FTP

#### Instalar Cliente FTP
- [ ] Descargar FileZilla (https://filezilla-project.org/)
- [ ] Instalar

#### Configurar Conexión
- [ ] Host: ftp.tudominio.com (o IP que te dieron)
- [ ] Usuario: tu_usuario_hostinger
- [ ] Contraseña: tu_contraseña_hostinger
- [ ] Puerto: 21

#### Subir Archivos
- [ ] Conectar
- [ ] Navegar a `public_html/`
- [ ] Subir carpeta completa del proyecto
- [ ] Verificar que todos los archivos se subieron

### 2.2 Opción B: Vía SSH (Recomendado)

```bash
# 1. Conectar por SSH
ssh usuario@tu_ip_hostinger

# 2. Ir al directorio del sitio
cd public_html

# 3. Clonar repositorio
git clone https://github.com/imsoft/Starfilters-Ecommerce.git .

# 4. Instalar dependencias
npm install
```

- [ ] Probar conexión SSH
- [ ] Clonar repositorio
- [ ] Instalar dependencias

---

## 🔑 PASO 3: CONFIGURAR VARIABLES DE ENTORNO

### 3.1 Crear archivo .env

Crear archivo `.env` en la raíz del proyecto:

```env
# Base de Datos
DB_HOST=localhost
DB_USER=u123456789_starfilters
DB_PASSWORD=tu_contraseña_segura
DB_NAME=u123456789_starfilters
DB_PORT=3306

# JWT
JWT_SECRET=tu_jwt_secret_minimo_32_caracteres_super_seguro_123456789
JWT_EXPIRES_IN=7d

# Node
NODE_ENV=production

# Stripe
STRIPE_SECRET_KEY=sk_live_TU_CLAVE_SECRETA
STRIPE_PUBLIC_KEY=pk_live_TU_CLAVE_PUBLICA
STRIPE_WEBHOOK_SECRET=whsec_TU_WEBHOOK_SECRET

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

- [ ] Crear archivo .env
- [ ] Configurar DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
- [ ] Configurar JWT_SECRET
- [ ] Configurar STRIPE_SECRET_KEY (producción)
- [ ] Configurar STRIPE_PUBLIC_KEY (producción)
- [ ] Configurar CLOUDINARY_*
- [ ] Configurar SMTP_*

---

## 🏗️ PASO 4: BUILD Y CONFIGURACIÓN

### 4.1 Build del Proyecto

```bash
# En el servidor
cd public_html
npm install
npm run build
```

- [ ] Ejecutar `npm install`
- [ ] Ejecutar `npm run build`
- [ ] Verificar que se creó carpeta `dist/`

### 4.2 Crear archivo .htaccess

Crear archivo `.htaccess` en `public_html`:

```apache
# Redirigir a HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

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
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType image/x-icon "access plus 1 year"
</IfModule>
```

- [ ] Crear archivo .htaccess
- [ ] Configurar redirección HTTPS

---

## ⚙️ PASO 5: CONFIGURAR NODE.JS

### 5.1 Configurar en Hostinger
- [ ] Ir a "Node.js Selector" en el panel
- [ ] Seleccionar versión: Node.js 18.x o 20.x
- [ ] Application root: `public_html`
- [ ] Application startup file: `index.js` (o el que hayas configurado)
- [ ] Application URL: `https://tudominio.com`
- [ ] Clic en "Create"

### 5.2 Reiniciar Aplicación
- [ ] Clic en "Restart" en Node.js Selector

---

## 🔒 PASO 6: CONFIGURAR SSL

- [ ] Ir a "SSL/TLS" en el panel
- [ ] Activar certificado SSL (Let's Encrypt es gratis)
- [ ] Esperar a que se genere el certificado
- [ ] Verificar que el sitio carga con https://

---

## 🔔 PASO 7: CONFIGURAR WEBHOOKS DE STRIPE

### 7.1 Ir a Stripe Dashboard
- [ ] Ir a https://dashboard.stripe.com/webhooks
- [ ] Clic en "Add endpoint"

### 7.2 Configurar Endpoint
- [ ] URL: `https://tudominio.com/api/stripe-webhook`
- [ ] Seleccionar eventos:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
- [ ] Clic en "Add endpoint"
- [ ] Copiar el "Signing secret"

### 7.3 Actualizar .env
- [ ] Actualizar `STRIPE_WEBHOOK_SECRET` con el nuevo secret
- [ ] Reiniciar la aplicación

---

## ✅ PASO 8: VERIFICACIÓN

### 8.1 Verificar Sitio
- [ ] Abrir `https://tudominio.com`
- [ ] Verificar que carga correctamente
- [ ] Verificar que no hay errores en consola

### 8.2 Test de Funcionalidades
- [ ] Login funciona
- [ ] Productos se muestran correctamente
- [ ] Agregar al carrito funciona
- [ ] Checkout funciona
- [ ] Pago con Stripe funciona (usar tarjeta de prueba: 4242 4242 4242 4242)
- [ ] Webhooks funcionan (revisar logs de Stripe)

### 8.3 Verificar Logs
```bash
# Ver logs de Node.js
tail -f ~/logs/nodejs/error.log
```

- [ ] Revisar logs de Node.js
- [ ] Verificar que no hay errores críticos

---

## 📝 NOTAS IMPORTANTES

### ⚠️ Consideraciones de Hostinger VPS
1. **SSR con Node.js**: El proyecto usa `@astrojs/node` para SSR en el VPS
2. **Deploy manual**: Necesitarás hacer deploys manuales con git pull y pnpm build
3. **SSL**: Configurado con Certbot
4. **PM2**: Gestión de procesos con PM2 para mantener la aplicación corriendo

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error: "Cannot find module"
```bash
npm install --production
```

### Error: "Port already in use"
- Cambiar PORT en .env a otro puerto
- O contactar soporte de Hostinger

### Error: "Database connection failed"
- Verificar credenciales en .env
- Verificar que la base de datos existe
- Verificar que el usuario tiene permisos

### Webhooks no funcionan
- Verificar que la URL sea HTTPS
- Verificar que STRIPE_WEBHOOK_SECRET sea correcto
- Verificar logs en Stripe Dashboard

---

## 📞 CONTACTO

Si tienes problemas:
1. Revisar logs: `pm2 logs starfilters-app`
2. Verificar estado: `pm2 status`
3. Revisar documentación: `docs/VPS_UPDATE_FILTER_CATEGORIES.md`
4. Contactar soporte de Hostinger si es necesario

---

## ✅ ¡LISTO!

Cuando hayas completado todos los checkboxes, tu sitio debería estar funcionando en:
**https://tudominio.com**
