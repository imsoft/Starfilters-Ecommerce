# 🚀 Guía Completa: Desplegar en VPS de Hostinger

Esta guía te ayudará a desplegar tu proyecto Astro en un VPS de Hostinger paso a paso.

---

## 📋 TABLA DE CONTENIDOS

1. [Contratar y Configurar VPS](#1-contratar-y-configurar-vps)
2. [Configuración Inicial del Servidor](#2-configuración-inicial-del-servidor)
3. [Instalar Software Necesario](#3-instalar-software-necesario)
4. [Configurar Base de Datos](#4-configurar-base-de-datos)
5. [Clonar y Configurar el Proyecto](#5-clonar-y-configurar-el-proyecto)
6. [Configurar Variables de Entorno](#6-configurar-variables-de-entorno)
7. [Build y Ejecutar la Aplicación](#7-build-y-ejecutar-la-aplicación)
8. [Configurar Nginx como Proxy Reverso](#8-configurar-nginx-como-proxy-reverso)
9. [Configurar SSL/HTTPS](#9-configurar-sslhttps)
10. [Configurar PM2 para Auto-reinicio](#10-configurar-pm2-para-auto-reinicio)
11. [Configurar Dominio DNS](#11-configurar-dominio-dns)
12. [Mantenimiento y Actualizaciones](#12-mantenimiento-y-actualizaciones)

---

## 1️⃣ CONTRATAR Y CONFIGURAR VPS

### 1.1 Contratar VPS en Hostinger

1. Accede a tu cuenta de Hostinger
2. Ve a **VPS** → **Contratar VPS**
3. Elige un plan (recomendado: mínimo 2GB RAM, 2 vCPU)
4. Selecciona:
   - **Ubuntu 22.04 LTS** (recomendado) o **Ubuntu 24.04 LTS**
   - **Ubicación**: La más cercana a tus usuarios
5. Completa el proceso de compra

### 1.2 Acceder al VPS

Hostinger te enviará por email:
- **IP del servidor**: `xxx.xxx.xxx.xxx`
- **Usuario root**: `root`
- **Contraseña**: (la que configuraste o te enviaron)

**Conectar por SSH:**

```bash
ssh root@TU_IP_VPS
```

Si es la primera vez, acepta el fingerprint escribiendo `yes`.

---

## 2️⃣ CONFIGURACIÓN INICIAL DEL SERVIDOR

### 2.1 Actualizar el Sistema

```bash
# Actualizar lista de paquetes
apt update

# Actualizar sistema
apt upgrade -y

# Reiniciar si es necesario
reboot
```

### 2.2 Crear Usuario No-root (Recomendado)

```bash
# Crear nuevo usuario
adduser starfilters

# Agregar a grupo sudo
usermod -aG sudo starfilters

# Cambiar a ese usuario
su - starfilters
```

### 2.3 Configurar Firewall (UFW)

```bash
# Instalar UFW si no está instalado
apt install ufw -y

# Permitir SSH (IMPORTANTE: hacer esto primero)
ufw allow OpenSSH

# Permitir HTTP y HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Habilitar firewall
ufw enable

# Verificar estado
ufw status
```

---

## 3️⃣ INSTALAR SOFTWARE NECESARIO

### 3.1 Instalar Node.js (v20 o superior)

```bash
# Instalar Node.js usando NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node --version  # Debe ser v20.x.x o superior
npm --version
```

### 3.2 Instalar pnpm

```bash
# Instalar pnpm globalmente
npm install -g pnpm

# Verificar instalación
pnpm --version
```

### 3.3 Instalar MySQL

```bash
# Instalar MySQL
sudo apt install mysql-server -y

# Configurar MySQL (ejecutar script de seguridad)
sudo mysql_secure_installation

# Durante la configuración:
# - Establecer contraseña para root: SÍ
# - Remover usuarios anónimos: SÍ
# - Deshabilitar login remoto root: SÍ
# - Remover base de datos test: SÍ
# - Recargar privilegios: SÍ
```

### 3.4 Instalar Nginx

```bash
# Instalar Nginx
sudo apt install nginx -y

# Iniciar y habilitar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar estado
sudo systemctl status nginx
```

### 3.5 Instalar PM2 (Process Manager)

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Configurar PM2 para iniciar al arrancar
pm2 startup systemd
# Copia el comando que te muestra y ejecútalo (será algo como):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u starfilters --hp /home/starfilters
```

---

## 4️⃣ CONFIGURAR BASE DE DATOS

### 4.1 Crear Base de Datos y Usuario

```bash
# Conectar a MySQL
sudo mysql -u root -p

# Dentro de MySQL, ejecutar:
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

### 4.2 Exportar e Importar Base de Datos Local

**En tu máquina local:**

```bash
# Exportar base de datos
mysqldump -u tu_usuario_local -p starfilters_db > starfilters_db.sql
```

**En el VPS:**

```bash
# Subir el archivo SQL al servidor (usando SCP desde tu máquina local)
# scp starfilters_db.sql starfilters@TU_IP_VPS:/home/starfilters/

# O crear el archivo directamente en el servidor y copiar el contenido

# Importar base de datos
mysql -u starfilters_user -p starfilters_db < starfilters_db.sql
```

---

## 5️⃣ CLONAR Y CONFIGURAR EL PROYECTO

### 5.1 Cambiar Adapter de Astro

**⚠️ IMPORTANTE:** El proyecto actualmente usa `@astrojs/vercel`. Para VPS necesitamos cambiar a `@astrojs/node`.

**En tu máquina local, antes de hacer push:**

```bash
# Instalar adapter de Node.js
pnpm add @astrojs/node

# Remover adapter de Vercel (opcional, puedes dejarlo)
# pnpm remove @astrojs/vercel
```

**Actualizar `astro.config.mjs`:**

```javascript
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://starfilters.com',
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  // ... resto de la configuración
});
```

### 5.2 Clonar Repositorio en el VPS

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

## 6️⃣ CONFIGURAR VARIABLES DE ENTORNO

### 6.1 Crear Archivo .env

```bash
# Crear archivo .env
nano .env
```

**Contenido del archivo `.env`:**

```env
# Base de Datos
DB_HOST=localhost
DB_USER=starfilters_user
DB_PASSWORD=TU_CONTRASEÑA_MYSQL
DB_NAME=starfilters_db
DB_PORT=3306

# JWT
JWT_SECRET=TU_JWT_SECRET_SUPER_SEGURO_ALEATORIO_AQUI
JWT_EXPIRES_IN=7d

# Node
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Stripe (Producción)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Email SMTP
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=noreply@tudominio.com
SMTP_PASS=tu_contraseña_email
FROM_EMAIL=noreply@tudominio.com

# Aplicación
PUBLIC_SITE_URL=https://tudominio.com
```

**Guardar:** `Ctrl + O`, `Enter`, `Ctrl + X`

### 6.2 Generar JWT_SECRET Seguro

```bash
# Generar un JWT_SECRET aleatorio
openssl rand -base64 32
```

Copia el resultado y úsalo como `JWT_SECRET` en el archivo `.env`.

---

## 7️⃣ BUILD Y EJECUTAR LA APLICACIÓN

### 7.1 Hacer Build del Proyecto

```bash
# Asegúrate de estar en el directorio del proyecto
cd ~/starfilters-app

# Hacer build
pnpm build
```

### 7.2 Verificar que server.js Existe

El archivo `server.js` ya debería existir. Si no, créalo:

```bash
cat server.js
```

Debería mostrar el contenido del servidor.

### 7.3 Probar la Aplicación Manualmente

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

## 8️⃣ CONFIGURAR NGINX COMO PROXY REVERSO

### 8.1 Crear Configuración de Nginx

```bash
# Crear archivo de configuración
sudo nano /etc/nginx/sites-available/starfilters
```

**Contenido:**

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

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

### 8.2 Habilitar el Sitio

```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/starfilters /etc/nginx/sites-enabled/

# Eliminar configuración por defecto (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Probar configuración
sudo nginx -t

# Si todo está bien, recargar Nginx
sudo systemctl reload nginx
```

---

## 9️⃣ CONFIGURAR SSL/HTTPS

### 9.1 Instalar Certbot

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y
```

### 9.2 Obtener Certificado SSL

```bash
# Obtener certificado (reemplaza tudominio.com con tu dominio)
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

Certbot te pedirá:
- Email para notificaciones
- Aceptar términos y condiciones
- Si quieres redirigir HTTP a HTTPS: **Sí (2)**

### 9.3 Verificar Renovación Automática

```bash
# Probar renovación automática
sudo certbot renew --dry-run
```

Los certificados se renuevan automáticamente cada 90 días.

---

## 🔟 CONFIGURAR PM2 PARA AUTO-REINICIO

### 10.1 Iniciar Aplicación con PM2

```bash
# Ir al directorio del proyecto
cd ~/starfilters-app

# Iniciar aplicación con PM2
pm2 start server.js --name starfilters-app

# Guardar configuración para auto-inicio
pm2 save
```

### 10.2 Comandos Útiles de PM2

```bash
# Ver estado de aplicaciones
pm2 status

# Ver logs
pm2 logs starfilters-app

# Reiniciar aplicación
pm2 restart starfilters-app

# Detener aplicación
pm2 stop starfilters-app

# Ver información detallada
pm2 info starfilters-app

# Monitoreo en tiempo real
pm2 monit
```

---

## 1️⃣1️⃣ CONFIGURAR DOMINIO DNS

### 11.1 Configurar Registros DNS

En el panel de tu proveedor de dominio (Hostinger o donde tengas el dominio):

**Agregar registros A:**

```
Tipo: A
Nombre: @
Valor: TU_IP_VPS
TTL: 3600

Tipo: A
Nombre: www
Valor: TU_IP_VPS
TTL: 3600
```

### 11.2 Verificar DNS

```bash
# Verificar que el dominio apunta al VPS
dig tudominio.com
nslookup tudominio.com
```

---

## 1️⃣2️⃣ MANTENIMIENTO Y ACTUALIZACIONES

### 12.1 Actualizar el Proyecto

```bash
# Conectar al VPS
ssh starfilters@TU_IP_VPS

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

### 12.2 Backup de Base de Datos

```bash
# Crear script de backup
nano ~/backup-db.sh
```

**Contenido:**

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$HOME/backups"
mkdir -p $BACKUP_DIR

mysqldump -u starfilters_user -pTU_CONTRASEÑA starfilters_db > $BACKUP_DIR/starfilters_db_$DATE.sql

# Eliminar backups más antiguos de 7 días
find $BACKUP_DIR -name "starfilters_db_*.sql" -mtime +7 -delete
```

```bash
# Hacer ejecutable
chmod +x ~/backup-db.sh

# Agregar a crontab (backup diario a las 2 AM)
crontab -e
# Agregar esta línea:
0 2 * * * /home/starfilters/backup-db.sh
```

### 12.3 Monitoreo

```bash
# Ver uso de recursos
htop

# Ver espacio en disco
df -h

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## ✅ CHECKLIST FINAL

- [ ] VPS contratado y accesible por SSH
- [ ] Sistema actualizado
- [ ] Firewall configurado
- [ ] Node.js y pnpm instalados
- [ ] MySQL instalado y configurado
- [ ] Base de datos creada e importada
- [ ] Nginx instalado y configurado
- [ ] Proyecto clonado y dependencias instaladas
- [ ] Variables de entorno configuradas
- [ ] Build del proyecto completado
- [ ] Aplicación corriendo con PM2
- [ ] Nginx configurado como proxy reverso
- [ ] SSL/HTTPS configurado
- [ ] Dominio DNS configurado
- [ ] Aplicación accesible en https://tudominio.com

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### La aplicación no inicia

```bash
# Ver logs de PM2
pm2 logs starfilters-app

# Verificar que el puerto 3000 esté libre
sudo netstat -tulpn | grep 3000

# Verificar variables de entorno
cd ~/starfilters-app
cat .env
```

### Error de conexión a base de datos

```bash
# Probar conexión MySQL
mysql -u starfilters_user -p starfilters_db

# Verificar que MySQL esté corriendo
sudo systemctl status mysql
```

### Nginx no funciona

```bash
# Verificar configuración
sudo nginx -t

# Ver logs de error
sudo tail -f /var/log/nginx/error.log
```

### Certificado SSL no se renueva

```bash
# Forzar renovación
sudo certbot renew --force-renewal
```

---

## 📞 SOPORTE

Si tienes problemas, verifica:
1. Logs de PM2: `pm2 logs starfilters-app`
2. Logs de Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Estado de servicios: `sudo systemctl status nginx mysql`

---

**¡Listo! Tu aplicación debería estar funcionando en https://tudominio.com** 🎉

