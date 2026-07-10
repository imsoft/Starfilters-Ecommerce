#!/usr/bin/env node

/**
 * Seed de un producto de prueba para validar el flujo de compra
 * (tienda → ficha → carrito → checkout) sin tocar productos reales.
 *
 * - Se cuelga del tipo de filtro "Pleat" (resuelto por slug, no por id,
 *   para que funcione igual en local y en el servidor).
 * - Sin bind_id: la validación de stock (/api/check-stock) cae al stock
 *   local de la tabla products, así que no toca BIND ERP.
 * - Idempotente: si ya existe (uuid fijo), solo RESETEA stock=25 y lo
 *   reactiva. Útil para restaurar stock después de compras de prueba.
 *
 * Uso:    node scripts/seed-test-product.js
 * Borrar: node scripts/seed-test-product.js --remove
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const UUID = 'producto-prueba-imsoft';
const STOCK = 25;

const main = async () => {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'starfilters_db',
  });

  try {
    if (process.argv.includes('--remove')) {
      const [prod] = await db.query('SELECT id FROM products WHERE uuid = ?', [UUID]);
      if (prod.length === 0) {
        console.log('ℹ️  El producto de prueba no existe, nada que borrar.');
        return;
      }
      await db.query('DELETE FROM product_images WHERE product_id = ?', [prod[0].id]);
      await db.query('DELETE FROM products WHERE id = ?', [prod[0].id]);
      console.log('🗑️  Producto de prueba eliminado.');
      return;
    }

    // Resolver la categoría "Pleat" por slug (id puede variar por entorno)
    const [cats] = await db.query(
      "SELECT id, name FROM filter_categories WHERE slug = 'pleat' AND status = 'active' LIMIT 1"
    );
    const filterCategoryId = cats.length > 0 ? cats[0].id : null;
    if (!filterCategoryId) {
      console.warn('⚠️  No se encontró la categoría "pleat"; el producto se creará sin categoría de filtro (no saldrá en los listados por categoría).');
    }

    const [existing] = await db.query('SELECT id, stock FROM products WHERE uuid = ?', [UUID]);

    if (existing.length > 0) {
      await db.query(
        "UPDATE products SET stock = ?, status = 'active', filter_category_id = ? WHERE uuid = ?",
        [STOCK, filterCategoryId, UUID]
      );
      console.log(`♻️  El producto de prueba ya existía (stock era ${existing[0].stock}); stock reseteado a ${STOCK} y reactivado.`);
      console.log(`   Ficha: /product/${UUID}`);
      return;
    }

    const [res] = await db.query(
      `INSERT INTO products
        (uuid, name, name_en, description, description_en, price, category, category_en,
         tags, dimensions, material, warranty, stock, status, product_type, filter_category_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'filter', ?)`,
      [
        UUID,
        'Producto de Prueba (TEST)',
        'Test Product (TEST)',
        'Producto de prueba para validar el flujo de compra. No es un producto real: úsalo para probar carrito, stock y checkout, y elimínalo con scripts/seed-test-product.js --remove cuando termines.',
        'Test product used to validate the purchase flow. Not a real product: use it to test cart, stock and checkout, and remove it with scripts/seed-test-product.js --remove when done.',
        50.0,
        'Filtros de aire',
        'Air Filters',
        'prueba,test',
        '24 x 24 x 2 in',
        'Marco de cartón, medio sintético (demo)',
        'N/A (producto de prueba)',
        STOCK,
        filterCategoryId,
      ]
    );

    await db.query(
      `INSERT INTO product_images (uuid, product_id, image_url, alt_text, sort_order, is_primary)
       VALUES (UUID(), ?, '/images/home-page/filtros-de-aire-star.jpg', 'Producto de Prueba (TEST)', 0, 1)`,
      [res.insertId]
    );

    console.log('✅ Producto de prueba creado:');
    console.log(`   Nombre:  Producto de Prueba (TEST) — $50.00 MXN — stock ${STOCK}`);
    console.log(`   Ficha:   /product/${UUID}`);
    console.log(`   Tienda:  /productos?category=pleat (y familia Filtros de aire)`);
    console.log('   Borrar:  node scripts/seed-test-product.js --remove');
  } finally {
    await db.end();
  }
};

main().catch((e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
