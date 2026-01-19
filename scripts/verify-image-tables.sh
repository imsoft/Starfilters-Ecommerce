#!/bin/bash

# Script para verificar y crear las tablas de imágenes si no existen
# Uso: ./scripts/verify-image-tables.sh

set -e

echo "🔍 Verificando tablas de imágenes..."

# Cargar variables de entorno
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Verificar que las variables de entorno estén definidas
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
    echo "❌ Error: Variables de entorno de base de datos no configuradas"
    echo "   Asegúrate de tener DB_HOST, DB_USER, DB_PASSWORD y DB_NAME en tu archivo .env"
    exit 1
fi

echo "📊 Verificando tabla product_images..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
SELECT COUNT(*) as count FROM information_schema.tables 
WHERE table_schema = '$DB_NAME' AND table_name = 'product_images';
" | grep -q "1" && echo "✅ product_images existe" || echo "⚠️  product_images NO existe"

echo "📊 Verificando tabla filter_category_images..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
SELECT COUNT(*) as count FROM information_schema.tables 
WHERE table_schema = '$DB_NAME' AND table_name = 'filter_category_images';
" | grep -q "1" && echo "✅ filter_category_images existe" || echo "❌ filter_category_images NO existe - Necesita crearse"

echo ""
echo "📝 Creando tabla filter_category_images si no existe..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < migrations/create_filter_category_images_table.sql

echo ""
echo "✅ Verificación completada!"
echo ""
echo "📊 Estructura de product_images:"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
DESCRIBE product_images;
"

echo ""
echo "📊 Estructura de filter_category_images:"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
DESCRIBE filter_category_images;
"
