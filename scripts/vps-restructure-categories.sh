#!/bin/bash

# ============================================
# Script para Reestructurar Categorías y Productos en VPS
# ============================================
# Este script automatiza el proceso de:
# 1. Actualizar código desde GitHub
# 2. Hacer backup de la base de datos
# 3. Ejecutar migración SQL
# 4. Reconstruir el proyecto
# 5. Reiniciar la aplicación
# ============================================

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
PROJECT_DIR="${HOME}/starfilters-app"
DB_NAME="starfilters_ecommerce_db"
DB_USER="root"
BACKUP_DIR="${HOME}/backups"
MIGRATION_FILE="migrations/restructure_categories_to_products.sql"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Reestructuración de Categorías y Productos${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Error: Directorio del proyecto no encontrado: $PROJECT_DIR${NC}"
    echo "Por favor, ajusta la variable PROJECT_DIR en el script"
    exit 1
fi

cd "$PROJECT_DIR"

# Paso 1: Actualizar código desde GitHub
echo -e "${YELLOW}📥 Paso 1: Actualizando código desde GitHub...${NC}"
git fetch origin
git pull origin main
echo -e "${GREEN}✅ Código actualizado${NC}"
echo ""

# Paso 2: Crear directorio de backups si no existe
echo -e "${YELLOW}💾 Paso 2: Preparando backup de la base de datos...${NC}"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
echo "Backup se guardará en: $BACKUP_FILE"
echo ""

# Solicitar contraseña de MySQL
echo -e "${YELLOW}Por favor, ingresa la contraseña de MySQL:${NC}"
mysqldump -u "$DB_USER" -p "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup creado exitosamente: $BACKUP_FILE${NC}"
else
    echo -e "${RED}❌ Error al crear backup. Abortando...${NC}"
    exit 1
fi
echo ""

# Paso 3: Verificar que existe el archivo de migración
echo -e "${YELLOW}📄 Paso 3: Verificando archivo de migración...${NC}"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Error: Archivo de migración no encontrado: $MIGRATION_FILE${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Archivo de migración encontrado${NC}"
echo ""

# Paso 4: Ejecutar migración SQL
echo -e "${YELLOW}🗄️  Paso 4: Ejecutando migración SQL...${NC}"
echo "Por favor, ingresa la contraseña de MySQL nuevamente:"
mysql -u "$DB_USER" -p "$DB_NAME" < "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migración ejecutada exitosamente${NC}"
else
    echo -e "${RED}❌ Error al ejecutar migración. Puedes restaurar el backup con:${NC}"
    echo -e "${YELLOW}mysql -u $DB_USER -p $DB_NAME < $BACKUP_FILE${NC}"
    exit 1
fi
echo ""

# Paso 5: Verificar migración
echo -e "${YELLOW}🔍 Paso 5: Verificando migración...${NC}"
echo "Por favor, ingresa la contraseña de MySQL para verificación:"
PRODUCTS_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -se "SELECT COUNT(*) FROM products WHERE filter_category_id IS NOT NULL;" 2>/dev/null || echo "0")

if [ "$PRODUCTS_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Migración verificada: $PRODUCTS_COUNT productos con categoría${NC}"
else
    echo -e "${YELLOW}⚠️  Advertencia: No se encontraron productos con categoría. Esto puede ser normal si no había variantes.${NC}"
fi
echo ""

# Paso 6: Instalar dependencias (si es necesario)
echo -e "${YELLOW}📦 Paso 6: Verificando dependencias...${NC}"
pnpm install
echo -e "${GREEN}✅ Dependencias verificadas${NC}"
echo ""

# Paso 7: Limpiar builds anteriores
echo -e "${YELLOW}🧹 Paso 7: Limpiando builds anteriores...${NC}"
rm -rf dist .astro
echo -e "${GREEN}✅ Builds anteriores eliminados${NC}"
echo ""

# Paso 8: Reconstruir proyecto
echo -e "${YELLOW}🔨 Paso 8: Reconstruyendo proyecto...${NC}"
pnpm build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Proyecto reconstruido exitosamente${NC}"
else
    echo -e "${RED}❌ Error al reconstruir el proyecto${NC}"
    exit 1
fi
echo ""

# Paso 9: Reiniciar aplicación con PM2
echo -e "${YELLOW}🔄 Paso 9: Reiniciando aplicación con PM2...${NC}"

# Detener aplicación si está corriendo
pm2 stop starfilters-app 2>/dev/null || true

# Reiniciar aplicación
if [ -f "ecosystem.config.cjs" ]; then
    pm2 start ecosystem.config.cjs
else
    pm2 start dist/server/entry.mjs --name starfilters-app
fi

# Esperar un momento
sleep 3

# Verificar estado
PM2_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="starfilters-app") | .pm2_env.status' 2>/dev/null || echo "unknown")

if [ "$PM2_STATUS" = "online" ]; then
    echo -e "${GREEN}✅ Aplicación iniciada correctamente${NC}"
else
    echo -e "${RED}❌ Error: Aplicación no está online. Revisa los logs:${NC}"
    echo -e "${YELLOW}pm2 logs starfilters-app --lines 50${NC}"
    exit 1
fi
echo ""

# Paso 10: Verificar puerto
echo -e "${YELLOW}🔌 Paso 10: Verificando que la aplicación está escuchando...${NC}"
sleep 2
if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    echo -e "${GREEN}✅ Aplicación está escuchando en puerto 3000${NC}"
else
    echo -e "${YELLOW}⚠️  Advertencia: No se detectó el puerto 3000. Verifica los logs:${NC}"
    echo -e "${YELLOW}pm2 logs starfilters-app --lines 50${NC}"
fi
echo ""

# Resumen final
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Proceso completado${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📋 Resumen:"
echo "  - Código actualizado desde GitHub"
echo "  - Backup guardado en: $BACKUP_FILE"
echo "  - Migración SQL ejecutada"
echo "  - Proyecto reconstruido"
echo "  - Aplicación reiniciada"
echo ""
echo "🔍 Verificaciones recomendadas:"
echo "  1. Visita: https://tu-dominio.com/filtros"
echo "  2. Haz click en una categoría"
echo "  3. Verifica que muestra productos de esa categoría"
echo ""
echo "📊 Ver estado de PM2:"
echo "  pm2 status"
echo ""
echo "📝 Ver logs:"
echo "  pm2 logs starfilters-app --lines 50"
echo ""
