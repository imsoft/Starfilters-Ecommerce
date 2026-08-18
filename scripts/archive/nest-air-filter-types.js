#!/usr/bin/env node

/**
 * Anida los tipos de filtro de aire bajo la familia "Filtros de aire".
 *
 * Tu base ya tenía categorías reales de filtro (HEPA, Prefiltros, alta/mediana/
 * baja eficiencia, celdas de absorción de gases) que quedaron como nivel
 * principal. Como todas son tipos de filtro de aire, deben colgar de
 * "Filtros de aire" para que el webshop muestre: 6 tipos de producto arriba y,
 * al elegir "Filtros de aire", sus tipos de filtro como subfiltro.
 *
 * Anida TODA categoría de nivel principal (parent_id NULL) que NO sea una de las
 * 6 familias nuevas. Muestra exactamente qué anida. Es reversible (poner
 * parent_id = NULL) e idempotente (al re-correrlo ya no quedan sueltas).
 *
 * Uso: node scripts/nest-air-filter-types.js
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// Las 6 familias (tipo de producto) deben permanecer en el nivel principal.
const FAMILIES = [
  'filtros-de-aire',
  'gabinetes',
  'accesorios-cuarto-limpio',
  'uma',
  'air-shower',
  'cabina-de-flujo-laminar',
];

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'starfilters_ecommerce_db',
  });

  console.log('🔗 Conectado a la base de datos.');

  const [air] = await connection.execute(
    "SELECT id FROM filter_categories WHERE slug = 'filtros-de-aire' LIMIT 1"
  );
  if (air.length === 0) {
    console.log('❌ No existe la familia "Filtros de aire". Corre antes scripts/seed-webshop-categories.js.');
    await connection.end();
    process.exit(1);
  }
  const airId = air[0].id;

  // Categorías de nivel principal que NO son familias → se anidan.
  const placeholders = FAMILIES.map(() => '?').join(', ');
  const [loose] = await connection.execute(
    `SELECT id, name, slug FROM filter_categories
     WHERE parent_id IS NULL AND id <> ? AND slug NOT IN (${placeholders})`,
    [airId, ...FAMILIES]
  );

  if (loose.length === 0) {
    console.log('✅ No hay categorías sueltas que anidar. Todo en orden.');
    await connection.end();
    return;
  }

  console.log(`\nSe anidarán ${loose.length} categoría(s) bajo "Filtros de aire":`);
  for (const c of loose) console.log(`   • ${c.name}`);

  for (const c of loose) {
    await connection.execute('UPDATE filter_categories SET parent_id = ? WHERE id = ?', [airId, c.id]);
  }

  console.log(`\n✅ Listo. ${loose.length} tipo(s) de filtro ahora cuelgan de "Filtros de aire".`);
  console.log('   (Si alguna no debería ir ahí, cámbiala desde el admin con el selector de categoría padre.)');
  await connection.end();
}

run().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
