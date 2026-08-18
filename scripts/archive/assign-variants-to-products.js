#!/usr/bin/env node
/**
 * Asigna cada fila de filter_category_variants al producto dueño.
 *
 * Antes los tamaños colgaban solo de la categoría de filtro: dos productos de
 * la misma categoría (p. ej. manómetro digital y análogo) compartían la misma
 * tabla de tamaños y se pisaban al guardar. Ahora las variantes tienen
 * product_id; esta pasada llena ese dato para lo ya cargado.
 *
 * Criterio:
 *   1. Si la variante y un producto comparten bind_code → ese es el dueño.
 *   2. Si la categoría tiene UN solo producto → ese es el dueño.
 *   3. Si la categoría tiene varios y no hay bind_code que coincida → se
 *      reporta para asignarla a mano desde el admin (se deja sin dueño, que
 *      sigue funcionando como antes).
 *
 * Uso:  node scripts/assign-variants-to-products.js [--apply]
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const apply = process.argv.includes('--apply');

const db = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'starfilters_db',
});

// La columna la crea la app sola, pero el script puede correr antes del deploy
const [cols] = await db.query(
  `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'filter_category_variants'
     AND COLUMN_NAME = 'product_id'`
);
if (Number(cols[0].n) === 0) {
  if (!apply) {
    console.log('La columna product_id todavía no existe. Corre con --apply para crearla.');
    await db.end();
    process.exit(0);
  }
  await db.query('ALTER TABLE filter_category_variants ADD COLUMN product_id INT NULL');
  await db.query('CREATE INDEX idx_fcv_product ON filter_category_variants (product_id)');
  console.log('✅ Columna product_id creada');
}

const [variants] = await db.query(
  `SELECT id, category_id, product_id, bind_code, nominal_size, real_size
   FROM filter_category_variants WHERE product_id IS NULL`
);
// products.bind_code no existe en todos los entornos: se consulta solo si está
const [productCols] = await db.query(
  `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'bind_code'`
);
const hayBindCodeEnProductos = Number(productCols[0].n) > 0;

const [products] = await db.query(
  `SELECT id, name, ${hayBindCodeEnProductos ? 'bind_code' : 'NULL AS bind_code'}, filter_category_id
   FROM products WHERE filter_category_id IS NOT NULL`
);

const porCategoria = new Map();
for (const p of products) {
  if (!porCategoria.has(p.filter_category_id)) porCategoria.set(p.filter_category_id, []);
  porCategoria.get(p.filter_category_id).push(p);
}

const asignaciones = [];
const ambiguas = [];

for (const v of variants) {
  const candidatos = porCategoria.get(v.category_id) || [];

  const porCodigo = v.bind_code
    ? candidatos.find(
        (p) => p.bind_code && p.bind_code.trim().toLowerCase() === v.bind_code.trim().toLowerCase()
      )
    : null;

  if (porCodigo) {
    asignaciones.push({ v, producto: porCodigo, motivo: 'mismo código BIND' });
  } else if (candidatos.length === 1) {
    asignaciones.push({ v, producto: candidatos[0], motivo: 'único producto de la categoría' });
  } else {
    ambiguas.push({ v, candidatos, sinProductos: candidatos.length === 0 });
  }
}

console.log(`Variantes sin dueño: ${variants.length}`);
console.log(`Se pueden asignar automáticamente: ${asignaciones.length}`);
console.log(`Requieren revisión manual: ${ambiguas.length}\n`);

for (const a of asignaciones) {
  console.log(
    `#${a.v.id} ${a.v.bind_code || '(sin código)'} ${a.v.nominal_size || ''} → ${a.producto.name} (${a.motivo})`
  );
}

if (ambiguas.length > 0) {
  console.log('\n⚠️  Sin poder decidir el dueño:');
  for (const a of ambiguas) {
    const detalle = a.sinProductos
      ? 'ningún producto usa esa categoría'
      : `candidatos: ${a.candidatos.map((p) => p.name).join(', ')}`;
    console.log(
      `   #${a.v.id} ${a.v.bind_code || '(sin código)'} ${a.v.nominal_size || ''} — ${detalle}`
    );
  }
  console.log(
    '   Abre cada producto en el admin, deja en su tabla solo los tamaños que le\n' +
    '   correspondan y guarda: al guardar quedan asignados a ese producto.'
  );
}

if (!apply) {
  console.log('\n(simulación) Corre con --apply para guardar los cambios.');
} else if (asignaciones.length > 0) {
  for (const a of asignaciones) {
    await db.execute('UPDATE filter_category_variants SET product_id = ? WHERE id = ?', [
      a.producto.id,
      a.v.id,
    ]);
  }
  console.log(`\n✅ ${asignaciones.length} variante(s) asignadas.`);
}

await db.end();
