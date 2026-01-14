# 🚀 Guía Paso a Paso: Actualizar VPS con Mejoras de Filter Categories

Esta guía te ayudará a actualizar tu VPS con todas las mejoras de UX/UI y ejecutar el script SQL necesario.

## 📋 Requisitos Previos

- ✅ Acceso SSH al VPS
- ✅ Credenciales de MySQL
- ✅ Proyecto ya clonado en el VPS

---

## 🔐 PASO 1: Conectarse al VPS

Abre tu terminal y conéctate al VPS:

```bash
ssh root@72.60.228.9
```

Si te pide contraseña, ingrésala.

---

## 📥 PASO 2: Ir al Directorio del Proyecto

```bash
cd ~/starfilters-app
```

Verifica que estás en el directorio correcto:
```bash
pwd
# Debería mostrar: /root/starfilters-app
```

---

## 🔄 PASO 3: Actualizar el Código desde GitHub

```bash
# Ver el estado actual
git status

# Hacer pull de los últimos cambios
git pull origin main
```

Deberías ver algo como:
```
Updating 4f11f88..112093b
Fast-forward
 docs/ACTUALIZAR_FILTER_CATEGORIES_DB.md          | 100+ lines
 migrations/update_filter_categories_complete.sql  | 100+ lines
 scripts/update-filter-categories-db.sh           | 50+ lines
 src/pages/admin/filter-categories/create/...     | modified
 ...
```

---

## 🗄️ PASO 4: Ejecutar el Script SQL

Tienes **3 opciones** para ejecutar el script SQL:

### Opción A: Script Automático (Recomendado) ⭐

```bash
# Dar permisos de ejecución (si no los tiene)
chmod +x scripts/update-filter-categories-db.sh

# Ejecutar el script
./scripts/update-filter-categories-db.sh
```

El script:
- ✅ Carga automáticamente las variables del `.env`
- ✅ Verifica si los campos ya existen
- ✅ Solo agrega los campos faltantes
- ✅ Muestra un resumen al finalizar

### Opción B: SQL Manual con MySQL

```bash
# Cargar variables de entorno
export $(cat .env | grep -v '^#' | xargs)

# Ejecutar SQL
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < migrations/update_filter_categories_complete.sql
```

### Opción C: Desde MySQL Directamente

```bash
# Entrar a MySQL
mysql -u root -p
```

Luego dentro de MySQL:
```sql
-- Seleccionar la base de datos
USE starfilters_db;  -- O el nombre de tu base de datos

-- Ejecutar el script
SOURCE /root/starfilters-app/migrations/update_filter_categories_complete.sql;

-- Verificar que funcionó
DESCRIBE filter_categories;
DESCRIBE filter_category_variants;

-- Salir
EXIT;
```

---

## ✅ PASO 5: Verificar que el Script Funcionó

Ejecuta estos comandos para verificar:

```bash
mysql -u root -p -e "
USE starfilters_db;
SELECT 'filter_categories:' AS '';
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'starfilters_db' 
  AND TABLE_NAME = 'filter_categories' 
  AND COLUMN_NAME IN ('efficiency', 'efficiency_en')
ORDER BY ORDINAL_POSITION;

SELECT 'filter_category_variants:' AS '';
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'starfilters_db' 
  AND TABLE_NAME = 'filter_category_variants' 
  AND COLUMN_NAME IN ('currency', 'price_usd')
ORDER BY ORDINAL_POSITION;
"
```

Deberías ver:
- ✅ `efficiency` (TEXT)
- ✅ `efficiency_en` (TEXT)
- ✅ `currency` (ENUM)
- ✅ `price_usd` (DECIMAL)

---

## 🔨 PASO 6: Reconstruir la Aplicación

```bash
# Asegurarte de estar en el directorio correcto
cd ~/starfilters-app

# Limpiar builds anteriores (opcional pero recomendado)
rm -rf dist/ .astro/

# Instalar dependencias (por si hay nuevas)
pnpm install

# Construir la aplicación
pnpm build
```

Espera a que termine el build. Deberías ver:
```
✓ Server built in X.XXs
✓ build Complete!
```

---

## 🔄 PASO 7: Reiniciar la Aplicación con PM2

```bash
# Detener la aplicación actual
pm2 stop starfilters-app

# Eliminar el proceso anterior (para limpiar)
pm2 delete starfilters-app

# Iniciar con la nueva configuración
pm2 start ecosystem.config.cjs

# O si no tienes ecosystem.config.cjs:
pm2 start server.js --name starfilters-app

# Guardar la configuración de PM2
pm2 save

# Ver el estado
pm2 status

# Ver los logs para verificar que todo está bien
pm2 logs starfilters-app --lines 20
```

---

## 🧪 PASO 8: Verificar que Todo Funciona

### Verificar que la aplicación está corriendo:
```bash
# Ver estado de PM2
pm2 status

# Verificar que está escuchando en el puerto 3000
netstat -tlnp | grep 3000

# Ver logs en tiempo real
pm2 logs starfilters-app
```

### Probar en el navegador:
1. Ve a: `https://srv1171123.hstgr.cloud/admin/filter-categories`
2. Intenta crear o editar una categoría
3. Verifica que todos los campos funcionan correctamente

---

## 🆘 Solución de Problemas

### Error: "Column already exists"
✅ **Esto es normal** - significa que el campo ya existe y no se necesita agregar.

### Error: "Access denied" en MySQL
```bash
# Verificar credenciales en .env
cat .env | grep DB_

# Intentar con usuario root directamente
mysql -u root -p
```

### Error: "Table doesn't exist"
```bash
# Verificar que las tablas existen
mysql -u root -p -e "USE starfilters_db; SHOW TABLES;"

# Si no existen, crear las tablas primero
mysql -u root -p starfilters_db < scripts/create-filter-categories-table.sql
```

### Error: "Cannot find module" en PM2
```bash
# Limpiar y reconstruir
rm -rf dist/ .astro/ node_modules/
pnpm install
pnpm build
pm2 restart starfilters-app
```

### La aplicación no inicia
```bash
# Ver logs detallados
pm2 logs starfilters-app --lines 50

# Intentar ejecutar manualmente para ver el error
cd ~/starfilters-app
node server.js
```

### Error 502 Bad Gateway
```bash
# Verificar que la app está corriendo
pm2 status

# Verificar puerto
netstat -tlnp | grep 3000

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log
```

---

## 📝 Resumen de Comandos Rápidos

```bash
# 1. Conectarse
ssh root@72.60.228.9

# 2. Ir al proyecto
cd ~/starfilters-app

# 3. Actualizar código
git pull origin main

# 4. Ejecutar SQL
./scripts/update-filter-categories-db.sh

# 5. Reconstruir
rm -rf dist/ .astro/
pnpm build

# 6. Reiniciar
pm2 restart starfilters-app
pm2 save

# 7. Verificar
pm2 status
pm2 logs starfilters-app --lines 20
```

---

## ✅ Checklist Final

- [ ] Código actualizado desde GitHub
- [ ] Script SQL ejecutado exitosamente
- [ ] Campos verificados en la base de datos
- [ ] Aplicación reconstruida sin errores
- [ ] PM2 reiniciado correctamente
- [ ] Aplicación escuchando en puerto 3000
- [ ] Página de admin funciona correctamente
- [ ] Formularios de categorías funcionan

---

¡Listo! Tu VPS debería estar actualizado con todas las mejoras. 🎉
