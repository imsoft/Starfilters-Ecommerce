#!/bin/bash

# Script para verificar categoría 10 específicamente

set -e

if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

DB_HOST=${DB_HOST:-localhost}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-}
DB_NAME=${DB_NAME:-starfilters_ecommerce_db}

echo "🔍 Verificando categoría 10..."
echo ""

echo "📊 Información de la categoría:"
mysql -h "$DB_HOST" -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} "$DB_NAME" -e "SELECT id, name, main_image, status FROM filter_categories WHERE id = 10;" 2>/dev/null

echo ""
echo "📊 Todas las imágenes de la categoría 10:"
mysql -h "$DB_HOST" -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} "$DB_NAME" -e "SELECT id, category_id, image_url, is_primary, sort_order, created_at FROM filter_category_images WHERE category_id = 10 ORDER BY sort_order, id;" 2>/dev/null

echo ""
echo "✅ Verificación completada"
