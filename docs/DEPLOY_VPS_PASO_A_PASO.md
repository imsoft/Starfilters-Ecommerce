# 🚀 Guía Paso a Paso: Desplegar Star Filters Ecommerce en VPS

Esta guía te lleva paso a paso desde la configuración inicial del VPS hasta tener tu aplicación funcionando en producción.

---

## 📋 PREREQUISITOS

- ✅ VPS contratado (Hostinger o similar)
- ✅ Acceso SSH al servidor
- ✅ Dominio configurado (opcional para inicio)
- ✅ Credenciales de Stripe y Cloudinary

---

## PASO 1: CONECTAR AL VPS POR SSH

### Desde Mac/Linux:
```bash
ssh root@TU_IP_VPS
```

### Desde Windows:
Usa **Windows Terminal** o **PuTTY**:
- Host: `TU_IP_VPS`
- Puerto: `22`
- Usuario: `root`

**En la primera conexión escribe `yes` cuando te pregunte.**

---

## PASO 2: ACTUALIZAR EL SISTEMA

```bash
apt update && apt upgrade -y
```

**Si hay actualizaciones del kernel, reinicia:**
```bash
reboot
# Espera 30 segundos y reconecta
```

---

## PASO 3: CREAR USUARIO NO-ROOT (Recomendado)

```bash
# Crear usuario
adduser starfilters

# Dar permisos de administrador
usermod -aG sudo starfilters

# Cambiar a ese usuario
su - starfilters
```

---

## PASO 4: CONFIGURAR FIREWALL

```bash
# Instalar UFW
sudo apt install ufw -y

# Permitir servicios esenciales
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Activar firewall
sudo ufw enable
```

---

## PASO 5: INSTALAR NODE.JS

```bash
# Agregar repositorio de NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instalar Node.js
sudo apt install -y nodejs

# Verificar instalación
node --version  # Debe ser v20.x.x o superior
npm --version   # Debe ser 10.x.x o superior
```

---

## PASO 6: INSTALAR PNPM

```bash
sudo npm install -g pnpm

# Verificar
pnpm --version  # Debe ser 9.x.x o superior
```

---

## PASO 7: INSTALAR MYSQL

```bash
# Instalar MySQL Server
sudo apt install mysql-server -y

# Configurar seguridad
sudo mysql_secure_installation
```

**Responde así:**
- Validar contraseña: `y`
- Política de contraseña: `1` (MEDIUM)
- Nueva contraseña: [ELIGE UNA SEGURA Y GUÁRDALA]
- Eliminar usuarios anónimos: `y`
- Deshabilitar login root remoto: `y`
- Eliminar base de datos de prueba: `y`
- Recargar tablas: `y`

---

## PASO 8: CREAR BASE DE DATOS

```bash
# Conectar a MySQL
sudo mysql -u root -p
```

**Dentro de MySQL, ejecuta (reemplaza las contraseñas):**
```sql
CREATE DATABASE starfilters_ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'starfilters_user'@'localhost' IDENTIFIED BY 'TU_CONTRASEÑA_SEGURA';
GRANT ALL PRIVILEGES ON starfilters_ecommerce_db.* TO 'starfilters_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**⚠️ GUARDA LA CONTRASEÑA DE MYSQL**

---

## PASO 9: INSTALAR NGINX

```bash
# Instalar Nginx
sudo apt install nginx -y

# Iniciar y habilitar
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar estado
sudo systemctl status nginx
```

**Prueba en el navegador:** `http://TU_IP_VPS` (deberías ver la página de bienvenida de Nginx)

---

## PASO 10: INSTALAR PM2

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Configurar auto-inicio
pm2 startup systemd
```

**PM2 te mostrará un comando, cópialo y ejecútalo exactamente como te lo muestra.**

---

## PASO 11: CLONAR EL PROYECTO

```bash
# Ir al directorio home
cd ~

# Clonar repositorio
git clone https://github.com/imsoft/Starfilters-Ecommerce.git starfilters-app

# Ir al directorio del proyecto
cd starfilters-app

