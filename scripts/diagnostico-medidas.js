#!/usr/bin/env node
/**
 * Diagnóstico de solo lectura de las medidas (filter_category_variants).
 *
 *   node scripts/diagnostico-medidas.js            → índices + resumen
 *   node scripts/diagnostico-medidas.js CCPO1      → además, todo sobre ese código
 *
 * No modifica nada. Sirve para entender por qué una medida "no se guarda":
 * muestra si sigue el índice único global de bind_code (que impide repetir
 * un código entre productos) y en qué producto vive cada código.
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const codigo = process.argv[2];
const con = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
const q = async (sql, params = []) => (await con.query(sql, params))[0];

console.log(`Base de datos: ${process.env.DB_NAME}\n`);

console.log('== Índices de filter_category_variants ==');
const idx = await q('SHOW INDEX FROM filter_category_variants');
const porNombre = new Map();
for (const i of idx) {
  if (!porNombre.has(i.Key_name)) porNombre.set(i.Key_name, { cols: [], unico: i.Non_unique === 0 });
  porNombre.get(i.Key_name).cols.push(i.Column_name);
}
for (const [n, d] of porNombre) console.log(`  ${d.unico ? 'ÚNICO ' : '      '} ${n} (${d.cols.join(', ')})`);
const unicoGlobal = [...porNombre].find(([, d]) => d.unico && d.cols.length === 1 && d.cols[0] === 'bind_code');
console.log(unicoGlobal
  ? `\n  ⚠️  Sigue el índice único GLOBAL "${unicoGlobal[0]}": un código BIND no puede repetirse en dos productos, ni aunque esté inactivo en el otro.`
  : '\n  ✅ No hay índice único global de bind_code (es único por producto).');

console.log('\n== Resumen ==');
const [r] = await q(`SELECT COUNT(*) total, SUM(is_active=1) activas, SUM(product_id IS NULL) heredadas FROM filter_category_variants`);
console.log(`  medidas: ${r.total} (activas ${r.activas}, heredadas por categoría ${r.heredadas})`);

if (codigo) {
  console.log(`\n== Código ${codigo} ==`);
  const filas = await q(
    `SELECT v.id, v.bind_code, v.nominal_size, v.is_active, v.product_id, p.name AS producto, p.status AS estado_producto, v.category_id, c.name AS categoria, v.updated_at
     FROM filter_category_variants v
     LEFT JOIN products p ON p.id = v.product_id
     LEFT JOIN filter_categories c ON c.id = v.category_id
     WHERE v.bind_code = ?`, [codigo]);
  if (filas.length === 0) console.log('  (ningún tamaño tiene ese código)');
  for (const f of filas) console.log(`  medida #${f.id} "${f.nominal_size}" activa=${f.is_active} → producto ${f.product_id ?? '(heredada)'} "${f.producto ?? ''}" [${f.estado_producto ?? ''}] · categoría "${f.categoria}" · actualizada ${f.updated_at?.toISOString?.() ?? f.updated_at}`);
  const prods = await q('SELECT id, name, status, bind_code FROM products WHERE bind_code = ?', [codigo]);
  for (const p of prods) console.log(`  producto #${p.id} "${p.name}" [${p.status}] tiene ese código como código propio`);

  // Toda la categoría de ese código: productos y medidas, para ver huérfanas
  // (medidas cuyo producto ya no existe) y duplicados.
  const cats = [...new Set(filas.map((f) => f.category_id).filter(Boolean))];
  for (const catId of cats) {
    const [c] = await q('SELECT id, name, slug FROM filter_categories WHERE id = ?', [catId]);
    console.log(`\n== Categoría #${c.id} "${c.name}" (${c.slug}) ==`);
    const ps = await q(
      `SELECT p.id, p.name, p.status, p.bind_code, p.slug, p.updated_at,
              (SELECT COUNT(*) FROM filter_category_variants v WHERE v.product_id = p.id AND v.is_active = 1) AS medidas
       FROM products p WHERE p.filter_category_id = ? ORDER BY p.id`, [catId]);
    console.log('  productos:');
    for (const p of ps) console.log(`    #${p.id} "${p.name}" [${p.status}] código=${p.bind_code ?? '-'} slug=${p.slug ?? '-'} medidas activas=${p.medidas} · act. ${p.updated_at?.toISOString?.().slice(0, 10)}`);
    const vs = await q(
      `SELECT v.id, v.bind_code, v.nominal_size, v.is_active, v.product_id, p.id AS existe
       FROM filter_category_variants v LEFT JOIN products p ON p.id = v.product_id
       WHERE v.category_id = ? ORDER BY v.product_id, v.id`, [catId]);
    console.log('  medidas:');
    for (const v of vs) {
      const dueno = v.product_id == null ? 'heredada por la categoría' : v.existe ? `producto #${v.product_id}` : `producto #${v.product_id} (¡YA NO EXISTE!)`;
      console.log(`    #${v.id} ${v.bind_code ?? '-'} "${v.nominal_size}" activa=${v.is_active} → ${dueno}`);
    }
  }
}
await con.end();
