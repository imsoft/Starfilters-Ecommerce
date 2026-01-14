# 🔧 Solución: Error "Unknown database 'starfilters_db'"

## Problema

El error indica que la base de datos tiene un nombre diferente al esperado.

## ✅ Solución Rápida

Tu base de datos se llama `starfilters_ecommerce_db`, no `starfilters_db`.

### Opción 1: Ejecutar SQL directamente (Más Rápido)

En el VPS, ejecuta:

```bash
cd ~/starfilters-app
mysql -u root -p starfilters_ecommerce_db < migrations/update_filter_categories_complete.sql
```

### Opción 2: Actualizar el .env

```bash
cd ~/starfilters-app
nano .env
```

Busca la línea:
```
DB_NAME=starfilters_db
```

Y cámbiala a:
```
DB_NAME=starfilters_ecommerce_db
```

Luego guarda (Ctrl+O, Enter, Ctrl+X) y ejecuta:
```bash
./scripts/update-filter-categories-db.sh
```

### Opción 3: Usar el script mejorado

```bash
cd ~/starfilters-app
git pull origin main  # Para obtener el script actualizado
chmod +x scripts/update-filter-categories-db-fixed.sh
./scripts/update-filter-categories-db-fixed.sh
```

## ✅ Verificar que Funcionó

Después de ejecutar el SQL, verifica:

```bash
mysql -u root -p starfilters_ecommerce_db -e "
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'starfilters_ecommerce_db' 
  AND TABLE_NAME = 'filter_categories' 
  AND COLUMN_NAME IN ('efficiency', 'efficiency_en')
ORDER BY ORDINAL_POSITION;

SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'starfilters_ecommerce_db' 
  AND TABLE_NAME = 'filter_category_variants' 
  AND COLUMN_NAME IN ('currency', 'price_usd')
ORDER BY ORDINAL_POSITION;
"
```

Deberías ver los campos:
- ✅ `efficiency` (TEXT)
- ✅ `efficiency_en` (TEXT)
- ✅ `currency` (ENUM)
- ✅ `price_usd` (DECIMAL)
