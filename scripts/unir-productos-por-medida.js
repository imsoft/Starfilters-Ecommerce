#!/usr/bin/env node

/**
 * Une los productos que son el mismo modelo repetido por medida.
 *
 * El formulario de alta crea un producto por cada medida de la tabla de
 * tamaños, así que un gabinete con 12 medidas quedó como 12 productos. Este
 * script deja UNO por modelo y convierte los demás en tamaños suyos, que es
 * como el resto del sitio espera que estén.
 *
 * SIMULA POR DEFECTO. Sin --aplicar no escribe absolutamente nada: solo dice
 * qué haría. Corre la simulación, revisa el reporte y solo entonces aplica.
 *
 *   node scripts/unir-productos-por-medida.js              → simulación
 *   node scripts/unir-productos-por-medida.js --aplicar    → ejecuta de verdad
 *
 * ANTES DE APLICAR, saca respaldo:
 *   mysqldump -u USUARIO -p BASE > respaldo-antes-de-unir.sql
 *
 * Qué hace exactamente al aplicar:
 *   1. Agrupa productos ACTIVOS con el mismo nombre exacto dentro de la misma
 *      categoría. Solo grupos de 2 o más.
 *   2. Elige como principal el que ya tenga tamaños; si ninguno tiene, el de
 *      id más bajo.
 *   3. Copia cada uno de los demás como un tamaño del principal, con su medida,
 *      precio, moneda, código de BIND y existencias.
 *   4. DESACTIVA los productos absorbidos. NUNCA los borra: order_items apunta
 *      a products y borrarlos rompería el historial de pedidos.
 *
 * Es repetible: si un tamaño ya existe (mismo código BIND o misma medida en el
 * principal), no lo duplica.
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
    ? '⚠️  MODO REAL: se van a escribir cambios en la base de datos.\n'
    : '🔍 SIMULACIÓN: no se escribe nada. Usa --aplicar para ejecutar de verdad.\n');
  console.log(`Base de datos: ${process.env.DB_NAME}\n`);

  // 1. Grupos: mismo nombre exacto y misma categoría, entre productos activos.
  const grupos = await q(`
    SELECT name, filter_category_id, COUNT(*) n
      FROM products
     WHERE status = 'active'
     GROUP BY name, filter_category_id
    HAVING COUNT(*) > 1
     ORDER BY n DESC`);

  if (!grupos.length) {
    console.log('No hay productos repetidos que unir.');
    await con.end();
    return;
  }

  let totalTamanos = 0;
  let totalDesactivados = 0;

  for (const g of grupos) {
    const miembros = await q(`
      SELECT p.id, p.uuid, p.name, p.nominal_size, p.real_size, p.price, p.currency,
             p.price_usd, p.bind_code, p.product_code, p.sku, p.stock, p.filter_category_id,
             (SELECT COUNT(*) FROM filter_category_variants v WHERE v.product_id = p.id) tamanos
        FROM products p
       WHERE p.status = 'active' AND p.name = ?
         AND (p.filter_category_id <=> ?)
       ORDER BY tamanos DESC, p.id ASC`, [g.name, g.filter_category_id]);

    const principal = miembros[0];
    const absorbidos = miembros.slice(1);

    console.log(`\n── "${g.name}" — ${miembros.length} productos`);
    console.log(`   principal: [${principal.id}] "${principal.nominal_size || '—'}" · ${principal.tamanos} tamaños actuales`);

    // Tamaños que el principal ya tiene, para no duplicar.
    const yaTiene = await q(
      'SELECT bind_code, nominal_size FROM filter_category_variants WHERE product_id = ?',
      [principal.id]
    );
    const codigos = new Set(yaTiene.map((v) => String(v.bind_code || '').trim().toUpperCase()).filter(Boolean));
    const medidas = new Set(yaTiene.map((v) => String(v.nominal_size || '').trim().toLowerCase()).filter(Boolean));

    for (const a of absorbidos) {
      const cod = String(a.bind_code || '').trim().toUpperCase();
      const med = String(a.nominal_size || '').trim().toLowerCase();
      const duplicado = (cod && codigos.has(cod)) || (!cod && med && medidas.has(med));

      if (duplicado) {
        console.log(`   = [${a.id}] "${a.nominal_size || '—'}" ya existe como tamaño, no se duplica`);
      } else {
        console.log(`   + [${a.id}] "${a.nominal_size || '—'}" · ${a.price} ${a.currency || 'MXN'} · BIND ${a.bind_code || '—'} → pasa a ser tamaño`);
        if (APLICAR) {
          await q(
            `INSERT INTO filter_category_variants
               (category_id, product_id, bind_code, product_code, nominal_size, real_size,
                price, currency, price_usd, stock, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
              principal.filter_category_id,
              principal.id,
              a.bind_code || null,
              a.product_code || a.sku || null,
              a.nominal_size || '',
              a.real_size || a.nominal_size || '',
              a.price || 0,
              a.currency || 'MXN',
              a.price_usd ?? null,
              a.stock || 0,
            ]
          );
        }
        if (cod) codigos.add(cod);
        if (med) medidas.add(med);
        totalTamanos++;
      }

      console.log(`   − [${a.id}] se desactiva (no se borra: hay pedidos que lo referencian)`);
      if (APLICAR) {
        await q("UPDATE products SET status = 'inactive', updated_at = NOW() WHERE id = ?", [a.id]);
      }
      totalDesactivados++;
    }
  }

  console.log('\n' + '='.repeat(66));
  console.log(APLICAR ? 'APLICADO' : 'SIMULACIÓN — no se escribió nada');
  console.log('='.repeat(66));
  console.log(`  grupos:                 ${grupos.length}`);
  console.log(`  tamaños ${APLICAR ? 'creados' : 'que se crearían'}: ${totalTamanos}`);
  console.log(`  productos ${APLICAR ? 'desactivados' : 'a desactivar'}: ${totalDesactivados}`);
  if (!APLICAR) console.log('\n  Para ejecutarlo: node scripts/unir-productos-por-medida.js --aplicar');
  console.log('  Para revertir: restaura el respaldo, o reactiva los productos y borra los tamaños creados.');

  await con.end();
};

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
