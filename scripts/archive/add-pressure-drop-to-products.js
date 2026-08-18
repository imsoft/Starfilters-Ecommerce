#!/usr/bin/env node

/**
 * Migración: columnas de caída de presión (ΔP) en la tabla products.
 *
 * El cliente pidió mostrar en la página de producto:
 *   - ΔP Inicial               → products.initial_pressure_drop
 *   - ΔP Final Recomendada     → products.recommended_final_pressure_drop
 *
 * Son texto libre (p. ej. "125 Pa") para que el admin capture unidad incluida.
 * Es idempotente y no destructiva.
 *
 * Uso: node scripts/add-pressure-drop-to-products.js
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const COLUMNS = [
  { column: 'initial_pressure_drop',           ddl: 'ADD COLUMN initial_pressure_drop VARCHAR(100) NULL DEFAULT NULL' },
  { column: 'recommended_final_pressure_drop', ddl: 'ADD COLUMN recommended_final_pressure_drop VARCHAR(100) NULL DEFAULT NULL' },
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

  for (const { column, ddl } of COLUMNS) {
    const [rows] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = ?`,
      [column]
    );

    if (rows.length > 0) {
      console.log(`⏭️  products.${column} ya existe, nada que hacer.`);
    } else {
      await connection.execute(`ALTER TABLE products ${ddl}`);
      console.log(`✅ Columna products.${column} creada.`);
    }
  }

  await connection.end();
}

migrate().catch((err) => {
  console.error('❌ Error en la migración:', err.message);
  process.exit(1);
});
