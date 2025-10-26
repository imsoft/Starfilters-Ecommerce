#!/usr/bin/env node
/**
 * Script para crear template de .env para producción
 * Uso: node scripts/deployment/create-env-template.js
 */

import { writeFileSync } from 'fs';
import { existsSync, readFileSync } from 'fs';

const TEMPLATE_FILE = './.env.production.example';

const envTemplate = `# ============================================
# CONFIGURACIÓN DE PRODUCCIÓN - HOSTINGER
# ============================================

# Base de Datos MySQL
# ⚠️ Reemplaza con tus credenciales de Hostinger
DB_HOST=localhost
DB_USER=u123456789_starfilters
DB_PASSWORD=tu_contraseña_segura
DB_NAME=u123456789_starfilters
DB_PORT=3306

# JWT
# ⚠️ Genera un secret seguro (mínimo 32 caracteres)
JWT_SECRET=tu_jwt_secret_super_seguro_minimo_32_caracteres_123456789
JWT_EXPIRES_IN=7d

# Node Environment
NODE_ENV=production

# Stripe - Producción
# ⚠️ Usa las claves LIVE de Stripe (sk_live_... y pk_live_...)
STRIPE_SECRET_KEY=sk_live_TU_CLAVE_SECRETA
STRIPE_PUBLIC_KEY=pk_live_TU_CLAVE_PUBLICA
STRIPE_WEBHOOK_SECRET=whsec_TU_WEBHOOK_SECRET

# Cloudinary
# ⚠️ Reemplaza con tus credenciales de Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Email SMTP - Hostinger
# ⚠️ Configura con tus credenciales de email de Hostinger
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=noreply@tudominio.com
SMTP_PASS=tu_contraseña_email
FROM_EMAIL=noreply@tudominio.com

# Aplicación
# ⚠️ Reemplaza con tu dominio real
PUBLIC_SITE_URL=https://tudominio.com
`;

console.log('📝 Creando template de .env para producción...\n');

try {
  // Verificar si ya existe
  if (existsSync(TEMPLATE_FILE)) {
    console.log(`⚠️  El archivo ${TEMPLATE_FILE} ya existe`);
    console.log('   No se sobrescribirá para no perder tus configuraciones\n');
  } else {
    writeFileSync(TEMPLATE_FILE, envTemplate);
    console.log(`✅ Template creado: ${TEMPLATE_FILE}`);
    console.log('\n💡 Próximos pasos:');
    console.log('   1. Copia este archivo a tu servidor Hostinger');
    console.log('   2. Renombra a .env');
    console.log('   3. Reemplaza los valores marcados con ⚠️');
    console.log('   4. NO subas el archivo .env a Git por seguridad\n');
  }

  // Mostrar contenido
  console.log('📄 Contenido del template:');
  console.log('─'.repeat(50));
  console.log(envTemplate);

} catch (error) {
  console.error('❌ Error al crear template:', error.message);
  process.exit(1);
}
