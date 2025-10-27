#!/usr/bin/env node

/**
 * Script para migrar imágenes de productos de la tabla products a product_images
 * Ejecutar: node scripts/migrate-product-images.js
 */

import mysql from 'mysql2/promise';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'starfilters_db',
  port: parseInt(process.env.DB_PORT || '3306')
};

// Función para generar UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function migrateProductImages() {
  console.log('🚀 Iniciando migración de imágenes de productos...\n');

  let connection;
  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos\n');

    // 1. Obtener todos los productos con imagen_url
    console.log('📋 Obteniendo productos con imágenes...');
    const [products] = await connection.execute(`
      SELECT id, name, image_url 
      FROM products 
      WHERE image_url IS NOT NULL AND image_url != ''
    `);

    console.log(`✅ Encontrados ${products.length} productos con imágenes\n`);

    // 2. Migrar cada imagen a product_images
    for (const product of products) {
      console.log(`🔄 Migrando: ${product.name}`);
      
      // Verificar si ya existe una imagen principal para este producto
      const [existingImages] = await connection.execute(`
        SELECT id FROM product_images 
        WHERE product_id = ? AND is_primary = 1
      `, [product.id]);

      if (existingImages.length > 0) {
        console.log(`  ⚠️  Ya existe imagen principal para ${product.name}, saltando...`);
        continue;
      }

      // Insertar imagen principal
      const uuid = generateUUID();
      await connection.execute(`
        INSERT INTO product_images (uuid, product_id, image_url, alt_text, sort_order, is_primary)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        uuid,
        product.id,
        product.image_url,
        `${product.name} - Imagen principal`,
        0,
        1
      ]);

      console.log(`  ✅ Migrada imagen principal para ${product.name}`);
    }

    // 3. Verificar migración
    console.log('\n📊 Verificando migración...');
    const [migratedCount] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM product_images 
      WHERE is_primary = 1
    `);

    console.log(`✅ ${migratedCount[0].count} imágenes migradas exitosamente\n`);

    // 4. Mostrar resumen
    console.log('📋 Resumen de la migración:');
    const [summary] = await connection.execute(`
      SELECT 
        p.name,
        p.image_url as 'Imagen en products',
        pi.image_url as 'Imagen en product_images',
        pi.is_primary
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      WHERE p.image_url IS NOT NULL AND p.image_url != ''
      ORDER BY p.id
    `);

    console.table(summary);

    console.log('\n🎉 ¡Migración completada exitosamente!');
    console.log('\n💡 Próximos pasos:');
    console.log('   1. Verificar que todas las imágenes se muestran correctamente');
    console.log('   2. Probar el componente ProductImageManager');
    console.log('   3. Opcional: Eliminar columna image_url de products');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar migración
migrateProductImages()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
