import mysql from 'mysql2/promise';

async function addDimensionsColumn() {
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
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'products' AND COLUMN_NAME = 'dimensions' AND TABLE_SCHEMA = DATABASE()"
    );

    if (columns.length > 0) {
      console.log('✅ El campo dimensions ya existe en la tabla products');
      return;
    }

    // Agregar el campo dimensions
    await connection.execute(`
      ALTER TABLE products 
      ADD COLUMN dimensions VARCHAR(100) NULL 
      AFTER tags
    `);

    console.log('✅ Campo dimensions agregado exitosamente a la tabla products');

  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  El campo dimensions ya existe en la tabla products');
    } else {
      throw error;
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión a la base de datos cerrada');
    }
  }
}

// Ejecutar la migración
addDimensionsColumn();

