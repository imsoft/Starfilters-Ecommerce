#!/usr/bin/env node
/**
 * Script para exportar la base de datos local
 * Uso: node scripts/deployment/export-database.js
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

const DB_USER = process.env.DB_USER || 'root';
const DB_NAME = process.env.DB_NAME || 'starfilters_ecommerce_db';
const OUTPUT_DIR = './database/exports';
const OUTPUT_FILE = `${OUTPUT_DIR}/starfilters_ecommerce_db_${new Date().toISOString().split('T')[0]}.sql`;

console.log('📦 Exportando base de datos...\n');

try {
  // Crear directorio de exports si no existe
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Exportar base de datos
  const command = `mysqldump -u ${DB_USER} -p ${DB_NAME} > ${OUTPUT_FILE}`;
  
  console.log(`Ejecutando: mysqldump -u ${DB_USER} ${DB_NAME}`);
  console.log(`Guardando en: ${OUTPUT_FILE}\n`);
  
  execSync(command, { 
    stdio: 'inherit',
    env: { ...process.env, PATH: process.env.PATH }
  });

  console.log('✅ Base de datos exportada exitosamente');
  console.log(`📁 Archivo: ${OUTPUT_FILE}`);
  console.log('\n💡 Próximos pasos:');
  console.log('   1. Sube este archivo al panel de Hostinger');
  console.log('   2. Importa la base de datos usando phpMyAdmin');
  
} catch (error) {
  console.error('❌ Error al exportar la base de datos:', error.message);
  console.log('\n💡 Verifica que:');
  console.log('   - MySQL está instalado en tu sistema');
  console.log('   - Las credenciales de DB_USER y DB_NAME son correctas');
  console.log('   - Tienes permisos para exportar la base de datos');
  process.exit(1);
}
