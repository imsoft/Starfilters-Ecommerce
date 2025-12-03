# 🚀 Guía Rápida: Desplegar en VPS Hostinger

## 📋 Información que necesitas

Antes de empezar, asegúrate de tener:
- ✅ IP del VPS de Hostinger
- ✅ Usuario root y contraseña del VPS
- ✅ Credenciales de base de datos MySQL (o crear una nueva)
- ✅ Dominio configurado (opcional, puedes usar la IP primero)

---

## 🎯 PASOS RÁPIDOS

### 1️⃣ Conectar al VPS por SSH

```bash
ssh root@TU_IP_VPS
```

Si es la primera vez, acepta el fingerprint escribiendo `yes`.

---

### 2️⃣ Instalar Software Necesario

```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Instalar pnpm
npm install -g pnpm

# Instalar MySQL
apt install mysql-server -y
mysql_secure_installation

# Instalar Nginx
apt install nginx -y
systemctl start nginx
systemctl enable nginx

# Instalar PM2
npm install -g pm2
```

---

### 3️⃣ Configurar Base de Datos

```bash
# Conectar a MySQL
mysql -u root -p

# Dentro de MySQL, ejecutar:
CREATE DATABASE starfilters_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'starfilters_user'@'localhost' IDENTIFIED BY 'TU_CONTRASEÑA_SEGURA';
GRANT ALL PRIVILEGES ON starfilters_db.* TO 'starfilters_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**⚠️ Guarda estas credenciales:**
- Base de datos: `starfilters_db`
- Usuario: `starfilters_user`
- Contraseña: (la que configuraste)

---

### 4️⃣ Clonar el Proyecto

```bash
cd ~
git clone https://github.com/imsoft/Starfilters-Ecommerce.git starfilters-app
cd starfilters-app
pnpm install
```

---

### 5️⃣ Configurar Variables de Entorno

```bash
# Crear archivo .env
nano .env
```

**Pega este contenido y reemplaza los valores:**

```env
# Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=starfilters_db
DB_USER=starfilters_user
DB_PASSWORD=TU_CONTRASEÑA_MYSQL

# JWT (genera uno seguro con: openssl rand -base64 32)
JWT_SECRET=GENERA_UN_SECRETO_AQUI

# Node
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Stripe (Producción)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Sitio
SITE_URL=https://tudominio.com
PUBLIC_SITE_URL=https://tudominio.com
```

**Guardar:** `Ctrl + O`, `Enter`, `Ctrl + X`

**Generar JWT_SECRET:**
```bash
openssl rand -base64 32
```
Copia el resultado y úsalo como `JWT_SECRET` en el `.env`.

---

### 6️⃣ Importar Base de Datos (si tienes datos locales)

**En tu máquina local:**
```bash
mysqldump -u tu_usuario -p starfilters_db > starfilters_db.sql
scp starfilters_db.sql root@TU_IP_VPS:/root/
```

**En el VPS:**
```bash
mysql -u starfilters_user -p starfilters_db < starfilters_db.sql
```

---

### 7️⃣ Build y Ejecutar

```bash
cd ~/starfilters-app

# Build del proyecto
pnpm build

# Probar manualmente (Ctrl+C para detener)
node server.js
```

Si funciona, presiona `Ctrl + C` y continúa.

---

### 8️⃣ Configurar Nginx

```bash
# Crear configuración
nano /etc/nginx/sites-available/starfilters
```

**Contenido (reemplaza `tudominio.com` con tu dominio o IP):**

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Guardar y habilitar:**
```bash
# Habilitar sitio
ln -s /etc/nginx/sites-available/starfilters /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Probar configuración
nginx -t

# Recargar Nginx
systemctl reload nginx
```

---

### 9️⃣ Iniciar con PM2

```bash
cd ~/starfilters-app

# Iniciar aplicación
pm2 start server.js --name starfilters-app

# Guardar para auto-inicio
pm2 save
pm2 startup
# Copia y ejecuta el comando que te muestra
```

---

### 🔟 Configurar SSL (Opcional pero Recomendado)

```bash
# Instalar Certbot
apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL
certbot --nginx -d tudominio.com -d www.tudominio.com
```

---

## ✅ Verificar que Todo Funciona

```bash
# Ver estado de PM2
pm2 status

# Ver logs
pm2 logs starfilters-app

# Verificar Nginx
systemctl status nginx

# Verificar MySQL
systemctl status mysql
```

---

## 🔄 Actualizar el Proyecto (cuando hagas cambios)

```bash
cd ~/starfilters-app
git pull origin main
pnpm install
pnpm build
pm2 restart starfilters-app
```

---

## 🆘 Solución de Problemas

### La app no inicia
```bash
pm2 logs starfilters-app
```

### Error de base de datos
```bash
mysql -u starfilters_user -p starfilters_db
```

### Nginx no funciona
```bash
nginx -t
tail -f /var/log/nginx/error.log
```

---

## 📞 Comandos Útiles

```bash
# Ver estado de la app
pm2 status

# Reiniciar app
pm2 restart starfilters-app

# Ver logs en tiempo real
pm2 logs starfilters-app --lines 50

# Monitoreo
pm2 monit

# Detener app
pm2 stop starfilters-app
```

---

**¡Listo! Tu aplicación debería estar funcionando.** 🎉

Si tienes problemas, revisa los logs con `pm2 logs starfilters-app`.

