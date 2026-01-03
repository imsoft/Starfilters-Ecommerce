# Diagnóstico y Solución: Error 502 Bad Gateway

## Problema
Después de actualizar el código, aparece el error "502 Bad Gateway" en el navegador.

## Causas Comunes
1. La aplicación no está corriendo (PM2 detenido)
2. La aplicación se cayó por un error
3. La aplicación no está escuchando en el puerto correcto
4. Error de sintaxis o runtime en el código compilado
5. Nginx no puede conectarse al servidor de la aplicación

## Pasos de Diagnóstico

### 1. Verificar estado de PM2
```bash
pm2 status
pm2 list
```

### 2. Ver logs de la aplicación
```bash
pm2 logs starfilters-app --lines 50
```

### 3. Verificar que la aplicación esté escuchando
```bash
netstat -tlnp | grep 3000
# O
ss -tlnp | grep 3000
```

### 4. Verificar configuración de Nginx
```bash
# Ver configuración de Nginx
cat /etc/nginx/sites-available/starfilters

# Verificar sintaxis de Nginx
nginx -t

# Ver logs de Nginx
tail -f /var/log/nginx/error.log
```

### 5. Intentar iniciar la aplicación manualmente
```bash
cd ~/starfilters-app
node dist/server/entry.mjs
```

## Soluciones Comunes

### Solución 1: Reiniciar la aplicación
```bash
pm2 restart starfilters-app
pm2 logs starfilters-app --lines 30
```

### Solución 2: Si la aplicación no inicia, verificar errores
```bash
# Detener PM2
pm2 stop starfilters-app
pm2 delete starfilters-app

# Intentar iniciar manualmente para ver el error
cd ~/starfilters-app
node dist/server/entry.mjs
```

### Solución 3: Reconstruir la aplicación
```bash
cd ~/starfilters-app
pm2 stop starfilters-app
rm -rf dist/ .astro/
pnpm build
pm2 start dist/server/entry.mjs --name starfilters-app
pm2 save
```

### Solución 4: Verificar variables de entorno
```bash
cd ~/starfilters-app
cat .env | grep -E "PORT|NODE_ENV|DATABASE"
```

### Solución 5: Verificar que el puerto esté disponible
```bash
# Ver qué está usando el puerto 3000
lsof -i :3000
# O
netstat -tlnp | grep 3000
```

## Comandos Rápidos de Recuperación

```bash
# Script completo de recuperación
cd ~/starfilters-app
pm2 stop starfilters-app
pm2 delete starfilters-app
rm -rf dist/ .astro/ node_modules/.cache
pnpm build
pm2 start dist/server/entry.mjs --name starfilters-app
pm2 save
pm2 logs starfilters-app --lines 30
```

## Verificar Nginx

Si la aplicación está corriendo pero Nginx sigue dando 502:

```bash
# Verificar que Nginx esté apuntando al puerto correcto
grep -r "proxy_pass" /etc/nginx/sites-available/starfilters

# Reiniciar Nginx
systemctl restart nginx
systemctl status nginx
```

