#!/usr/bin/env node
/**
 * Asigna un tamaño (fila de filter_category_variants) a un producto.
 *
 * Para los casos sueltos que los scripts automáticos no pueden decidir, como
 * un tamaño cuya categoría no la usa ningún producto.
 *
 * Uso:
 *   node scripts/assign-variant.js --variant 26 --product "Filtro HEPA H13"
 *   node scripts/assign-variant.js --variant 26 --product 111 --apply
 *
 * Sin --apply solo muestra lo que haría.
 *
 * Con --move-category además cambia la categoría del tamaño a la del producto,
 * para que ambos queden en la misma (recomendado si el tamaño quedó en una
 * categoría suelta que nadie usa).
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const args = process.argv.slice(2);
const valorDe = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};

const variantId = Number(valorDe('--variant'));
const productoArg = valorDe('--product');
const apply = args.includes('--apply');
const moverCategoria = args.includes('--move-category');

if (!variantId || !productoArg) {
  console.log('Uso: node scripts/assign-variant.js --variant <id> --product <id|nombre> [--move-category] [--apply]');
  process.exit(1);
}

const db = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'starfilters_db',
});

const [variantes] = await db.query(
  `SELECT v.id, v.bind_code, v.nominal_size, v.category_id, v.product_id,
          c.name AS categoria, p.name AS dueño_actual
   FROM filter_category_variants v
   LEFT JOIN filter_categories c ON c.id = v.category_id
   LEFT JOIN products p ON p.id = v.product_id
   WHERE v.id = ?`,
  [variantId]
);
if (variantes.length === 0) {
  console.log(`❌ No existe el tamaño #${variantId}`);
  await db.end();
  process.exit(1);
}
const variante = variantes[0];

// El producto puede venir por id o por nombre exacto
const esNumero = /^\d+$/.test(productoArg);
const [productos] = await db.query(
  `SELECT p.id, p.name, p.filter_category_id, c.name AS categoria
   FROM products p LEFT JOIN filter_categories c ON c.id = p.filter_category_id
   WHERE ${esNumero ? 'p.id = ?' : 'p.name = ?'}`,
  [esNumero ? Number(productoArg) : productoArg]
);
if (productos.length === 0) {
  console.log(`❌ No se encontró el producto "${productoArg}"`);
  await db.end();
  process.exit(1);
}
if (productos.length > 1) {
  console.log(`❌ Hay ${productos.length} productos con ese nombre. Usa el id:`);
  for (const p of productos) console.log(`   ${p.id} — ${p.name}`);
  await db.end();
  process.exit(1);
}
const producto = productos[0];

console.log(`Tamaño  #${variante.id}  ${variante.bind_code}  ${variante.nominal_size}`);
console.log(`   dueño:     ${variante.dueño_actual || '(sin dueño)'} → ${producto.name}`);
if (moverCategoria) {
  console.log(`   categoría: ${variante.categoria || variante.category_id} → ${producto.categoria || '(el producto no tiene categoría)'}`);
  if (!producto.filter_category_id) {
    console.log('\n❌ El producto no tiene categoría asignada; no se puede mover el tamaño.');
    await db.end();
    process.exit(1);
  }
} else if (variante.category_id !== producto.filter_category_id) {
  console.log(
    `   ⚠️  El tamaño está en la categoría "${variante.categoria}" y el producto en ` +
    `"${producto.categoria}". Agrega --move-category si quieres emparejarlas.`
  );
}

if (!apply) {
  console.log('\n(simulación) Agrega --apply para guardar.');
  await db.end();
  process.exit(0);
}

if (moverCategoria) {
  await db.execute(
    'UPDATE filter_category_variants SET product_id = ?, category_id = ? WHERE id = ?',
    [producto.id, producto.filter_category_id, variante.id]
  );
} else {
  await db.execute('UPDATE filter_category_variants SET product_id = ? WHERE id = ?', [
    producto.id,
    variante.id,
  ]);
}
console.log('\n✅ Guardado.');

await db.end();
