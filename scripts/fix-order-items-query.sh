#!/bin/bash

# Script para corregir el error "Unknown column 'p.image_url' in 'field list'"
# Este script actualiza el código en el VPS y reconstruye la aplicación

set -e

echo "🔧 Corrigiendo error de consulta en getOrderItems..."
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Detener la aplicación
echo -e "${YELLOW}1. Deteniendo aplicación...${NC}"
pm2 stop starfilters-app || true

# 2. Actualizar código desde GitHub
echo -e "${YELLOW}2. Actualizando código desde GitHub...${NC}"
git fetch origin
git reset --hard origin/main

# Verificar que el commit correcto esté presente
if git log --oneline -1 | grep -q "fix: corregir query en getOrderItems"; then
    echo -e "${GREEN}✅ Commit de corrección encontrado${NC}"
else
    echo -e "${RED}⚠️  Advertencia: No se encontró el commit de corrección${NC}"
    echo "   Verificando commits recientes..."
    git log --oneline -5
fi

# 3. Limpiar build anterior
echo -e "${YELLOW}3. Limpiando build anterior...${NC}"
rm -rf dist/ .astro/ node_modules/.cache

# 4. Reinstalar dependencias (opcional)
read -p "¿Reinstalar dependencias? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}4. Reinstalando dependencias...${NC}"
    pnpm install
else
    echo -e "${YELLOW}4. Omitiendo reinstalación de dependencias...${NC}"
fi

# 5. Reconstruir aplicación
echo -e "${YELLOW}5. Reconstruyendo aplicación...${NC}"
pnpm build

# 6. Verificar que no haya consulta antigua
echo -e "${YELLOW}6. Verificando código compilado...${NC}"
if grep -r "p.image_url" dist/server/chunks/ 2>/dev/null; then
    echo -e "${RED}❌ ERROR: Todavía se encontró la consulta antigua en el código compilado${NC}"
    exit 1
else
    echo -e "${GREEN}✅ No se encontró la consulta antigua${NC}"
fi

# 7. Verificar que getOrderItems esté correcto
echo -e "${YELLOW}7. Verificando función getOrderItems...${NC}"
if grep -A 5 "getOrderItems" dist/server/chunks/database*.mjs | grep -q "LEFT JOIN products"; then
    echo -e "${RED}❌ ERROR: getOrderItems todavía tiene LEFT JOIN con products${NC}"
    exit 1
else
    echo -e "${GREEN}✅ getOrderItems está correcto${NC}"
fi

# 8. Reiniciar aplicación
echo -e "${YELLOW}8. Reiniciando aplicación...${NC}"
pm2 restart starfilters-app

# 9. Esperar un momento y verificar logs
echo -e "${YELLOW}9. Verificando logs...${NC}"
sleep 3
pm2 logs starfilters-app --lines 20 --nostream

echo ""
echo -e "${GREEN}✅ Proceso completado${NC}"
echo ""
echo "Verifica que no aparezca el error 'Unknown column p.image_url' en los logs."
echo "Si el error persiste, ejecuta: pm2 logs starfilters-app --lines 50"

