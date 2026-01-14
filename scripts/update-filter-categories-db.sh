#!/bin/bash

# Script para actualizar la base de datos con todos los campos necesarios
# para el sistema completo de categorías de filtros

set -e

echo "🔧 Actualizando base de datos para Filter Categories..."
echo ""

# Cargar variables de entorno
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ Error: Archivo .env no encontrado"
    exit 1
fi

# Verificar que las variables estén definidas
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
    echo "❌ Error: Variables de entorno DB_HOST, DB_USER o DB_NAME no están definidas"
    exit 1
fi

# Ejecutar script SQL
echo "📝 Ejecutando script SQL de actualización..."
echo ""

if [ -z "$DB_PASSWORD" ]; then
    mysql -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" < migrations/update_filter_categories_complete.sql
else
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < migrations/update_filter_categories_complete.sql
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Base de datos actualizada exitosamente!"
    echo ""
    echo "Campos agregados/modificados:"
    echo "  - filter_categories.efficiency_en (TEXT)"
    echo "  - filter_categories.efficiency (cambiado a TEXT si era VARCHAR)"
    echo "  - filter_category_variants.currency (ENUM('MXN', 'USD'))"
    echo "  - filter_category_variants.price_usd (DECIMAL(10, 2))"
    echo ""
else
    echo ""
    echo "❌ Error al actualizar la base de datos"
    exit 1
fi
