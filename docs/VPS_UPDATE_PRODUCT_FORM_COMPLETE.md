# Guía: Actualizar Formulario Completo de Productos en el VPS

Esta guía te ayudará a actualizar el proyecto en el VPS con el formulario completo de productos que incluye todos los campos técnicos.

## 🚀 Pasos para Actualizar

### 1. Conectarse al VPS

```bash
ssh root@72.60.228.9
```

### 2. Navegar al directorio del proyecto

```bash
cd ~/starfilters-app
```

### 3. Hacer backup de la base de datos (RECOMENDADO)

```bash
# Backup de la base de datos
mysqldump -u root -p starfilters_ecommerce_db > backup_$(date +%Y%m%d_%H%M%S).sql

# O si tienes la contraseña en .env:
source .env 2>/dev/null || true
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 4. Obtener los últimos cambios de GitHub

```bash
git pull origin main
```

### 5. Ejecutar la migración SQL para agregar campos técnicos

**IMPORTANTE:** Este paso es necesario para agregar los nuevos campos a la tabla `products`.

```bash
# Opción 1: Usar el script automatizado
./scripts/add-product-technical-fields.sh

# Opción 2: Ejecutar manualmente
mysql -u root -p starfilters_ecommerce_db < migrations/add_product_technical_fields.sql
```

**Verificar que los campos se agregaron:**
```bash
mysql -u root -p starfilters_ecommerce_db -e "DESCRIBE products;" | grep -E "efficiency|characteristics|applications|benefits"
```

Deberías ver los nuevos campos:
- `efficiency`
- `efficiency_en`
- `efficiency_class`
- `characteristics`
- `characteristics_en`
- `frame_material`
- `max_temperature`
- `typical_installation`
- `typical_installation_en`
- `applications`
- `applications_en`
- `benefits`
- `benefits_en`

### 6. Instalar dependencias (si hay cambios)

```bash
pnpm install
```

### 7. Construir el proyecto

```bash
pnpm build
```

**Verificar que el build fue exitoso:**
- Debe mostrar `✓ Completed` sin errores
- Debe crear los archivos en `dist/`

### 8. Reiniciar la aplicación con PM2

```bash
# Ver el estado actual
pm2 status

# Reiniciar la aplicación
pm2 restart starfilters-app

# Ver los logs para verificar que todo está bien
pm2 logs starfilters-app --lines 50
```

### 9. Verificar que la aplicación está funcionando

```bash
# Verificar que está escuchando en el puerto 3000
netstat -tlnp | grep 3000

# Verificar el estado de PM2
pm2 status

# Verificar los logs recientes
pm2 logs starfilters-app --lines 20
```

### 10. Reiniciar Nginx (si es necesario)

```bash
# Verificar configuración de Nginx
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

### 11. Probar en el navegador

Visita:
- `https://srv1171123.hstgr.cloud/admin/products/add` - Debe mostrar el formulario completo con todas las secciones
- `https://srv1171123.hstgr.cloud/admin/products/edit/[id]` - Debe mostrar el formulario completo de edición

**Verificar que aparecen todas las secciones:**
- ✅ Información Básica (Nombre, Descripción ES/EN)
- ✅ Categoría y Variante (Categoría, Código Bind, Tamaños, Precios, Stock)
- ✅ Especificaciones Técnicas (Eficiencia, Características, Material, Temperatura)
- ✅ Instalación Típica
- ✅ Aplicaciones
- ✅ Beneficios
- ✅ Imágenes
- ✅ Estado

## 🔧 Solución de Problemas

### Error: "Unknown column 'efficiency' in 'field list'"

**Causa:** La migración SQL no se ejecutó.

**Solución:**
```bash
# Ejecutar la migración manualmente
mysql -u root -p starfilters_ecommerce_db < migrations/add_product_technical_fields.sql

# Verificar que los campos se agregaron
mysql -u root -p starfilters_ecommerce_db -e "DESCRIBE products;" | grep efficiency
```

### Error: "Cannot find module"

```bash
# Limpiar y reconstruir
rm -rf dist/ .astro/ node_modules/
pnpm install
pnpm build
pm2 restart starfilters-app
```

### Error: "502 Bad Gateway"

```bash
# Verificar que la app está corriendo
pm2 status

# Ver logs de errores
pm2 logs starfilters-app --err --lines 50

# Reiniciar todo
pm2 restart starfilters-app
systemctl restart nginx
```

## ✅ Checklist de Verificación

Después de actualizar, verifica:

- [ ] `git pull` se ejecutó sin errores
- [ ] La migración SQL se ejecutó correctamente
- [ ] Los nuevos campos están en la tabla `products`
- [ ] `pnpm build` completó exitosamente
- [ ] `pm2 status` muestra la app como "online"
- [ ] `netstat -tlnp | grep 3000` muestra que el puerto 3000 está en uso
- [ ] Los logs de PM2 no muestran errores
- [ ] El sitio web carga correctamente
- [ ] El formulario de agregar producto muestra todas las secciones
- [ ] El formulario de editar producto muestra todas las secciones
- [ ] Se pueden guardar productos con todos los campos técnicos

## 📝 Comandos en una Línea (Rápido)

Si todo está configurado correctamente, puedes ejecutar todo en secuencia:

```bash
cd ~/starfilters-app && \
git pull origin main && \
mysql -u root -p starfilters_ecommerce_db < migrations/add_product_technical_fields.sql && \
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
   mysql -u root -p starfilters_ecommerce_db -e "DESCRIBE products;"
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

- **Tiempo estimado:** 10-15 minutos
- **Downtime:** Mínimo (solo durante el reinicio de PM2, ~5-10 segundos)
- **Backup recomendado:** Sí, especialmente antes de ejecutar la migración SQL
- **Requisitos:** Acceso SSH al VPS, credenciales de MySQL

## 🎯 Campos Agregados a la Tabla Products

Los siguientes campos técnicos se agregaron a la tabla `products`:

- `efficiency` (TEXT) - Eficiencia en español
- `efficiency_en` (TEXT) - Eficiencia en inglés
- `efficiency_class` (VARCHAR) - Clase EN1822 (ej: H14)
- `characteristics` (TEXT) - Características en español
- `characteristics_en` (TEXT) - Características en inglés
- `frame_material` (VARCHAR) - Material del marco
- `max_temperature` (VARCHAR) - Temperatura máxima
- `typical_installation` (TEXT) - Instalación típica en español
- `typical_installation_en` (TEXT) - Instalación típica en inglés
- `applications` (TEXT) - Aplicaciones en español
- `applications_en` (TEXT) - Aplicaciones en inglés
- `benefits` (TEXT) - Beneficios en español
- `benefits_en` (TEXT) - Beneficios en inglés

Todos estos campos son opcionales (NULL permitido) para mantener compatibilidad con productos existentes.
