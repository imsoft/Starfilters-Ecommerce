# 📋 Actualizar Base de Datos para Filter Categories

Este documento explica cómo actualizar la base de datos para que todos los campos del sistema de categorías de filtros funcionen correctamente.

## 🔍 Campos que se Agregarán/Modificarán

### Tabla `filter_categories`:
- ✅ `efficiency_en` (TEXT) - Eficiencia en inglés
- ✅ `efficiency` (cambiado a TEXT si era VARCHAR) - Para almacenar múltiples valores

### Tabla `filter_category_variants`:
- ✅ `currency` (ENUM('MXN', 'USD')) - Tipo de moneda
- ✅ `price_usd` (DECIMAL(10, 2)) - Precio en dólares (opcional)

## 🚀 Opción 1: Usar el Script Automático (Recomendado)

### En tu máquina local:
```bash
cd /ruta/a/tu/proyecto
./scripts/update-filter-categories-db.sh
```

### En el VPS:
```bash
cd ~/starfilters-app
./scripts/update-filter-categories-db.sh
```

El script:
- ✅ Verifica si los campos ya existen antes de agregarlos
- ✅ Solo agrega los campos que faltan
- ✅ Muestra un resumen al finalizar

## 🛠️ Opción 2: Ejecutar SQL Manualmente

### Desde la terminal del VPS:
```bash
cd ~/starfilters-app

# Cargar variables de entorno
source .env 2>/dev/null || export $(cat .env | grep -v '^#' | xargs)

# Ejecutar SQL
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < migrations/update_filter_categories_complete.sql
```

### O desde MySQL directamente:
```bash
mysql -u root -p
```

Luego:
```sql
USE starfilters_db;  -- O el nombre de tu base de datos
SOURCE /root/starfilters-app/migrations/update_filter_categories_complete.sql;
```

## 📝 Opción 3: Ejecutar SQL Directo

Si prefieres ejecutar los comandos SQL directamente:

```sql
-- 1. Agregar efficiency_en
ALTER TABLE filter_categories
ADD COLUMN efficiency_en TEXT NULL
AFTER efficiency;

-- 2. Cambiar efficiency a TEXT (si es necesario)
ALTER TABLE filter_categories
MODIFY COLUMN efficiency TEXT NULL;

-- 3. Agregar currency y price_usd a variantes
ALTER TABLE filter_category_variants
ADD COLUMN currency ENUM('MXN', 'USD') DEFAULT 'MXN' AFTER price,
ADD COLUMN price_usd DECIMAL(10, 2) DEFAULT NULL AFTER currency;
```

**⚠️ Nota:** El script SQL automático verifica si los campos ya existen antes de agregarlos, así que es seguro ejecutarlo múltiples veces.

## ✅ Verificar que Funcionó

Después de ejecutar el script, puedes verificar con:

```sql
-- Ver estructura de filter_categories
DESCRIBE filter_categories;

-- Ver estructura de filter_category_variants
DESCRIBE filter_category_variants;

-- O verificar campos específicos
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'starfilters_db'  -- Cambia por tu nombre de BD
  AND TABLE_NAME = 'filter_categories'
  AND COLUMN_NAME IN ('efficiency', 'efficiency_en');

SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'starfilters_db'
  AND TABLE_NAME = 'filter_category_variants'
  AND COLUMN_NAME IN ('currency', 'price_usd');
```

## 🎯 ¿Cuándo Ejecutar Este Script?

Ejecuta este script si:
- ✅ Acabas de clonar el proyecto
- ✅ Estás actualizando desde una versión anterior
- ✅ Ves errores sobre columnas faltantes al crear/editar categorías
- ✅ Quieres asegurarte de que todos los campos estén disponibles

## 🔒 Seguridad

El script es **seguro** porque:
- ✅ Verifica si los campos existen antes de agregarlos
- ✅ No elimina ni modifica datos existentes
- ✅ Solo agrega campos nuevos o modifica tipos de datos cuando es necesario
- ✅ Puede ejecutarse múltiples veces sin problemas

## ❓ Problemas Comunes

### Error: "Column already exists"
✅ **Esto es normal** - significa que el campo ya existe y no se necesita agregar.

### Error: "Access denied"
- Verifica que el usuario de MySQL tenga permisos ALTER
- Verifica las credenciales en el archivo `.env`

### Error: "Table doesn't exist"
- Asegúrate de que las tablas `filter_categories` y `filter_category_variants` existan
- Si no existen, ejecuta primero: `scripts/create-filter-categories-table.sql`
