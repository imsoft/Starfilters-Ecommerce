#!/usr/bin/env node
/**
 * Medidas huérfanas: filas de filter_category_variants cuyo product_id apunta
 * a un producto que ya no existe (se borró el producto y la medida se quedó).
 *
 * Si la categoría de la medida tiene UN solo producto activo, la medida se
 * le asigna a ese producto (es el caso "borré el producto ovalado para
 * ponerlo como medida del redondo"). Si hay varios o ninguno, solo se
 * informa: esa decisión es de una persona.
 *
 *   node scripts/adoptar-medidas-huerfanas.js            → simula, no cambia nada
 *   node scripts/adoptar-medidas-huerfanas.js --aplicar  → aplica
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const APLICAR = process.argv.includes('--aplicar');
const con = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
const q = async (sql, params = []) => (await con.query(sql, params))[0];

console.log(`Base de datos: ${process.env.DB_NAME}  ·  modo: ${APLICAR ? 'APLICAR' : 'simulación'}\n`);

const huerfanas = await q(
  `SELECT v.id, v.bind_code, v.nominal_size, v.real_size, v.price, v.is_active, v.product_id, v.category_id, c.name AS categoria
   FROM filter_category_variants v
   LEFT JOIN products p ON p.id = v.product_id
   LEFT JOIN filter_categories c ON c.id = v.category_id
   WHERE v.product_id IS NOT NULL AND p.id IS NULL
   ORDER BY v.category_id, v.id`
);

if (huerfanas.length === 0) {
  console.log('✅ No hay medidas huérfanas.');
  await con.end();
  process.exit(0);
}

let adoptadas = 0;
for (const v of huerfanas) {
  const candidatos = await q(
    `SELECT id, name, bind_code FROM products WHERE filter_category_id = ? AND status = 'active' ORDER BY id`,
    [v.category_id]
  );
  const etiqueta = `medida #${v.id} ${v.bind_code ?? '-'} "${v.nominal_size}" ($${v.price}) · categoría "${v.categoria}" · apuntaba al producto #${v.product_id} (borrado)`;

  if (candidatos.length !== 1) {
    console.log(`⏭  ${etiqueta}\n     → ${candidatos.length === 0 ? 'la categoría no tiene productos activos' : `la categoría tiene ${candidatos.length} productos (${candidatos.map((c) => `#${c.id} ${c.name}`).join(', ')})`}; decide a mano.`);
    continue;
  }
  const destino = candidatos[0];
  const choque = await q(
    'SELECT id FROM filter_category_variants WHERE product_id = ? AND bind_code = ? AND bind_code IS NOT NULL',
    [destino.id, v.bind_code]
  );
  if (choque.length > 0) {
    console.log(`⏭  ${etiqueta}\n     → el producto #${destino.id} "${destino.name}" ya tiene una medida con el código ${v.bind_code} (#${choque[0].id}); decide a mano.`);
    continue;
  }
  console.log(`${APLICAR ? '✅' : '→ '} ${etiqueta}\n     ${APLICAR ? 'asignada' : 'se asignaría'} al producto #${destino.id} "${destino.name}"`);
  if (APLICAR) {
    await q('UPDATE filter_category_variants SET product_id = ?, is_active = 1 WHERE id = ?', [destino.id, v.id]);
  }
  adoptadas++;
}

console.log(`\n${huerfanas.length} huérfana(s); ${adoptadas} ${APLICAR ? 'adoptada(s)' : 'se adoptarían'}.`);
if (!APLICAR && adoptadas > 0) console.log('Para aplicar:  node scripts/adoptar-medidas-huerfanas.js --aplicar');
await con.end();
