# Guía Paso a Paso: Actualizar Formulario de Productos en el VPS

Esta guía te llevará paso a paso para ejecutar la migración SQL y actualizar el proyecto en el VPS.

## 📋 Paso 1: Conectarse al VPS

```bash
ssh root@72.60.228.9
```

Si te pide contraseña, ingrésala.

## 📋 Paso 2: Navegar al directorio del proyecto

```bash
cd ~/starfilters-app
```

## 📋 Paso 3: Hacer backup de la base de datos (RECOMENDADO)

**⚠️ IMPORTANTE:** Siempre haz un backup antes de modificar la base de datos.

```bash
# Verificar que estás en el directorio correcto
pwd
# Debe mostrar: /root/starfilters-app

# Hacer backup
mysqldump -u root -p starfilters_ecommerce_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

Te pedirá la contraseña de MySQL. Ingresa la contraseña.

**Verificar que el backup se creó:**
```bash
ls -lh backup_*.sql
```

Deberías ver un archivo con el nombre del backup.

## 📋 Paso 4: Obtener los últimos cambios de GitHub

```bash
git pull origin main
```

**Si hay conflictos o cambios locales:**
```bash
# Si quieres descartar cambios locales y usar solo los de GitHub
git reset --hard origin/main
git pull origin main
```

## 📋 Paso 5: Verificar que el archivo SQL existe

```bash
ls -la migrations/add_product_technical_fields.sql
```

Deberías ver el archivo. Si no existe, verifica que el `git pull` se ejecutó correctamente.

## 📋 Paso 6: Ejecutar la migración SQL

Tienes dos opciones:

### Opción A: Usar el script automatizado (RECOMENDADO)

```bash
# Dar permisos de ejecución (solo la primera vez)
chmod +x scripts/add-product-technical-fields.sh

# Ejecutar el script
./scripts/add-product-technical-fields.sh
```

### Opción B: Ejecutar manualmente

```bash
# Ejecutar el SQL directamente
mysql -u root -p starfilters_ecommerce_db < migrations/add_product_technical_fields.sql
```

Te pedirá la contraseña de MySQL. Ingresa la contraseña.

**Verificar que los campos se agregaron correctamente:**
```bash
mysql -u root -p starfilters_ecommerce_db -e "DESCRIBE products;" | grep -E "efficiency|characteristics|applications|benefits"
```

Deberías ver los nuevos campos listados. Si no ves nada, verifica que la migración se ejecutó correctamente.

## 📋 Paso 7: Instalar dependencias (si es necesario)

```bash
pnpm install
```

Esto puede tardar unos minutos. Solo instala si hay cambios en `package.json`.

## 📋 Paso 8: Construir el proyecto

```bash
pnpm build
```

**Espera a que termine.** Deberías ver al final:
```
✓ Completed in X.XXs
[build] Complete!
```

Si ves errores, detente y revisa los mensajes de error.

## 📋 Paso 9: Reiniciar la aplicación con PM2

```bash
# Ver el estado actual
pm2 status

# Reiniciar la aplicación
pm2 restart starfilters-app

# Esperar unos segundos y verificar el estado
sleep 3
pm2 status
```

**Verificar que está "online":**
- Debe mostrar `status: online` en verde
- No debe mostrar `status: errored` o `status: stopped`

## 📋 Paso 10: Verificar que la aplicación está funcionando

```bash
# Verificar que está escuchando en el puerto 3000
netstat -tlnp | grep 3000
```

Deberías ver algo como:
```
tcp  0  0  0.0.0.0:3000  0.0.0.0:*  LISTEN  12345/node
```

**Ver los logs recientes:**
```bash
pm2 logs starfilters-app --lines 20
```

No deberías ver errores críticos. Si ves errores, anótalos.

## 📋 Paso 11: Reiniciar Nginx (si es necesario)

```bash
# Verificar configuración
nginx -t

# Si dice "syntax is ok", reiniciar
systemctl restart nginx

