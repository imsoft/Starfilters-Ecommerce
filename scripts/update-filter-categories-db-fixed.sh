#!/bin/bash

# Script para actualizar la base de datos con todos los campos necesarios
# Versión que detecta automáticamente el nombre de la base de datos

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
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ]; then
    echo "❌ Error: Variables de entorno DB_HOST o DB_USER no están definidas"
    exit 1
fi

# Detectar el nombre de la base de datos
if [ -z "$DB_NAME" ]; then
    echo "⚠️  DB_NAME no está definido en .env, intentando detectar..."
    
    # Intentar encontrar la base de datos
    if [ -z "$DB_PASSWORD" ]; then
        DB_NAME=$(mysql -h "$DB_HOST" -u "$DB_USER" -e "SHOW DATABASES;" 2>/dev/null | grep -E "starfilters|ecommerce" | head -1 || echo "")
    else
        DB_NAME=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SHOW DATABASES;" 2>/dev/null | grep -E "starfilters|ecommerce" | head -1 || echo "")
    fi
    
    if [ -z "$DB_NAME" ]; then
        echo "❌ No se pudo detectar el nombre de la base de datos"
        echo "   Por favor, actualiza tu .env con: DB_NAME=starfilters_ecommerce_db"
        exit 1
    fi
    
    echo "✅ Base de datos detectada: $DB_NAME"
    echo ""
fi

# Verificar que la base de datos existe
echo "🔍 Verificando que la base de datos '$DB_NAME' existe..."
if [ -z "$DB_PASSWORD" ]; then
    DB_EXISTS=$(mysql -h "$DB_HOST" -u "$DB_USER" -e "SHOW DATABASES LIKE '$DB_NAME';" 2>/dev/null | grep -c "$DB_NAME" || echo "0")
else
    DB_EXISTS=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SHOW DATABASES LIKE '$DB_NAME';" 2>/dev/null | grep -c "$DB_NAME" || echo "0")
fi

if [ "$DB_EXISTS" = "0" ]; then
    echo "❌ Error: La base de datos '$DB_NAME' no existe"
    echo ""
    echo "📋 Bases de datos disponibles:"
    if [ -z "$DB_PASSWORD" ]; then
        mysql -h "$DB_HOST" -u "$DB_USER" -e "SHOW DATABASES;" 2>/dev/null || mysql -u root -e "SHOW DATABASES;" 2>/dev/null
    else
        mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SHOW DATABASES;" 2>/dev/null || mysql -u root -p"$DB_PASSWORD" -e "SHOW DATABASES;" 2>/dev/null
    fi
    exit 1
fi

echo "✅ Base de datos '$DB_NAME' encontrada"
echo ""

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
