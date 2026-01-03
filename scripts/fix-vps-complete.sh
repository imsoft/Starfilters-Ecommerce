#!/bin/bash

# Script completo para corregir el error p.image_url en el VPS

set -e

echo "🔧 Corrigiendo error p.image_url en VPS..."
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Detener aplicación
echo -e "${BLUE}1. Deteniendo aplicación...${NC}"
pm2 stop starfilters-app || true
pm2 delete starfilters-app || true
echo ""

# 2. Actualizar código desde GitHub
echo -e "${BLUE}2. Actualizando código desde GitHub...${NC}"
git fetch origin
git reset --hard origin/main

# Verificar que el commit correcto esté presente
if git log --oneline -10 | grep -q "fix: corregir query en getOrderItems"; then
    echo -e "${GREEN}✅ Commit de corrección encontrado${NC}"
    git log --oneline -1 | grep "fix: corregir query en getOrderItems"
else
    echo -e "${RED}❌ ERROR: No se encontró el commit de corrección${NC}"
    echo "   Commits recientes:"
    git log --oneline -5
    exit 1
fi
echo ""

# 3. Limpiar build anterior completamente
echo -e "${BLUE}3. Limpiando build anterior...${NC}"
rm -rf dist/ .astro/ node_modules/.cache
echo -e "${GREEN}✅ Limpieza completada${NC}"
echo ""

# 4. Reconstruir aplicación
echo -e "${BLUE}4. Reconstruyendo aplicación...${NC}"
pnpm build
echo ""

# 5. Verificar que no haya consulta antigua
echo -e "${BLUE}5. Verificando código compilado...${NC}"
if grep -r "p.image_url" dist/server/chunks/ 2>/dev/null; then
    echo -e "${RED}❌ ERROR: Todavía se encontró la consulta antigua${NC}"
    exit 1
else
    echo -e "${GREEN}✅ No se encontró la consulta antigua${NC}"
fi

# Verificar que getOrderItems esté correcto
if grep -A 5 "getOrderItems" dist/server/chunks/database*.mjs | grep -q "LEFT JOIN products"; then
    echo -e "${RED}❌ ERROR: getOrderItems todavía tiene LEFT JOIN${NC}"
    exit 1
else
    echo -e "${GREEN}✅ getOrderItems está correcto${NC}"
fi
echo ""

# 6. Verificar que el archivo de entrada existe
echo -e "${BLUE}6. Verificando archivo de entrada...${NC}"
if [ ! -f "dist/server/entry.mjs" ]; then
    echo -e "${RED}❌ ERROR: Archivo entry.mjs no existe${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Archivo entry.mjs existe${NC}"
    ls -lh dist/server/entry.mjs
fi
echo ""

# 7. Iniciar aplicación con PM2
echo -e "${BLUE}7. Iniciando aplicación...${NC}"
pm2 start dist/server/entry.mjs --name starfilters-app
pm2 save
echo ""

# 8. Esperar y verificar logs
echo -e "${BLUE}8. Verificando logs (esperando 5 segundos)...${NC}"
sleep 5
pm2 logs starfilters-app --lines 30 --nostream

echo ""
echo -e "${GREEN}✅ Proceso completado${NC}"
echo ""
echo "Verifica que:"
echo "  1. No aparezca el error 'Unknown column p.image_url'"
echo "  2. El servidor esté corriendo en http://0.0.0.0:3000"
echo "  3. La aplicación responda correctamente"
echo ""
echo "Si hay problemas, ejecuta: pm2 logs starfilters-app --lines 50"

