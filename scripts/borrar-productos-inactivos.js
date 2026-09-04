#!/usr/bin/env node

/**
 * Borra productos INACTIVOS que ya no sirven para nada.
 *
 * Al unir los gabinetes por medida (unir-productos-por-medida.js) los
 * productos absorbidos quedaron desactivados, no borrados, y siguen
 * apareciendo en el panel. Este script los elimina, con una regla estricta:
 *
 *   SOLO se borra un producto si está inactivo, no tiene medidas propias y
 *   NINGÚN pedido lo referencia.
 *
 * La última condición no es cortesía: order_items.product_id tiene
 * ON DELETE CASCADE, así que borrar un producto con pedidos BORRARÍA los
 * renglones de esos pedidos. Esos productos se dejan como están.
 *
 * SIMULA POR DEFECTO. Sin --aplicar no escribe nada.
 *
 *   node scripts/borrar-productos-inactivos.js            → simulación
 *   node scripts/borrar-productos-inactivos.js --aplicar  → borra de verdad
 *
 * Antes de aplicar, respaldo:
 *   mysqldump -u USUARIO -p BASE > respaldo-antes-de-borrar.sql
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const APLICAR = process.argv.includes('--aplicar');

const main = async () => {
  const con = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const q = async (sql, params = []) => (await con.query(sql, params))[0];

  console.log(APLICAR
    ? '⚠️  MODO REAL: se van a borrar productos.\n'
    : '🔍 SIMULACIÓN: no se escribe nada. Usa --aplicar para borrar de verdad.\n');
  console.log(`Base de datos: ${process.env.DB_NAME}\n`);

  const inactivos = await q(`
    SELECT p.id, p.name, p.nominal_size, p.bind_code,
           (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id) AS pedidos,
           (SELECT COUNT(*) FROM filter_category_variants v WHERE v.product_id = p.id) AS medidas,
           (SELECT COUNT(*) FROM product_images i WHERE i.product_id = p.id) AS imagenes
      FROM products p
     WHERE p.status = 'inactive'
     ORDER BY p.name, p.id`);

  if (!inactivos.length) {
    console.log('No hay productos inactivos.');
    await con.end();
    return;
  }

  const borrables = inactivos.filter((p) => p.pedidos === 0 && p.medidas === 0);
  const protegidos = inactivos.filter((p) => !(p.pedidos === 0 && p.medidas === 0));

  console.log(`Inactivos: ${inactivos.length} · se pueden borrar: ${borrables.length} · se conservan: ${protegidos.length}\n`);

  for (const p of borrables) {
    console.log(`  − [${p.id}] ${p.name}  "${p.nominal_size || '—'}"  BIND ${p.bind_code || '—'}${p.imagenes ? `  (${p.imagenes} imagen(es) también se borran)` : ''}`);
    if (APLICAR) {
      await q('DELETE FROM product_images WHERE product_id = ?', [p.id]);
      await q('DELETE FROM products WHERE id = ?', [p.id]);
    }
  }

  if (protegidos.length) {
    console.log('\nSe conservan (no se tocan):');
    for (const p of protegidos) {
      const motivo = p.pedidos ? `${p.pedidos} renglón(es) de pedido lo usan` : `${p.medidas} medida(s) propias`;
      console.log(`  = [${p.id}] ${p.name}  "${p.nominal_size || '—'}"  → ${motivo}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(APLICAR ? `BORRADOS: ${borrables.length}` : `SIMULACIÓN — se borrarían ${borrables.length}`);
  console.log('='.repeat(60));
  if (!APLICAR) console.log('\n  Para ejecutarlo: node scripts/borrar-productos-inactivos.js --aplicar');

  await con.end();
};

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
