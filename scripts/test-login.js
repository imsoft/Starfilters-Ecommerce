#!/usr/bin/env node

/**
 * Script para probar el login de un usuario
 * Uso: node scripts/test-login.js <email> <contraseña>
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

async function testLogin() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'starfilters_db'
    });

    // Obtener argumentos
    const args = process.argv.slice(2);
    const email = args[0];
    const password = args[1];
    
    if (!email || !password) {
      console.log('❌ Uso: node scripts/test-login.js <email> <contraseña>');
      console.log('📝 Ejemplo: node scripts/test-login.js admin@starfilters.com NuevaContraseña123');
      process.exit(1);
    }

    console.log(`🔍 Probando login para: ${email}\n`);

    // Verificar en tabla users
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.log('❌ Usuario NO encontrado en tabla users');
    } else {
      const user = users[0];
      console.log('✅ Usuario encontrado en tabla users:');
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Status: ${user.status}`);
      console.log(`   - Email Verified: ${user.email_verified}`);
      
      const isValid = await bcrypt.compare(password, user.password_hash);
      console.log(`   - Contraseña: ${isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
      
      if (!isValid) {
        console.log(`   - Hash almacenado: ${user.password_hash.substring(0, 30)}...`);
      }
    }

    console.log('');

    // Verificar en tabla admin_users
    const [admins] = await connection.execute(
      'SELECT * FROM admin_users WHERE email = ?',
      [email]
    );

    if (admins.length === 0) {
      console.log('⚠️ Usuario NO encontrado en tabla admin_users (pero puede ser usuario normal)');
    } else {
      const admin = admins[0];
      console.log('✅ Usuario encontrado en tabla admin_users:');
      console.log(`   - ID: ${admin.id}`);
      console.log(`   - Username: ${admin.username}`);
      console.log(`   - Role: ${admin.role}`);
      console.log(`   - Status: ${admin.status}`);
      
      const isValid = await bcrypt.compare(password, admin.password_hash);
      console.log(`   - Contraseña: ${isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
      
      if (!isValid) {
        console.log(`   - Hash almacenado: ${admin.password_hash.substring(0, 30)}...`);
      }
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testLogin();

