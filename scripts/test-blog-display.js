/**
 * Script para probar cómo se está leyendo la imagen del blog
 * Ejecutar: node scripts/test-blog-display.js <uuid>
 */

import { query } from './db-config.js';

async function testBlogDisplay(uuid) {
  console.log('🔍 Probando lectura de blog:', uuid, '\n');
  
  try {
    // Consultar el blog directamente
    const result = await query(`
      SELECT 
        uuid, 
        title,
        featured_image,
        featured_image_url,
        LENGTH(featured_image) as img_len,
        LENGTH(featured_image_url) as url_len
      FROM blog_posts 
      WHERE uuid = ?
    `, [uuid]);
    
    if (result.length === 0) {
      console.error('❌ No se encontró el blog');
      process.exit(1);
    }
    
    const blog = result[0];
    
    console.log('📊 Datos en la base de datos:');
    console.table([blog]);
    
    console.log('\n📸 URLs de imágenes:');
    console.log('featured_image:', blog.featured_image || '(vacío)');
    console.log('featured_image_url:', blog.featured_image_url || '(vacío)');
    
    // Simular el mapeo que hace el código
    const featuredImage = blog.featured_image_url || blog.featured_image || '';
    
    console.log('\n🔄 Después del mapeo (prioridad featured_image_url):');
    console.log('featured_image final:', featuredImage || '(vacío)');
    
    if (featuredImage) {
      console.log('\n✅ La imagen DEBERÍA mostrarse');
      console.log('URL:', featuredImage);
    } else {
      console.log('\n❌ NO hay imagen para mostrar');
      console.log('Se mostrará el placeholder');
    }
    
    // Verificar si la URL es válida
    if (featuredImage) {
      if (featuredImage.startsWith('http')) {
        console.log('✅ La URL es válida (comienza con http)');
      } else {
        console.log('⚠️ La URL NO es válida (no comienza con http)');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Obtener UUID de argumentos
const uuid = process.argv[2] || '26e0db26-ea85-4f67-86d3-c9e41b2f60d0';

testBlogDisplay(uuid).catch(console.error);

