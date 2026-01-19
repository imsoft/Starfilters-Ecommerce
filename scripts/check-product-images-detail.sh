#!/bin/bash

# Script para verificar detalladamente las imágenes de un producto específico
# Uso: ./scripts/check-product-images-detail.sh <product_id>

PRODUCT_ID=${1:-20}

# Cargar variables de entorno desde .env si existe
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Usar variables de entorno o valores por defecto
DB_HOST=${DB_HOST:-localhost}
DB_USER=${DB_USER:-root}
DB_PASS=${DB_PASS:-}
DB_NAME=${DB_NAME:-starfilters_ecommerce_db}

echo "=========================================="
echo "🔍 VERIFICACIÓN DETALLADA DE IMÁGENES"
echo "=========================================="
echo "📦 Producto ID: $PRODUCT_ID"
echo "📊 Base de datos: $DB_NAME"
echo ""

# Verificar si el producto existe
echo "1️⃣  INFORMACIÓN DEL PRODUCTO:"
echo "----------------------------------------"
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
SELECT 
    id,
    name,
    uuid,
    status,
    created_at,
    updated_at
FROM products 
WHERE id = $PRODUCT_ID;
" 2>/dev/null

echo ""
echo "2️⃣  TODAS LAS IMÁGENES DEL PRODUCTO:"
echo "----------------------------------------"
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
SELECT 
    id,
    uuid,
    product_id,
    SUBSTRING(image_url, 1, 80) as image_url_short,
    is_primary,
    sort_order,
    alt_text,
    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
FROM product_images 
WHERE product_id = $PRODUCT_ID
ORDER BY is_primary DESC, sort_order ASC, created_at ASC;
" 2>/dev/null

echo ""
echo "3️⃣  RESUMEN ESTADÍSTICO:"
echo "----------------------------------------"
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
SELECT 
    COUNT(*) as total_imagenes,
    SUM(CASE WHEN is_primary = 1 THEN 1 ELSE 0 END) as imagenes_principales,
    SUM(CASE WHEN is_primary = 0 OR is_primary IS NULL THEN 1 ELSE 0 END) as imagenes_carrusel,
    MIN(sort_order) as sort_order_minimo,
    MAX(sort_order) as sort_order_maximo
FROM product_images 
WHERE product_id = $PRODUCT_ID;
" 2>/dev/null

echo ""
echo "4️⃣  DETALLE DE CADA IMAGEN:"
echo "----------------------------------------"
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
SELECT 
    id as 'ID',
    CASE 
        WHEN is_primary = 1 THEN '✅ Principal'
        WHEN is_primary = 0 THEN '🖼️  Carrusel'
        ELSE '❓ Sin definir'
    END as 'Tipo',
    sort_order as 'Orden',
    SUBSTRING(image_url, 1, 60) as 'URL (primeros 60 chars)',
    alt_text as 'Texto Alt',
    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as 'Creada'
FROM product_images 
WHERE product_id = $PRODUCT_ID
ORDER BY is_primary DESC, sort_order ASC, created_at ASC;
" 2>/dev/null

echo ""
echo "5️⃣  VERIFICAR VALORES DE is_primary:"
echo "----------------------------------------"
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
SELECT 
    id,
    is_primary,
    CASE 
        WHEN is_primary = 1 THEN '1 (true/boolean)'
        WHEN is_primary = 0 THEN '0 (false/boolean)'
        WHEN is_primary IS NULL THEN 'NULL'
        ELSE CONCAT('Otro: ', is_primary)
    END as 'Valor is_primary',
    typeof(is_primary) as 'Tipo MySQL'
FROM product_images 
WHERE product_id = $PRODUCT_ID
ORDER BY id;
" 2>/dev/null

echo ""
echo "6️⃣  VERIFICAR URLs COMPLETAS (primeros 100 caracteres):"
echo "----------------------------------------"
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
SELECT 
    id,
    CASE 
        WHEN is_primary = 1 THEN '✅ Principal'
        ELSE '🖼️  Carrusel'
    END as tipo,
    SUBSTRING(image_url, 1, 100) as url
FROM product_images 
WHERE product_id = $PRODUCT_ID
ORDER BY is_primary DESC, sort_order ASC;
" 2>/dev/null

echo ""
echo "=========================================="
echo "✅ Verificación completada"
echo "=========================================="
echo ""
echo "💡 CONSEJOS PARA DIAGNÓSTICO:"
echo "   - Si total_imagenes = 0: Las imágenes NO se guardaron"
echo "   - Si imagenes_principales > 1: Hay múltiples imágenes principales (error)"
echo "   - Si imagenes_carrusel > 4: Hay más de 4 imágenes de carrusel"
echo "   - Verifica que las URLs sean válidas y accesibles"
echo ""
