# 📸 Guía Visual Paso a Paso: VPS Hostinger

Esta guía te lleva paso a paso desde la contratación hasta tener tu aplicación funcionando.

---

## PASO 1: CONTRATAR VPS KVM

### 1.1 En el Panel de Hostinger

1. Ve a **VPS** → **VPS KVM**
2. Haz clic en **"Obtener ya"** en la tarjeta de VPS KVM

### 1.2 Elegir Plan

**Plan recomendado:**
- **Mínimo:** 2GB RAM, 2 vCPU, 40GB SSD
- **Ideal:** 4GB RAM, 4 vCPU, 80GB SSD

### 1.3 Configurar VPS

- **Hostname:** `starfilters` (o el que prefieras)
- **Ubicación:** La más cercana a tus usuarios

---

## PASO 2: ELEGIR SISTEMA OPERATIVO

### 2.1 Seleccionar Tipo de Sistema

**⚠️ IMPORTANTE:** En la pantalla "Elige un sistema operativo":

1. **Haz clic en la pestaña: "Sistema operativo simple"**
   - ❌ NO elijas "Sistema operativo con panel" (cPanel, Plesk, etc.)
   - ❌ NO elijas "Aplicación" (WordPress, etc.)

### 2.2 Elegir Ubuntu

**De la lista de sistemas operativos, elige:**

- ✅ **Ubuntu 22.04 LTS** (recomendado) 
- ✅ O **Ubuntu 24.04 LTS**

**Ubuntu es la mejor opción porque:**
- Tiene excelente soporte para Node.js
- Fácil instalación de MySQL y Nginx
- Gran comunidad y documentación
- Actualizaciones de seguridad regulares

### 2.3 Continuar

Haz clic en **Ubuntu** y luego en el botón de continuar/completar compra.

---

## PASO 3: RECIBIR CREDENCIALES

### 3.1 Email de Confirmación

Hostinger te enviará un email con:

- **IP del servidor:** `xxx.xxx.xxx.xxx`
- **Usuario root:** `root`
- **Contraseña root:** (la que configuraste)

**⚠️ GUARDA ESTA INFORMACIÓN EN UN LUGAR SEGURO**

---

## PASO 4: CONECTAR POR SSH

### 4.1 Desde Mac/Linux

```bash
ssh root@TU_IP_VPS
```

### 4.2 Desde Windows

**Opción A: Windows Terminal (Windows 10/11)**
1. Abre Windows Terminal
2. Escribe: `ssh root@TU_IP_VPS`

**Opción B: PuTTY**
1. Descarga PuTTY: https://www.putty.org/
2. Instala y abre
3. En "Host Name": `TU_IP_VPS`
4. Puerto: `22`
5. Tipo de conexión: `SSH`
6. Haz clic en "Open"

### 4.3 Primera Conexión

Si es la primera vez, verás un mensaje como:

```
The authenticity of host 'xxx.xxx.xxx.xxx' can't be established.
Are you sure you want to continue connecting (yes/no)?
```

**Escribe:** `yes` y presiona Enter

### 4.4 Ingresar Contraseña

Te pedirá la contraseña de root. **Pégala y presiona Enter** (no verás los caracteres mientras escribes, es normal).

**Si conectaste exitosamente, verás algo como:**

```
Welcome to Ubuntu 22.04 LTS
root@vps-xxx:~#
```

---

## PASO 5: ACTUALIZAR EL SISTEMA

### 5.1 Actualizar Paquetes

```bash
# Actualizar lista de paquetes
apt update

# Actualizar todos los paquetes
apt upgrade -y
```

**Esto puede tardar 5-10 minutos.**

### 5.2 Reiniciar (si es necesario)

```bash
# Si hay actualizaciones del kernel, reinicia
reboot
```

**Espera 30 segundos y reconecta:**

```bash
ssh root@TU_IP_VPS
```

---

## PASO 6: CREAR USUARIO NO-ROOT

### 6.1 Crear Usuario

```bash
adduser starfilters
```

**Te pedirá:**
- Nueva contraseña: (elige una segura, guárdala)
- Confirmar contraseña: (repite)
- Nombre completo: (presiona Enter para omitir)
- Número de habitación: (presiona Enter)
- Teléfono: (presiona Enter)
- Otro: (presiona Enter)
- ¿Es correcta la información? (Y/n): `Y`

### 6.2 Dar Permisos de Administrador

```bash
usermod -aG sudo starfilters
```

### 6.3 Cambiar a ese Usuario

```bash
su - starfilters
```

**Ahora verás:** `starfilters@vps-xxx:~$` (en lugar de `root@`)

---

## PASO 7: CONFIGURAR FIREWALL

### 7.1 Instalar UFW

```bash
sudo apt install ufw -y
```

### 7.2 Configurar Reglas

