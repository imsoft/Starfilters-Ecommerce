# 🚀 Quick Start: VPS Hostinger - Resumen Rápido

## ⚡ Comandos Esenciales (Copia y Pega)

### 1. Conectar al VPS
```bash
ssh root@TU_IP_VPS
```

### 2. Configuración Inicial (Una vez)
```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Instalar pnpm
npm install -g pnpm

# Instalar MySQL
apt install mysql-server -y
mysql_secure_installation

# Instalar Nginx
apt install nginx -y
systemctl enable nginx

# Instalar PM2
npm install -g pm2

# Configurar firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 3. Crear Base de Datos
```bash
mysql -u root -p
```
```sql
CREATE DATABASE starfilters_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'starfilters_user'@'localhost' IDENTIFIED BY 'TU_PASSWORD';
GRANT ALL PRIVILEGES ON starfilters_db.* TO 'starfilters_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. Clonar y Configurar Proyecto
```bash
cd ~
git clone https://github.com/imsoft/Starfilters-Ecommerce.git starfilters-app
cd starfilters-app

# Cambiar adapter a Node.js (ver sección abajo)
# Instalar dependencias
pnpm install

# Crear .env
nano .env
# (Pegar contenido del .env - ver guía completa)

# Build
pnpm build
```

### 5. Configurar Nginx
```bash
sudo nano /etc/nginx/sites-available/starfilters
```
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

```bash
sudo ln -s /etc/nginx/sites-available/starfilters /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL/HTTPS
```bash
apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

### 7. Iniciar Aplicación
```bash
cd ~/starfilters-app
pm2 start server.js --name starfilters-app
pm2 save
pm2 startup
# (Ejecutar el comando que muestra)
```

---

## 🔄 Cambiar Adapter para VPS

**Antes de hacer build en el VPS, en tu máquina local:**

```bash
# Instalar adapter de Node.js
pnpm add @astrojs/node

# Actualizar astro.config.mjs
```

**En `astro.config.mjs`, cambiar:**
```javascript
import vercel from '@astrojs/vercel';
// Por:
import node from '@astrojs/node';

// Y en la configuración:
adapter: node({
  mode: 'standalone'
}),
```

**Luego hacer commit y push:**
```bash
git add astro.config.mjs package.json pnpm-lock.yaml
git commit -m "feat: cambiar adapter a Node.js para VPS"
git push
```

---

## 📋 Checklist Rápido

- [ ] VPS contratado
- [ ] SSH funcionando
- [ ] Node.js 20+ instalado
- [ ] pnpm instalado
- [ ] MySQL instalado y base de datos creada
- [ ] Proyecto clonado
- [ ] .env configurado
- [ ] Build completado
- [ ] Nginx configurado
- [ ] SSL configurado
- [ ] PM2 iniciado
- [ ] Dominio DNS configurado
- [ ] ✅ Aplicación funcionando

---

## 🆘 Problemas Comunes

**Puerto 3000 en uso:**
```bash
sudo lsof -i :3000
sudo kill -9 PID
```

**PM2 no inicia:**
```bash
pm2 logs starfilters-app
cd ~/starfilters-app
node server.js  # Probar manualmente
```

**Nginx 502 Bad Gateway:**
```bash
# Verificar que la app esté corriendo
pm2 status
# Verificar logs
pm2 logs starfilters-app
```

---

**Para más detalles, ver: `docs/deployment/DEPLOY_VPS_HOSTINGER.md`**

