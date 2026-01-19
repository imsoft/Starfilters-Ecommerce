#!/bin/bash

# Script para verificar el estado de las tablas de imágenes en la BD

set -e

echo "🔍 Verificando estado de las tablas de imágenes..."
echo ""

# Cargar variables de entorno si existe .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

DB_HOST=${DB_HOST:-localhost}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-}
DB_NAME=${DB_NAME:-starfilters_ecommerce_db}

echo "📊 Base de datos: $DB_NAME"
echo ""

# Verificar si existe la tabla filter_category_images
echo "1️⃣ Verificando tabla filter_category_images..."
TABLE_EXISTS=$(mysql -h "$DB_HOST" -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} "$DB_NAME" -e "SHOW TABLES LIKE 'filter_category_images';" 2>/dev/null | grep -c "filter_category_images" || echo "0")

if [ "$TABLE_EXISTS" -eq 0 ]; then
    echo "❌ La tabla filter_category_images NO existe"
    echo ""
    echo "💡 Para crearla, ejecuta:"
    echo "   mysql -u root -p $DB_NAME < migrations/create_filter_category_images_table.sql"
else
    echo "✅ La tabla filter_category_images existe"
    echo ""
    echo "📋 Estructura de la tabla:"
    mysql -h "$DB_HOST" -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} "$DB_NAME" -e "DESCRIBE filter_category_images;" 2>/dev/null
    echo ""
    echo "📊 Registros en filter_category_images:"
    mysql -h "$DB_HOST" -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} "$DB_NAME" -e "SELECT COUNT(*) as total FROM filter_category_images;" 2>/dev/null
    echo ""
    echo "📋 Últimas 10 imágenes guardadas:"
    mysql -h "$DB_HOST" -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} "$DB_NAME" -e "SELECT id, category_id, image_url, is_primary, sort_order, created_at FROM filter_category_images ORDER BY created_at DESC LIMIT 10;" 2>/dev/null
fi

echo ""
echo "2️⃣ Verificando tabla product_images..."
TABLE_EXISTS_PRODUCT=$(mysql -h "$DB_HOST" -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} "$DB_NAME" -e "SHOW TABLES LIKE 'product_images';" 2>/dev/null | grep -c "product_images" || echo "0")

if [ "$TABLE_EXISTS_PRODUCT" -eq 0 ]; then
    echo "❌ La tabla product_images NO existe"
else
    echo "✅ La tabla product_images existe"
    echo ""
    echo "📊 Registros en product_images:"
    mysql -h "$DB_HOST" -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} "$DB_NAME" -e "SELECT COUNT(*) as total FROM product_images;" 2>/dev/null
fi

echo ""
echo "3️⃣ Verificando categorías existentes:"
mysql -h "$DB_HOST" -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} "$DB_NAME" -e "SELECT id, name, main_image FROM filter_categories LIMIT 5;" 2>/dev/null

echo ""
echo "✅ Verificación completada"
