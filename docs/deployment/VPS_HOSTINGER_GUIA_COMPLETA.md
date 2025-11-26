# 🚀 Guía Completa: Desplegar StarFilters en VPS Hostinger

## 📋 ÍNDICE

1. [Contratar VPS KVM](#1-contratar-vps-kvm)
2. [Configuración Inicial del Servidor](#2-configuración-inicial-del-servidor)
3. [Instalar Software Necesario](#3-instalar-software-necesario)
4. [Configurar Base de Datos MySQL](#4-configurar-base-de-datos-mysql)
5. [Preparar el Proyecto (Cambiar Adapter)](#5-preparar-el-proyecto-cambiar-adapter)
6. [Clonar y Configurar el Proyecto](#6-clonar-y-configurar-el-proyecto)
7. [Configurar Variables de Entorno](#7-configurar-variables-de-entorno)
8. [Build y Ejecutar la Aplicación](#8-build-y-ejecutar-la-aplicación)
9. [Configurar Nginx como Proxy Reverso](#9-configurar-nginx-como-proxy-reverso)
10. [Configurar SSL/HTTPS con Let's Encrypt](#10-configurar-sslhttps-con-lets-encrypt)
11. [Configurar PM2 para Auto-reinicio](#11-configurar-pm2-para-auto-reinicio)
12. [Configurar Dominio DNS](#12-configurar-dominio-dns)
13. [Mantenimiento y Actualizaciones](#13-mantenimiento-y-actualizaciones)
14. [Solución de Problemas](#14-solución-de-problemas)

---

## 1️⃣ CONTRATAR VPS KVM

### Pasos en Hostinger:

1. **En el panel de Hostinger:**
   - Ve a **VPS** → **VPS KVM**
   - Haz clic en **"Obtener ya"**

2. **Elegir plan:**
   - **Mínimo recomendado:** 2GB RAM, 2 vCPU, 40GB SSD
   - **Ideal:** 4GB RAM, 4 vCPU, 80GB SSD (para mejor rendimiento)

3. **Configurar VPS:**
   - **Sistema Operativo:** Ubuntu 22.04 LTS (recomendado) o Ubuntu 24.04 LTS
   - **Ubicación:** La más cercana a tus usuarios
   - **Hostname:** `starfilters` (o el que prefieras)

4. **Completar compra**

### 📧 Información que recibirás por email:

- **IP del servidor:** `xxx.xxx.xxx.xxx`
- **Usuario root:** `root`
- **Contraseña root:** (la que configuraste o te enviaron)

---

## 2️⃣ CONFIGURACIÓN INICIAL DEL SERVIDOR

### 2.1 Conectar por SSH

**Desde tu máquina local (Mac/Linux):**

```bash
ssh root@TU_IP_VPS
```

**Desde Windows:**
- Usa **PuTTY** o **Windows Terminal**
- O instala **Git Bash** y usa el comando anterior

**Si es la primera vez, acepta el fingerprint escribiendo `yes`**

### 2.2 Actualizar el Sistema

```bash
# Actualizar lista de paquetes
apt update

# Actualizar todos los paquetes instalados
apt upgrade -y

# Reiniciar si hay actualizaciones del kernel
reboot
```

**Espera 30 segundos y reconecta:**

```bash
ssh root@TU_IP_VPS
```

### 2.3 Crear Usuario No-root (Seguridad)

```bash
# Crear nuevo usuario
adduser starfilters

# Durante la creación, te pedirá:
# - Nueva contraseña: (elige una segura)
# - Confirmar contraseña: (repite)
# - Información adicional: (puedes presionar Enter para omitir)

# Agregar usuario al grupo sudo (permisos de administrador)
usermod -aG sudo starfilters

# Cambiar a ese usuario
su - starfilters
```

**De ahora en adelante, usa este usuario en lugar de root.**

### 2.4 Configurar Firewall (UFW)

```bash
# Instalar UFW si no está instalado
sudo apt install ufw -y

# Permitir SSH (IMPORTANTE: hacer esto primero para no quedar bloqueado)
sudo ufw allow OpenSSH

# Permitir HTTP (puerto 80)
sudo ufw allow 80/tcp

# Permitir HTTPS (puerto 443)
sudo ufw allow 443/tcp

# Habilitar firewall
sudo ufw enable

# Verificar estado
sudo ufw status
```

**Deberías ver:**
```
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

---

## 3️⃣ INSTALAR SOFTWARE NECESARIO

### 3.1 Instalar Node.js (v20 o superior)

```bash
# Instalar Node.js usando NodeSource (repositorio oficial)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instalar Node.js
sudo apt install -y nodejs

# Verificar instalación
node --version
# Debe mostrar: v20.x.x o superior

npm --version
# Debe mostrar: 10.x.x o superior
```

### 3.2 Instalar pnpm

```bash
# Instalar pnpm globalmente
sudo npm install -g pnpm

# Verificar instalación
pnpm --version
# Debe mostrar: 9.x.x o superior
```

### 3.3 Instalar MySQL

```bash
# Instalar MySQL Server
sudo apt install mysql-server -y

# Configurar MySQL (script de seguridad)
sudo mysql_secure_installation
```

**Durante la configuración, responde:**

```
VALIDATE PASSWORD COMPONENT: y (Sí)
Password validation policy: 1 (MEDIUM es suficiente)
New password: [TU_CONTRASEÑA_SEGURA_PARA_MYSQL_ROOT]
Re-enter new password: [REPETIR]
Remove anonymous users: y (Sí)
Disallow root login remotely: y (Sí)
Remove test database: y (Sí)
Reload privilege tables: y (Sí)
```

**⚠️ IMPORTANTE:** Guarda la contraseña de MySQL root que acabas de crear.

### 3.4 Instalar Nginx

```bash
# Instalar Nginx
sudo apt install nginx -y

# Iniciar Nginx
sudo systemctl start nginx

# Habilitar Nginx para que inicie automáticamente al reiniciar
sudo systemctl enable nginx

# Verificar que está corriendo
sudo systemctl status nginx
```

**Deberías ver:** `Active: active (running)`

**Probar en el navegador:** Ve a `http://TU_IP_VPS` - deberías ver la página de bienvenida de Nginx.

### 3.5 Instalar PM2 (Process Manager)

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Configurar PM2 para iniciar al arrancar el servidor
pm2 startup systemd
```

**PM2 te mostrará un comando como este:**

```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u starfilters --hp /home/starfilters
```

**Copia y ejecuta ese comando exactamente como te lo muestra PM2.**

---

## 4️⃣ CONFIGURAR BASE DE DATOS MYSQL

### 4.1 Crear Base de Datos y Usuario

```bash
# Conectar a MySQL como root
sudo mysql -u root -p
# Ingresa la contraseña de MySQL root que configuraste antes
```

**Dentro de MySQL, ejecuta estos comandos:**

```sql
-- Crear base de datos
CREATE DATABASE starfilters_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario
CREATE USER 'starfilters_user'@'localhost' IDENTIFIED BY 'TU_CONTRASEÑA_SEGURA_AQUI';

-- Dar todos los privilegios al usuario
GRANT ALL PRIVILEGES ON starfilters_db.* TO 'starfilters_user'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Verificar que se creó
SHOW DATABASES;

-- Salir
EXIT;
```

**⚠️ IMPORTANTE:** Guarda estas credenciales:
- **Base de datos:** `starfilters_db`
- **Usuario:** `starfilters_user`
- **Contraseña:** (la que pusiste en el comando CREATE USER)

### 4.2 Exportar Base de Datos Local

**En tu máquina local:**

```bash
# Exportar base de datos
mysqldump -u tu_usuario_local -p starfilters_db > starfilters_db.sql
```

**Si no tienes la base de datos local, puedes crear las tablas manualmente después.**

### 4.3 Importar Base de Datos al VPS

**Opción A: Usando SCP (desde tu máquina local)**

```bash
# Desde tu máquina local
scp starfilters_db.sql starfilters@TU_IP_VPS:/home/starfilters/
```

**Opción B: Subir archivo manualmente**

1. Usa un cliente FTP (FileZilla) o
2. Crea el archivo directamente en el servidor

**En el VPS:**

```bash
# Importar base de datos
mysql -u starfilters_user -p starfilters_db < starfilters_db.sql
# Ingresa la contraseña de starfilters_user
```

**Verificar que se importó:**

```bash
mysql -u starfilters_user -p starfilters_db
```

```sql
SHOW TABLES;
EXIT;
```

---

## 5️⃣ PREPARAR EL PROYECTO (CAMBIAR ADAPTER)

### 5.1 En tu Máquina Local

**El proyecto actualmente usa `@astrojs/vercel`. Para VPS necesitamos `@astrojs/node`.**

```bash
# Ir al directorio del proyecto
cd /Users/brangarciaramos/Proyectos/imSoft/sitios-web/starfilters-ecommerce

# Instalar adapter de Node.js
pnpm add @astrojs/node

# Opcional: remover adapter de Vercel (o déjalo si también usas Vercel)
# pnpm remove @astrojs/vercel
```

### 5.2 Actualizar astro.config.mjs

**Abre `astro.config.mjs` y cámbialo a:**

```javascript
// @ts-check

import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://starfilters.com',
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),

  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: false
    }
  },

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [react()],
});
```

### 5.3 Commit y Push

```bash
# Verificar cambios
git status

# Agregar cambios
git add astro.config.mjs package.json pnpm-lock.yaml

# Commit
git commit -m "feat: cambiar adapter a Node.js para VPS Hostinger"

# Push
git push
```

---

## 6️⃣ CLONAR Y CONFIGURAR EL PROYECTO

### 6.1 Clonar Repositorio en el VPS

```bash
# Ir al directorio home
cd ~

# Clonar repositorio
git clone https://github.com/imsoft/Starfilters-Ecommerce.git starfilters-app

# Ir al directorio del proyecto
cd starfilters-app

# Verificar que estás en la rama correcta
git branch
```

### 6.2 Instalar Dependencias

```bash
# Instalar todas las dependencias
pnpm install

# Esto puede tardar varios minutos
```

---

## 7️⃣ CONFIGURAR VARIABLES DE ENTORNO

### 7.1 Crear Archivo .env

```bash
# Crear archivo .env
nano .env
```

### 7.2 Contenido del Archivo .env

**Pega este contenido y reemplaza los valores con tus credenciales reales:**

```env
# Base de Datos
DB_HOST=localhost
DB_USER=starfilters_user
DB_PASSWORD=TU_CONTRASEÑA_MYSQL_AQUI
DB_NAME=starfilters_db
DB_PORT=3306

# JWT
JWT_SECRET=GENERA_UN_SECRET_ALEATORIO_AQUI
JWT_EXPIRES_IN=7d

# Node
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Stripe (Producción - usa las claves LIVE)
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

### 7.3 Generar JWT_SECRET

```bash
# Generar un JWT_SECRET aleatorio y seguro
openssl rand -base64 32
```

**Copia el resultado y úsalo como valor de `JWT_SECRET` en el archivo `.env`.**

### 7.4 Guardar el Archivo

**En nano:**
- `Ctrl + O` (guardar)
- `Enter` (confirmar nombre)
- `Ctrl + X` (salir)

---

## 8️⃣ BUILD Y EJECUTAR LA APLICACIÓN

### 8.1 Hacer Build del Proyecto

```bash
# Asegúrate de estar en el directorio del proyecto
cd ~/starfilters-app

# Hacer build (esto puede tardar varios minutos)
pnpm build
```

**Si hay errores, revísalos y corrígelos antes de continuar.**

### 8.2 Verificar que server.js Existe

```bash
# Verificar que el archivo existe
ls -la server.js

# Ver contenido (debería mostrar el código del servidor)
cat server.js
```

### 8.3 Probar la Aplicación Manualmente

```bash
# Ejecutar manualmente para probar
node server.js
```

**Deberías ver:**
```
🚀 Server running on http://0.0.0.0:3000
📦 Environment: production
```

**Abre otra terminal SSH y prueba:**

```bash
curl http://localhost:3000
```

**Si funciona, presiona `Ctrl + C` en la primera terminal para detener el servidor.**

---

## 9️⃣ CONFIGURAR NGINX COMO PROXY REVERSO

### 9.1 Crear Configuración de Nginx

```bash
# Crear archivo de configuración
sudo nano /etc/nginx/sites-available/starfilters
```

### 9.2 Contenido de la Configuración

**Pega este contenido (reemplaza `tudominio.com` con tu dominio real):**

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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

**Guardar:** `Ctrl + O`, `Enter`, `Ctrl + X`

### 9.3 Habilitar el Sitio

```bash
# Crear enlace simbólico para habilitar el sitio
sudo ln -s /etc/nginx/sites-available/starfilters /etc/nginx/sites-enabled/

# Eliminar configuración por defecto (opcional pero recomendado)
sudo rm /etc/nginx/sites-enabled/default

# Probar configuración de Nginx
sudo nginx -t
```

**Deberías ver:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 9.4 Recargar Nginx

```bash
# Recargar Nginx para aplicar cambios
sudo systemctl reload nginx

# Verificar estado
sudo systemctl status nginx
```

**Ahora deberías poder acceder a tu aplicación en:** `http://TU_IP_VPS`

---

## 🔟 CONFIGURAR SSL/HTTPS CON LET'S ENCRYPT

### 10.1 Instalar Certbot

```bash
# Instalar Certbot y plugin de Nginx
sudo apt install certbot python3-certbot-nginx -y
```

### 10.2 Obtener Certificado SSL

**⚠️ IMPORTANTE:** Asegúrate de que tu dominio ya apunta al VPS antes de continuar.

```bash
# Obtener certificado SSL (reemplaza tudominio.com con tu dominio)
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

**Certbot te pedirá:**

1. **Email:** Ingresa tu email para notificaciones de renovación
2. **Términos y condiciones:** Escribe `A` para aceptar
3. **Compartir email con EFF:** Escribe `N` (No) o `Y` (Sí) según prefieras
4. **Redirigir HTTP a HTTPS:** Escribe `2` para **Sí (recomendado)**

**Si todo sale bien, verás:**
```
Congratulations! You have successfully enabled https://tudominio.com
```

### 10.3 Verificar Renovación Automática

```bash
# Probar renovación automática
sudo certbot renew --dry-run
```

**Los certificados se renuevan automáticamente cada 90 días.**

### 10.4 Verificar que HTTPS Funciona

**Abre en el navegador:** `https://tudominio.com`

**Deberías ver:**
- 🔒 Candado verde en la barra de direcciones
- Tu aplicación funcionando correctamente

---

## 1️⃣1️⃣ CONFIGURAR PM2 PARA AUTO-REINICIO

### 11.1 Iniciar Aplicación con PM2

```bash
# Ir al directorio del proyecto
cd ~/starfilters-app

# Iniciar aplicación con PM2
pm2 start server.js --name starfilters-app

# Ver estado
pm2 status
```

**Deberías ver algo como:**
```
┌─────┬─────────────────────┬─────────┬─────────┬──────────┐
│ id  │ name                │ status  │ restart │ uptime   │
├─────┼─────────────────────┼─────────┼─────────┼──────────┤
│ 0   │ starfilters-app     │ online  │ 0       │ 5s       │
└─────┴─────────────────────┴─────────┴─────────┴──────────┘
```

### 11.2 Guardar Configuración de PM2

```bash
# Guardar configuración actual
pm2 save

# Esto asegura que PM2 recuerde qué aplicaciones iniciar
```

### 11.3 Comandos Útiles de PM2

```bash
# Ver estado de todas las aplicaciones
pm2 status

# Ver logs en tiempo real
pm2 logs starfilters-app

# Ver solo últimas 50 líneas
pm2 logs starfilters-app --lines 50

# Reiniciar aplicación
pm2 restart starfilters-app

# Detener aplicación
pm2 stop starfilters-app

# Eliminar aplicación de PM2
pm2 delete starfilters-app

# Ver información detallada
pm2 info starfilters-app

# Monitoreo en tiempo real (CPU, memoria)
pm2 monit
```

---

## 1️⃣2️⃣ CONFIGURAR DOMINIO DNS

### 12.1 En el Panel de tu Proveedor de Dominio

**Si tu dominio está en Hostinger:**

1. Ve a **Dominios** → Tu dominio
2. Ve a **Zona DNS** o **DNS**

**Si tu dominio está en otro proveedor (GoDaddy, Namecheap, etc.):**

1. Accede al panel de tu proveedor
2. Busca la sección de **DNS** o **Zona DNS**

### 12.2 Agregar Registros A

**Agrega estos registros:**

```
Tipo: A
Nombre: @
Valor: TU_IP_VPS
TTL: 3600 (o Auto)

Tipo: A
Nombre: www
Valor: TU_IP_VPS
TTL: 3600 (o Auto)
```

### 12.3 Verificar DNS

**Espera 5-15 minutos para que los cambios de DNS se propaguen, luego:**

```bash
# Verificar que el dominio apunta al VPS
dig tudominio.com
nslookup tudominio.com
```

**O usa herramientas online:**
- https://dnschecker.org
- https://www.whatsmydns.net

---

## 1️⃣3️⃣ MANTENIMIENTO Y ACTUALIZACIONES

### 13.1 Actualizar el Proyecto

**Cuando quieras actualizar la aplicación con nuevos cambios:**

```bash
# Conectar al VPS
ssh starfilters@TU_IP_VPS

# Ir al directorio del proyecto
cd ~/starfilters-app

# Obtener últimos cambios de GitHub
git pull origin main

# Instalar nuevas dependencias (si hay)
pnpm install

# Rebuild del proyecto
pnpm build

# Reiniciar aplicación
pm2 restart starfilters-app

# Ver logs para verificar que todo está bien
pm2 logs starfilters-app --lines 50
```

### 13.2 Backup de Base de Datos

**Crear script de backup automático:**

```bash
# Crear directorio para backups
mkdir -p ~/backups

# Crear script de backup
nano ~/backup-db.sh
```

**Contenido del script:**

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$HOME/backups"
mkdir -p $BACKUP_DIR

# Reemplaza TU_CONTRASEÑA con la contraseña real de MySQL
mysqldump -u starfilters_user -pTU_CONTRASEÑA starfilters_db > $BACKUP_DIR/starfilters_db_$DATE.sql

# Comprimir backup
gzip $BACKUP_DIR/starfilters_db_$DATE.sql

# Eliminar backups más antiguos de 30 días
find $BACKUP_DIR -name "starfilters_db_*.sql.gz" -mtime +30 -delete

echo "Backup completado: starfilters_db_$DATE.sql.gz"
```

**Hacer ejecutable:**

```bash
chmod +x ~/backup-db.sh
```

**Agregar a crontab (backup diario a las 2 AM):**

```bash
# Editar crontab
crontab -e

# Agregar esta línea al final:
0 2 * * * /home/starfilters/backup-db.sh >> /home/starfilters/backup.log 2>&1
```

### 13.3 Monitoreo del Servidor

```bash
# Ver uso de CPU y memoria
htop
# (Si no está instalado: sudo apt install htop -y)

# Ver espacio en disco
df -h

# Ver los procesos más pesados
top

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Ver uso de memoria
free -h

# Ver información del sistema
uname -a
```

---

## 1️⃣4️⃣ SOLUCIÓN DE PROBLEMAS

### Problema: No puedo conectar por SSH

**Solución:**
```bash
# Verificar que el firewall permite SSH
sudo ufw status

# Si SSH no está permitido:
sudo ufw allow OpenSSH
```

### Problema: La aplicación no inicia

**Solución:**
```bash
# Ver logs de PM2
pm2 logs starfilters-app

# Verificar que el puerto 3000 esté libre
sudo netstat -tulpn | grep 3000

# Si hay un proceso usando el puerto:
sudo kill -9 PID_DEL_PROCESO

# Verificar variables de entorno
cd ~/starfilters-app
cat .env

# Probar ejecutar manualmente
node server.js
```

### Problema: Error de conexión a base de datos

**Solución:**
```bash
# Probar conexión MySQL
mysql -u starfilters_user -p starfilters_db

# Si no conecta, verificar que MySQL esté corriendo
sudo systemctl status mysql

# Si no está corriendo:
sudo systemctl start mysql
sudo systemctl enable mysql

# Verificar credenciales en .env
cd ~/starfilters-app
cat .env | grep DB_
```

### Problema: Nginx muestra 502 Bad Gateway

**Solución:**
```bash
# Verificar que la aplicación esté corriendo
pm2 status

# Si no está corriendo:
cd ~/starfilters-app
pm2 start server.js --name starfilters-app

# Verificar logs de Nginx
sudo tail -f /var/log/nginx/error.log

# Verificar configuración de Nginx
sudo nginx -t
```

### Problema: Certificado SSL no se renueva

**Solución:**
```bash
# Forzar renovación manual
sudo certbot renew --force-renewal

# Verificar que el servicio de renovación automática esté activo
sudo systemctl status certbot.timer
```

### Problema: Puerto 3000 en uso

**Solución:**
```bash
# Ver qué proceso está usando el puerto
sudo lsof -i :3000

# Matar el proceso
sudo kill -9 PID

# O cambiar el puerto en .env
nano ~/starfilters-app/.env
# Cambiar PORT=3000 a otro puerto, ej: PORT=3001
# Y actualizar Nginx para usar ese puerto
```

### Problema: Build falla

**Solución:**
```bash
# Limpiar y reinstalar dependencias
cd ~/starfilters-app
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Verificar versión de Node.js
node --version  # Debe ser v20 o superior

# Ver logs detallados del build
pnpm build --verbose
```

---

## ✅ CHECKLIST FINAL

Antes de considerar que todo está listo, verifica:

- [ ] VPS KVM contratado y accesible por SSH
- [ ] Sistema operativo actualizado
- [ ] Firewall configurado (UFW)
- [ ] Usuario no-root creado
- [ ] Node.js 20+ instalado
- [ ] pnpm instalado
- [ ] MySQL instalado y configurado
- [ ] Base de datos creada e importada
- [ ] Nginx instalado y configurado
- [ ] PM2 instalado y configurado
- [ ] Proyecto clonado desde GitHub
- [ ] Adapter cambiado a Node.js
- [ ] Dependencias instaladas (`pnpm install`)
- [ ] Archivo `.env` configurado con todas las credenciales
- [ ] Build del proyecto completado (`pnpm build`)
- [ ] Aplicación probada manualmente (`node server.js`)
- [ ] Aplicación corriendo con PM2
- [ ] Nginx configurado como proxy reverso
- [ ] SSL/HTTPS configurado con Certbot
- [ ] Dominio DNS configurado (registros A)
- [ ] Aplicación accesible en `https://tudominio.com`
- [ ] Backup de base de datos configurado

---

## 🎉 ¡FELICIDADES!

Si completaste todos los pasos, tu aplicación StarFilters debería estar funcionando correctamente en:

**🌐 https://tudominio.com**

---

## 📞 SOPORTE ADICIONAL

Si encuentras problemas que no están cubiertos en esta guía:

1. **Revisa los logs:**
   - PM2: `pm2 logs starfilters-app`
   - Nginx: `sudo tail -f /var/log/nginx/error.log`
   - MySQL: `sudo tail -f /var/log/mysql/error.log`

2. **Verifica el estado de los servicios:**
   ```bash
   sudo systemctl status nginx
   sudo systemctl status mysql
   pm2 status
   ```

3. **Consulta la documentación oficial:**
   - Astro: https://docs.astro.build
   - Nginx: https://nginx.org/en/docs/
   - PM2: https://pm2.keymetrics.io/docs/

---

**Última actualización:** Diciembre 2024

