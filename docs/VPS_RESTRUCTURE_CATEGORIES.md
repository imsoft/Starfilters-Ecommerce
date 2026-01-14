# Guía: Reestructuración de Categorías y Productos en VPS

Esta guía te ayudará a ejecutar la migración SQL y actualizar el proyecto en el VPS después de la reestructuración de categorías y productos.

## 📋 Resumen de Cambios

- **Categorías de filtros** ahora solo tienen: título, descripción e imagen
- **Productos** ahora incluyen las variantes (tamaños, precios, códigos Bind)
- Las **variantes** de `filter_category_variants` se han movido a `products`
- La página `/filtros` muestra solo categorías simples
- La página `/productos` filtra productos por categoría cuando se hace click

## 🚀 Pasos para Actualizar el VPS

### Paso 1: Conectarse al VPS

```bash
ssh root@tu-servidor-ip
# O si usas un usuario específico:
ssh usuario@tu-servidor-ip
```

### Paso 2: Navegar al directorio del proyecto

```bash
cd ~/starfilters-app
# O la ruta donde tengas el proyecto
```

### Paso 3: Actualizar el código desde GitHub

```bash
# Asegúrate de estar en la rama main
git fetch origin
git pull origin main
```

### Paso 4: Hacer backup de la base de datos (IMPORTANTE)

```bash
# Crear backup antes de ejecutar la migración
mysqldump -u root -p starfilters_ecommerce_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Nota:** Te pedirá la contraseña de MySQL. Guarda este backup en un lugar seguro.

### Paso 5: Ejecutar la migración SQL

```bash
# Opción 1: Ejecutar directamente desde el archivo
mysql -u root -p starfilters_ecommerce_db < migrations/restructure_categories_to_products.sql
```

**O si prefieres ejecutar paso a paso:**

```bash
# Conectarse a MySQL
mysql -u root -p starfilters_ecommerce_db

# Luego copiar y pegar el contenido del archivo SQL
# O ejecutar:
source migrations/restructure_categories_to_products.sql;
```

### Paso 6: Verificar que la migración se ejecutó correctamente

```bash
# Conectarse a MySQL
mysql -u root -p starfilters_ecommerce_db

# Verificar que filter_categories tiene menos columnas
DESCRIBE filter_categories;

# Verificar que products tiene las nuevas columnas
DESCRIBE products;

# Verificar que hay productos con filter_category_id
SELECT COUNT(*) as productos_con_categoria FROM products WHERE filter_category_id IS NOT NULL;

# Verificar que hay productos migrados
SELECT COUNT(*) as total_productos FROM products;
```

### Paso 7: Instalar/actualizar dependencias (si es necesario)

```bash
# Si hay nuevas dependencias
pnpm install
```

### Paso 8: Reconstruir el proyecto

```bash
# Limpiar builds anteriores (opcional pero recomendado)
rm -rf dist .astro

# Reconstruir el proyecto
pnpm build
```

### Paso 9: Reiniciar la aplicación con PM2

```bash
# Detener la aplicación
pm2 stop starfilters-app

# Eliminar el proceso anterior (opcional, si hay problemas)
pm2 delete starfilters-app

# Iniciar la aplicación
pm2 start ecosystem.config.cjs

# O si no tienes ecosystem.config.cjs:
pm2 start dist/server/entry.mjs --name starfilters-app

# Verificar que está corriendo
pm2 status

# Ver logs para verificar que no hay errores
pm2 logs starfilters-app --lines 50
```

### Paso 10: Verificar que la aplicación está funcionando

```bash
# Verificar que está escuchando en el puerto 3000
netstat -tlnp | grep 3000

# O verificar con curl
curl http://localhost:3000
```

### Paso 11: Reiniciar Nginx (si es necesario)

```bash
# Verificar configuración de Nginx
nginx -t

# Reiniciar Nginx
systemctl restart nginx
# O
service nginx restart
```

## ✅ Verificación Final

1. **Verificar página de categorías:**
   - Visita: `https://tu-dominio.com/filtros`
   - Debe mostrar solo categorías simples (título, descripción, imagen)

2. **Verificar página de productos:**
   - Haz click en una categoría desde `/filtros`
   - Debe redirigir a `/productos?filter_category_id={id}`
   - Debe mostrar solo los productos de esa categoría

3. **Verificar admin de categorías:**
   - Visita: `https://tu-dominio.com/admin/filter-categories/create`
   - El formulario debe tener solo: nombre, descripción, imagen, estado

4. **Verificar admin de productos:**
   - Visita: `https://tu-dominio.com/admin/products/add`
   - El formulario debe tener: categoría de filtro, código Bind, medidas, precios, etc.

## 🔧 Solución de Problemas

### Error: "Unknown database"
```bash
# Verificar que la base de datos existe
mysql -u root -p -e "SHOW DATABASES;"

# Si no existe, crear la base de datos
mysql -u root -p -e "CREATE DATABASE starfilters_ecommerce_db;"
```

### Error: "Column already exists"
La migración SQL verifica si las columnas existen antes de crearlas, así que este error no debería aparecer. Si aparece, significa que la migración ya se ejecutó parcialmente.

### Error: "Cannot find module"
```bash
# Limpiar y reconstruir
rm -rf dist .astro node_modules
pnpm install
pnpm build
pm2 restart starfilters-app
```

### Error 502 Bad Gateway
```bash
# Verificar que la aplicación está corriendo
pm2 status

# Ver logs de errores
pm2 logs starfilters-app --err --lines 50

# Reiniciar aplicación
pm2 restart starfilters-app

# Verificar Nginx
systemctl status nginx
```

### Los productos no aparecen después de la migración
```bash
# Verificar que los productos tienen filter_category_id
mysql -u root -p starfilters_ecommerce_db -e "SELECT id, name, filter_category_id FROM products LIMIT 10;"

# Si no hay productos, verificar que la migración se ejecutó
mysql -u root -p starfilters_ecommerce_db -e "SELECT COUNT(*) FROM filter_category_variants;"
```

## 📝 Notas Importantes

1. **Backup obligatorio:** Siempre haz backup antes de ejecutar migraciones SQL
2. **Horario recomendado:** Ejecuta la migración en horario de bajo tráfico
3. **Verificación:** Verifica cada paso antes de continuar al siguiente
4. **Logs:** Revisa los logs de PM2 después de reiniciar para detectar errores temprano

## 🆘 Si algo sale mal

Si la migración falla o hay problemas:

1. **Restaurar backup:**
   ```bash
   mysql -u root -p starfilters_ecommerce_db < backup_YYYYMMDD_HHMMSS.sql
   ```

2. **Revertir código:**
   ```bash
   git reset --hard HEAD~1
   git pull origin main
   pnpm build
   pm2 restart starfilters-app
   ```

3. **Contactar soporte:** Si no puedes resolver el problema, guarda los logs y contacta al equipo de desarrollo.