```bash
# Permitir SSH (IMPORTANTE: primero esto)
sudo ufw allow OpenSSH

# Permitir HTTP
sudo ufw allow 80/tcp

# Permitir HTTPS
sudo ufw allow 443/tcp
```

### 7.3 Activar Firewall

```bash
sudo ufw enable
```

**Te preguntará:** `Command may disrupt existing ssh connections. Proceed with operation (y|n)?`

**Escribe:** `y`

### 7.4 Verificar

```bash
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

## PASO 8: INSTALAR NODE.JS

### 8.1 Agregar Repositorio de NodeSource

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
```

### 8.2 Instalar Node.js

```bash
sudo apt install -y nodejs
```

### 8.3 Verificar Instalación

```bash
node --version
```

**Debería mostrar:** `v20.x.x` o superior

```bash
npm --version
```

**Debería mostrar:** `10.x.x` o superior

---

## PASO 9: INSTALAR PNPM

```bash
sudo npm install -g pnpm
```

**Verificar:**

```bash
pnpm --version
```

**Debería mostrar:** `9.x.x` o superior

---

## PASO 10: INSTALAR MYSQL

### 10.1 Instalar MySQL Server

```bash
sudo apt install mysql-server -y
```

### 10.2 Configurar Seguridad

```bash
sudo mysql_secure_installation
```

**Responde así:**

```
VALIDATE PASSWORD COMPONENT: y
Password validation policy: 1 (MEDIUM)
New password: [TU_CONTRASEÑA_SEGURA]
Re-enter new password: [REPETIR]
Remove anonymous users: y
Disallow root login remotely: y
Remove test database: y
Reload privilege tables: y
```

**⚠️ GUARDA LA CONTRASEÑA DE MYSQL ROOT**

---

## PASO 11: CREAR BASE DE DATOS

### 11.1 Conectar a MySQL

```bash
sudo mysql -u root -p
```

**Ingresa la contraseña de MySQL root que configuraste.**

### 11.2 Crear Base de Datos y Usuario

**Dentro de MySQL, ejecuta (copia y pega todo):**

```sql
CREATE DATABASE starfilters_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'starfilters_user'@'localhost' IDENTIFIED BY 'TU_CONTRASEÑA_SEGURA_AQUI';
GRANT ALL PRIVILEGES ON starfilters_db.* TO 'starfilters_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**⚠️ REEMPLAZA `TU_CONTRASEÑA_SEGURA_AQUI` con una contraseña real y guárdala.**

---

## PASO 12: INSTALAR NGINX

### 12.1 Instalar Nginx

```bash
sudo apt install nginx -y
```

### 12.2 Iniciar y Habilitar

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 12.3 Verificar

```bash
sudo systemctl status nginx
```

**Deberías ver:** `Active: active (running)`

### 12.4 Probar en Navegador

Abre tu navegador y ve a: `http://TU_IP_VPS`

**Deberías ver la página de bienvenida de Nginx.**

---

## PASO 13: INSTALAR PM2

### 13.1 Instalar PM2

```bash
sudo npm install -g pm2
```

### 13.2 Configurar Auto-inicio

```bash
pm2 startup systemd
```

**PM2 te mostrará un comando como:**

```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u starfilters --hp /home/starfilters
```

**Copia y ejecuta ese comando exactamente como te lo muestra.**

---

## PASO 14: CLONAR PROYECTO

### 14.1 Ir al Directorio Home

```bash
cd ~
```

### 14.2 Clonar Repositorio

```bash
git clone https://github.com/imsoft/Starfilters-Ecommerce.git starfilters-app
```

### 14.3 Ir al Directorio del Proyecto

```bash
cd starfilters-app
```

### 14.4 Instalar Dependencias

```bash
pnpm install
```

**Esto puede tardar 5-10 minutos.**

---

## PASO 15: CAMBIAR ADAPTER A NODE.JS

### 15.1 Instalar Adapter de Node.js

```bash
pnpm add @astrojs/node
```

### 15.2 Editar astro.config.mjs

```bash
nano astro.config.mjs
```

**Verifica que la configuración sea:**

```javascript
import node from '@astrojs/node';
```

**Y que el adapter sea:**

```javascript
adapter: node({
  mode: 'standalone'
}),
```

**Guardar:** `Ctrl + O`, `Enter`, `Ctrl + X`

---

## PASO 16: CONFIGURAR VARIABLES DE ENTORNO

### 16.1 Crear Archivo .env

```bash
nano .env
```

### 16.2 Pegar Configuración

**Pega esto y reemplaza los valores con tus credenciales:**

