import mysql from 'mysql2/promise';

async function addProfileImageField() {
  let connection;
  
  try {
    // Crear conexión a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'starfilters_db'
    });

    console.log('🔗 Conectado a la base de datos');

    // Verificar si el campo ya existe
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'admin_users' AND COLUMN_NAME = 'profile_image'"
    );

    if (columns.length > 0) {
      console.log('✅ El campo profile_image ya existe en la tabla admin_users');
      return;
    }

    // Agregar el campo profile_image
    await connection.execute(`
      ALTER TABLE admin_users 
      ADD COLUMN profile_image VARCHAR(500) NULL AFTER full_name
    `);

    console.log('✅ Campo profile_image agregado exitosamente a la tabla admin_users');

    // Actualizar el campo updated_at para que se actualice automáticamente
    await connection.execute(`
      ALTER TABLE admin_users 
      MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `);

    console.log('✅ Campo updated_at actualizado exitosamente');

  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión a la base de datos cerrada');
    }
  }
}

// Ejecutar la migración
addProfileImageField();
