# 🚀 Despliegue en VPS Hostinger - starfilters.mx

## 📋 Información del Servidor

- **IP del VPS**: `72.60.228.9`
- **Dominio**: `starfilters.mx`
- **Usuario SSH**: `root`
- **Comando SSH**: `ssh root@72.60.228.9`

---

## 🎯 PASOS DE DESPLIEGUE

### 1️⃣ Conectar al VPS

```bash
ssh root@72.60.228.9
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

# Verificar instalación
node --version  # Debe ser v20.x.x o superior
npm --version

# Instalar pnpm
npm install -g pnpm

# Instalar MySQL
apt install mysql-server -y
mysql_secure_installation
# Durante la configuración:
# - Establecer contraseña para root: SÍ
# - Remover usuarios anónimos: SÍ
# - Deshabilitar login remoto root: SÍ
# - Remover base de datos test: SÍ
# - Recargar privilegios: SÍ

# Instalar Nginx
apt install nginx -y
systemctl start nginx
systemctl enable nginx

# Instalar PM2
npm install -g pm2

# Configurar firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

### 3️⃣ Configurar Base de Datos

```bash
# Conectar a MySQL
mysql -u root -p
```

**Dentro de MySQL, ejecutar (reemplaza `TU_CONTRASEÑA_SEGURA` con una contraseña fuerte):**

```sql
CREATE DATABASE starfilters_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'starfilters_user'@'localhost' IDENTIFIED BY 'TU_CONTRASEÑA_SEGURA';
GRANT ALL PRIVILEGES ON starfilters_db.* TO 'starfilters_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**⚠️ IMPORTANTE:** Guarda estas credenciales:
- Base de datos: `starfilters_db`
- Usuario: `starfilters_user`
- Contraseña: (la que configuraste)

---

### 4️⃣ Clonar el Proyecto

```bash
# Ir al directorio home
cd ~

# Clonar repositorio
git clone https://github.com/imsoft/Starfilters-Ecommerce.git starfilters-app

# Ir al directorio del proyecto
cd starfilters-app

# Instalar dependencias
pnpm install
```

---

### 5️⃣ Configurar Variables de Entorno

```bash
# Crear archivo .env
nano .env
```

**Pega este contenido y reemplaza los valores con tus credenciales reales:**

```env
# Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=starfilters_db
DB_USER=starfilters_user
DB_PASSWORD=TU_CONTRASEÑA_MYSQL_AQUI

# JWT (genera uno con: openssl rand -base64 32)
JWT_SECRET=GENERA_UN_SECRETO_AQUI

# Node
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Stripe (Producción - reemplaza con tus keys reales)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=MXN

# Cloudinary (reemplaza con tus credenciales)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Sitio
SITE_URL=https://starfilters.mx
PUBLIC_SITE_URL=https://starfilters.mx
ADMIN_EMAIL=admin@starfilters.mx
```

**Para generar JWT_SECRET:**
```bash
openssl rand -base64 32
```
Copia el resultado y úsalo como `JWT_SECRET` en el `.env`.

**Guardar:** `Ctrl + O`, `Enter`, `Ctrl + X`

---

### 6️⃣ Importar Base de Datos (si tienes datos locales)

**En tu máquina local:**
```bash
mysqldump -u tu_usuario -p starfilters_db > starfilters_db.sql
scp starfilters_db.sql root@72.60.228.9:/root/
```

**En el VPS:**
```bash
mysql -u starfilters_user -p starfilters_db < starfilters_db.sql
```

---

### 7️⃣ Build del Proyecto

```bash
cd ~/starfilters-app

# Build del proyecto
pnpm build

# Verificar que se creó el directorio dist
ls -la dist/
```

---

### 8️⃣ Probar la Aplicación Manualmente

```bash
# Ejecutar manualmente para probar
node server.js
```

Deberías ver:
```
🚀 Server running on http://0.0.0.0:3000
📦 Environment: production
```

**Presiona `Ctrl + C` para detener.**

---

### 9️⃣ Configurar Nginx

```bash
# Crear configuración
nano /etc/nginx/sites-available/starfilters
```

**Contenido completo:**

```nginx
server {
    listen 80;
    server_name starfilters.mx www.starfilters.mx;

    # Tamaño máximo de archivo para uploads
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

**Guardar:** `Ctrl + O`, `Enter`, `Ctrl + X`

**Habilitar el sitio:**
```bash
# Crear enlace simbólico
ln -s /etc/nginx/sites-available/starfilters /etc/nginx/sites-enabled/

