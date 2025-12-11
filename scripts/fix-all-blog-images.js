/**
 * Script para copiar todas las URLs de featured_image a featured_image_url
 * Ejecutar: node scripts/fix-all-blog-images.js
 */

import { query } from '../src/config/database.js';

async function fixAllBlogImages() {
  console.log('🔄 Migrando imágenes de blog\n');
  
  try {
    // Verificar que la columna featured_image_url existe
    const columns = await query('DESCRIBE blog_posts');
    const hasFeaturedImageUrl = columns.some((col) => col.Field === 'featured_image_url');
    
    if (!hasFeaturedImageUrl) {
      console.error('❌ La columna "featured_image_url" NO EXISTE');
      console.log('💡 Ejecuta primero: mysql -u starfilters_user -p starfilters_ecommerce_db < database/verify_featured_image_url.sql');
      process.exit(1);
    }
    
    console.log('✅ La columna "featured_image_url" existe\n');
    
    // Obtener todos los blogs con featured_image pero sin featured_image_url
    const blogs = await query(`
      SELECT id, uuid, title, featured_image, featured_image_url
      FROM blog_posts
      WHERE (featured_image IS NOT NULL AND featured_image != '')
         OR (featured_image_url IS NOT NULL AND featured_image_url != '')
    `);
    
    console.log(`📊 Encontrados ${blogs.length} blogs con imágenes\n`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const blog of blogs) {
      // Si ya tiene featured_image_url, saltar
      if (blog.featured_image_url && blog.featured_image_url.startsWith('http')) {
        console.log(`⏭️  ${blog.title}: Ya tiene URL de Cloudinary`);
        skipped++;
        continue;
      }
      
      // Si featured_image es una URL de Cloudinary, copiarla a featured_image_url
      if (blog.featured_image && blog.featured_image.startsWith('http')) {
        await query(
          'UPDATE blog_posts SET featured_image_url = ? WHERE id = ?',
          [blog.featured_image, blog.id]
        );
        console.log(`✅ ${blog.title}: URL copiada`);
        updated++;
      } else {
        console.log(`⚠️  ${blog.title}: No tiene URL válida`);
        skipped++;
      }
    }
    
    console.log('\n📈 Resumen:');
    console.log(`  - Actualizados: ${updated}`);
    console.log(`  - Omitidos: ${skipped}`);
    console.log(`  - Total: ${blogs.length}`);
    
    // Mostrar estado final
    console.log('\n📊 Estado final de las imágenes:');
    const final = await query(`
      SELECT uuid, title, 
             CASE 
               WHEN featured_image_url IS NOT NULL AND featured_image_url != '' THEN '✅ Tiene URL'
               ELSE '❌ Sin URL'
             END as estado
      FROM blog_posts
      ORDER BY created_at DESC
    `);
    console.table(final);
    
    console.log('\n✅ Proceso completado');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixAllBlogImages().catch(console.error);

