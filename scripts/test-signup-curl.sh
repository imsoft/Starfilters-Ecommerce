#!/bin/bash

# Script para probar el registro con curl
# Ejecutar con: bash scripts/test-signup-curl.sh

echo "🧪 Probando el registro de usuario con curl..."
echo ""

# Datos de prueba
EMAIL="test3@starfilters.com"
FIRST_NAME="Usuario"
LAST_NAME="Prueba 3"
PHONE="+52 55 1111 2222"
PASSWORD="Test123456"
ADDRESS="Calle de Prueba 789"
CITY="Monterrey"
POSTAL_CODE="64000"
COUNTRY="México"

echo "📝 Datos de prueba:"
echo "   Email: $EMAIL"
echo "   Nombre: $FIRST_NAME $LAST_NAME"
echo "   Ciudad: $CITY"
echo ""

# Realizar la petición POST
echo "🚀 Enviando petición de registro..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:4321/signup \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=$EMAIL" \
  -d "password=$PASSWORD" \
  -d "firstName=$FIRST_NAME" \
  -d "lastName=$LAST_NAME" \
  -d "phone=$PHONE" \
  -d "address=$ADDRESS" \
  -d "city=$CITY" \
  -d "postalCode=$POSTAL_CODE" \
  -d "country=$COUNTRY")

# Separar el cuerpo de la respuesta del código HTTP
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "📊 Respuesta del servidor:"
echo "   Código HTTP: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Registro exitoso! (Redirección o éxito)"
  echo "   El usuario debería haber sido creado en la base de datos"
else
  echo "❌ Error en el registro"
  echo "   Código HTTP: $HTTP_CODE"
  echo "   Respuesta: $BODY"
fi

echo ""
echo "🔍 Para verificar, puedes:"
echo "   1. Revisar la base de datos en TablePlus"
echo "   2. Ir a http://localhost:4321/login y probar con:"
echo "      Email: $EMAIL"
echo "      Contraseña: $PASSWORD"
