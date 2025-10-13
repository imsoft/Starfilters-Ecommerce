#!/bin/bash

# Script para probar el login con curl
# Ejecutar con: bash scripts/test-login-curl.sh

echo "🧪 Probando el login de usuario con curl..."
echo ""

# Datos de prueba
EMAIL="test3@starfilters.com"
PASSWORD="Test123456"

echo "📝 Datos de prueba:"
echo "   Email: $EMAIL"
echo "   Contraseña: $PASSWORD"
echo ""

# Realizar la petición POST
echo "🚀 Enviando petición de login..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:4321/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=$EMAIL" \
  -d "password=$PASSWORD")

# Separar el cuerpo de la respuesta del código HTTP
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "📊 Respuesta del servidor:"
echo "   Código HTTP: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "302" ]; then
  echo "✅ Login exitoso! (Redirección)"
  echo "   El usuario debería estar autenticado"
elif [ "$HTTP_CODE" = "200" ]; then
  echo "⚠️  Login con problemas (código 200)"
  echo "   Posiblemente hay un error en la página"
else
  echo "❌ Error en el login"
  echo "   Código HTTP: $HTTP_CODE"
  echo "   Respuesta: $BODY"
fi

echo ""
echo "🔍 Para verificar, puedes:"
echo "   1. Ir a http://localhost:4321/login en el navegador"
echo "   2. Usar las credenciales:"
echo "      Email: $EMAIL"
echo "      Contraseña: $PASSWORD"
