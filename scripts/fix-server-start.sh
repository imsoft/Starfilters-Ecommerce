#!/bin/bash

# Script para corregir el inicio del servidor usando server.js

set -e

echo "🔧 Corrigiendo inicio del servidor..."
echo ""

cd ~/starfilters-app

# 1. Verificar que server.js existe
if [ ! -f "server.js" ]; then
    echo "❌ ERROR: Archivo server.js no existe"
    echo "   Necesitas crear el archivo server.js o usar el correcto"
    exit 1
fi

echo "✅ Archivo server.js existe"
echo ""

# 2. Detener y eliminar proceso actual
echo "1. Limpiando procesos de PM2..."
pm2 stop starfilters-app 2>/dev/null || true
pm2 delete starfilters-app 2>/dev/null || true
pm2 flush starfilters-app 2>/dev/null || true
echo ""

# 3. Verificar que dist/server/entry.mjs existe
if [ ! -f "dist/server/entry.mjs" ]; then
    echo "❌ Archivo entry.mjs no existe. Reconstruyendo..."
    rm -rf dist/ .astro/
    pnpm build
fi
echo ""

# 4. Verificar variables de entorno
if [ ! -f ".env" ]; then
    echo "❌ ERROR: Archivo .env no existe"
    exit 1
fi
echo "✅ Archivo .env existe"
echo ""

# 5. Actualizar ecosystem.config.cjs para usar server.js
echo "2. Actualizando configuración de PM2..."
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'starfilters-app',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
    watch: false
  }]
};
EOF

mkdir -p logs
echo "   ✅ Configuración actualizada para usar server.js"
echo ""

# 6. Iniciar con PM2
echo "3. Iniciando aplicación con PM2..."
pm2 start ecosystem.config.cjs
pm2 save
echo ""

# 7. Esperar y verificar
echo "4. Esperando 5 segundos..."
sleep 5
echo ""

# 8. Verificar estado
echo "5. Estado de PM2:"
pm2 status
echo ""

# 9. Verificar puerto
echo "6. Verificando puerto 3000:"
if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    echo "   ✅ Aplicación escuchando en puerto 3000"
    netstat -tlnp 2>/dev/null | grep ":3000"
else
    echo "   ❌ Aplicación NO está escuchando en puerto 3000"
    echo ""
    echo "   Verificando logs..."
    pm2 logs starfilters-app --lines 30 --nostream
fi
echo ""

echo "✅ Proceso completado"
echo ""
echo "Si la aplicación sigue sin escuchar, ejecuta:"
echo "   pm2 logs starfilters-app --lines 50"
echo "   node server.js"
echo "   (para ver el error manualmente)"

