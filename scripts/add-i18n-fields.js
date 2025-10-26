import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

async function addI18nFields() {
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

    console.log('🔄 Agregando campos de traducción a las tablas...\n');

    // Agregar campos a productos
    console.log('📦 Modificando tabla products...');
    
    try {
      await connection.execute(`ALTER TABLE products ADD COLUMN name_en VARCHAR(255)`);
      console.log('✅ name_en agregado');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Campo name_en ya existe');
      } else {
        throw error;
      }
    }

    try {
      await connection.execute(`ALTER TABLE products ADD COLUMN description_en TEXT`);
      console.log('✅ description_en agregado');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Campo description_en ya existe');
      } else {
        throw error;
      }
    }

    try {
      await connection.execute(`ALTER TABLE products ADD COLUMN category_en VARCHAR(100)`);
      console.log('✅ category_en agregado\n');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Campo category_en ya existe\n');
      } else {
        throw error;
      }
    }

    // Agregar campos a blog_posts
    console.log('📝 Modificando tabla blog_posts...');
    
    try {
      await connection.execute(`ALTER TABLE blog_posts ADD COLUMN title_en VARCHAR(255)`);
      console.log('✅ title_en agregado');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Campo title_en ya existe');
      } else {
        throw error;
      }
    }

    try {
      await connection.execute(`ALTER TABLE blog_posts ADD COLUMN slug_en VARCHAR(255)`);
      console.log('✅ slug_en agregado');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Campo slug_en ya existe');
      } else {
        throw error;
      }
    }

    try {
      await connection.execute(`ALTER TABLE blog_posts ADD COLUMN content_en LONGTEXT`);
      console.log('✅ content_en agregado');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Campo content_en ya existe');
      } else {
        throw error;
      }
    }

    try {
      await connection.execute(`ALTER TABLE blog_posts ADD COLUMN excerpt_en TEXT`);
      console.log('✅ excerpt_en agregado');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Campo excerpt_en ya existe');
      } else {
        throw error;
      }
    }

    try {
      await connection.execute(`ALTER TABLE blog_posts ADD COLUMN meta_title_en VARCHAR(255)`);
      console.log('✅ meta_title_en agregado');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Campo meta_title_en ya existe');
      } else {
        throw error;
      }
    }

    try {
      await connection.execute(`ALTER TABLE blog_posts ADD COLUMN meta_description_en TEXT`);
      console.log('✅ meta_description_en agregado\n');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Campo meta_description_en ya existe\n');
      } else {
        throw error;
      }
    }

    // Crear índices adicionales
    console.log('🔍 Creando índices...');
    try {
      await connection.execute(`CREATE INDEX idx_products_category_en ON products(category_en)`);
      console.log('✅ Índice en category_en creado');
    } catch (error) {
      console.log('ℹ️  Índice category_en ya existe');
    }

    try {
      await connection.execute(`CREATE INDEX idx_blog_posts_slug_en ON blog_posts(slug_en)`);
      console.log('✅ Índice en slug_en creado\n');
    } catch (error) {
      console.log('ℹ️  Índice slug_en ya existe\n');
    }

    await connection.end();

    console.log('✨ ¡Campos de traducción agregados exitosamente!\n');
    console.log('📋 Campos agregados:');
    console.log('  Products: name_en, description_en, category_en');
    console.log('  Blog Posts: title_en, slug_en, content_en, excerpt_en, meta_title_en, meta_description_en\n');

  } catch (error) {
    console.error('❌ Error agregando campos de traducción:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addI18nFields();