# Eliminar configuración por defecto
rm /etc/nginx/sites-enabled/default

# Probar configuración
nginx -t

# Si todo está bien, recargar Nginx
systemctl reload nginx
```

---

### 🔟 Iniciar con PM2

```bash
cd ~/starfilters-app

# Iniciar aplicación
pm2 start server.js --name starfilters-app

# Guardar configuración para auto-inicio
pm2 save

# Configurar PM2 para iniciar al arrancar
pm2 startup
# Copia el comando que te muestra y ejecútalo (será algo como):
# env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
```

---

### 1️⃣1️⃣ Configurar SSL/HTTPS

```bash
# Instalar Certbot
apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL
certbot --nginx -d starfilters.mx -d www.starfilters.mx
```

Certbot te pedirá:
- Email para notificaciones
- Aceptar términos y condiciones
- Si quieres redirigir HTTP a HTTPS: **Sí (2)**

---

### 1️⃣2️⃣ Configurar DNS (si aún no está configurado)

En el panel de tu proveedor de dominio (Hostinger o donde tengas el dominio):

**Agregar registros A:**
```
Tipo: A
Nombre: @
Valor: 72.60.228.9
TTL: 3600

Tipo: A
Nombre: www
Valor: 72.60.228.9
TTL: 3600
```

**Verificar DNS:**
```bash
dig starfilters.mx
nslookup starfilters.mx
```

---

## ✅ Verificar que Todo Funciona

```bash
# Ver estado de PM2
pm2 status

# Ver logs
pm2 logs starfilters-app

# Ver información detallada
pm2 info starfilters-app

# Verificar Nginx
systemctl status nginx

# Verificar MySQL
systemctl status mysql
```

**Abrir en el navegador:**
- http://starfilters.mx (debería redirigir a HTTPS)
- https://starfilters.mx

---

## 🔄 Actualizar el Proyecto (cuando hagas cambios)

```bash
# Conectar al VPS
ssh root@72.60.228.9

# Ir al directorio del proyecto
cd ~/starfilters-app

# Obtener últimos cambios
git pull origin main

# Instalar nuevas dependencias (si hay)
pnpm install

# Rebuild
pnpm build

# Reiniciar aplicación
pm2 restart starfilters-app

# Ver logs para verificar
pm2 logs starfilters-app --lines 50
```

---

## 🆘 Solución de Problemas

### La aplicación no inicia
```bash
# Ver logs de PM2
pm2 logs starfilters-app

# Verificar que el puerto 3000 esté libre
netstat -tulpn | grep 3000

# Verificar variables de entorno
cd ~/starfilters-app
cat .env
```

### Error de conexión a base de datos
```bash
# Probar conexión MySQL
mysql -u starfilters_user -p starfilters_db

# Verificar que MySQL esté corriendo
systemctl status mysql
```

### Nginx no funciona
```bash
# Verificar configuración
nginx -t

# Ver logs de error
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Certificado SSL no se renueva
```bash
# Forzar renovación
certbot renew --force-renewal

# Probar renovación automática
certbot renew --dry-run
```

---

## 📞 Comandos Útiles

```bash
# Ver estado de la app
pm2 status

# Reiniciar app
pm2 restart starfilters-app

# Detener app
pm2 stop starfilters-app

# Ver logs en tiempo real
pm2 logs starfilters-app --lines 50

# Monitoreo en tiempo real
pm2 monit

# Ver uso de recursos
htop

# Ver espacio en disco
df -h
```

---

## 📋 Checklist Final

- [ ] VPS accesible por SSH
- [ ] Sistema actualizado
- [ ] Node.js y pnpm instalados
- [ ] MySQL instalado y base de datos creada
- [ ] Nginx instalado y configurado
- [ ] Proyecto clonado y dependencias instaladas
- [ ] Variables de entorno configuradas (.env)
- [ ] Build del proyecto completado
- [ ] Aplicación corriendo con PM2
- [ ] Nginx configurado como proxy reverso
- [ ] SSL/HTTPS configurado
- [ ] DNS configurado (si aplica)
- [ ] Aplicación accesible en https://starfilters.mx

---

**¡Listo! Tu aplicación debería estar funcionando en https://starfilters.mx** 🎉

Si tienes problemas, revisa los logs con `pm2 logs starfilters-app`.