# Instalar dependencias (esto puede tardar 5-10 minutos)
pnpm install
```

---

## PASO 12: CONFIGURAR VARIABLES DE ENTORNO

```bash
# Crear archivo .env
nano .env
```

**Pega esta configuración y reemplaza los valores:**

```env
# Base de Datos
DB_HOST=localhost
DB_USER=starfilters_user
DB_PASSWORD=TU_CONTRASEÑA_MYSQL
DB_NAME=starfilters_ecommerce_db
DB_PORT=3306

# JWT (genera uno seguro)
JWT_SECRET=GENERA_UN_SECRET_ALEATORIO_DE_32_CARACTERES_MINIMO
JWT_EXPIRES_IN=7d

# Node.js
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Stripe (Producción - claves LIVE)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

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
PUBLIC_SITE_URL=https://starfilters.mx
SITE_URL=https://starfilters.mx
```

**Para generar JWT_SECRET, abre otra terminal y ejecuta:**
```bash
openssl rand -base64 32
```
**Copia el resultado y úsalo como valor de `JWT_SECRET`.**

**Guardar archivo:** `Ctrl + O`, `Enter`, `Ctrl + X`

---

## PASO 13: IMPORTAR BASE DE DATOS

### Opción A: Desde tu máquina local

**1. Exportar base de datos local:**
```bash
mysqldump -u tu_usuario_local -p starfilters_ecommerce_db > starfilters_ecommerce_db.sql
```

**2. Subir al VPS usando SCP:**
```bash
scp starfilters_ecommerce_db.sql starfilters@TU_IP_VPS:/home/starfilters/
```

**3. Importar en el VPS:**
```bash
cd ~
mysql -u starfilters_user -p starfilters_ecommerce_db < starfilters_ecommerce_db.sql
```

### Opción B: Crear desde cero

**Si prefieres crear la base de datos desde cero:**
```bash
cd ~/starfilters-app
mysql -u starfilters_user -p starfilters_ecommerce_db < database/schema.sql
```

### Ejecutar migraciones adicionales

**Si la base de datos ya existía o necesitas agregar campos adicionales, ejecuta las migraciones:**

```bash
cd ~/starfilters-app

# Agregar campo profile_image a la tabla users (para fotos de perfil de usuarios)
mysql -u starfilters_user -p starfilters_ecommerce_db < database/add_profile_image_to_users.sql
```

**Nota:** Si ya ejecutaste `schema.sql` desde cero, estas migraciones pueden no ser necesarias, pero ejecutarlas no causará problemas si los campos ya existen.

---

## PASO 14: HACER BUILD DEL PROYECTO

```bash
cd ~/starfilters-app

# Hacer build (esto puede tardar 5-10 minutos)
pnpm build
```

**Verificar que funcionó:**
```bash
# Probar manualmente (presiona Ctrl+C para detener)
node server.js
```

**Deberías ver:**
```
🚀 Server running on http://0.0.0.0:3000
📦 Environment: production
```

**Presiona `Ctrl + C` para detener.**

---

## PASO 15: CONFIGURAR NGINX

```bash
# Crear configuración de Nginx
sudo nano /etc/nginx/sites-available/starfilters
```

**Pega esta configuración (reemplaza `tudominio.com` con tu dominio):**

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

**Habilitar el sitio:**
```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/starfilters /etc/nginx/sites-enabled/

# Eliminar configuración por defecto
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

---

## PASO 16: INICIAR APLICACIÓN CON PM2

```bash
cd ~/starfilters-app

# Iniciar aplicación
pm2 start server.js --name starfilters-app

# Guardar configuración para auto-inicio
pm2 save

# Verificar estado
pm2 status
```

**Deberías ver la aplicación `online`.**

---

## PASO 17: CONFIGURAR SSL/HTTPS (Opcional pero Recomendado)

**⚠️ IMPORTANTE: Tu dominio debe estar apuntando al VPS antes de esto.**

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

**Responde:**
- Email: (tu email)
- Términos: `A` (Aceptar)
- Compartir email: `N` (No)
- Redirigir HTTP a HTTPS: `2` (Sí)

**Certbot actualizará automáticamente la configuración de Nginx.**

