#!/usr/bin/env node

const mysql = require('mysql2/promise');
require('dotenv').config();

async function activateUser(email) {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'starfilters_ecommerce_db'
    });

    console.log(`🔧 Activando cuenta para: ${email}`);

    // Verificar si el usuario existe
    const [users] = await connection.execute(
      'SELECT email, status, email_verified FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.log('❌ Usuario no encontrado');
      await connection.end();
      return;
    }

    const user = users[0];
    console.log(`📋 Estado actual: ${user.status}`);
    console.log(`✉️ Email verificado: ${user.email_verified ? 'Sí' : 'No'}`);

    // Activar usuario
    const [result] = await connection.execute(
      'UPDATE users SET status = ?, email_verified = ?, updated_at = NOW() WHERE email = ?',
      ['active', 1, email]
    );

    if (result.affectedRows > 0) {
      console.log('✅ Cuenta activada exitosamente!');
      console.log('📧 El usuario ya puede iniciar sesión');
    } else {
      console.log('❌ Error al activar la cuenta');
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Obtener email del argumento de línea de comandos
const email = process.argv[2];

if (!email) {
  console.log('📝 Uso: node scripts/activate-user.js <email>');
  console.log('📝 Ejemplo: node scripts/activate-user.js usuario@ejemplo.com');
  process.exit(1);
}

activateUser(email);
