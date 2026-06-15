#!/usr/bin/env node

/**
 * Crea las tablas `benefits` y `testimonials` (con su contenido inicial) si no
 * existen. Estas tablas alimentan el banner superior y la sección de testimonios
 * del home; si faltan, el home se rompe.
 *
 * Ejecuta cada migración SOLO si la tabla no existe (para no duplicar datos).
 *
 * Uso: node scripts/init-home-tables.js
 */

import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const MIGRATIONS = [
  { table: 'benefits', file: 'create_benefits_table.sql' },
  { table: 'testimonials', file: 'create_testimonials_table.sql' },
];

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'starfilters_ecommerce_db',
    multipleStatements: true,
  });

  console.log('🔗 Conectado a la base de datos.');

  for (const { table, file } of MIGRATIONS) {
    const [rows] = await connection.query(
      `SELECT COUNT(*) AS n FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
      [table]
    );
    if (rows[0].n > 0) {
      console.log(`⏭️  La tabla ${table} ya existe; no se toca.`);
      continue;
    }

    const sql = readFileSync(join(__dirname, '..', 'migrations', file), 'utf8');
    await connection.query(sql);
    const [count] = await connection.query(`SELECT COUNT(*) AS n FROM ${table}`);
    console.log(`✅ Tabla ${table} creada con ${count[0].n} registros.`);
  }

  console.log('\n✅ Listo.');
  await connection.end();
}

run().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
