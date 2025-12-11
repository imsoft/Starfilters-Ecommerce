/**
 * Script para verificar las imágenes de blog en la base de datos
 * Ejecutar: node scripts/check-blog-images.js
 */

import { query } from '../src/config/database.js';

async function checkBlogImages() {
  console.log('🔍 Verificando imágenes de blog en la base de datos\n');
  
  try {
    // Verificar estructura de la tabla
    console.log('📋 Estructura de la tabla blog_posts:');
    const columns = await query('DESCRIBE blog_posts');
    console.table(columns);
    
    // Verificar si existe la columna featured_image_url
    const hasFeaturedImageUrl = columns.some((col) => col.Field === 'featured_image_url');
    
    if (!hasFeaturedImageUrl) {
      console.error('❌ La columna "featured_image_url" NO EXISTE en la tabla blog_posts');
      console.log('\n💡 Para agregar la columna, ejecuta:');
      console.log('   mysql -u starfilters_user -p starfilters_ecommerce_db < database/verify_featured_image_url.sql');
      process.exit(1);
    } else {
      console.log('✅ La columna "featured_image_url" existe\n');
    }
    
    // Verificar datos actuales
    console.log('📊 Datos de imágenes en blog_posts:');
    const posts = await query(`
      SELECT id, uuid, title, 
             featured_image, 
             featured_image_url,
             LENGTH(featured_image) as img_length,
             LENGTH(featured_image_url) as url_length
      FROM blog_posts 
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.table(posts);
    
    // Estadísticas
    const stats = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN featured_image IS NOT NULL AND featured_image != '' THEN 1 ELSE 0 END) as with_featured_image,
        SUM(CASE WHEN featured_image_url IS NOT NULL AND featured_image_url != '' THEN 1 ELSE 0 END) as with_featured_image_url
      FROM blog_posts
    `);
    
    console.log('\n📈 Estadísticas:');
    console.table(stats);
    
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkBlogImages().catch(console.error);

