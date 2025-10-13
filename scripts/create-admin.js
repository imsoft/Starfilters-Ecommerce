#!/usr/bin/env node

import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

async function createAdmin() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'starfilters_db'
    });

    console.log('🔗 Conectando a la base de datos...');
    
    // Obtener argumentos de línea de comandos
    const args = process.argv.slice(2);
    const email = args[0];
    const password = args[1] || 'admin123'; // Contraseña por defecto
    
    if (!email) {
      console.log('❌ Uso: node create-admin.js <email> [contraseña]');
      console.log('📝 Ejemplo: node create-admin.js admin@starfilters.com admin123');
      process.exit(1);
    }

    console.log(`👤 Creando administrador para: ${email}`);

    // Verificar si el usuario ya existe
    const [existingUser] = await connection.execute(
      'SELECT * FROM users WHERE email = ?', 
      [email]
    );

    let userId;
    
    if (existingUser.length === 0) {
      // Crear usuario si no existe
      console.log('📝 Creando usuario...');
      const uuid = randomUUID();
      const passwordHash = await bcrypt.hash(password, 10);
      
      const [userResult] = await connection.execute(`
        INSERT INTO users (uuid, email, password_hash, first_name, last_name, status, email_verified) 
        VALUES (?, ?, ?, ?, ?, 'active', TRUE)
      `, [uuid, email, passwordHash, 'Admin', 'User']);
      
      userId = userResult.insertId;
      console.log('✅ Usuario creado exitosamente');
    } else {
      userId = existingUser[0].id;
      console.log('✅ Usuario ya existe, usando usuario existente');
    }

    // Verificar si ya es administrador
    const [existingAdmin] = await connection.execute(
      'SELECT * FROM admin_users WHERE email = ?', 
      [email]
    );

    if (existingAdmin.length > 0) {
      console.log('⚠️ El usuario ya es administrador');
      await connection.end();
      return;
    }

    // Crear administrador
    console.log('🔑 Creando permisos de administrador...');
    const adminUuid = randomUUID();
    const username = email.split('@')[0];
    
    await connection.execute(`
      INSERT INTO admin_users (uuid, username, email, password_hash, full_name, role, status) 
      VALUES (?, ?, ?, ?, ?, 'admin', 'active')
    `, [
      adminUuid,
      username,
      email,
      existingUser.length > 0 ? existingUser[0].password_hash : await bcrypt.hash(password, 10),
      'Administrador Principal'
    ]);

    console.log('🎉 Administrador creado exitosamente!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Contraseña: ${password}`);
    console.log('🔐 Rol: Super Administrador');
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error creando administrador:', error.message);
    process.exit(1);
  }
}

createAdmin();
