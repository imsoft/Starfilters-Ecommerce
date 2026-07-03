#!/usr/bin/env node

/**
 * Migración: columna `company` en la tabla users.
 *
 * El cliente pidió que el registro de cuenta pida la empresa de forma
 * obligatoria. El formulario y createUser() ahora envían `company`, así que
 * la columna debe existir tanto en local como en producción.
 *
 * Es idempotente y no destructivo. Los usuarios existentes quedan con NULL.
 *
 * Uso: node scripts/add-company-to-users.js
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'starfilters_ecommerce_db',
  });

  console.log('🔗 Conectado a la base de datos.');

  const [rows] = await connection.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'company'`
  );

  if (rows.length > 0) {
    console.log('⏭️  users.company ya existe, nada que hacer.');
  } else {
    await connection.execute(
      'ALTER TABLE users ADD COLUMN company VARCHAR(150) NULL DEFAULT NULL AFTER last_name'
    );
    console.log('✅ Columna users.company creada.');
  }

  await connection.end();
}

migrate().catch((err) => {
  console.error('❌ Error en la migración:', err.message);
  process.exit(1);
});
