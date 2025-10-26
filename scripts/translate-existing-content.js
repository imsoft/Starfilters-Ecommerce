import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

async function translateExistingContent() {
  let connection;
  
  try {
    console.log('🔗 Conectando a la base de datos...');
    
    connection = await createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Conexión exitosa\n');

    console.log('🌍 Traduciendo contenido existente...\n');

    // Traducir productos
    console.log('📦 Traduciendo productos...');
    const productTranslations = [
      {
        name: 'Filtro de Aire Premium',
        name_en: 'Premium Air Filter',
        description: 'Filtro de aire de alta calidad para mejor rendimiento del motor',
        description_en: 'High quality air filter for better engine performance',
        category: 'Filtros de Aire',
        category_en: 'Air Filters'
      },
      {
        name: 'Filtro de Aceite Standard',
        name_en: 'Standard Oil Filter',
        description: 'Filtro de aceite estándar para mantenimiento regular',
        description_en: 'Standard oil filter for regular maintenance',
        category: 'Filtros de Aceite',
        category_en: 'Oil Filters'
      },
      {
        name: 'Filtro de Combustible',
        name_en: 'Fuel Filter',
        description: 'Filtro de combustible para protección del sistema de inyección',
        description_en: 'Fuel filter for injection system protection',
        category: 'Filtros de Combustible',
        category_en: 'Fuel Filters'
      }
    ];

    for (const translation of productTranslations) {
      const [result] = await connection.execute(
        `UPDATE products 
         SET name_en = ?, description_en = ?, category_en = ?
         WHERE name = ?`,
        [translation.name_en, translation.description_en, translation.category_en, translation.name]
      );
      console.log(`  ✅ Traducido: ${translation.name} → ${translation.name_en}`);
    }
    console.log('');

    // Traducir blog posts
    console.log('📝 Traduciendo artículos del blog...');
    const blogTranslations = [
      {
        title: 'Guía Completa de Mantenimiento de Filtros',
        title_en: 'Complete Filter Maintenance Guide',
        slug: 'guia-mantenimiento-filtros',
        slug_en: 'filter-maintenance-guide',
        excerpt: 'Aprende todo sobre el mantenimiento correcto de los filtros de tu vehículo',
        excerpt_en: 'Learn everything about proper maintenance of your vehicle filters',
        content: '<h1>Guía Completa de Mantenimiento de Filtros</h1><p>Los filtros son componentes esenciales...</p>',
        content_en: '<h1>Complete Filter Maintenance Guide</h1><p>Filters are essential components...</p>',
        meta_title: 'Guía de Mantenimiento de Filtros',
        meta_title_en: 'Filter Maintenance Guide',
        meta_description: 'Guía completa para el mantenimiento de filtros automotrices',
        meta_description_en: 'Complete guide for automotive filter maintenance'
      },
      {
        title: 'Tipos de Filtros y Sus Funciones',
        title_en: 'Types of Filters and Their Functions',
        slug: 'tipos-filtros-funciones',
        slug_en: 'filter-types-and-functions',
        excerpt: 'Conoce los diferentes tipos de filtros y sus funciones específicas',
        excerpt_en: 'Learn about different types of filters and their specific functions',
        content: '<h1>Tipos de Filtros y Sus Funciones</h1><p>Existen diferentes tipos de filtros...</p>',
        content_en: '<h1>Types of Filters and Their Functions</h1><p>There are different types of filters...</p>',
        meta_title: 'Tipos de Filtros Automotrices',
        meta_title_en: 'Automotive Filter Types',
        meta_description: 'Información sobre los diferentes tipos de filtros automotrices',
        meta_description_en: 'Information about different types of automotive filters'
      }
    ];

    for (const translation of blogTranslations) {
      const [result] = await connection.execute(
        `UPDATE blog_posts 
         SET title_en = ?, slug_en = ?, excerpt_en = ?, content_en = ?, 
             meta_title_en = ?, meta_description_en = ?
         WHERE title = ?`,
        [
          translation.title_en,
          translation.slug_en,
          translation.excerpt_en,
          translation.content_en,
          translation.meta_title_en,
          translation.meta_description_en,
          translation.title
        ]
      );
      console.log(`  ✅ Traducido: ${translation.title} → ${translation.title_en}`);
    }
    console.log('');

    // Actualizar categorías existentes
    console.log('📂 Traduciendo categorías...');
    const categoryTranslations = [
      { name: 'Filtros de Aire', name_en: 'Air Filters' },
      { name: 'Filtros de Aceite', name_en: 'Oil Filters' },
      { name: 'Filtros de Combustible', name_en: 'Fuel Filters' },
      { name: 'Filtros de Cabina', name_en: 'Cabin Filters' },
      { name: 'Cuartos Limpios', name_en: 'Cleanrooms' },
      { name: 'Accesorios', name_en: 'Accessories' },
      { name: 'Servicios', name_en: 'Services' }
    ];

    for (const translation of categoryTranslations) {
      await connection.execute(
        `UPDATE products SET category_en = ? WHERE category = ?`,
        [translation.name_en, translation.name]
      );
    }
    console.log('✅ Categorías traducidas\n');

    await connection.end();

    console.log('✨ ¡Contenido traducido exitosamente!\n');
    console.log('📊 Resumen:');
    console.log('  - Productos traducidos: ' + productTranslations.length);
    console.log('  - Artículos de blog traducidos: ' + blogTranslations.length);
    console.log('  - Categorías traducidas: ' + categoryTranslations.length);

  } catch (error) {
    console.error('❌ Error traduciendo contenido:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

translateExistingContent();
