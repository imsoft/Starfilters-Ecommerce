#!/bin/bash

# Script para crear la tabla filter_category_images
# Detecta automáticamente el nombre de la base de datos desde .env

set -e

echo "🔍 Detectando configuración de base de datos..."

# Cargar variables de entorno si existe .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Variables de entorno cargadas desde .env"
else
    echo "⚠️  No se encontró archivo .env"
    echo "   Usando valores por defecto o variables de entorno del sistema"
fi

# Verificar que las variables estén definidas
DB_HOST=${DB_HOST:-localhost}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-}
DB_NAME=${DB_NAME:-starfilters_db}

echo ""
echo "📊 Configuración detectada:"
echo "   Host: $DB_HOST"
echo "   Usuario: $DB_USER"
echo "   Base de datos: $DB_NAME"
echo ""

# Listar bases de datos disponibles
echo "🔍 Bases de datos disponibles:"
mysql -h "$DB_HOST" -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} -e "SHOW DATABASES;" 2>/dev/null || {
    echo "❌ Error al conectar. Verifica las credenciales."
    echo ""
    echo "💡 Si necesitas ingresar la contraseña manualmente, ejecuta:"
    echo "   mysql -h $DB_HOST -u $DB_USER -p"
    exit 1
}

echo ""
read -p "¿Usar '$DB_NAME' como base de datos? (s/n): " confirm

if [[ ! $confirm =~ ^[Ss]$ ]]; then
    read -p "Ingresa el nombre de la base de datos: " DB_NAME
fi

echo ""
echo "📝 Creando tabla filter_category_images en '$DB_NAME'..."

# Verificar si la tabla ya existe
TABLE_EXISTS=$(mysql -h "$DB_HOST" -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} "$DB_NAME" -e "SHOW TABLES LIKE 'filter_category_images';" 2>/dev/null | grep -c "filter_category_images" || echo "0")

if [ "$TABLE_EXISTS" -gt 0 ]; then
    echo "⚠️  La tabla filter_category_images ya existe."
    read -p "¿Deseas eliminarla y recrearla? (s/n): " recreate
    if [[ $recreate =~ ^[Ss]$ ]]; then
        echo "🗑️  Eliminando tabla existente..."
        mysql -h "$DB_HOST" -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} "$DB_NAME" -e "DROP TABLE IF EXISTS filter_category_images;" 2>/dev/null
    else
        echo "✅ Tabla ya existe, no se realizarán cambios."
        exit 0
    fi
fi

# Crear la tabla
mysql -h "$DB_HOST" -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} "$DB_NAME" <<EOF
CREATE TABLE IF NOT EXISTS filter_category_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    category_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    sort_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES filter_categories(id) ON DELETE CASCADE,
    INDEX idx_filter_category_images_category_id (category_id),
    INDEX idx_filter_category_images_uuid (uuid),
    INDEX idx_filter_category_images_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Tabla filter_category_images creada exitosamente!"
    echo ""
    echo "📊 Estructura de la tabla:"
    mysql -h "$DB_HOST" -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} "$DB_NAME" -e "DESCRIBE filter_category_images;" 2>/dev/null
else
    echo "❌ Error al crear la tabla"
    exit 1
fi
