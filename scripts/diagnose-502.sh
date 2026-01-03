#!/bin/bash

# Script para diagnosticar y corregir error 502 Bad Gateway

set -e

echo "🔍 Diagnosticando error 502 Bad Gateway..."
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Verificar estado de PM2
echo -e "${BLUE}1. Verificando estado de PM2...${NC}"
pm2 status
echo ""

# 2. Ver logs recientes
echo -e "${BLUE}2. Últimos 30 logs de la aplicación...${NC}"
pm2 logs starfilters-app --lines 30 --nostream || echo -e "${RED}No se encontraron logs${NC}"
echo ""

# 3. Verificar puerto
echo -e "${BLUE}3. Verificando si algo está escuchando en el puerto 3000...${NC}"
if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    echo -e "${GREEN}✅ Algo está escuchando en el puerto 3000${NC}"
    netstat -tlnp 2>/dev/null | grep ":3000"
else
    echo -e "${RED}❌ Nada está escuchando en el puerto 3000${NC}"
fi
echo ""

# 4. Verificar proceso de Node
echo -e "${BLUE}4. Verificando procesos de Node...${NC}"
ps aux | grep -E "node|pm2" | grep -v grep || echo "No se encontraron procesos de Node"
echo ""

# 5. Verificar archivo de entrada
echo -e "${BLUE}5. Verificando archivo de entrada...${NC}"
if [ -f "dist/server/entry.mjs" ]; then
    echo -e "${GREEN}✅ Archivo de entrada existe${NC}"
    ls -lh dist/server/entry.mjs
else
    echo -e "${RED}❌ Archivo de entrada NO existe${NC}"
    echo "   Necesitas ejecutar: pnpm build"
fi
echo ""

# 6. Verificar variables de entorno
echo -e "${BLUE}6. Verificando variables de entorno críticas...${NC}"
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ Archivo .env existe${NC}"
    if grep -q "PORT" .env; then
        echo "   PORT configurado"
    else
        echo -e "${YELLOW}⚠️  PORT no configurado en .env (usará default: 3000)${NC}"
    fi
    if grep -q "DATABASE" .env; then
        echo "   DATABASE configurado"
    else
        echo -e "${RED}❌ DATABASE no configurado${NC}"
    fi
else
    echo -e "${RED}❌ Archivo .env NO existe${NC}"
fi
echo ""

# 7. Verificar Nginx
echo -e "${BLUE}7. Verificando configuración de Nginx...${NC}"
if [ -f "/etc/nginx/sites-available/starfilters" ]; then
    echo -e "${GREEN}✅ Configuración de Nginx existe${NC}"
    echo "   Proxy pass configurado:"
    grep "proxy_pass" /etc/nginx/sites-available/starfilters || echo "   No se encontró proxy_pass"
    
    # Verificar sintaxis
    if nginx -t 2>&1 | grep -q "successful"; then
        echo -e "${GREEN}✅ Sintaxis de Nginx correcta${NC}"
    else
        echo -e "${RED}❌ Error en sintaxis de Nginx${NC}"
        nginx -t
    fi
else
    echo -e "${YELLOW}⚠️  Configuración de Nginx no encontrada${NC}"
fi
echo ""

# 8. Intentar iniciar/reiniciar
echo -e "${BLUE}8. Intentando reiniciar la aplicación...${NC}"
read -p "¿Reiniciar la aplicación ahora? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "   Deteniendo aplicación..."
    pm2 stop starfilters-app || true
    pm2 delete starfilters-app || true
    
    echo "   Iniciando aplicación..."
    cd ~/starfilters-app
    pm2 start dist/server/entry.mjs --name starfilters-app
    pm2 save
    
    echo "   Esperando 3 segundos..."
    sleep 3
    
    echo "   Verificando logs..."
    pm2 logs starfilters-app --lines 20 --nostream
    
    echo ""
    echo -e "${GREEN}✅ Aplicación reiniciada${NC}"
    echo "   Verifica los logs arriba para ver si hay errores"
fi

echo ""
echo -e "${BLUE}📋 Resumen del diagnóstico:${NC}"
echo "   - Revisa los logs arriba para identificar el problema"
echo "   - Si la aplicación no está corriendo, ejecuta: pm2 start dist/server/entry.mjs --name starfilters-app"
echo "   - Si hay errores en el código, ejecuta: pnpm build"
echo "   - Si Nginx tiene problemas, ejecuta: systemctl restart nginx"

