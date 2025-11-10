/**
 * Script de migración: Agregar columna bind_id a la tabla products
 *
 * Este script agrega la columna bind_id a la tabla de productos
 * para almacenar el ID del producto en Bind ERP.
 *
 * Uso: node scripts/migrate-bind-id.js
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'starfilters_db',
};

console.log('🔧 Configuración de Base de Datos:');
console.log('   Host:', dbConfig.host);
console.log('   Puerto:', dbConfig.port);
console.log('   Usuario:', dbConfig.user);
console.log('   Base de datos:', dbConfig.database);
console.log('');

async function runMigration() {
  let connection;

  try {
    // Conectar a la base de datos
    console.log('📡 Conectando a MySQL...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión exitosa\n');

    // Verificar si la columna ya existe
    console.log('🔍 Verificando si la columna bind_id ya existe...');
    const [columns] = await connection.query(
      `SHOW COLUMNS FROM products LIKE 'bind_id'`
    );

    if (columns.length > 0) {
      console.log('⚠️  La columna bind_id ya existe en la tabla products');
      console.log('✅ No se necesita migración\n');
      return;
    }

    console.log('📝 La columna bind_id no existe, procediendo con la migración...\n');

    // Ejecutar la migración
    console.log('🚀 Ejecutando migración...');
    console.log('   SQL: ALTER TABLE products ADD COLUMN bind_id VARCHAR(100) NULL AFTER uuid');

    await connection.query(
      `ALTER TABLE products
       ADD COLUMN bind_id VARCHAR(100) NULL AFTER uuid`
    );
    console.log('✅ Columna bind_id agregada exitosamente\n');

    // Agregar índice
    console.log('🔍 Verificando si el índice idx_bind_id ya existe...');
    const [indexes] = await connection.query(
      `SHOW INDEX FROM products WHERE Key_name = 'idx_bind_id'`
    );

    if (indexes.length > 0) {
      console.log('⚠️  El índice idx_bind_id ya existe');
      console.log('✅ Migración completada (índice ya existía)\n');
      return;
    }

    console.log('📝 Creando índice idx_bind_id...');
    await connection.query(
      `ALTER TABLE products ADD INDEX idx_bind_id (bind_id)`
    );
    console.log('✅ Índice idx_bind_id creado exitosamente\n');

    // Verificar la estructura final
    console.log('🔍 Verificando estructura final de la tabla...');
    const [finalColumns] = await connection.query(
      `DESCRIBE products`
    );

    console.log('\n📊 Estructura de la tabla products:');
    console.table(finalColumns);

    console.log('\n🎉 ¡Migración completada exitosamente!');
    console.log('✅ La columna bind_id está lista para usar\n');

  } catch (error) {
    console.error('\n❌ Error durante la migración:');
    console.error('   Mensaje:', error.message);
    console.error('   Código:', error.code);
    console.error('   SQL:', error.sql);
    console.error('\n');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar migración
console.log('🚀 Iniciando migración de base de datos...\n');
runMigration()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
