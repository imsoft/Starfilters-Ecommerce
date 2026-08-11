#!/usr/bin/env node
/**
 * Muestra el árbol de categorías tal como lo ve la tienda, con cuántos
 * productos cuelga cada una.
 *
 * Sirve para entender por qué una familia enseña menos productos de los
 * esperados: /productos?category=<familia> lista los productos de la familia
 * MÁS los de sus subcategorías, así que un tipo sin padre (o colgado de otra
 * familia) no aparece donde se le busca.
 *
 * Uso:  node scripts/categorias-arbol.js
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const db = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'starfilters_db',
});

const [categorias] = await db.query(
  `SELECT c.id, c.parent_id, c.name, c.name_en, c.slug, c.status,
          (SELECT COUNT(*) FROM products p WHERE p.filter_category_id = c.id) AS productos
   FROM filter_categories c
   ORDER BY c.parent_id IS NOT NULL, c.name`
);

const familias = categorias.filter((c) => !c.parent_id);
const hijas = categorias.filter((c) => c.parent_id);

const etiqueta = (c) => {
  const en = c.name_en ? '' : '  ⚠️ sin nombre en inglés';
  const estado = c.status && c.status !== 'active' ? `  [${c.status}]` : '';
  return `${c.name} (id ${c.id}, /${c.slug || 'sin-slug'}) — ${c.productos} producto(s)${estado}${en}`;
};

console.log('FAMILIAS (lo que se ve en la portada de /productos)\n');
for (const familia of familias) {
  const suyas = hijas.filter((h) => h.parent_id === familia.id);
  const total = familia.productos + suyas.reduce((n, h) => n + h.productos, 0);
  console.log(`■ ${etiqueta(familia)}`);
  console.log(`   al entrar se ven ${total} producto(s) en total`);
  if (suyas.length === 0) {
    console.log('   (sin tipos dentro)');
  }
  for (const hija of suyas) {
    console.log(`   └─ ${etiqueta(hija)}`);
  }
  console.log('');
}

const huerfanas = hijas.filter((h) => !categorias.some((c) => c.id === h.parent_id));
if (huerfanas.length > 0) {
  console.log('⚠️  Tipos cuyo padre ya no existe:');
  for (const h of huerfanas) console.log(`   ${etiqueta(h)}  (parent_id ${h.parent_id})`);
  console.log('');
}

const [sinCategoria] = await db.query(
  'SELECT id, name FROM products WHERE filter_category_id IS NULL'
);
if (sinCategoria.length > 0) {
  console.log('⚠️  Productos sin categoría asignada (no salen en ninguna familia):');
  for (const p of sinCategoria) console.log(`   #${p.id} ${p.name}`);
  console.log('');
}

console.log(
  'Para mover un tipo a otra familia:\n' +
  '  node scripts/set-category-parent.js --categoria "Prefiltros" --familia "Filtros de aire"\n' +
  '  (agrega --apply para guardar)'
);

await db.end();
