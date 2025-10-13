// Script para probar el registro de usuarios
// Ejecutar con: node scripts/test-signup.js

import { createUser, getUserByEmail } from '../src/lib/database.ts';
import { hashPassword, generateVerificationToken, validateRegisterData } from '../src/lib/auth.ts';

async function testSignup() {
  try {
    console.log('🧪 Probando el sistema de registro...\n');
    
    // Datos de prueba
    const testUser = {
      email: 'test2@starfilters.com',
      password: 'Test123456',
      firstName: 'Usuario',
      lastName: 'Prueba 2',
      phone: '+52 55 9876 5432',
      address: 'Calle de Prueba 456',
      city: 'Guadalajara',
      postalCode: '44100',
      country: 'México'
    };

    console.log('📝 Datos de prueba:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Nombre: ${testUser.firstName} ${testUser.lastName}`);
    console.log(`   Ciudad: ${testUser.city}`);
    console.log('');

    // 1. Validar datos
    console.log('🔍 Validando datos...');
    const validation = validateRegisterData(testUser);
    if (!validation.isValid) {
      console.log('❌ Validación falló:', validation.errors);
      return;
    }
    console.log('✅ Validación exitosa');

    // 2. Verificar si el usuario ya existe
    console.log('🔍 Verificando si el usuario ya existe...');
    const existingUser = await getUserByEmail(testUser.email);
    if (existingUser) {
      console.log('⚠️  Usuario ya existe, eliminando...');
      // Aquí podrías agregar lógica para eliminar el usuario existente si es necesario
      console.log('✅ Usuario existente encontrado');
      return;
    }
    console.log('✅ Email disponible');

    // 3. Hash de la contraseña
    console.log('🔐 Generando hash de contraseña...');
    const passwordHash = await hashPassword(testUser.password);
    console.log('✅ Hash generado');

    // 4. Generar token de verificación
    console.log('🎫 Generando token de verificación...');
    const verificationToken = generateVerificationToken();
    console.log('✅ Token generado');

    // 5. Crear usuario en la base de datos
    console.log('💾 Creando usuario en la base de datos...');
    const userId = await createUser({
      email: testUser.email,
      password_hash: passwordHash,
      first_name: testUser.firstName,
      last_name: testUser.lastName,
      phone: testUser.phone,
      address: testUser.address,
      city: testUser.city,
      postal_code: testUser.postalCode,
      country: testUser.country,
      status: 'pending',
      email_verified: false,
      verification_token: verificationToken
    });

    console.log('✅ Usuario creado exitosamente!');
    console.log(`   ID: ${userId}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Estado: pending`);
    console.log('');

    // 6. Verificar que el usuario se creó
    console.log('🔍 Verificando usuario creado...');
    const createdUser = await getUserByEmail(testUser.email);
    if (createdUser) {
      console.log('✅ Usuario encontrado en la base de datos:');
      console.log(`   ID: ${createdUser.id}`);
      console.log(`   Email: ${createdUser.email}`);
      console.log(`   Nombre: ${createdUser.first_name} ${createdUser.last_name}`);
      console.log(`   Estado: ${createdUser.status}`);
      console.log(`   Email verificado: ${createdUser.email_verified}`);
    } else {
      console.log('❌ Error: Usuario no encontrado después de crearlo');
    }

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSignup();
