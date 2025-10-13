// Script simple para crear un usuario de prueba directamente con MySQL
// Ejecutar con: node scripts/create-test-user-simple.js

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function createTestUser() {
  let connection;
  
  try {
    console.log('🔍 Conectando a la base de datos...');
    
    // Conectar a MySQL
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'starfilters_db'
    });

    console.log('✅ Conexión exitosa');

    // Verificar si el usuario ya existe
    const [existingUsers] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      ['test@starfilters.com']
    );

    if (existingUsers.length > 0) {
      console.log('✅ Usuario de prueba ya existe:');
      console.log(`   Email: ${existingUsers[0].email}`);
      console.log(`   Nombre: ${existingUsers[0].first_name} ${existingUsers[0].last_name}`);
      console.log(`   Estado: ${existingUsers[0].status}`);
      return;
    }

    console.log('📝 Creando usuario de prueba...');
    
    // Hash de la contraseña
    const passwordHash = await bcrypt.hash('Test123456', 12);
    
    // Crear usuario
    const [result] = await connection.execute(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, address, city, postal_code, country, status, email_verified, verification_token) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'test@starfilters.com',
        passwordHash,
        'Usuario',
        'Prueba',
        '+52 55 1234 5678',
        'Calle de Prueba 123',
        'Ciudad de México',
        '01000',
        'México',
        'active',
        true,
        null
      ]
    );

    console.log('✅ Usuario de prueba creado exitosamente!');
    console.log(`   ID: ${result.insertId}`);
    console.log(`   Email: test@starfilters.com`);
    console.log(`   Contraseña: Test123456`);
    console.log(`   Estado: active`);
    console.log('');
    console.log('🔑 Puedes usar estas credenciales para hacer login:');
    console.log('   Email: test@starfilters.com');
    console.log('   Contraseña: Test123456');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createTestUser();
