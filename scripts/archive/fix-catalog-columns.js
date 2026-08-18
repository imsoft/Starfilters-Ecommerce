#!/usr/bin/env node

/**
 * Migración: columnas faltantes del catálogo.
 *
 * El código (product-service.ts) consulta columnas que no existían en la BD de
 * producción, lo que hacía que getProductsByFilterCategory() lanzara error y
 * devolviera [] — por eso el webshop no mostraba productos al elegir categoría.
 *
 * Agrega (si faltan):
 *   - filter_category_variants.currency   (default 'MXN')
 *   - filter_category_variants.price_usd
 *   - products.filter_category_id
 *   - products.product_type               (default 'filter')
 *
 * Es idempotente y no destructivo.
 *
 * Uso: node scripts/fix-catalog-columns.js
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const COLUMNS = [
  { table: 'filter_category_variants', column: 'currency',           ddl: "ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'MXN'" },
  { table: 'filter_category_variants', column: 'price_usd',          ddl: 'ADD COLUMN price_usd DECIMAL(10,2) NULL DEFAULT NULL' },
  { table: 'products',                 column: 'filter_category_id', ddl: 'ADD COLUMN filter_category_id INT NULL DEFAULT NULL' },
  { table: 'products',                 column: 'product_type',       ddl: "ADD COLUMN product_type VARCHAR(20) NOT NULL DEFAULT 'filter'" },
];

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'starfilters_ecommerce_db',
  });

  console.log('🔗 Conectado a la base de datos.');

  for (const { table, column, ddl } of COLUMNS) {
    const [rows] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, column]
    );

    if (rows.length > 0) {
      console.log(`⏭️  ${table}.${column} ya existe.`);
      continue;
    }

    await connection.query(`ALTER TABLE ${table} ${ddl}`);
    console.log(`✅ ${table}.${column} agregada.`);
  }

  console.log('\n✅ Migración de columnas completada.');
  await connection.end();
}

migrate().catch((err) => {
  console.error('❌ Error en la migración:', err);
  process.exit(1);
});