```env
# Base de Datos
DB_HOST=localhost
DB_USER=starfilters_user
DB_PASSWORD=TU_CONTRASEÑA_MYSQL_AQUI
DB_NAME=starfilters_db
DB_PORT=3306

# JWT
JWT_SECRET=GENERA_UN_SECRET_ALEATORIO
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

### 16.3 Generar JWT_SECRET

**Abre otra terminal SSH y ejecuta:**

```bash
openssl rand -base64 32
```

**Copia el resultado y úsalo como valor de `JWT_SECRET` en el archivo `.env`.**

**Guardar:** `Ctrl + O`, `Enter`, `Ctrl + X`

---

## PASO 17: IMPORTAR BASE DE DATOS

### 17.1 Exportar desde tu Máquina Local

**En tu máquina local:**

```bash
mysqldump -u tu_usuario_local -p starfilters_db > starfilters_db.sql
```

### 17.2 Subir al VPS

**Opción A: Usando SCP (desde tu máquina local)**

```bash
scp starfilters_db.sql starfilters@TU_IP_VPS:/home/starfilters/
```

**Opción B: Usando FileZilla (FTP)**
1. Descarga FileZilla: https://filezilla-project.org/
2. Conecta usando SFTP:
   - Host: `sftp://TU_IP_VPS`
   - Usuario: `starfilters`
   - Contraseña: (tu contraseña)
   - Puerto: `22`
3. Sube el archivo `starfilters_db.sql` a `/home/starfilters/`

### 17.3 Importar en el VPS

**En el VPS:**

```bash
mysql -u starfilters_user -p starfilters_db < starfilters_db.sql
```

**Ingresa la contraseña de `starfilters_user`.**

---

## PASO 18: BUILD DEL PROYECTO

### 18.1 Hacer Build

```bash
cd ~/starfilters-app
pnpm build
```

**Esto puede tardar 5-10 minutos.**

### 18.2 Verificar que Funciona

```bash
node server.js
```

**Deberías ver:**

```
🚀 Server running on http://0.0.0.0:3000
📦 Environment: production
```

**Presiona `Ctrl + C` para detener.**

---

## PASO 19: CONFIGURAR NGINX

### 19.1 Crear Configuración

```bash
sudo nano /etc/nginx/sites-available/starfilters
```

### 19.2 Pegar Configuración

**Pega esto (reemplaza `tudominio.com` con tu dominio):**

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

**Guardar:** `Ctrl + O`, `Enter`, `Ctrl + X`

### 19.3 Habilitar Sitio

```bash
sudo ln -s /etc/nginx/sites-available/starfilters /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
```

**Deberías ver:** `nginx: configuration file ... test is successful`

### 19.4 Recargar Nginx

```bash
sudo systemctl reload nginx
```

---

## PASO 20: INICIAR CON PM2

### 20.1 Iniciar Aplicación

```bash
cd ~/starfilters-app
pm2 start server.js --name starfilters-app
```

### 20.2 Guardar Configuración

```bash
pm2 save
```

### 20.3 Verificar

```bash
pm2 status
```

**Deberías ver la aplicación `online`.**

---

## PASO 21: CONFIGURAR SSL/HTTPS

### 21.1 Instalar Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 21.2 Obtener Certificado

**⚠️ Asegúrate de que tu dominio ya apunta al VPS antes de esto.**

```bash
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

**Responde:**
- Email: (tu email)
- Términos: `A` (Aceptar)
- Compartir email: `N` (No)
- Redirigir HTTP a HTTPS: `2` (Sí)

---

## PASO 22: CONFIGURAR DNS

### 22.1 En el Panel de tu Dominio

**Agrega estos registros A:**

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

### 22.2 Esperar Propagación

**Espera 5-15 minutos y luego prueba:**

```bash
dig tudominio.com
```

---

## ✅ VERIFICACIÓN FINAL

### Checklist:

- [ ] VPS contratado y accesible
- [ ] Ubuntu instalado
- [ ] Node.js 20+ instalado
- [ ] pnpm instalado
- [ ] MySQL instalado y base de datos creada
- [ ] Nginx instalado y configurado
- [ ] PM2 instalado
- [ ] Proyecto clonado
- [ ] Adapter cambiado a Node.js
- [ ] .env configurado
- [ ] Base de datos importada
- [ ] Build completado
- [ ] Aplicación corriendo con PM2
- [ ] Nginx configurado
- [ ] SSL configurado
- [ ] DNS configurado
- [ ] ✅ Aplicación accesible en https://tudominio.com

---

## 🎉 ¡LISTO!

Tu aplicación debería estar funcionando en:

**🌐 https://tudominio.com**

---

## 📞 COMANDOS ÚTILES

```bash
# Ver logs de la aplicación
pm2 logs starfilters-app

# Reiniciar aplicación
pm2 restart starfilters-app

# Ver estado de servicios
sudo systemctl status nginx
sudo systemctl status mysql
pm2 status

# Actualizar proyecto
cd ~/starfilters-app
git pull origin main
pnpm install
pnpm build
pm2 restart starfilters-app
```

---

**Última actualización:** Diciembre 2024

