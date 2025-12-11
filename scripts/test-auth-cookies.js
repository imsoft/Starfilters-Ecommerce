/**
 * Script para diagnosticar problemas de autenticación con cookies
 * Ejecutar en el servidor: node scripts/test-auth-cookies.js
 */

import { query } from '../src/config/database.js';
import { verifyJWT } from '../src/lib/auth.js';

async function testAuthCookies() {
  console.log('🔍 Diagnóstico de Autenticación con Cookies\n');
  
  // Verificar que la base de datos esté conectada
  try {
    const result = await query('SELECT 1 as test');
    console.log('✅ Conexión a la base de datos: OK');
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    process.exit(1);
  }
  
  // Verificar JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret === 'tu-secreto-super-seguro-cambiar-en-produccion') {
    console.warn('⚠️  JWT_SECRET no está configurado o usa el valor por defecto');
  } else {
    console.log('✅ JWT_SECRET está configurado');
  }
  
  // Verificar variables de entorno relacionadas con cookies
  console.log('\n📋 Variables de entorno:');
  console.log('  - NODE_ENV:', process.env.NODE_ENV || 'no definido');
  console.log('  - FORCE_SECURE_COOKIES:', process.env.FORCE_SECURE_COOKIES || 'no definido');
  
  // Probar verificación de token
  console.log('\n🔐 Prueba de verificación de token:');
  const testToken = 'test-token-invalid';
  const verified = verifyJWT(testToken);
  if (verified === null) {
    console.log('✅ Verificación de token inválido funciona correctamente (retorna null)');
  } else {
    console.warn('⚠️  Verificación de token inválido no funciona correctamente');
  }
  
  console.log('\n✅ Diagnóstico completado');
  console.log('\n💡 Si las cookies no se están enviando:');
  console.log('   1. Verifica que el código tenga "credentials: \'include\'" en el fetch');
  console.log('   2. Verifica que las cookies se establezcan con el dominio correcto');
  console.log('   3. Si usas HTTP, asegúrate de que secure: false en las cookies');
  console.log('   4. Verifica los logs de PM2: pm2 logs starfilters-app --lines 50');
}

testAuthCookies().catch(console.error);

