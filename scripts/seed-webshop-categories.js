#!/usr/bin/env node

/**
 * Seed de categorías del webshop.
 *
 * Inserta las 6 familias de producto que el cliente pidió como botones
 * superiores en /productos: Filtros de aire, Gabinetes, Accesorios cuarto
 * limpio, UMA, Air Shower y Cabina de flujo laminar.
 *
 * El webshop genera los botones desde la tabla `filter_categories` ordenados
 * por `created_at DESC`, así que se insertan con timestamps decrecientes para
 * que aparezcan en el mismo orden en que el cliente los listó.
 *
 * Es idempotente: si un slug ya existe, lo omite. No modifica categorías
 * existentes (como "Mini pleat sello gel downstream", que tiene producto real).
 *
 * Uso: node scripts/seed-webshop-categories.js
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// Orden en el que el cliente quiere ver los botones (izquierda a derecha).
const CATEGORIES = [
  { name: 'Filtros de aire',          name_en: 'Air Filters',             slug: 'filtros-de-aire' },
  { name: 'Gabinetes',                name_en: 'Cabinets',                slug: 'gabinetes' },
  { name: 'Accesorios cuarto limpio', name_en: 'Cleanroom Accessories',   slug: 'accesorios-cuarto-limpio' },
  { name: 'UMA',                      name_en: 'Air Handling Units (AHU)', slug: 'uma' },
  { name: 'Air Shower',               name_en: 'Air Shower',              slug: 'air-shower' },
  { name: 'Cabina de flujo laminar',  name_en: 'Laminar Flow Cabinet',    slug: 'cabina-de-flujo-laminar' },
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

  // Slugs ya existentes para no duplicar.
  const [rows] = await connection.execute('SELECT slug FROM filter_categories');
  const existing = new Set(rows.map((r) => r.slug));

  let inserted = 0;
  let skipped = 0;

  // Insertar en orden inverso para que el primero de la lista quede con el
  // created_at más reciente (y por tanto aparezca primero con ORDER BY DESC).
  for (let i = CATEGORIES.length - 1; i >= 0; i--) {
    const cat = CATEGORIES[i];

    if (existing.has(cat.slug)) {
      console.log(`⏭️  Omitida (ya existe): ${cat.name}`);
      skipped++;
      continue;
    }

    // created_at decreciente según la posición en la lista del cliente.
    const offsetSeconds = i;
    await connection.execute(
      `INSERT INTO filter_categories (name, name_en, slug, status, created_at, updated_at)
       VALUES (?, ?, ?, 'active', NOW() - INTERVAL ? SECOND, NOW())`,
      [cat.name, cat.name_en, cat.slug, offsetSeconds]
    );

    console.log(`✅ Creada: ${cat.name} (${cat.slug})`);
    inserted++;
  }

  console.log(`\n📊 Resumen: ${inserted} creadas, ${skipped} omitidas.`);
  await connection.end();
}

seed().catch((err) => {
  console.error('❌ Error en el seed:', err);
  process.exit(1);
});
