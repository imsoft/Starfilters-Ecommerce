#!/bin/bash

# Script para exportar la estructura completa de la base de datos
# Uso: ./scripts/export-database-structure.sh

echo "📊 Exportando estructura de la base de datos..."
echo ""

# Cargar variables de entorno
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️ Archivo .env no encontrado. Usando valores por defecto."
    echo "Por favor, proporciona las credenciales manualmente."
    exit 1
fi

# Verificar que las variables estén definidas
if [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    echo "❌ Variables de base de datos no encontradas en .env"
    echo "Necesitas: DB_NAME, DB_USER, DB_PASSWORD"
    exit 1
fi

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}

echo "🔍 Conectando a: $DB_HOST:$DB_PORT"
echo "📦 Base de datos: $DB_NAME"
echo "👤 Usuario: $DB_USER"
echo ""

# Crear directorio para exports si no existe
mkdir -p database/exports
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EXPORT_FILE="database/exports/db_structure_${TIMESTAMP}.sql"

echo "📝 Exportando estructura completa..."
mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
    --no-data \
    --routines \
    --triggers \
    "$DB_NAME" > "$EXPORT_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Estructura exportada a: $EXPORT_FILE"
else
    echo "❌ Error al exportar estructura"
    exit 1
fi

# Exportar datos de tablas específicas importantes
echo ""
echo "📝 Exportando datos de tablas importantes..."

DATA_FILE="database/exports/db_data_${TIMESTAMP}.sql"

mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
    --no-create-info \
    --skip-triggers \
    "$DB_NAME" \
    filter_categories \
    filter_category_variants \
    filter_category_images \
    products \
    product_images \
    > "$DATA_FILE" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Datos exportados a: $DATA_FILE"
else
    echo "⚠️ Algunas tablas pueden no existir (esto es normal)"
fi

# Mostrar estructura de tablas específicas
echo ""
echo "📋 Estructura de tablas relevantes:"
echo "=================================="

mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" <<EOF
-- Mostrar todas las tablas
SHOW TABLES;

-- Estructura de filter_categories
DESCRIBE filter_categories;

-- Estructura de filter_category_variants
DESCRIBE filter_category_variants;

-- Estructura de products
DESCRIBE products;

-- Contar registros
SELECT 'filter_categories' as tabla, COUNT(*) as total FROM filter_categories
UNION ALL
SELECT 'filter_category_variants', COUNT(*) FROM filter_category_variants
UNION ALL
SELECT 'products', COUNT(*) FROM products;

-- Ver categorías y su estado
SELECT id, name, status, slug, created_at FROM filter_categories ORDER BY id;

-- Ver productos y su estado
SELECT id, name, status, category, price, stock FROM products ORDER BY id LIMIT 10;
EOF

echo ""
echo "✅ Exportación completada"
echo "📁 Archivos guardados en: database/exports/"
echo ""
echo "Para compartir la estructura, puedes:"
echo "1. Mostrar el contenido: cat $EXPORT_FILE"
echo "2. Copiar el archivo a tu máquina local"
echo "3. Compartir el contenido del archivo"

