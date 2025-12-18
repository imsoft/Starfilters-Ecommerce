#!/bin/bash

# Script para mostrar la estructura completa de todas las tablas
# Uso: ./scripts/show-all-tables-structure.sh

echo "📊 ESTRUCTURA COMPLETA DE LA BASE DE DATOS"
echo "=========================================="
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

-- Mostrar todas las tablas
SELECT '=== LISTA DE TODAS LAS TABLAS ===' as '';
SHOW TABLES;

-- Estructura de filter_categories
SELECT '=== ESTRUCTURA: filter_categories ===' as '';
DESCRIBE filter_categories;

-- Datos de filter_categories
SELECT '=== DATOS: filter_categories ===' as '';
SELECT * FROM filter_categories;

-- Estructura de filter_category_variants
SELECT '=== ESTRUCTURA: filter_category_variants ===' as '';
DESCRIBE filter_category_variants;

-- Datos de filter_category_variants (primeros 10)
SELECT '=== DATOS: filter_category_variants (primeros 10) ===' as '';
SELECT * FROM filter_category_variants LIMIT 10;

-- Estructura de filter_category_images
SELECT '=== ESTRUCTURA: filter_category_images ===' as '';
DESCRIBE filter_category_images;

-- Datos de filter_category_images
SELECT '=== DATOS: filter_category_images ===' as '';
SELECT * FROM filter_category_images;

-- Estructura de products
SELECT '=== ESTRUCTURA: products ===' as '';
DESCRIBE products;

-- Datos de products (primeros 10)
SELECT '=== DATOS: products (primeros 10) ===' as '';
SELECT * FROM products LIMIT 10;

-- Estructura de product_images
SELECT '=== ESTRUCTURA: product_images ===' as '';
DESCRIBE product_images;

-- Datos de product_images (primeros 10)
SELECT '=== DATOS: product_images (primeros 10) ===' as '';
SELECT * FROM product_images LIMIT 10;

-- Conteo de registros por tabla
SELECT '=== CONTEO DE REGISTROS POR TABLA ===' as '';
SELECT 'filter_categories' as tabla, COUNT(*) as total FROM filter_categories
UNION ALL
SELECT 'filter_category_variants', COUNT(*) FROM filter_category_variants
UNION ALL
SELECT 'filter_category_images', COUNT(*) FROM filter_category_images
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'product_images', COUNT(*) FROM product_images
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL
SELECT 'blog_posts', COUNT(*) FROM blog_posts
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'admin_users', COUNT(*) FROM admin_users;

-- Análisis de filter_categories
SELECT '=== ANÁLISIS: filter_categories ===' as '';
SELECT 
    id,
    name,
    slug,
    status,
    main_image IS NOT NULL as tiene_imagen_principal,
    created_at,
    updated_at
FROM filter_categories
ORDER BY id;

-- Análisis de variantes por categoría
SELECT '=== ANÁLISIS: Variantes por categoría ===' as '';
SELECT 
    fc.id as categoria_id,
    fc.name as categoria_nombre,
    fc.status as categoria_status,
    COUNT(fcv.id) as total_variantes,
    SUM(CASE WHEN fcv.is_active = 1 THEN 1 ELSE 0 END) as variantes_activas,
    SUM(CASE WHEN fcv.is_active = 0 THEN 1 ELSE 0 END) as variantes_inactivas,
    SUM(fcv.stock) as stock_total
FROM filter_categories fc
LEFT JOIN filter_category_variants fcv ON fc.id = fcv.category_id
GROUP BY fc.id, fc.name, fc.status
ORDER BY fc.id;

-- Ver todas las variantes de la categoría 1
SELECT '=== VARIANTES DE CATEGORÍA 1 ===' as '';
SELECT 
    id,
    category_id,
    bind_code,
    nominal_size,
    real_size,
    price,
    stock,
    is_active,
    created_at
FROM filter_category_variants
WHERE category_id = 1
ORDER BY id;

EOF

echo ""
echo "✅ Información mostrada"

