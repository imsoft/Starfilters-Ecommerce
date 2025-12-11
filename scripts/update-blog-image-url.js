/**
 * Script para actualizar manualmente la URL de Cloudinary en un blog post
 * Ejecutar: node scripts/update-blog-image-url.js <uuid> <cloudinary-url>
 * Ejemplo: node scripts/update-blog-image-url.js 26e0db26-ea85-4f67-86d3-c9e41b2f60d0 "https://res.cloudinary.com/..."
 */

import { query } from '../src/config/database.js';

async function updateBlogImageUrl(uuid, imageUrl) {
  console.log('🔄 Actualizando imagen de blog\n');
  console.log('UUID:', uuid);
  console.log('URL:', imageUrl);
  console.log('');
  
  try {
    // Verificar que el blog existe
    const blog = await query('SELECT id, uuid, title FROM blog_posts WHERE uuid = ?', [uuid]);
    
    if (blog.length === 0) {
      console.error('❌ No se encontró el blog con UUID:', uuid);
      process.exit(1);
    }
    
    console.log('✅ Blog encontrado:', blog[0].title);
    console.log('');
    
    // Verificar si la columna featured_image_url existe
    const columns = await query('DESCRIBE blog_posts');
    const hasFeaturedImageUrl = columns.some((col) => col.Field === 'featured_image_url');
    
    if (!hasFeaturedImageUrl) {
      console.error('❌ La columna "featured_image_url" NO EXISTE');
      console.log('💡 Ejecuta primero: mysql -u starfilters_user -p starfilters_ecommerce_db < database/verify_featured_image_url.sql');
      process.exit(1);
    }
    
    // Actualizar la URL
    const result = await query(
      'UPDATE blog_posts SET featured_image_url = ? WHERE uuid = ?',
      [imageUrl, uuid]
    );
    
    if (result.affectedRows > 0) {
      console.log('✅ URL de imagen actualizada exitosamente');
      
      // Verificar la actualización
      const updated = await query(
        'SELECT uuid, title, featured_image, featured_image_url FROM blog_posts WHERE uuid = ?',
        [uuid]
      );
      
      console.log('\n📊 Datos actualizados:');
      console.table(updated);
      
      console.log('\n✅ Proceso completado');
      console.log('💡 Ahora puedes ver la imagen en:');
      console.log(`   - Editor: https://srv1171123.hstgr.cloud/admin/blog/edit/${uuid}`);
      console.log(`   - Blog: https://srv1171123.hstgr.cloud/blog/${uuid}`);
    } else {
      console.error('❌ No se pudo actualizar el registro');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.log('\n💡 La columna featured_image_url no existe. Ejecuta:');
      console.log('   mysql -u starfilters_user -p starfilters_ecommerce_db < database/verify_featured_image_url.sql');
    }
    process.exit(1);
  }
}

// Obtener argumentos de línea de comandos
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('❌ Uso: node scripts/update-blog-image-url.js <uuid> <cloudinary-url>');
  console.log('\nEjemplo:');
  console.log('  node scripts/update-blog-image-url.js 26e0db26-ea85-4f67-86d3-c9e41b2f60d0 "https://res.cloudinary.com/dbfyxzmxk/image/upload/v1765486019/starfilters-ecommerce/blog/26e0db26-ea85-4f67-86d3-c9e41b2f60d0/featured_1765486018257.jpg"');
  process.exit(1);
}

const [uuid, imageUrl] = args;

updateBlogImageUrl(uuid, imageUrl).catch(console.error);

