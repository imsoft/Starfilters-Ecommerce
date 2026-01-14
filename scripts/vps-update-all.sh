#!/bin/bash

# Script completo para actualizar el VPS con todas las mejoras
# Este script automatiza todo el proceso de actualización

set -e

echo "🚀 Iniciando actualización completa del VPS..."
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_step() {
    echo -e "${GREEN}▶${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. Asegúrate de estar en el directorio del proyecto."
    exit 1
fi

PROJECT_DIR=$(pwd)
print_step "Directorio del proyecto: $PROJECT_DIR"
echo ""

# PASO 1: Actualizar código desde GitHub
print_step "PASO 1: Actualizando código desde GitHub..."
git status
echo ""
read -p "¿Continuar con git pull? (s/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    git pull origin main
    echo ""
else
    print_warning "Saltando git pull"
    echo ""
fi

# PASO 2: Ejecutar script SQL
print_step "PASO 2: Ejecutando script SQL para actualizar base de datos..."
if [ -f "scripts/update-filter-categories-db.sh" ]; then
    chmod +x scripts/update-filter-categories-db.sh
    read -p "¿Ejecutar script SQL? (s/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        ./scripts/update-filter-categories-db.sh
        echo ""
    else
        print_warning "Saltando script SQL"
        echo ""
    fi
else
    print_error "No se encontró scripts/update-filter-categories-db.sh"
    exit 1
fi

# PASO 3: Limpiar builds anteriores
print_step "PASO 3: Limpiando builds anteriores..."
read -p "¿Limpiar dist/ y .astro/? (s/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    rm -rf dist/ .astro/
    echo "✅ Limpieza completada"
    echo ""
else
    print_warning "Saltando limpieza"
    echo ""
fi

# PASO 4: Instalar dependencias
print_step "PASO 4: Instalando dependencias..."
read -p "¿Ejecutar pnpm install? (s/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    pnpm install
    echo ""
else
    print_warning "Saltando pnpm install"
    echo ""
fi

# PASO 5: Construir la aplicación
print_step "PASO 5: Construyendo la aplicación..."
read -p "¿Ejecutar pnpm build? (s/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    pnpm build
    echo ""
    if [ $? -eq 0 ]; then
        echo "✅ Build completado exitosamente"
        echo ""
    else
        print_error "Error en el build"
        exit 1
    fi
else
    print_warning "Saltando build"
    echo ""
fi

# PASO 6: Reiniciar PM2
print_step "PASO 6: Reiniciando aplicación con PM2..."
read -p "¿Reiniciar PM2? (s/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    # Verificar si existe ecosystem.config.cjs
    if [ -f "ecosystem.config.cjs" ]; then
        pm2 stop starfilters-app 2>/dev/null || true
        pm2 delete starfilters-app 2>/dev/null || true
        pm2 start ecosystem.config.cjs
    elif [ -f "server.js" ]; then
        pm2 stop starfilters-app 2>/dev/null || true
        pm2 delete starfilters-app 2>/dev/null || true
        pm2 start server.js --name starfilters-app
    else
        print_error "No se encontró ecosystem.config.cjs ni server.js"
        exit 1
    fi
    
    pm2 save
    echo ""
    echo "✅ PM2 reiniciado"
    echo ""
    
    # Mostrar estado
    echo "📊 Estado de PM2:"
    pm2 status
    echo ""
    
    # Verificar puerto
    echo "🔍 Verificando puerto 3000:"
    if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
        echo "✅ Aplicación escuchando en puerto 3000"
        netstat -tlnp 2>/dev/null | grep ":3000"
    else
        print_warning "⚠️  Aplicación NO está escuchando en puerto 3000"
        echo "   Revisa los logs: pm2 logs starfilters-app"
    fi
    echo ""
else
    print_warning "Saltando reinicio de PM2"
    echo ""
fi

# Resumen final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Actualización completada${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Verifica los logs: pm2 logs starfilters-app --lines 20"
echo "   2. Prueba la aplicación en: https://srv1171123.hstgr.cloud"
echo "   3. Verifica que los formularios de categorías funcionan correctamente"
echo ""
echo "🆘 Si hay problemas:"
echo "   - Ver logs: pm2 logs starfilters-app"
echo "   - Verificar BD: mysql -u root -p -e 'USE starfilters_db; DESCRIBE filter_categories;'"
echo "   - Revisar documentación: docs/VPS_UPDATE_FILTER_CATEGORIES.md"
echo ""
