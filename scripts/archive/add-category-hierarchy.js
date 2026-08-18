#!/usr/bin/env node

/**
 * Migración: jerarquía de 2 niveles en filter_categories.
 *
 * Agrega la columna `parent_id` (autorreferencia) para distinguir:
 *   - Tipo de producto (categoría 1 de BIND): parent_id = NULL
 *   - Tipo de filtro    (categoría 2 de BIND): parent_id = id del tipo de producto
 *
 * Además cuelga la categoría existente "Mini pleat sello gel downstream"
 * (que es un tipo de filtro con 10 medidas) bajo "Filtros de aire".
 *
 * Es idempotente: no falla si la columna o la relación ya existen.
 *
 * Uso: node scripts/add-category-hierarchy.js
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

  // 1. Agregar columna parent_id si no existe.
  const [cols] = await connection.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'filter_categories' AND COLUMN_NAME = 'parent_id'`
  );

  if (cols.length === 0) {
    await connection.execute(
      'ALTER TABLE filter_categories ADD COLUMN parent_id INT NULL DEFAULT NULL AFTER id'
    );
    console.log('✅ Columna parent_id agregada.');
    try {
      await connection.execute(
        'ALTER TABLE filter_categories ADD INDEX idx_parent_id (parent_id)'
      );
      console.log('✅ Índice idx_parent_id creado.');
    } catch (e) {
      console.log('⚠️ No se pudo crear el índice (puede ya existir):', e.message);
    }
  } else {
    console.log('⏭️  La columna parent_id ya existe.');
  }

  // 2. Colgar "Mini pleat sello gel downstream" bajo "Filtros de aire".
  const [parents] = await connection.execute(
    "SELECT id FROM filter_categories WHERE slug = 'filtros-de-aire' LIMIT 1"
  );
  const [children] = await connection.execute(
    "SELECT id, parent_id FROM filter_categories WHERE slug = 'mini-pleat-sello-gel-downstream' LIMIT 1"
  );

  if (parents.length === 0) {
    console.log('⚠️ No existe la categoría "Filtros de aire" (filtros-de-aire). Corre antes seed-webshop-categories.js.');
  } else if (children.length === 0) {
    console.log('⏭️  No existe "Mini pleat sello gel downstream"; nada que reasignar.');
  } else {
    const parentId = parents[0].id;
    const child = children[0];
    if (child.parent_id === parentId) {
      console.log(`⏭️  "Mini pleat" ya cuelga de "Filtros de aire" (id ${parentId}).`);
    } else {
      await connection.execute(
        'UPDATE filter_categories SET parent_id = ? WHERE id = ?',
        [parentId, child.id]
      );
      console.log(`✅ "Mini pleat" (id ${child.id}) ahora cuelga de "Filtros de aire" (id ${parentId}).`);
    }
  }

  // 3. Resumen de la jerarquía resultante.
  const [rows] = await connection.execute(
    `SELECT c.id, c.name, c.parent_id, p.name AS parent_name
     FROM filter_categories c
     LEFT JOIN filter_categories p ON c.parent_id = p.id
     WHERE c.status = 'active' OR c.status IS NULL
     ORDER BY (c.parent_id IS NOT NULL), c.created_at DESC`
  );
  console.log('\n📊 Jerarquía actual:');
  for (const r of rows) {
    console.log(r.parent_id ? `   └─ ${r.name}  (tipo de filtro de "${r.parent_name}")` : `${r.name}  (tipo de producto)`);
  }

  await connection.end();
}

migrate().catch((err) => {
  console.error('❌ Error en la migración:', err);
  process.exit(1);
});
