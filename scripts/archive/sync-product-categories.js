/**
 * Sincroniza products.category y products.category_en con el nombre (español e
 * inglés) de la categoría de filtro asignada a cada producto.
 *
 * Por qué: el formulario del admin solo guardaba el nombre en español, así que
 * en /en el carrito y las fichas mostraban "Filtros de Aire" en medio del sitio
 * en inglés. A partir de ahora el admin guarda los dos, pero los productos ya
 * cargados necesitan esta pasada.
 *
 * Uso:  node scripts/sync-product-categories.js [--apply]
 * Sin --apply solo muestra lo que cambiaría.
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const apply = process.argv.includes('--apply');

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'starfilters_db',
});

const [rows] = await connection.execute(`
  SELECT p.id, p.name, p.category, p.category_en, fc.name AS fc_name, fc.name_en AS fc_name_en
  FROM products p
  JOIN filter_categories fc ON fc.id = p.filter_category_id
`);

const pending = rows.filter(
  (r) => (r.fc_name && r.category !== r.fc_name) || (r.fc_name_en && r.category_en !== r.fc_name_en)
);

console.log(`Productos con categoría asignada: ${rows.length}`);
console.log(`Necesitan actualizarse: ${pending.length}\n`);

for (const r of pending) {
  console.log(`#${r.id} ${r.name}`);
  console.log(`   es: ${r.category || '(vacío)'} → ${r.fc_name}`);
  console.log(`   en: ${r.category_en || '(vacío)'} → ${r.fc_name_en || '(la categoría no tiene nombre en inglés)'}`);
}

const sinIngles = rows.filter((r) => !r.fc_name_en);
if (sinIngles.length > 0) {
  console.log(
    `\n⚠️  ${sinIngles.length} producto(s) pertenecen a categorías sin nombre en inglés.` +
    `\n   Captura el campo "Nombre (inglés)" en Admin → Categorías Filtros y vuelve a correr esto.`
  );
}

if (!apply) {
  console.log('\n(simulación) Corre con --apply para guardar los cambios.');
} else if (pending.length > 0) {
  for (const r of pending) {
    await connection.execute('UPDATE products SET category = ?, category_en = ? WHERE id = ?', [
      r.fc_name,
      r.fc_name_en || null,
      r.id,
    ]);
  }
  console.log(`\n✅ ${pending.length} producto(s) actualizados.`);
}

await connection.end();
