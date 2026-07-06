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

  // Desactivar hijas de Filtros de aire que no estén en la lista del cliente
  const [children] = await connection.execute(
    'SELECT id, name, slug FROM filter_categories WHERE parent_id = ?',
    [parentId]
  );
  for (const child of children) {
    if (!wantedSlugs.includes(child.slug)) {
      await connection.execute(
        "UPDATE filter_categories SET status = 'inactive' WHERE id = ?",
        [child.id]
      );
      console.log(`🚫 Desactivada (no está en la lista): ${child.name} (${child.slug})`);
    }
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
