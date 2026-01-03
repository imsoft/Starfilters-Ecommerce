#!/bin/bash

# Script para corregir problema de PM2 con la aplicación

set -e

echo "🔧 Corrigiendo problema de PM2..."
echo ""

cd ~/starfilters-app

# 1. Detener y eliminar proceso actual
echo "1. Limpiando procesos de PM2..."
pm2 stop starfilters-app 2>/dev/null || true
pm2 delete starfilters-app 2>/dev/null || true
pm2 flush starfilters-app 2>/dev/null || true
echo ""

# 2. Verificar que el archivo existe
if [ ! -f "dist/server/entry.mjs" ]; then
    echo "❌ Archivo entry.mjs no existe. Reconstruyendo..."
    rm -rf dist/ .astro/
    pnpm build
fi
echo ""

# 3. Verificar variables de entorno
echo "2. Verificando variables de entorno..."
if [ ! -f ".env" ]; then
    echo "❌ ERROR: Archivo .env no existe"
    exit 1
fi
echo "   ✅ Archivo .env existe"
echo ""

# 4. Crear archivo de configuración de PM2 con variables de entorno
echo "3. Creando configuración de PM2..."
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'starfilters-app',
    script: './dist/server/entry.mjs',
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

# Crear directorio de logs si no existe
mkdir -p logs
echo "   ✅ Archivo ecosystem.config.cjs creado"
echo ""

# 5. Iniciar con PM2 usando el archivo de configuración
echo "4. Iniciando aplicación con PM2..."
pm2 start ecosystem.config.cjs
pm2 save
echo ""

# 6. Esperar y verificar
echo "5. Esperando 5 segundos..."
sleep 5
echo ""

# 7. Verificar estado
echo "6. Estado de PM2:"
pm2 status
echo ""

# 8. Verificar puerto
echo "7. Verificando puerto 3000:"
if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    echo "   ✅ Aplicación escuchando en puerto 3000"
    netstat -tlnp 2>/dev/null | grep ":3000"
else
    echo "   ❌ Aplicación NO está escuchando en puerto 3000"
    echo "   Verificando logs..."
    pm2 logs starfilters-app --lines 20 --nostream
fi
echo ""

# 9. Ver logs recientes
echo "8. Últimos logs:"
pm2 logs starfilters-app --lines 15 --nostream | tail -20
echo ""

echo "✅ Proceso completado"
echo ""
echo "Si la aplicación sigue sin escuchar en el puerto 3000, ejecuta:"
echo "   pm2 logs starfilters-app --lines 50"
echo "   node dist/server/entry.mjs"
echo "   (en otra terminal para ver si funciona manualmente)"

