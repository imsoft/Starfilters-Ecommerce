/**
 * Script para verificar la consistencia entre la base de datos
 * y las interfaces TypeScript para discount_codes y filter_categories
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '..', '.env') });

// Interfaces esperadas (basadas en TypeScript)
const expectedDiscountCodeFields = [
  'id',
  'code',
  'description',
  'discount_type',
  'discount_value',
  'min_purchase_amount',
  'max_discount_amount',
  'usage_limit',
  'usage_count',
  'start_date',
  'end_date',
  'is_active',
  'created_at',
  'updated_at'
];

const expectedFilterCategoryFields = [
  'id',
  'name',
  'name_en',
  'slug',
  'description',
  'description_en',
  'main_image',
  'efficiency',
  'efficiency_en',
  'efficiency_class',
  'characteristics',
  'characteristics_en',
  'typical_installation',
  'typical_installation_en',
  'applications',
  'applications_en',
  'benefits',
  'benefits_en',
  'max_temperature',
  'frame_material',
  'status',
  'created_at',
  'updated_at'
];

async function verifyTableStructure(connection, tableName, expectedFields) {
  try {
    console.log(`\n📋 Verificando estructura de la tabla: ${tableName}`);
    
    // Obtener estructura de la tabla
    const [columns] = await connection.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? 
       ORDER BY ORDINAL_POSITION`,
      [process.env.DB_NAME, tableName]
    );

    if (columns.length === 0) {
      console.error(`❌ La tabla ${tableName} no existe en la base de datos`);
      return { exists: false, matches: false, missing: expectedFields, extra: [] };
    }

    const dbFields = columns.map(col => col.COLUMN_NAME);
    const missingFields = expectedFields.filter(field => !dbFields.includes(field));
    const extraFields = dbFields.filter(field => !expectedFields.includes(field));

    console.log(`\n✅ Campos en la BD (${dbFields.length}):`);
    columns.forEach(col => {
      const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultValue = col.COLUMN_DEFAULT !== null ? ` DEFAULT ${col.COLUMN_DEFAULT}` : '';
      console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${nullable}${defaultValue}`);
    });

    if (missingFields.length > 0) {
      console.log(`\n⚠️  Campos faltantes en la BD (${missingFields.length}):`);
      missingFields.forEach(field => console.log(`   - ${field}`));
    }

    if (extraFields.length > 0) {
      console.log(`\nℹ️  Campos extra en la BD (no en la interfaz) (${extraFields.length}):`);
      extraFields.forEach(field => console.log(`   - ${field}`));
    }

    const matches = missingFields.length === 0;
    if (matches) {
      console.log(`\n✅ La estructura de ${tableName} coincide con la interfaz TypeScript`);
    } else {
      console.log(`\n❌ La estructura de ${tableName} NO coincide completamente con la interfaz TypeScript`);
    }

    return {
      exists: true,
      matches,
      missing: missingFields,
      extra: extraFields,
      columns: columns
    };
  } catch (error) {
    console.error(`❌ Error verificando ${tableName}:`, error.message);
    return { exists: false, matches: false, error: error.message };
  }
}

async function verifyDataConsistency(connection) {
  try {
    console.log('\n📊 Verificando consistencia de datos...\n');

    // Verificar discount_codes
    const discountCodesResult = await verifyTableStructure(
      connection,
      'discount_codes',
      expectedDiscountCodeFields
    );

    // Verificar filter_categories
    const filterCategoriesResult = await verifyTableStructure(
      connection,
      'filter_categories',
      expectedFilterCategoryFields
    );

    // Resumen
    console.log('\n' + '='.repeat(60));
    console.log('📋 RESUMEN DE VERIFICACIÓN');
    console.log('='.repeat(60));

    console.log('\n🔹 discount_codes:');
    if (discountCodesResult.exists) {
      if (discountCodesResult.matches) {
        console.log('   ✅ Estructura correcta - Todos los campos coinciden');
      } else {
        console.log(`   ⚠️  Estructura incompleta - Faltan ${discountCodesResult.missing.length} campos`);
      }
    } else {
      console.log('   ❌ La tabla no existe');
    }

    console.log('\n🔹 filter_categories:');
    if (filterCategoriesResult.exists) {
      if (filterCategoriesResult.matches) {
        console.log('   ✅ Estructura correcta - Todos los campos coinciden');
      } else {
        console.log(`   ⚠️  Estructura incompleta - Faltan ${filterCategoriesResult.missing.length} campos`);
      }
    } else {
      console.log('   ❌ La tabla no existe');
    }

    // Verificar datos de ejemplo
    console.log('\n📝 Verificando datos existentes...');
    
    const [discountCodes] = await connection.execute('SELECT COUNT(*) as count FROM discount_codes');
    console.log(`   - Códigos de descuento: ${discountCodes[0].count}`);

    const [filterCategories] = await connection.execute('SELECT COUNT(*) as count FROM filter_categories');
    console.log(`   - Categorías de filtros: ${filterCategories[0].count}`);

    return {
      discountCodes: discountCodesResult,
      filterCategories: filterCategoriesResult,
      allMatch: discountCodesResult.matches && filterCategoriesResult.matches
    };
  } catch (error) {
    console.error('❌ Error en la verificación:', error);
    throw error;
  }
}

async function main() {
  let connection;

  try {
    console.log('🔌 Conectando a la base de datos...');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Database: ${process.env.DB_NAME}`);

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    });

    console.log('✅ Conexión establecida\n');

    const result = await verifyDataConsistency(connection);

    console.log('\n' + '='.repeat(60));
    if (result.allMatch) {
      console.log('✅ VERIFICACIÓN COMPLETA: Todo coincide correctamente');
      process.exit(0);
    } else {
      console.log('⚠️  VERIFICACIÓN COMPLETA: Se encontraron inconsistencias');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

main();

