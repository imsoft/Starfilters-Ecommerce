#!/bin/bash

# Script para verificar imágenes de categorías

set -e

echo "🔍 Verificando categorías e imágenes..."
echo ""

# Cargar variables de entorno si existe .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

DB_HOST=${DB_HOST:-localhost}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-}
DB_NAME=${DB_NAME:-starfilters_ecommerce_db}

echo "📊 Todas las categorías:"
mysql -h "$DB_HOST" -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} "$DB_NAME" -e "SELECT id, name, main_image, status FROM filter_categories ORDER BY id DESC LIMIT 10;" 2>/dev/null

echo ""
echo "📊 Imágenes en filter_category_images:"
mysql -h "$DB_HOST" -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} "$DB_NAME" -e "SELECT id, category_id, image_url, is_primary, sort_order FROM filter_category_images ORDER BY created_at DESC LIMIT 10;" 2>/dev/null

echo ""
echo "📊 Contar imágenes por categoría:"
mysql -h "$DB_HOST" -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} "$DB_NAME" -e "SELECT category_id, COUNT(*) as total, SUM(CASE WHEN is_primary = 1 THEN 1 ELSE 0 END) as principales, SUM(CASE WHEN is_primary = 0 THEN 1 ELSE 0 END) as carrusel FROM filter_category_images GROUP BY category_id;" 2>/dev/null

echo ""
echo "✅ Verificación completada"