# Verificar estado
systemctl status nginx
```

## 📋 Paso 12: Probar en el navegador

Abre tu navegador y visita:

1. **Formulario de agregar producto:**
   ```
   https://srv1171123.hstgr.cloud/admin/products/add
   ```

2. **Formulario de editar producto:**
   ```
   https://srv1171123.hstgr.cloud/admin/products/edit/[ID]
   ```
   (Reemplaza `[ID]` con el ID de un producto existente)

**Verificar que aparecen todas las secciones:**
- ✅ Información Básica
- ✅ Categoría y Variante
- ✅ Especificaciones Técnicas
- ✅ Instalación Típica
- ✅ Aplicaciones
- ✅ Beneficios
- ✅ Imágenes
- ✅ Estado

## 🔧 Solución de Problemas

### Problema: "ERROR 1049 (42000): Unknown database"

**Solución:**
```bash
# Verificar el nombre de la base de datos
mysql -u root -p -e "SHOW DATABASES;"

# Usar el nombre correcto (probablemente es starfilters_ecommerce_db)
mysql -u root -p starfilters_ecommerce_db < migrations/add_product_technical_fields.sql
```

### Problema: "ERROR 1054 (42S22): Unknown column"

**Causa:** El campo ya existe o hay un error en el SQL.

**Solución:**
```bash
# Verificar qué campos ya existen
mysql -u root -p starfilters_ecommerce_db -e "DESCRIBE products;"

# Si el campo ya existe, está bien. Continúa con el siguiente paso.
```

### Problema: "Cannot find module" en los logs

**Solución:**
```bash
# Limpiar y reconstruir
rm -rf dist/ .astro/ node_modules/
pnpm install
pnpm build
pm2 restart starfilters-app
```

### Problema: "502 Bad Gateway"

**Solución:**
```bash
# Verificar que la app está corriendo
pm2 status

# Ver logs de errores
pm2 logs starfilters-app --err --lines 50

# Si está detenida, iniciarla
pm2 start ecosystem.config.cjs --name starfilters-app

# Reiniciar Nginx
systemctl restart nginx
```

## ✅ Checklist Final

Antes de terminar, verifica:

- [ ] Backup de la base de datos creado
- [ ] `git pull` ejecutado sin errores
- [ ] Migración SQL ejecutada correctamente
- [ ] Campos técnicos agregados a la tabla `products`
- [ ] `pnpm build` completado exitosamente
- [ ] PM2 muestra la app como "online"
- [ ] Puerto 3000 está en uso
- [ ] No hay errores en los logs de PM2
- [ ] El sitio web carga correctamente
- [ ] Los formularios muestran todas las secciones

## 📝 Comandos Rápidos (Todo en uno)

Si prefieres ejecutar todo de una vez (después de hacer backup):

```bash
cd ~/starfilters-app && \
git pull origin main && \
mysql -u root -p starfilters_ecommerce_db < migrations/add_product_technical_fields.sql && \
pnpm install && \
pnpm build && \
pm2 restart starfilters-app && \
sleep 3 && \
pm2 status && \
pm2 logs starfilters-app --lines 20
```

**Nota:** Te pedirá la contraseña de MySQL una vez.

## 🆘 Si Algo Sale Mal

1. **Restaurar backup:**
   ```bash
   mysql -u root -p starfilters_ecommerce_db < backup_YYYYMMDD_HHMMSS.sql
   ```

2. **Ver logs detallados:**
   ```bash
   pm2 logs starfilters-app --lines 100
   ```

3. **Volver a la versión anterior:**
   ```bash
   git log --oneline -5
   git checkout COMMIT_HASH_ANTERIOR
   pnpm build
   pm2 restart starfilters-app
   ```

## 📞 Información de Contacto

Si tienes problemas, guarda:
- Los logs de PM2: `pm2 logs starfilters-app --lines 100 > logs.txt`
- El resultado de: `pm2 status`
- El resultado de: `mysql -u root -p starfilters_ecommerce_db -e "DESCRIBE products;"`