---

## PASO 18: CONFIGURAR DNS (Si aún no lo has hecho)

### En el Panel de tu Dominio:

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

**Espera 5-15 minutos para la propagación DNS.**

---

## ✅ VERIFICACIÓN FINAL

### Checklist de Verificación:

- [ ] ✅ VPS accesible por SSH
- [ ] ✅ Node.js 20+ instalado
- [ ] ✅ pnpm instalado
- [ ] ✅ MySQL instalado y base de datos creada
- [ ] ✅ Nginx instalado y configurado
- [ ] ✅ PM2 instalado
- [ ] ✅ Proyecto clonado
- [ ] ✅ .env configurado
- [ ] ✅ Base de datos importada
- [ ] ✅ Build completado
- [ ] ✅ Aplicación corriendo con PM2
- [ ] ✅ Nginx configurado
- [ ] ✅ SSL configurado (si aplica)
- [ ] ✅ DNS configurado

### Probar en el Navegador:

🌐 **https://tudominio.com** (o `http://TU_IP_VPS` si no tienes dominio aún)

**Deberías ver la página principal de Star Filters.**

---

## 🔄 ACTUALIZAR LA APLICACIÓN (Para Futuros Cambios)

```bash
cd ~/starfilters-app

# Obtener últimos cambios
git pull origin main

# Instalar nuevas dependencias (si hay)
pnpm install

# Reconstruir
pnpm build

# Reiniciar aplicación
pm2 restart starfilters-app

# Todo junto
cd ~/starfilters-app && git pull origin main && pnpm install && pnpm build && pm2 restart starfilters-app
```

mysql -u starfilters_user -p starfilters_ecommerce_db -e "ALTER TABLE filter_category_variants ADD COLUMN product_code VARCHAR(100) DEFAULT NULL AFTER bind_code;"



---

## 📊 COMANDOS ÚTILES

```bash
# Ver logs de la aplicación
pm2 logs starfilters-app

# Ver últimos 100 líneas de logs
pm2 logs starfilters-app --lines 100

# Reiniciar aplicación
pm2 restart starfilters-app

# Detener aplicación
pm2 stop starfilters-app

# Ver estado de todos los servicios
pm2 status
sudo systemctl status nginx
sudo systemctl status mysql

# Verificar que la aplicación está escuchando en el puerto
sudo netstat -tlnp | grep :3000
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error: "Cannot find module"
```bash
cd ~/starfilters-app
pnpm install
```

### Error: "Port 3000 already in use"
```bash
# Ver qué proceso está usando el puerto
sudo lsof -i :3000

# Detener PM2 y reiniciar
pm2 stop starfilters-app
pm2 delete starfilters-app
pm2 start server.js --name starfilters-app
```

### Error: "Database connection failed"
```bash
# Verificar credenciales en .env
cat ~/starfilters-app/.env | grep DB_

# Probar conexión manualmente
mysql -u starfilters_user -p starfilters_ecommerce_db -e "SELECT 1;"
```

### Nginx 502 Bad Gateway
```bash
# Verificar que la app esté corriendo
pm2 status

# Ver logs de la aplicación
pm2 logs starfilters-app

# Verificar logs de Nginx
sudo tail -f /var/log/nginx/error.log

# Reiniciar servicios
pm2 restart starfilters-app
sudo systemctl restart nginx
```

### La aplicación no inicia
```bash
# Probar manualmente
cd ~/starfilters-app
node server.js

# Si hay errores, revisa:
# 1. Variables de entorno en .env
# 2. Que dist/server/entry.mjs exista
# 3. Logs de PM2: pm2 logs starfilters-app
```

---

## 📚 DOCUMENTACIÓN ADICIONAL

- Ver `docs/deployment/VPS_HOSTINGER_PASO_A_PASO.md` para guía más detallada
- Ver `scripts/vps-update-all.sh` para script de actualización automática

---

## 🎉 ¡LISTO!

Tu aplicación Star Filters Ecommerce debería estar funcionando en:

**🌐 https://tudominio.com**

---

**Última actualización:** Diciembre 2024
