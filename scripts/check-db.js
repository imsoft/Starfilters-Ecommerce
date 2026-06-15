#!/usr/bin/env node

/**
 * Verificación de SOLO LECTURA del estado de la base de datos.
 *
 * Revisa que existan las tablas, columnas y datos que el sitio necesita.
 * NO modifica nada. Útil para confirmar en el VPS que las migraciones/seeds
 * ya están aplicados.
 *
 * Uso: node scripts/check-db.js
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

let ok = 0;
let fail = 0;
const line = (pass, label, extra = '') => {
  console.log(`${pass ? '✅' : '❌'} ${label}${extra ? '  — ' + extra : ''}`);
  pass ? ok++ : fail++;
};

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'starfilters_ecommerce_db',
  });

  const [dbRows] = await connection.query('SELECT DATABASE() AS db');
  console.log(`🔗 Conectado a la base: ${dbRows[0].db}\n`);

  const q = async (s, p = []) => (await connection.query(s, p))[0];

  const tableExists = async (t) =>
    (await q(
      `SELECT COUNT(*) n FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
      [t]
    ))[0].n > 0;

  const columnExists = async (t, c) =>
    (await q(
      `SELECT COUNT(*) n FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [t, c]
    ))[0].n > 0;

  const count = async (t, where = '') =>
    (await q(`SELECT COUNT(*) n FROM ${t} ${where}`))[0].n;

  console.log('── Columnas del catálogo ──────────────────────────────');
  line(await columnExists('filter_categories', 'parent_id'), 'filter_categories.parent_id (jerarquía)');
  line(await columnExists('filter_category_variants', 'currency'), 'filter_category_variants.currency');
  line(await columnExists('filter_category_variants', 'price_usd'), 'filter_category_variants.price_usd');
  line(await columnExists('products', 'filter_category_id'), 'products.filter_category_id');
  line(await columnExists('products', 'product_type'), 'products.product_type');

  console.log('\n── Categorías del webshop ─────────────────────────────');
  const slugs = ['filtros-de-aire', 'gabinetes', 'accesorios-cuarto-limpio', 'uma', 'air-shower', 'cabina-de-flujo-laminar'];
  for (const slug of slugs) {
    const rows = await q('SELECT id FROM filter_categories WHERE slug = ?', [slug]);
    line(rows.length > 0, `categoría "${slug}"`);
  }
  // Mostrar la jerarquía actual (informativo, no cuenta como fallo).
  if (await columnExists('filter_categories', 'parent_id')) {
    const tree = await q(
      `SELECT c.name, p.name AS parent FROM filter_categories c
       LEFT JOIN filter_categories p ON c.parent_id = p.id
       WHERE c.status = 'active' OR c.status IS NULL
       ORDER BY (c.parent_id IS NOT NULL), c.created_at DESC`
    );
    const parents = tree.filter((r) => !r.parent);
    const children = tree.filter((r) => r.parent);
    console.log(`\n   Jerarquía actual (${parents.length} tipos de producto, ${children.length} tipos de filtro):`);
    for (const p of parents) {
      const kids = children.filter((c) => c.parent === p.name);
      console.log(`   • ${p.name}${kids.length ? '  → ' + kids.map((k) => k.name).join(', ') : ''}`);
    }
    if (children.length === 0) {
      console.log('   ⚠️  Aún no hay tipos de filtro anidados. Si tienes categorías de filtro de aire');
      console.log('       (HEPA, Prefiltros, etc.) como nivel principal, córrelas bajo "Filtros de aire"');
      console.log('       con: node scripts/nest-air-filter-types.js');
    }
  }

  console.log('\n── Tablas del home ────────────────────────────────────');
  for (const t of ['benefits', 'testimonials']) {
    if (await tableExists(t)) line(true, `tabla ${t}`, `${await count(t)} registros`);
    else line(false, `tabla ${t}`, 'NO existe');
  }

  console.log('\n── Casos de éxito / galería ───────────────────────────');
  if (await tableExists('case_studies')) {
    const c = await q("SELECT id FROM case_studies WHERE slug = 'planta-farmaceutica-el-salto-jalisco'");
    line(c.length > 0, 'caso de éxito de ejemplo (farmacéutico)');
  } else line(false, 'tabla case_studies', 'NO existe');

  if (await tableExists('portfolio_projects')) {
    line((await count('portfolio_projects')) > 0, 'tarjeta(s) en la galería del home', `${await count('portfolio_projects')} en total`);
  } else line(false, 'tabla portfolio_projects', 'NO existe');

  console.log('\n───────────────────────────────────────────────────────');
  console.log(`Resultado: ${ok} OK, ${fail} faltante(s).`);
  if (fail === 0) console.log('🎉 Todo está en la base. No necesitas correr nada.');
  else console.log('⚠️ Falta algo. Corre los scripts de migración/seed indicados.');

  await connection.end();
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('❌ Error conectando o consultando la base:', err.message);
  process.exit(2);
});
