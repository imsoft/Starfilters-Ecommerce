#!/usr/bin/env node

/**
 * Script para resetear la contraseña de un usuario administrador
 * Uso: node scripts/reset-admin-password.js <email> <nueva_contraseña>
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

async function resetAdminPassword() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'starfilters_ecommerce_db'
    });

    console.log('🔗 Conectando a la base de datos...');
    
    // Obtener argumentos de línea de comandos
    const args = process.argv.slice(2);
    const email = args[0];
    const password = args[1];
    
    if (!email || !password) {
      console.log('❌ Uso: node reset-admin-password.js <email> <nueva_contraseña>');
      console.log('📝 Ejemplo: node reset-admin-password.js admin@starfilters.com NuevaContraseña123');
      process.exit(1);
    }

    console.log(`👤 Reseteando contraseña para: ${email}`);

    // Generar hash de la nueva contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Actualizar contraseña en tabla users
    const [usersResult] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (usersResult.length > 0) {
      console.log('📝 Actualizando contraseña en tabla users...');
      await connection.execute(
        'UPDATE users SET password_hash = ? WHERE email = ?',
        [passwordHash, email]
      );
      console.log('✅ Contraseña actualizada en tabla users');
    } else {
      console.log('⚠️ Usuario no encontrado en tabla users, creándolo...');
      const { randomUUID } = await import('crypto');
      const uuid = randomUUID();
      await connection.execute(
        `INSERT INTO users (uuid, email, password_hash, first_name, last_name, status, email_verified) 
         VALUES (?, ?, ?, ?, ?, 'active', TRUE)`,
        [uuid, email, passwordHash, 'Admin', 'User']
      );
      console.log('✅ Usuario creado en tabla users');
    }

    // Actualizar contraseña en tabla admin_users
    const [adminResult] = await connection.execute(
      'SELECT * FROM admin_users WHERE email = ?',
      [email]
    );

    if (adminResult.length > 0) {
      console.log('📝 Actualizando contraseña en tabla admin_users...');
      await connection.execute(
        'UPDATE admin_users SET password_hash = ? WHERE email = ?',
        [passwordHash, email]
      );
      console.log('✅ Contraseña actualizada en tabla admin_users');
    } else {
      console.log('⚠️ Usuario no encontrado en tabla admin_users, creándolo...');
      const { randomUUID } = await import('crypto');
      const adminUuid = randomUUID();
      const username = email.split('@')[0];
      await connection.execute(
        `INSERT INTO admin_users (uuid, username, email, password_hash, full_name, role, status) 
         VALUES (?, ?, ?, ?, ?, 'admin', 'active')`,
        [adminUuid, username, email, passwordHash, 'Administrador Principal']
      );
      console.log('✅ Usuario creado en tabla admin_users');
    }

    console.log('\n🎉 Contraseña reseteada exitosamente!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Nueva contraseña: ${password}`);
    console.log('\n💡 Ahora puedes iniciar sesión con estas credenciales.');
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error reseteando contraseña:', error.message);
    console.error(error);
    process.exit(1);
  }
}

resetAdminPassword();

