// Script para crear un usuario de prueba
// Ejecutar con: node --loader ts-node/esm scripts/create-test-user.js

import { createUser, getUserByEmail } from '../src/lib/database.ts';
import { hashPassword } from '../src/lib/auth.ts';

async function createTestUser() {
  try {
    console.log('🔍 Verificando si el usuario de prueba ya existe...');
    
    // Verificar si ya existe
    const existingUser = await getUserByEmail('test@starfilters.com');
    if (existingUser) {
      console.log('✅ Usuario de prueba ya existe:');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Nombre: ${existingUser.first_name} ${existingUser.last_name}`);
      console.log(`   Estado: ${existingUser.status}`);
      return;
    }

    console.log('📝 Creando usuario de prueba...');
    
    // Hash de la contraseña
    const passwordHash = await hashPassword('Test123456');
    
    // Crear usuario
    const userId = await createUser({
      email: 'test@starfilters.com',
      password_hash: passwordHash,
      first_name: 'Usuario',
      last_name: 'Prueba',
      phone: '+52 55 1234 5678',
      address: 'Calle de Prueba 123',
      city: 'Ciudad de México',
      postal_code: '01000',
      country: 'México',
      status: 'active',
      email_verified: true,
      verification_token: null
    });

    console.log('✅ Usuario de prueba creado exitosamente!');
    console.log(`   ID: ${userId}`);
    console.log(`   Email: test@starfilters.com`);
    console.log(`   Contraseña: Test123456`);
    console.log(`   Estado: active`);
    console.log('');
    console.log('🔑 Puedes usar estas credenciales para hacer login:');
    console.log('   Email: test@starfilters.com');
    console.log('   Contraseña: Test123456');
    
  } catch (error) {
    console.error('❌ Error creando usuario de prueba:', error.message);
  }
  
  process.exit(0);
}

createTestUser();
