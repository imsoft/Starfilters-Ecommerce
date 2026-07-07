#!/usr/bin/env node

/**
 * Seed: tipos de filtro (categoría 2 de Bind) bajo "Filtros de aire".
 *
 * El cliente definió la lista exacta que debe mostrar el dropdown
 * "Tipo de filtro" del webshop:
 *   Bolsa, Carbón Activado, Celda, Colector de Polvo, HEPA Alta Capacidad,
 *   HEPA Alta Temperatura, HEPA Sello Gel, HEPA Sello Neopreno, Metálico,
 *   Mini Pleat, Pleat, W (V-Bank)
 *
 * - Idempotente: si el slug ya existe, solo asegura parent y status.
 * - Las hijas de "Filtros de aire" que NO estén en la lista se marcan
 *   'inactive' (no se borran; los productos ligados conservan su relación
 *   y pueden re-vincularse desde el admin).
 * - El dropdown ordena por created_at DESC, así que se insertan con
 *   timestamps escalonados para respetar el orden de la lista.
 *
 * Uso: node scripts/seed-filter-type-categories.js
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const TYPES = [
  { name: 'Bolsa',                 name_en: 'Bag',                   slug: 'bolsa' },
  { name: 'Carbón Activado',       name_en: 'Activated Carbon',      slug: 'carbon-activado' },
  { name: 'Celda',                 name_en: 'Cell',                  slug: 'celda' },
  { name: 'Colector de Polvo',     name_en: 'Dust Collector',        slug: 'colector-de-polvo' },
  { name: 'HEPA Alta Capacidad',   name_en: 'High Capacity HEPA',    slug: 'hepa-alta-capacidad' },
  { name: 'HEPA Alta Temperatura', name_en: 'High Temperature HEPA', slug: 'hepa-alta-temperatura' },
  { name: 'HEPA Sello Gel',        name_en: 'Gel Seal HEPA',         slug: 'hepa-sello-gel' },
  { name: 'HEPA Sello Neopreno',   name_en: 'Neoprene Seal HEPA',    slug: 'hepa-sello-neopreno' },
  { name: 'Metálico',              name_en: 'Metallic',              slug: 'metalico' },
  { name: 'Mini Pleat',            name_en: 'Mini Pleat',            slug: 'mini-pleat' },
  { name: 'Pleat',                 name_en: 'Pleat',                 slug: 'pleat' },
  { name: 'W (V-Bank)',            name_en: 'W (V-Bank)',            slug: 'w-v-bank' },
];

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'starfilters_ecommerce_db',
  });

  console.log('🔗 Conectado a la base de datos.');

  const [parents] = await connection.execute(
    "SELECT id FROM filter_categories WHERE slug = 'filtros-de-aire' LIMIT 1"
  );
  if (parents.length === 0) {
    console.error('❌ No existe la familia "filtros-de-aire". Corre antes scripts/seed-webshop-categories.js');
    process.exit(1);
  }
  const parentId = parents[0].id;

  const wantedSlugs = TYPES.map((t) => t.slug);

  // Crear/actualizar los 12 tipos. El primero de la lista debe quedar con el
  // created_at más reciente (el dropdown ordena DESC).
  for (let i = 0; i < TYPES.length; i++) {
    const t = TYPES[i];
    const offsetSeconds = i; // Bolsa = NOW(), W (V-Bank) = NOW()-11s

    const [existing] = await connection.execute(
      'SELECT id FROM filter_categories WHERE slug = ? LIMIT 1',
      [t.slug]
    );

    if (existing.length > 0) {
      await connection.execute(
        `UPDATE filter_categories
         SET parent_id = ?, name = ?, name_en = ?, status = 'active',
             created_at = DATE_SUB(NOW(), INTERVAL ? SECOND)
         WHERE id = ?`,
        [parentId, t.name, t.name_en, offsetSeconds, existing[0].id]
      );
      console.log(`♻️  Actualizada: ${t.name} (${t.slug})`);
    } else {
      await connection.execute(
        `INSERT INTO filter_categories (parent_id, name, name_en, slug, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'active', DATE_SUB(NOW(), INTERVAL ? SECOND), NOW())`,
        [parentId, t.name, t.name_en, t.slug, offsetSeconds]
      );
      console.log(`✅ Creada: ${t.name} (${t.slug})`);
    }
  }

  // Migración de la categoría legada "Mini pleat sello gel downstream":
  // sus variantes son los productos reales de la tienda; se mueven a la nueva
  // "Mini Pleat" para que no desaparezcan del webshop al desactivarla.
  const [legacyRows] = await connection.execute(
    "SELECT * FROM filter_categories WHERE slug = 'mini-pleat-sello-gel-downstream' LIMIT 1"
  );
  if (legacyRows.length > 0) {
    const legacy = legacyRows[0];
    const [newRows] = await connection.execute(
      "SELECT * FROM filter_categories WHERE slug = 'mini-pleat' LIMIT 1"
    );
    if (newRows.length > 0 && newRows[0].id !== legacy.id) {
      const nuevo = newRows[0];
      const [vRes] = await connection.execute(
        'UPDATE filter_category_variants SET category_id = ? WHERE category_id = ?',
        [nuevo.id, legacy.id]
      );
      const [pRes] = await connection.execute(
        'UPDATE products SET filter_category_id = ? WHERE filter_category_id = ?',
        [nuevo.id, legacy.id]
      );
      // Conservar imagen y textos de la categoría legada si la nueva no tiene
      const copyFields = ['main_image', 'description', 'description_en', 'efficiency', 'efficiency_en', 'characteristics', 'characteristics_en', 'applications', 'applications_en', 'benefits', 'benefits_en', 'typical_installation', 'typical_installation_en'];
      for (const f of copyFields) {
        if (legacy[f] != null && nuevo[f] == null) {
          await connection.execute(
            `UPDATE filter_categories SET ${f} = ? WHERE id = ?`,
            [legacy[f], nuevo.id]
          );
        }
      }
      console.log(`🔀 Migradas ${vRes.affectedRows} variantes y ${pRes.affectedRows} productos de "${legacy.name}" → "Mini Pleat"`);
    }
  }

  // Desactivar hijas de Filtros de aire que no estén en la lista del cliente,
  // PERO solo si están vacías. Si una categoría legada todavía tiene productos
  // o variantes (p. ej. "hepa" con el Filtro HEPA H13 en producción),
  // desactivarla los ocultaría del webshop. En ese caso se conserva activa y
  // se avisa para migrarla a mano desde el admin.
  const [children] = await connection.execute(
    'SELECT id, name, slug FROM filter_categories WHERE parent_id = ?',
    [parentId]
  );
  const needsManualMigration = [];
  for (const child of children) {
    if (wantedSlugs.includes(child.slug)) continue;

    const [[{ nVar }]] = await connection.execute(
      'SELECT COUNT(*) AS nVar FROM filter_category_variants WHERE category_id = ?',
      [child.id]
    );
    const [[{ nProd }]] = await connection.execute(
      'SELECT COUNT(*) AS nProd FROM products WHERE filter_category_id = ?',
      [child.id]
    );

    if (nVar > 0 || nProd > 0) {
      needsManualMigration.push({ name: child.name, slug: child.slug, nVar, nProd });
      console.log(`⏭️  Conservada activa (tiene ${nVar} variantes y ${nProd} productos): ${child.name} (${child.slug})`);
    } else {
      await connection.execute(
        "UPDATE filter_categories SET status = 'inactive' WHERE id = ?",
        [child.id]
      );
      console.log(`🚫 Desactivada (vacía y fuera de la lista): ${child.name} (${child.slug})`);
    }
  }

  if (needsManualMigration.length > 0) {
    console.log('\n⚠️  Estas categorías legadas siguen ACTIVAS porque tienen productos.');
    console.log('    Migra sus productos a la nueva categoría desde el admin y luego desactívalas:');
    needsManualMigration.forEach((c) => console.log(`      · ${c.name} (${c.slug}): ${c.nVar} variantes, ${c.nProd} productos`));
  }

  const [finales] = await connection.execute(
    `SELECT name FROM filter_categories
     WHERE parent_id = ? AND (status = 'active' OR status IS NULL)
     ORDER BY created_at DESC`,
    [parentId]
  );
  console.log('\n📋 Dropdown "Tipo de filtro" quedará así:');
  finales.forEach((f, i) => console.log(`   ${i + 1}. ${f.name}`));

  await connection.end();
}

seed().catch((err) => {
  console.error('❌ Error en el seed:', err.message);
  process.exit(1);
});
