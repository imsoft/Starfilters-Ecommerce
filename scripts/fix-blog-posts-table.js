/**
 * Script para corregir y actualizar la tabla blog_posts
 * Ejecuta: node scripts/fix-blog-posts-table.js
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '..', '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'starfilters_ecommerce_db',
};

async function checkColumnExists(connection, tableName, columnName) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) as count 
     FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = ? 
     AND TABLE_NAME = ? 
     AND COLUMN_NAME = ?`,
    [dbConfig.database, tableName, columnName]
  );
  return rows[0].count > 0;
}

async function fixBlogPostsTable() {
  let connection;

  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos');

    // Verificar si la tabla existe
    const [tables] = await connection.execute(
      `SELECT COUNT(*) as count 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_NAME = 'blog_posts'`,
      [dbConfig.database]
    );

    if (tables[0].count === 0) {
      console.log('❌ La tabla blog_posts no existe. Ejecuta primero database/schema.sql');
      process.exit(1);
    }

    console.log('✅ La tabla blog_posts existe');

    // Lista de columnas a verificar/agregar
    const columnsToAdd = [
      { name: 'featured_image_url', type: 'VARCHAR(500)', after: 'featured_image' },
      { name: 'title_en', type: 'VARCHAR(255)', after: 'title' },
      { name: 'slug_en', type: 'VARCHAR(255)', after: 'slug' },
      { name: 'content_en', type: 'LONGTEXT', after: 'content' },
      { name: 'excerpt_en', type: 'TEXT', after: 'excerpt' },
      { name: 'meta_title_en', type: 'VARCHAR(255)', after: 'meta_title' },
      { name: 'meta_description_en', type: 'TEXT', after: 'meta_description' },
    ];

    console.log('\n📋 Verificando columnas...');
    for (const column of columnsToAdd) {
      const exists = await checkColumnExists(connection, 'blog_posts', column.name);
      
      if (!exists) {
        console.log(`➕ Agregando columna: ${column.name}`);
        try {
          await connection.execute(
            `ALTER TABLE blog_posts 
             ADD COLUMN ${column.name} ${column.type} 
             ${column.after ? `AFTER ${column.after}` : ''}`
          );
          console.log(`✅ Columna ${column.name} agregada`);
        } catch (error) {
          console.error(`❌ Error agregando ${column.name}:`, error.message);
        }
      } else {
        console.log(`✓ Columna ${column.name} ya existe`);
      }
    }

    // Agregar índice único para slug_en si no existe
    console.log('\n📋 Verificando índices...');
    try {
      const [indexes] = await connection.execute(
        `SHOW INDEXES FROM blog_posts WHERE Column_name = 'slug_en'`
      );
      
      if (indexes.length === 0) {
        console.log('➕ Agregando índice único para slug_en...');
        await connection.execute(
          `ALTER TABLE blog_posts 
           ADD UNIQUE INDEX idx_blog_posts_slug_en (slug_en)`
        );
        console.log('✅ Índice agregado');
      } else {
        console.log('✓ Índice para slug_en ya existe');
      }
    } catch (error) {
      console.error('⚠️  Error con índice (puede que ya exista):', error.message);
    }

    // Si featured_image existe pero featured_image_url no tiene datos, copiar
    const hasFeaturedImage = await checkColumnExists(connection, 'blog_posts', 'featured_image');
    if (hasFeaturedImage) {
      console.log('\n📋 Verificando datos de featured_image...');
      const [rows] = await connection.execute(
        `SELECT COUNT(*) as count 
         FROM blog_posts 
         WHERE featured_image IS NOT NULL 
         AND (featured_image_url IS NULL OR featured_image_url = '')`
      );
      
      if (rows[0].count > 0) {
        console.log(`➕ Copiando datos de featured_image a featured_image_url...`);
        await connection.execute(
          `UPDATE blog_posts 
           SET featured_image_url = featured_image 
           WHERE featured_image IS NOT NULL 
           AND (featured_image_url IS NULL OR featured_image_url = '')`
        );
        console.log('✅ Datos copiados');
      } else {
        console.log('✓ No hay datos para copiar');
      }
    }

    console.log('\n✅ ¡Tabla blog_posts actualizada correctamente!');
    console.log('\n📝 Resumen:');
    console.log('   - Todas las columnas necesarias están presentes');
    console.log('   - Los índices están configurados');
    console.log('   - La tabla está lista para usar');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar
fixBlogPostsTable();

