#!/bin/bash

# Script para agregar campos técnicos a la tabla products
# Ejecutar en el VPS después de hacer git pull

set -e

echo "🔧 Agregando campos técnicos a la tabla products..."

# Cargar variables de entorno
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Usar la base de datos del .env o la predeterminada
DB_NAME="${DB_NAME:-starfilters_ecommerce_db}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"

# Si hay contraseña, usarla
if [ -n "$DB_PASSWORD" ]; then
    MYSQL_CMD="mysql -u $DB_USER -p$DB_PASSWORD"
else
    MYSQL_CMD="mysql -u $DB_USER"
fi

# Ejecutar el script SQL
echo "📝 Ejecutando migración SQL..."
echo "   Usando versión compatible con MySQL antiguo..."

# Intentar primero con la versión simple (más rápida)
# Si falla, usar la versión segura
if $MYSQL_CMD $DB_NAME < migrations/add_product_technical_fields.sql 2>/dev/null; then
    echo "✅ Migración ejecutada con versión simple"
else
    echo "⚠️  La versión simple falló, usando versión segura..."
    $MYSQL_CMD $DB_NAME < migrations/add_product_technical_fields_safe.sql
fi

if [ $? -eq 0 ]; then
    echo "✅ Campos técnicos agregados exitosamente"
else
    echo "❌ Error al agregar campos técnicos"
    exit 1
fi
