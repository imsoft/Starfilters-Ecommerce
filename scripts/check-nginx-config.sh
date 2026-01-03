#!/bin/bash

# Script para verificar configuración de Nginx y aplicación

echo "🔍 Verificando configuración de Nginx y aplicación..."
echo ""

# 1. Ver configuración de Nginx
echo "1. Configuración de Nginx para starfilters:"
if [ -f "/etc/nginx/sites-available/starfilters" ]; then
    echo "   Archivo encontrado: /etc/nginx/sites-available/starfilters"
    echo ""
    echo "   Contenido del proxy_pass:"
    grep -A 5 "proxy_pass" /etc/nginx/sites-available/starfilters || echo "   No se encontró proxy_pass"
    echo ""
    echo "   Puerto configurado:"
    grep -o "proxy_pass http://[^;]*" /etc/nginx/sites-available/starfilters | grep -o "[0-9]*" || echo "   No se pudo determinar el puerto"
elif [ -f "/etc/nginx/sites-available/default" ]; then
    echo "   Usando configuración default"
    grep -A 5 "proxy_pass" /etc/nginx/sites-available/default || echo "   No se encontró proxy_pass"
else
    echo "   ⚠️  No se encontró configuración de Nginx"
    echo "   Archivos disponibles:"
    ls -la /etc/nginx/sites-available/ 2>/dev/null || echo "   No se puede acceder a /etc/nginx/sites-available/"
fi
echo ""

# 2. Ver estado de Nginx
echo "2. Estado de Nginx:"
systemctl status nginx --no-pager -l | head -10
echo ""

# 3. Ver procesos de PM2
echo "3. Procesos de PM2:"
pm2 list
echo ""

# 4. Ver qué está escuchando en puertos comunes
echo "4. Puertos en uso:"
echo "   Puerto 3000:"
netstat -tlnp 2>/dev/null | grep ":3000" || echo "   ❌ Nada escuchando en puerto 3000"
echo ""
echo "   Puerto 8080:"
netstat -tlnp 2>/dev/null | grep ":8080" || echo "   ❌ Nada escuchando en puerto 8080"
echo ""
echo "   Puerto 5000:"
netstat -tlnp 2>/dev/null | grep ":5000" || echo "   ❌ Nada escuchando en puerto 5000"
echo ""

# 5. Ver logs de Nginx
echo "5. Últimos errores de Nginx:"
tail -10 /var/log/nginx/error.log 2>/dev/null || echo "   No se puede acceder a los logs de Nginx"
echo ""

# 6. Verificar archivo de entrada
echo "6. Archivo de entrada de la aplicación:"
if [ -f "~/starfilters-app/dist/server/entry.mjs" ]; then
    echo "   ✅ Existe: ~/starfilters-app/dist/server/entry.mjs"
    ls -lh ~/starfilters-app/dist/server/entry.mjs 2>/dev/null
else
    echo "   ❌ No existe: ~/starfilters-app/dist/server/entry.mjs"
    if [ -f "dist/server/entry.mjs" ]; then
        echo "   ✅ Pero existe en directorio actual: dist/server/entry.mjs"
        ls -lh dist/server/entry.mjs
    fi
fi
echo ""

echo "📋 Resumen:"
echo "   - Verifica qué puerto está configurado en Nginx (proxy_pass)"
echo "   - Verifica que la aplicación esté corriendo en ese puerto"
echo "   - Si no coincide, ajusta la configuración o el puerto de la aplicación"

