#!/bin/bash

# Script para verificar las imágenes de un producto específico
# Uso: ./scripts/check-product-images.sh <product_id>

PRODUCT_ID=${1:-14}

# Cargar variables de entorno desde .env si existe
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Usar variables de entorno o valores por defecto
DB_HOST=${DB_HOST:-localhost}
DB_USER=${DB_USER:-root}
DB_PASS=${DB_PASS:-}
DB_NAME=${DB_NAME:-starfilters_ecommerce_db}

echo "🔍 Verificando imágenes del producto ID: $PRODUCT_ID"
echo "📊 Base de datos: $DB_NAME"
echo ""

# Verificar si el producto existe
echo "1. Verificando si el producto existe..."
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
SELECT id, name, uuid 
FROM products 
WHERE id = $PRODUCT_ID;
" 2>/dev/null

echo ""
echo "2. Imágenes asociadas al producto:"
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
SELECT 
    id,
    uuid,
    product_id,
    image_url,
    is_primary,
    sort_order,
    alt_text,
    created_at
FROM product_images 
WHERE product_id = $PRODUCT_ID
ORDER BY is_primary DESC, sort_order ASC, created_at ASC;
" 2>/dev/null

echo ""
echo "3. Resumen:"
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
SELECT 
    COUNT(*) as total_imagenes,
    SUM(CASE WHEN is_primary = 1 THEN 1 ELSE 0 END) as imagenes_principales,
    SUM(CASE WHEN is_primary = 0 THEN 1 ELSE 0 END) as imagenes_carrusel
FROM product_images 
WHERE product_id = $PRODUCT_ID;
" 2>/dev/null

echo ""
echo "✅ Verificación completada"
