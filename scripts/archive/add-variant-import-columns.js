#!/usr/bin/env node

/**
 * Migración: columnas que usa la importación masiva de tamaños por Excel.
 *
 * El importador (lib/import-sizes.ts, usado por editar y agregar producto)
 * guarda `product_code` (codigo_producto) y `air_flow` (flujo_aire) en
 * filter_category_variants, pero esas columnas nunca se crearon: cada fila
 * fallaba con "Unknown column 'product_code'".
 *
 * Idempotente: si la columna ya existe, la omite.
 * Uso: node scripts/add-variant-import-columns.js  (correr también en el servidor)
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const COLUMNS = [
  { name: 'product_code', ddl: 'ADD COLUMN product_code VARCHAR(100) NULL AFTER bind_code' },
  { name: 'air_flow', ddl: 'ADD COLUMN air_flow VARCHAR(100) NULL AFTER product_code' },
];

const main = async () => {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'starfilters_db',
  });

  try {
    const [existing] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'filter_category_variants'`
    );
    const have = new Set(existing.map((r) => r.COLUMN_NAME));

    for (const col of COLUMNS) {
      if (have.has(col.name)) {
        console.log(`✓ ${col.name} ya existe, omitida`);
        continue;
      }
      await db.query(`ALTER TABLE filter_category_variants ${col.ddl}`);
      console.log(`✅ Columna agregada: ${col.name}`);
    }
    console.log('Listo.');
  } finally {
    await db.end();
  }
};

main().catch((e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
