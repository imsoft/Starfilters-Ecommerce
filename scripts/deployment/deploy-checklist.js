#!/usr/bin/env node
/**
 * Script de verificación antes del deployment
 * Verifica que todos los requisitos estén completos
 * Uso: node scripts/deployment/deploy-checklist.js
 */

import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';

const checks = [];

console.log('🔍 Verificando requisitos para deployment en Hostinger...\n');
console.log('─'.repeat(60));

// Check 1: .env existe
function checkEnvFile() {
  const exists = existsSync('.env');
  checks.push({
    name: 'Archivo .env existe',
    status: exists,
    message: exists 
      ? '✓ Archivo .env encontrado' 
      : '✗ Archivo .env no existe. Ejecuta: node scripts/deployment/create-env-template.js'
  });
}

// Check 2: Variables de entorno necesarias
function checkEnvVariables() {
  if (!existsSync('.env')) {
    checks.push({
      name: 'Variables de entorno configuradas',
      status: false,
      message: '✗ No se puede verificar (falta archivo .env)'
    });
    return;
  }

  try {
    const envContent = readFileSync('.env', 'utf-8');
    const requiredVars = [
      'DB_HOST',
      'DB_USER',
      'DB_PASSWORD',
      'DB_NAME',
      'JWT_SECRET',
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLIC_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'SMTP_HOST'
    ];

    const missing = requiredVars.filter(v => !envContent.includes(v));
    
    checks.push({
      name: 'Variables de entorno configuradas',
      status: missing.length === 0,
      message: missing.length === 0
        ? `✓ Todas las variables requeridas están configuradas (${requiredVars.length})`
        : `✗ Faltan variables: ${missing.join(', ')}`
    });
  } catch (error) {
    checks.push({
      name: 'Variables de entorno configuradas',
      status: false,
      message: '✗ Error al leer archivo .env'
    });
  }
}

// Check 3: node_modules existe
function checkNodeModules() {
  const exists = existsSync('node_modules');
  checks.push({
    name: 'Dependencias instaladas',
    status: exists,
    message: exists 
      ? '✓ node_modules existe' 
      : '✗ Dependencias no instaladas. Ejecuta: npm install'
  });
}

// Check 4: Build realizado
function checkBuild() {
  const exists = existsSync('dist');
  checks.push({
    name: 'Build de producción',
    status: exists,
    message: exists 
      ? '✓ Carpeta dist existe' 
      : '✗ Build no realizado. Ejecuta: npm run build'
  });
}

// Check 5: .gitignore incluye .env
function checkGitignore() {
  if (!existsSync('.gitignore')) {
    checks.push({
      name: '.env en .gitignore',
      status: false,
      message: '✗ Archivo .gitignore no existe'
    });
    return;
  }

  const gitignoreContent = readFileSync('.gitignore', 'utf-8');
  const includesEnv = gitignoreContent.includes('.env') || 
                      gitignoreContent.includes('/.env');
  
  checks.push({
    name: '.env protegido en .gitignore',
    status: includesEnv,
    message: includesEnv
      ? '✓ .env está en .gitignore'
      : '✗ .env NO está en .gitignore (riesgo de seguridad)'
  });
}

// Check 6: Base de datos exportada
function checkDatabaseExport() {
  const exportsDir = './database/exports';
  const exists = existsSync(exportsDir);
  
  let files = [];
  if (exists) {
    try {
      files = execSync(`find ${exportsDir} -name "*.sql" 2>/dev/null`).toString().trim().split('\n');
      files = files.filter(f => f);
    } catch (e) {
      files = [];
    }
  }
  
  checks.push({
    name: 'Base de datos exportada',
    status: files.length > 0,
    message: files.length > 0
      ? `✓ Base de datos exportada (${files.length} archivo(s))`
      : '✗ Base de datos no exportada. Ejecuta: node scripts/deployment/export-database.js'
  });
}

// Ejecutar checks
checkEnvFile();
checkEnvVariables();
checkNodeModules();
checkBuild();
checkGitignore();
checkDatabaseExport();

// Mostrar resultados
console.log('\n📋 Resultados de la verificación:\n');

checks.forEach((check, index) => {
  const icon = check.status ? '✅' : '❌';
  console.log(`${icon} ${index + 1}. ${check.name}`);
  console.log(`   ${check.message}\n`);
});

const allPassed = checks.every(c => c.status);
const passedCount = checks.filter(c => c.status).length;
const totalCount = checks.length;

console.log('─'.repeat(60));
console.log(`\n📊 Resumen: ${passedCount}/${totalCount} verificaciones pasaron\n`);

if (allPassed) {
  console.log('🎉 ¡Todo está listo para el deployment!');
  console.log('\n💡 Próximos pasos:');
  console.log('   1. Sube los archivos a Hostinger vía FTP o SSH');
  console.log('   2. Configura las variables de entorno en el servidor');
  console.log('   3. Configura Node.js en el panel de Hostinger');
  console.log('   4. Configura SSL/HTTPS');
  console.log('   5. Configura webhooks de Stripe\n');
  process.exit(0);
} else {
  console.log('⚠️  Hay verificaciones que no pasaron.');
  console.log('   Completa las tareas indicadas antes de hacer el deployment.\n');
  process.exit(1);
}
