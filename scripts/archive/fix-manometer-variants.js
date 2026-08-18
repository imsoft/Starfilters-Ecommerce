#!/usr/bin/env node
/**
 * Asigna a mano los tamaños que assign-variants-to-products.js no pudo decidir.
 *
 * Contexto: los manómetros análogo y digital comparten categoría, así que sus
 * tamaños quedaron sin dueño. Además, el "mismo código BIND" llevó MSCA1 (que
 * es análogo) al producto digital, porque products.bind_code del digital tenía
 * guardado un código analógico de cuando ambos compartían la tabla.
 *
 * Regla: el prefijo del código BIND dice de quién es cada tamaño.
 *   MSCA* → Manómetro análogo
 *   MSD*  → Manómetro digital
 *
 * También reporta (sin tocar) los tamaños que siguen sin dueño, como
 * HEPA-24-24-H13, cuya categoría no la usa ningún producto.
 *
 * Uso:  node scripts/fix-manometer-variants.js [--apply]
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const apply = process.argv.includes('--apply');

// Reglas: a qué producto (por nombre exacto) pertenece cada prefijo de código
const REGLAS = [
  { prefijo: 'MSCA', producto: 'Manómetro análogo' },
  { prefijo: 'MSD', producto: 'Manómetro digital' },
];

const db = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'starfilters_db',
});

const [colProductId] = await db.query(
  `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'filter_category_variants'
     AND COLUMN_NAME = 'product_id'`
);
if (Number(colProductId[0].n) === 0) {
  console.log('❌ Falta la columna product_id. Corre primero assign-variants-to-products.js --apply');
  await db.end();
  process.exit(1);
}

// Resolver los productos de las reglas por nombre
const nombres = REGLAS.map((r) => r.producto);
const [productos] = await db.query(
  `SELECT id, name FROM products WHERE name IN (${nombres.map(() => '?').join(',')})`,
  nombres
);
const productoPorNombre = new Map(productos.map((p) => [p.name, p]));

const faltantes = nombres.filter((n) => !productoPorNombre.has(n));
if (faltantes.length > 0) {
  console.log(`❌ No se encontraron estos productos: ${faltantes.join(', ')}`);
  console.log('   Revisa que el nombre en el admin coincida exactamente y vuelve a correr.');
  await db.end();
  process.exit(1);
}

// Buscar los tamaños que caen bajo alguna regla
const cambios = [];
for (const regla of REGLAS) {
  const producto = productoPorNombre.get(regla.producto);
  const [filas] = await db.query(
    `SELECT v.id, v.bind_code, v.nominal_size, v.product_id, p.name AS dueño_actual
     FROM filter_category_variants v
     LEFT JOIN products p ON p.id = v.product_id
     WHERE v.bind_code LIKE ?`,
    [`${regla.prefijo}%`]
  );
  for (const f of filas) {
    // Excluir prefijos que se solapan (MSD no debe capturar MSCA y viceversa)
    const otraReglaMasEspecifica = REGLAS.some(
      (r) => r !== regla && r.prefijo.startsWith(regla.prefijo) && f.bind_code.startsWith(r.prefijo)
    );
    if (otraReglaMasEspecifica) continue;
    if (f.product_id === producto.id) continue; // ya está bien
    cambios.push({ fila: f, producto });
  }
}

console.log(`Tamaños que hay que reasignar: ${cambios.length}\n`);
for (const c of cambios) {
  const actual = c.fila.dueño_actual || '(sin dueño)';
  console.log(`#${c.fila.id} ${c.fila.bind_code}  ${c.fila.nominal_size}`);
  console.log(`   ${actual} → ${c.producto.name}`);
}

// Reportar lo que sigue sin dueño y no cubre ninguna regla
const [huerfanas] = await db.query(
  `SELECT v.id, v.bind_code, v.nominal_size, v.category_id, c.name AS categoria
   FROM filter_category_variants v
   LEFT JOIN filter_categories c ON c.id = v.category_id
   WHERE v.product_id IS NULL`
);
const sinRegla = huerfanas.filter(
  (h) => !REGLAS.some((r) => (h.bind_code || '').startsWith(r.prefijo))
);
if (sinRegla.length > 0) {
  console.log('\n⚠️  Siguen sin dueño (hay que resolverlos en el admin):');
  for (const h of sinRegla) {
    console.log(`   #${h.id} ${h.bind_code} ${h.nominal_size} — categoría: ${h.categoria || h.category_id}`);
    const [candidatos] = await db.query(
      'SELECT id, name FROM products WHERE filter_category_id = ?',
      [h.category_id]
    );
    console.log(
      candidatos.length > 0
        ? `      productos en esa categoría: ${candidatos.map((p) => p.name).join(', ')}`
        : '      ningún producto usa esa categoría: asígnasela a un producto desde el admin'
    );
  }
}

if (!apply) {
  console.log('\n(simulación) Corre con --apply para guardar los cambios.');
  await db.end();
  process.exit(0);
}

for (const c of cambios) {
  await db.execute('UPDATE filter_category_variants SET product_id = ? WHERE id = ?', [
    c.producto.id,
    c.fila.id,
  ]);
}
console.log(`\n✅ ${cambios.length} tamaño(s) reasignados.`);

// Verificación final
const [resultado] = await db.query(
  `SELECT p.name AS producto, v.bind_code, v.nominal_size
   FROM filter_category_variants v JOIN products p ON p.id = v.product_id
   WHERE v.bind_code LIKE 'MS%'
   ORDER BY p.name, v.bind_code`
);
console.log('\nEstado final de los manómetros:');
for (const r of resultado) {
  console.log(`   ${r.producto.padEnd(20)} ${r.bind_code.padEnd(8)} ${r.nominal_size}`);
}

console.log(
  '\nSiguiente paso: entra a cada manómetro en el admin y guárdalo, para que el\n' +
  'producto tome el código BIND correcto de su primera fila (hoy el digital\n' +
  'tiene guardado un código analógico).'
);

await db.end();
