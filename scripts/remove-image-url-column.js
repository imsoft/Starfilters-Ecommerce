#!/usr/bin/env node

/**
 * Script para eliminar la columna image_url de la tabla products
 * Ejecutar: node scripts/remove-image-url-column.js
 * 
 * IMPORTANTE: Este script elimina permanentemente la columna image_url.
 * Solo ejecutar después de confirmar que el sistema de product_images funciona correctamente.
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

async function removeImageUrlColumn() {
  console.log('🚀 Iniciando eliminación de columna image_url...\n');

  let connection;
  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos\n');

    // 1. Verificar que todos los productos tienen imágenes en product_images
    console.log('📋 Verificando que todos los productos tienen imágenes...');
    const [productsWithoutImages] = await connection.execute(`
      SELECT p.id, p.name, p.image_url
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE pi.id IS NULL AND p.image_url IS NOT NULL AND p.image_url != ''
    `);

    if (productsWithoutImages.length > 0) {
      console.log('⚠️  ADVERTENCIA: Los siguientes productos tienen image_url pero NO tienen imágenes en product_images:');
      console.table(productsWithoutImages);
      console.log('\n❌ No se puede proceder. Primero migra estas imágenes a product_images.');
      return;
    }

    console.log('✅ Todos los productos tienen imágenes en product_images\n');

    // 2. Verificar que todos los productos tienen al menos una imagen principal
    console.log('📋 Verificando imágenes principales...');
    const [productsWithoutPrimary] = await connection.execute(`
      SELECT p.id, p.name
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      WHERE pi.id IS NULL
    `);

    if (productsWithoutPrimary.length > 0) {
      console.log('⚠️  ADVERTENCIA: Los siguientes productos NO tienen imagen principal:');
      console.table(productsWithoutPrimary);
      console.log('\n❌ No se puede proceder. Primero establece imágenes principales.');
      return;
    }

    console.log('✅ Todos los productos tienen imagen principal\n');

    // 3. Mostrar resumen antes de eliminar
    console.log('📊 Resumen de productos con imágenes:');
    const [summary] = await connection.execute(`
      SELECT 
        p.id,
        p.name,
        p.image_url as 'Imagen en products',
        pi.image_url as 'Imagen principal en product_images',
        pi.is_primary
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      ORDER BY p.id
    `);

    console.table(summary);

    // 4. Confirmar eliminación
    console.log('\n⚠️  ADVERTENCIA: Esta operación eliminará PERMANENTEMENTE la columna image_url de la tabla products.');
    console.log('   Asegúrate de que el sistema de product_images funciona correctamente antes de continuar.\n');

    // 5. Eliminar la columna
    console.log('🗑️  Eliminando columna image_url...');
    await connection.execute('ALTER TABLE products DROP COLUMN image_url');
    console.log('✅ Columna image_url eliminada exitosamente\n');

    // 6. Verificar eliminación
    console.log('📋 Verificando estructura de tabla products...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products'
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);

    console.log('📊 Nueva estructura de tabla products:');
    console.table(columns);

    console.log('\n🎉 ¡Eliminación completada exitosamente!');
    console.log('\n💡 Próximos pasos:');
    console.log('   1. Actualizar código para remover referencias a image_url');
    console.log('   2. Probar que todas las funcionalidades siguen funcionando');
    console.log('   3. Actualizar documentación');

  } catch (error) {
    console.error('❌ Error durante la eliminación:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar eliminación
removeImageUrlColumn()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
