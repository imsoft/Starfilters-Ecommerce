#!/bin/bash

# Script para verificar el nombre de la base de datos

echo "🔍 Verificando bases de datos disponibles..."
echo ""

# Cargar variables de entorno si existe .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Intentar conectar y listar bases de datos
if [ -z "$DB_PASSWORD" ]; then
    echo "📋 Listando bases de datos (sin contraseña):"
    mysql -h "${DB_HOST:-localhost}" -u "${DB_USER:-root}" -e "SHOW DATABASES;" 2>/dev/null || \
    mysql -u root -e "SHOW DATABASES;" 2>/dev/null
else
    echo "📋 Listando bases de datos:"
    mysql -h "${DB_HOST:-localhost}" -u "${DB_USER:-root}" -p"$DB_PASSWORD" -e "SHOW DATABASES;" 2>/dev/null || \
    mysql -u root -p"$DB_PASSWORD" -e "SHOW DATABASES;" 2>/dev/null
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar variables de entorno
echo "📝 Variables de entorno actuales:"
if [ -f .env ]; then
    echo "   DB_HOST: ${DB_HOST:-no definido}"
    echo "   DB_USER: ${DB_USER:-no definido}"
    echo "   DB_NAME: ${DB_NAME:-no definido}"
    echo "   DB_PASSWORD: ${DB_PASSWORD:+definido (oculto)}"
else
    echo "   ⚠️  Archivo .env no encontrado"
fi

echo ""
echo "💡 Si necesitas crear la base de datos, ejecuta:"
echo "   mysql -u root -p -e \"CREATE DATABASE starfilters_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\""
