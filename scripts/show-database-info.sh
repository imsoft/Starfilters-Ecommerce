#!/bin/bash

# Script rápido para mostrar información de la base de datos
# Uso: ./scripts/show-database-info.sh

echo "📊 Información de la Base de Datos"
echo "===================================="
echo ""

# Cargar variables de entorno
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️ Archivo .env no encontrado"
    exit 1
fi

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}

mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" <<EOF

-- 1. Listar todas las tablas
SELECT '=== TABLAS EN LA BASE DE DATOS ===' as '';
SHOW TABLES;

-- 2. Estructura de filter_categories
SELECT '=== ESTRUCTURA: filter_categories ===' as '';
DESCRIBE filter_categories;

-- 3. Datos de filter_categories
SELECT '=== DATOS: filter_categories ===' as '';
SELECT id, name, slug, status, main_image IS NOT NULL as tiene_imagen, created_at 
FROM filter_categories 
ORDER BY id;

-- 4. Estructura de filter_category_variants
SELECT '=== ESTRUCTURA: filter_category_variants ===' as '';
DESCRIBE filter_category_variants;

-- 5. Conteo de variantes por categoría
SELECT '=== VARIANTES POR CATEGORÍA ===' as '';
SELECT 
    fc.id as categoria_id,
    fc.name as categoria_nombre,
    fc.status as categoria_status,
    COUNT(fcv.id) as total_variantes,
    SUM(CASE WHEN fcv.is_active = 1 THEN 1 ELSE 0 END) as variantes_activas
FROM filter_categories fc
LEFT JOIN filter_category_variants fcv ON fc.id = fcv.category_id
GROUP BY fc.id, fc.name, fc.status
ORDER BY fc.id;

-- 6. Estructura de products
SELECT '=== ESTRUCTURA: products ===' as '';
DESCRIBE products;

-- 7. Conteo de productos por estado
SELECT '=== PRODUCTOS POR ESTADO ===' as '';
SELECT status, COUNT(*) as total FROM products GROUP BY status;

-- 8. Primeros 5 productos
SELECT '=== PRIMEROS 5 PRODUCTOS ===' as '';
SELECT id, name, status, category, price, stock FROM products ORDER BY id LIMIT 5;

EOF

echo ""
echo "✅ Información mostrada"

