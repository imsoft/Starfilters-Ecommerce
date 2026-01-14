# Guía: Actualizar Formularios de Productos en el VPS

Esta guía te ayudará a actualizar el proyecto en el VPS con los nuevos formularios de productos.

## 🚀 Pasos Rápidos

### 1. Conectarse al VPS

```bash
ssh root@72.60.228.9
```

### 2. Navegar al directorio del proyecto

```bash
cd ~/starfilters-app
```

### 3. Hacer backup (opcional pero recomendado)

```bash
# Backup de la base de datos
mysqldump -u root -p starfilters_ecommerce_db > backup_$(date +%Y%m%d_%H%M%S).sql

# O si tienes la contraseña en .env, puedes usar:
# source .env 2>/dev/null || true
# mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 4. Obtener los últimos cambios de GitHub

```bash
git pull origin main
```

**Si hay conflictos:**
```bash
# Si hay cambios locales que no quieres conservar
git reset --hard origin/main
git pull origin main
```

### 5. Instalar dependencias (si hay cambios en package.json)

```bash
pnpm install
```

### 6. Construir el proyecto

```bash
pnpm build
```

**Verificar que el build fue exitoso:**
- Debe mostrar `✓ Completed` sin errores
- Debe crear los archivos en `dist/`

### 7. Reiniciar la aplicación con PM2

```bash
# Ver el estado actual
pm2 status

# Reiniciar la aplicación
pm2 restart starfilters-app

# O si no está corriendo, iniciarla
pm2 start ecosystem.config.cjs --name starfilters-app

# Ver los logs para verificar que todo está bien
pm2 logs starfilters-app --lines 50
```

### 8. Verificar que la aplicación está funcionando

```bash
# Verificar que está escuchando en el puerto 3000
netstat -tlnp | grep 3000

# Verificar el estado de PM2
pm2 status

# Verificar los logs recientes
pm2 logs starfilters-app --lines 20
```

### 9. Reiniciar Nginx (si es necesario)

```bash
# Verificar configuración de Nginx
nginx -t

# Reiniciar Nginx
systemctl restart nginx

# O
service nginx restart
```

### 10. Probar en el navegador

Visita:
- `https://srv1171123.hstgr.cloud/admin/products/add` - Debe mostrar el nuevo formulario
- `https://srv1171123.hstgr.cloud/admin/products/edit/[id]` - Debe mostrar el nuevo formulario de edición

## 🔧 Solución de Problemas

### Error: "Cannot find module"

```bash
# Limpiar y reconstruir
rm -rf dist/ .astro/ node_modules/
pnpm install
pnpm build
pm2 restart starfilters-app
```

### Error: "Port 3000 already in use"

```bash
# Encontrar el proceso
lsof -i :3000

# Matar el proceso (reemplaza PID con el número que aparezca)
kill -9 PID

# O reiniciar PM2
pm2 restart starfilters-app
```

### Error: "502 Bad Gateway"

```bash
# Verificar que la app está corriendo
pm2 status

# Ver logs de errores
pm2 logs starfilters-app --err --lines 50

# Verificar Nginx
nginx -t
systemctl status nginx

# Reiniciar todo
pm2 restart starfilters-app
systemctl restart nginx
```

### Error: "git pull" falla

```bash
# Si hay cambios locales que no quieres
git stash
git pull origin main

# O forzar actualización
git fetch origin
git reset --hard origin/main
```

## ✅ Checklist de Verificación

Después de actualizar, verifica:

- [ ] `git pull` se ejecutó sin errores
- [ ] `pnpm build` completó exitosamente
- [ ] `pm2 status` muestra la app como "online"
- [ ] `netstat -tlnp | grep 3000` muestra que el puerto 3000 está en uso
- [ ] Los logs de PM2 no muestran errores
- [ ] El sitio web carga correctamente
- [ ] Los formularios de productos muestran el nuevo diseño

## 📝 Comandos en una Línea (Rápido)

Si todo está configurado correctamente, puedes ejecutar todo en secuencia:

```bash
cd ~/starfilters-app && \
git pull origin main && \
pnpm install && \
pnpm build && \
pm2 restart starfilters-app && \
pm2 logs starfilters-app --lines 20
```

## 🆘 Si Algo Sale Mal

1. **Revisar logs:**
   ```bash
   pm2 logs starfilters-app --lines 100
   ```

2. **Verificar estado:**
   ```bash
   pm2 status
   systemctl status nginx
   ```

3. **Restaurar backup (si hiciste uno):**
   ```bash
   mysql -u root -p starfilters_ecommerce_db < backup_YYYYMMDD_HHMMSS.sql
   ```

4. **Volver a la versión anterior:**
   ```bash
   git log --oneline -10  # Ver commits recientes
   git checkout COMMIT_HASH  # Volver a un commit anterior
   pnpm build
   pm2 restart starfilters-app
   ```

## 📞 Notas Adicionales

- **Tiempo estimado:** 5-10 minutos
- **Downtime:** Mínimo (solo durante el reinicio de PM2, ~5-10 segundos)
- **Backup recomendado:** Sí, especialmente si hay datos importantes
- **Requisitos:** Acceso SSH al VPS, credenciales de MySQL (si haces backup)
