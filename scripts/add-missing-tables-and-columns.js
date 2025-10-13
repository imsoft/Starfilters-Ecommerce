import { createConnection } from 'mysql2/promise';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

async function addMissingTablesAndColumns() {
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

    console.log('✅ Conexión exitosa');

    // 1. Agregar columnas faltantes a blog_posts
    console.log('📝 Agregando columnas faltantes a blog_posts...');
    
    try {
      await connection.execute(`
        ALTER TABLE blog_posts 
        ADD COLUMN category varchar(100) DEFAULT 'General' AFTER author
      `);
      console.log('✅ Columna category agregada a blog_posts');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Columna category ya existe en blog_posts');
      } else {
        throw error;
      }
    }

    try {
      await connection.execute(`
        ALTER TABLE blog_posts 
        ADD COLUMN publish_date timestamp NULL AFTER status
      `);
      console.log('✅ Columna publish_date agregada a blog_posts');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Columna publish_date ya existe en blog_posts');
      } else {
        throw error;
      }
    }

    // 2. Agregar columna faltante a order_items
    console.log('📝 Agregando columna faltante a order_items...');
    
    try {
      await connection.execute(`
        ALTER TABLE order_items 
        ADD COLUMN image_url varchar(500) AFTER product_name
      `);
      console.log('✅ Columna image_url agregada a order_items');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Columna image_url ya existe en order_items');
      } else {
        throw error;
      }
    }

    // 3. Crear tabla categories
    console.log('📝 Creando tabla categories...');
    
    try {
      await connection.execute(`
        CREATE TABLE categories (
          id int NOT NULL AUTO_INCREMENT,
          uuid varchar(36) NOT NULL,
          name varchar(100) NOT NULL,
          slug varchar(100) NOT NULL,
          description text,
          parent_id int DEFAULT NULL,
          status enum('active','inactive') DEFAULT 'active',
          created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uuid (uuid),
          UNIQUE KEY slug (slug),
          KEY idx_categories_parent_id (parent_id),
          KEY idx_categories_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);
      console.log('✅ Tabla categories creada');

      // Insertar categorías básicas
      const categories = [
        { name: 'Filtros de Aire', slug: 'filtros-aire', description: 'Filtros para el sistema de admisión de aire' },
        { name: 'Filtros de Aceite', slug: 'filtros-aceite', description: 'Filtros para el sistema de lubricación' },
        { name: 'Filtros de Combustible', slug: 'filtros-combustible', description: 'Filtros para el sistema de combustible' },
        { name: 'Filtros de Cabina', slug: 'filtros-cabina', description: 'Filtros para el aire acondicionado y cabina' },
        { name: 'Cuartos Limpios', slug: 'cuartos-limpios', description: 'Sistemas y equipos para cuartos limpios' },
        { name: 'Accesorios', slug: 'accesorios', description: 'Accesorios y repuestos' },
        { name: 'Servicios', slug: 'servicios', description: 'Servicios de mantenimiento e instalación' }
      ];

      for (const category of categories) {
        const uuid = randomUUID();
        await connection.execute(`
          INSERT INTO categories (uuid, name, slug, description) 
          VALUES (?, ?, ?, ?)
        `, [uuid, category.name, category.slug, category.description]);
      }
      console.log('✅ Categorías básicas insertadas');
      
    } catch (error) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('ℹ️  Tabla categories ya existe');
      } else {
        throw error;
      }
    }

    // 4. Crear tabla product_images
    console.log('📝 Creando tabla product_images...');
    
    try {
      await connection.execute(`
        CREATE TABLE product_images (
          id int NOT NULL AUTO_INCREMENT,
          uuid varchar(36) NOT NULL,
          product_id int NOT NULL,
          image_url varchar(500) NOT NULL,
          alt_text varchar(255),
          sort_order int DEFAULT 0,
          is_primary tinyint(1) DEFAULT 0,
          created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uuid (uuid),
          KEY idx_product_images_product_id (product_id),
          CONSTRAINT product_images_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);
      console.log('✅ Tabla product_images creada');
      
    } catch (error) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('ℹ️  Tabla product_images ya existe');
      } else {
        throw error;
      }
    }

    // 5. Crear tabla product_reviews
    console.log('📝 Creando tabla product_reviews...');
    
    try {
      await connection.execute(`
        CREATE TABLE product_reviews (
          id int NOT NULL AUTO_INCREMENT,
          uuid varchar(36) NOT NULL,
          product_id int NOT NULL,
          user_id int NOT NULL,
          rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
          title varchar(255),
          comment text,
          status enum('pending','approved','rejected') DEFAULT 'pending',
          created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uuid (uuid),
          KEY idx_reviews_product_id (product_id),
          KEY idx_reviews_user_id (user_id),
          CONSTRAINT product_reviews_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
          CONSTRAINT product_reviews_ibfk_2 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);
      console.log('✅ Tabla product_reviews creada');
      
    } catch (error) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('ℹ️  Tabla product_reviews ya existe');
      } else {
        throw error;
      }
    }

    // 6. Crear tabla wishlist
    console.log('📝 Creando tabla wishlist...');
    
    try {
      await connection.execute(`
        CREATE TABLE wishlist (
          id int NOT NULL AUTO_INCREMENT,
          uuid varchar(36) NOT NULL,
          user_id int NOT NULL,
          product_id int NOT NULL,
          created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uuid (uuid),
          UNIQUE KEY user_product (user_id, product_id),
          KEY idx_wishlist_user_id (user_id),
          KEY idx_wishlist_product_id (product_id),
          CONSTRAINT wishlist_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          CONSTRAINT wishlist_ibfk_2 FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);
      console.log('✅ Tabla wishlist creada');
      
    } catch (error) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('ℹ️  Tabla wishlist ya existe');
      } else {
        throw error;
      }
    }

    // 7. Crear tabla cart (para carritos persistentes)
    console.log('📝 Creando tabla cart...');
    
    try {
      await connection.execute(`
        CREATE TABLE cart (
          id int NOT NULL AUTO_INCREMENT,
          uuid varchar(36) NOT NULL,
          user_id int DEFAULT NULL,
          session_id varchar(255),
          product_id int NOT NULL,
          quantity int NOT NULL DEFAULT 1,
          created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uuid (uuid),
          KEY idx_cart_user_id (user_id),
          KEY idx_cart_session_id (session_id),
          KEY idx_cart_product_id (product_id),
          CONSTRAINT cart_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          CONSTRAINT cart_ibfk_2 FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);
      console.log('✅ Tabla cart creada');
      
    } catch (error) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('ℹ️  Tabla cart ya existe');
      } else {
        throw error;
      }
    }

    console.log('🎉 ¡Migración completada exitosamente!');
    console.log('\n📋 Resumen de cambios:');
    console.log('✅ Columnas agregadas a blog_posts: category, publish_date');
    console.log('✅ Columna agregada a order_items: image_url');
    console.log('✅ Tabla categories creada con 7 categorías básicas');
    console.log('✅ Tabla product_images creada');
    console.log('✅ Tabla product_reviews creada');
    console.log('✅ Tabla wishlist creada');
    console.log('✅ Tabla cart creada');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar la migración
addMissingTablesAndColumns()
  .then(() => {
    console.log('✅ Migración completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
