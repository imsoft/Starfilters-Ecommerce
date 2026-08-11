#!/usr/bin/env node
/**
 * Cuelga una categoría de una familia (o la convierte en familia).
 *
 * La tienda muestra en la portada las categorías sin padre, y al entrar en una
 * lista los productos de ella y de sus subcategorías. Si un tipo de filtro no
 * cuelga de "Filtros de aire", sus productos no aparecen ahí.
 *
 * Uso:
 *   node scripts/set-category-parent.js --categoria "Prefiltros" --familia "Filtros de aire"
 *   node scripts/set-category-parent.js --categoria "Prefiltros" --familia "Filtros de aire" --apply
 *   node scripts/set-category-parent.js --categoria "UMA" --sin-familia --apply   (la vuelve familia)
 *
 * Acepta el nombre exacto o el id. Sin --apply solo muestra lo que haría.
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const args = process.argv.slice(2);
const valorDe = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};

const categoriaArg = valorDe('--categoria');
const familiaArg = valorDe('--familia');
const sinFamilia = args.includes('--sin-familia');
const apply = args.includes('--apply');

if (!categoriaArg || (!familiaArg && !sinFamilia)) {
  console.log(
    'Uso: node scripts/set-category-parent.js --categoria <id|nombre> (--familia <id|nombre> | --sin-familia) [--apply]'
  );
  process.exit(1);
}

const db = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'starfilters_db',
});

const buscar = async (valor) => {
  const esId = /^\d+$/.test(valor);
  const [filas] = await db.query(
    `SELECT id, parent_id, name FROM filter_categories WHERE ${esId ? 'id = ?' : 'name = ?'}`,
    [esId ? Number(valor) : valor]
  );
  return filas;
};

const categorias = await buscar(categoriaArg);
if (categorias.length !== 1) {
  console.log(
    categorias.length === 0
      ? `❌ No se encontró la categoría "${categoriaArg}"`
      : `❌ Hay ${categorias.length} categorías con ese nombre; usa el id`
  );
  for (const c of categorias) console.log(`   ${c.id} — ${c.name}`);
  await db.end();
  process.exit(1);
}
const categoria = categorias[0];

let familia = null;
if (!sinFamilia) {
  const encontradas = await buscar(familiaArg);
  if (encontradas.length !== 1) {
    console.log(
      encontradas.length === 0
        ? `❌ No se encontró la familia "${familiaArg}"`
        : `❌ Hay ${encontradas.length} categorías con ese nombre; usa el id`
    );
    for (const c of encontradas) console.log(`   ${c.id} — ${c.name}`);
    await db.end();
    process.exit(1);
  }
  familia = encontradas[0];

  if (familia.id === categoria.id) {
    console.log('❌ Una categoría no puede colgar de sí misma.');
    await db.end();
    process.exit(1);
  }
  if (familia.parent_id) {
    console.log(
      `❌ "${familia.name}" no es una familia: cuelga de otra categoría.\n` +
      '   La tienda solo maneja dos niveles (familia → tipo).'
    );
    await db.end();
    process.exit(1);
  }
  // Evitar dejar tipos colgando de un tipo
  const [nietas] = await db.query('SELECT id, name FROM filter_categories WHERE parent_id = ?', [categoria.id]);
  if (nietas.length > 0) {
    console.log(
      `❌ "${categoria.name}" ya tiene ${nietas.length} categoría(s) dentro, así que es una familia.\n` +
      `   Si la cuelgas de otra quedarían tres niveles: ${nietas.map((n) => n.name).join(', ')}`
    );
    await db.end();
    process.exit(1);
  }
}

const [padreActual] = categoria.parent_id
  ? await db.query('SELECT name FROM filter_categories WHERE id = ?', [categoria.parent_id])
  : [[]];

console.log(`Categoría: ${categoria.name} (id ${categoria.id})`);
console.log(`   ahora:  ${padreActual[0]?.name || 'es una familia (sin padre)'}`);
console.log(`   queda:  ${familia ? familia.name : 'familia (sin padre)'}`);

const [productos] = await db.query(
  'SELECT COUNT(*) AS n FROM products WHERE filter_category_id = ?',
  [categoria.id]
);
console.log(`   productos que se mueven con ella: ${productos[0].n}`);

if (!apply) {
  console.log('\n(simulación) Agrega --apply para guardar.');
  await db.end();
  process.exit(0);
}

await db.execute('UPDATE filter_categories SET parent_id = ? WHERE id = ?', [
  familia ? familia.id : null,
  categoria.id,
]);
console.log('\n✅ Guardado. Revisa el resultado con: node scripts/categorias-arbol.js');

await db.end();
