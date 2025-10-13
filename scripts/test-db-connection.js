// Script para probar la conexión a la base de datos
// Ejecutar con: node --loader ts-node/esm scripts/test-db-connection.js

import { testConnection, query } from '../src/config/database.ts';

async function testDatabase() {
  console.log('🔍 Probando conexión a la base de datos...\n');
  
  try {
    // Probar conexión
    const isConnected = await testConnection();
    
    if (isConnected) {
      console.log('✅ Conexión exitosa!\n');
      
      // Probar consulta simple
      console.log('🔍 Probando consulta simple...');
      const result = await query('SELECT 1 as test');
      console.log('✅ Consulta exitosa:', result);
      
      // Probar consulta a tabla de productos
      console.log('\n🔍 Probando consulta a productos...');
      try {
        const products = await query('SELECT COUNT(*) as total FROM products');
        console.log('✅ Tabla productos encontrada:', products);
      } catch (error) {
        console.log('⚠️  Tabla productos no existe aún. Ejecuta el script schema.sql en phpMyAdmin');
      }
      
    } else {
      console.log('❌ No se pudo conectar a la base de datos');
      console.log('📋 Verifica:');
      console.log('   - Que el archivo .env esté configurado correctamente');
      console.log('   - Que los datos de conexión sean correctos');
      console.log('   - Que la base de datos exista en Hostinger');
    }
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  }
  
  process.exit(0);
}

testDatabase();
