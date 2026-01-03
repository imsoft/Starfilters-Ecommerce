#!/bin/bash

# Script rápido para solucionar error 502 Bad Gateway

set -e

echo "🔧 Solucionando error 502 Bad Gateway..."
echo ""

cd ~/starfilters-app

# 1. Detener y eliminar proceso actual
echo "1. Deteniendo aplicación..."
pm2 stop starfilters-app 2>/dev/null || true
pm2 delete starfilters-app 2>/dev/null || true

# 2. Verificar que el archivo existe
if [ ! -f "dist/server/entry.mjs" ]; then
    echo "❌ ERROR: Archivo entry.mjs no existe. Reconstruyendo..."
    rm -rf dist/ .astro/
    pnpm build
fi

# 3. Iniciar aplicación
echo "2. Iniciando aplicación..."
pm2 start dist/server/entry.mjs --name starfilters-app
pm2 save

# 4. Esperar 3 segundos
echo "3. Esperando que la aplicación inicie..."
sleep 3

# 5. Verificar estado
echo "4. Verificando estado..."
pm2 status

# 6. Verificar puerto
echo "5. Verificando puerto 3000..."
if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    echo "✅ Aplicación escuchando en puerto 3000"
    netstat -tlnp 2>/dev/null | grep ":3000"
else
    echo "❌ Aplicación NO está escuchando en puerto 3000"
fi

# 7. Ver logs recientes
echo ""
echo "6. Últimos logs (sin errores antiguos):"
pm2 logs starfilters-app --lines 15 --nostream | tail -15

# 8. Verificar Nginx
echo ""
echo "7. Verificando Nginx..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx está corriendo"
else
    echo "⚠️  Nginx no está corriendo, iniciando..."
    systemctl start nginx
fi

echo ""
echo "✅ Proceso completado"
echo ""
echo "Si aún ves 502, espera 10 segundos y recarga la página."
echo "Si persiste, ejecuta: pm2 logs starfilters-app --lines 50"

