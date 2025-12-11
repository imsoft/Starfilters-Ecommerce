#!/usr/bin/env node
/**
 * Script para probar la configuración de Cloudinary
 * Uso: node scripts/test-cloudinary.js
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
config({ path: join(__dirname, '../.env.local') });
config({ path: join(__dirname, '../.env') });

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('🔍 Verificando credenciales de Cloudinary...\n');

// Verificar que existan
if (!cloudName) {
  console.error('❌ CLOUDINARY_CLOUD_NAME no está configurado');
} else {
  console.log('✅ CLOUDINARY_CLOUD_NAME:', cloudName);
}

if (!apiKey) {
  console.error('❌ CLOUDINARY_API_KEY no está configurado');
} else {
  console.log('✅ CLOUDINARY_API_KEY:', apiKey.substring(0, 10) + '...');
}

if (!apiSecret) {
  console.error('❌ CLOUDINARY_API_SECRET no está configurado');
} else {
  console.log('✅ CLOUDINARY_API_SECRET:', apiSecret.substring(0, 10) + '...');
}

if (!cloudName || !apiKey || !apiSecret) {
  console.error('\n❌ Faltan credenciales de Cloudinary');
  console.error('   Asegúrate de tener estas variables en tu .env.local o .env:');
  console.error('   - CLOUDINARY_CLOUD_NAME');
  console.error('   - CLOUDINARY_API_KEY');
  console.error('   - CLOUDINARY_API_SECRET');
  process.exit(1);
}

// Probar conexión con Cloudinary
console.log('\n📤 Probando conexión con Cloudinary...');

try {
  const { v2: cloudinary } = await import('cloudinary');
  
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });

  // Intentar obtener información de la cuenta
  const result = await cloudinary.api.ping();
  console.log('✅ Conexión exitosa con Cloudinary');
  console.log('   Status:', result.status);
  
  console.log('\n✅ Todas las credenciales están correctas');
} catch (error) {
  console.error('\n❌ Error al conectar con Cloudinary:');
  console.error('   Mensaje:', error.message);
  if (error.http_code) {
    console.error('   HTTP Code:', error.http_code);
  }
  if (error.message.includes('401') || error.message.includes('Unauthorized')) {
    console.error('\n⚠️  Las credenciales son incorrectas o no tienen permisos');
  }
  process.exit(1);
}

