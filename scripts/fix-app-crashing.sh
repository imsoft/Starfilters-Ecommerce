#!/bin/bash

# Script para diagnosticar y corregir aplicación que se cae al iniciar

set -e

echo "🔍 Diagnosticando por qué la aplicación se cae..."
echo ""

cd ~/starfilters-app

# 1. Ver logs de error completos
echo "1. Últimos 50 logs de ERROR:"
pm2 logs starfilters-app --lines 50 --err --nostream
echo ""

# 2. Ver logs de salida
echo "2. Últimos 50 logs de SALIDA:"
pm2 logs starfilters-app --lines 50 --out --nostream
echo ""

# 3. Intentar ejecutar manualmente para ver el error
echo "3. Intentando ejecutar manualmente para ver el error:"
echo "   (Esto mostrará el error real si la aplicación se cae)"
timeout 10 node dist/server/entry.mjs 2>&1 || echo "   (Aplicación se detuvo o timeout)"
echo ""

# 4. Verificar variables de entorno
echo "4. Verificando variables de entorno críticas:"
if [ -f ".env" ]; then
    echo "   ✅ Archivo .env existe"
    if grep -q "DATABASE_HOST\|DB_HOST" .env; then
        echo "   ✅ DATABASE_HOST configurado"
    else
        echo "   ⚠️  DATABASE_HOST no encontrado"
    fi
    if grep -q "DATABASE_NAME\|DB_NAME" .env; then
        echo "   ✅ DATABASE_NAME configurado"
    else
        echo "   ⚠️  DATABASE_NAME no encontrado"
    fi
    if grep -q "PORT" .env; then
        echo "   ✅ PORT configurado:"
        grep "PORT" .env | head -1
    else
        echo "   ⚠️  PORT no configurado (usará default: 3000)"
    fi
else
    echo "   ❌ Archivo .env NO existe"
fi
echo ""

# 5. Verificar conexión a base de datos
echo "5. Verificando conexión a base de datos:"
if command -v mysql &> /dev/null; then
    if grep -q "DATABASE_HOST\|DB_HOST" .env 2>/dev/null; then
        DB_HOST=$(grep "DATABASE_HOST\|DB_HOST" .env | head -1 | cut -d '=' -f2 | tr -d ' "')
        DB_USER=$(grep "DATABASE_USER\|DB_USER" .env | head -1 | cut -d '=' -f2 | tr -d ' "')
        DB_PASS=$(grep "DATABASE_PASSWORD\|DB_PASSWORD" .env | head -1 | cut -d '=' -f2 | tr -d ' "')
        DB_NAME=$(grep "DATABASE_NAME\|DB_NAME" .env | head -1 | cut -d '=' -f2 | tr -d ' "')
        
        if [ ! -z "$DB_HOST" ] && [ ! -z "$DB_USER" ] && [ ! -z "$DB_NAME" ]; then
            echo "   Intentando conectar a base de datos..."
            mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1" "$DB_NAME" 2>&1 | head -3 || echo "   ⚠️  No se pudo conectar a la base de datos"
        else
            echo "   ⚠️  Variables de base de datos incompletas"
        fi
    else
        echo "   ⚠️  No se encontraron variables de base de datos en .env"
    fi
else
    echo "   ⚠️  mysql client no está instalado"
fi
echo ""

echo "📋 Siguiente paso:"
echo "   Revisa los logs de error arriba para identificar el problema específico"
echo "   Los errores más comunes son:"
echo "   - Error de conexión a base de datos"
echo "   - Variables de entorno faltantes"
echo "   - Error de sintaxis en el código"
echo "   - Puerto ya en uso"

