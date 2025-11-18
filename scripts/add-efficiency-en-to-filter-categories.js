/**
 * Script para agregar la columna efficiency_en a la tabla filter_categories
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function addEfficiencyEnColumn() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('🔍 Verificando si la columna efficiency_en existe...');

    // Verificar si la columna ya existe
    const [columns] = await connection.execute(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_NAME = 'filter_categories' 
       AND COLUMN_NAME = 'efficiency_en'`,
      [process.env.DB_NAME]
    );

    if (Array.isArray(columns) && columns.length > 0) {
      console.log('✅ La columna efficiency_en ya existe');
      return;
    }

    console.log('📝 Agregando columna efficiency_en...');

    await connection.execute(`
      ALTER TABLE filter_categories
      ADD COLUMN efficiency_en TEXT NULL
      AFTER efficiency
    `);

    console.log('✅ Columna efficiency_en agregada exitosamente');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addEfficiencyEnColumn()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error ejecutando script:', error);
    process.exit(1);
  });

