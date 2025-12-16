#!/bin/bash

# Script para editar .env en el VPS
# Uso: ./scripts/edit-env-vps.sh

echo "🔧 Conectando al VPS para editar .env..."
echo ""
echo "📝 Pasos a seguir:"
echo "1. Te conectarás por SSH al VPS"
echo "2. Navegarás al directorio del proyecto"
echo "3. Editarás el archivo .env con nano"
echo ""
echo "Presiona Enter para continuar o Ctrl+C para cancelar..."
read

# Comandos a ejecutar en el VPS
ssh root@72.60.228.9 << 'EOF'
cd ~/starfilters-app

echo "📁 Directorio actual: $(pwd)"
echo ""
echo "📄 Contenido actual del .env:"
echo "----------------------------------------"
cat .env 2>/dev/null || echo "⚠️ Archivo .env no encontrado"
echo "----------------------------------------"
echo ""
echo "🔧 Abriendo editor nano..."
echo "💡 Instrucciones de nano:"
echo "   - Edita las variables necesarias"
echo "   - Ctrl+O para guardar"
echo "   - Ctrl+X para salir"
echo ""
read -p "Presiona Enter para abrir nano..." 
nano .env

echo ""
echo "✅ Archivo .env actualizado"
echo ""
echo "📄 Verificando cambios..."
echo "----------------------------------------"
cat .env | grep -E "(RESEND|ADMIN_EMAIL|SITE_URL)" || echo "No se encontraron variables de Resend"
echo "----------------------------------------"
EOF

echo ""
echo "✅ Proceso completado"
echo ""
echo "🔄 Recuerda reiniciar la aplicación:"
echo "   ssh root@72.60.228.9"
echo "   cd ~/starfilters-app"
echo "   pm2 restart starfilters-app"

