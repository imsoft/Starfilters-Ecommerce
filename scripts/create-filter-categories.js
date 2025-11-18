import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '..', '.env') });

async function createFilterCategoriesTables() {
  let connection;

  try {
    console.log('🔌 Conectando a la base de datos...');

    // Crear conexión
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      multipleStatements: true, // Permitir múltiples statements
    });

    console.log('✅ Conexión establecida');

    // Leer el archivo SQL
    const sqlPath = join(__dirname, 'create-filter-categories-table.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    console.log('\n📋 Ejecutando script SQL...');
    await connection.query(sql);

    console.log('✅ Tablas creadas exitosamente');

    // Mostrar categorías creadas
    console.log('\n📊 Categorías de filtros creadas:');
    const [categories] = await connection.execute('SELECT id, name, slug, efficiency FROM filter_categories');
    console.table(categories);

    // Mostrar variantes creadas
    console.log('\n📦 Variantes/Tamaños creados:');
    const [variants] = await connection.execute(`
      SELECT
        fc.name as categoria,
        v.bind_code,
        v.nominal_size,
        v.real_size,
        v.price,
        v.stock
      FROM filter_category_variants v
      JOIN filter_categories fc ON v.category_id = fc.id
      ORDER BY v.id
    `);
    console.table(variants);

    console.log('\n🎉 ¡Script ejecutado exitosamente!');

  } catch (error) {
    console.error('\n❌ Error ejecutando el script:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar el script
createFilterCategoriesTables();
