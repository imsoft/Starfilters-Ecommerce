import { query } from './db-config.js';

async function testBlogDisplay() {
  console.log('🔍 Probando cómo se muestran las imágenes del blog\n');

  try {
    // Simular el query que hace getBlogPosts
    const sql = `
      SELECT bp.*, bp.featured_image_url, au.profile_image
      FROM blog_posts bp
      LEFT JOIN admin_users au ON bp.author_id = au.id
      WHERE bp.status = 'published'
      ORDER BY bp.created_at DESC
      LIMIT 5
    `;

    const posts = await query(sql, []);

    console.log('📊 Posts obtenidos:', posts.length);
    console.log('');

    posts.forEach((post, index) => {
      console.log(`\n📝 Post ${index + 1}: ${post.title}`);
      console.log('   UUID:', post.uuid);
      console.log('   featured_image (campo antiguo):', post.featured_image || '(vacío)');
      console.log('   featured_image_url (Cloudinary):', post.featured_image_url || '(vacío)');
      console.log('   profile_image (autor):', post.profile_image || '(vacío)');
      
      // Simular mapBlogPostFromDB
      const featuredImage = post.featured_image_url || post.featured_image || '';
      const authorImage = post.profile_image || null;
      
      console.log('\n   🎨 Después de mapBlogPostFromDB:');
      console.log('   featured_image (final):', featuredImage || '(vacío)');
      console.log('   author_image (final):', authorImage || '(vacío)');
      
      // Verificar si las URLs son válidas
      if (featuredImage && featuredImage.startsWith('http')) {
        console.log('   ✅ URL de imagen parece válida');
      } else if (featuredImage) {
        console.log('   ⚠️  URL de imagen NO parece válida');
      } else {
        console.log('   ❌ NO hay URL de imagen');
      }
    });

    console.log('\n\n✅ Diagnóstico completado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testBlogDisplay();
