import mysql from 'mysql2/promise';

async function addSpecificationsColumns() {
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

    // Verificar si los campos ya existen
    const [columns] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'products' 
       AND COLUMN_NAME IN ('weight', 'material', 'warranty')
       AND TABLE_SCHEMA = DATABASE()`
    );

    const existingColumns = columns.map((col) => col.COLUMN_NAME);
    
    if (existingColumns.includes('weight') && existingColumns.includes('material') && existingColumns.includes('warranty')) {
      console.log('✅ Los campos weight, material y warranty ya existen en la tabla products');
      return;
    }

    // Agregar los campos que faltan
    if (!existingColumns.includes('weight')) {
      await connection.execute(`
        ALTER TABLE products 
        ADD COLUMN weight VARCHAR(100) NULL AFTER dimensions
      `);
      console.log('✅ Campo weight agregado');
    }

    if (!existingColumns.includes('material')) {
      await connection.execute(`
        ALTER TABLE products 
        ADD COLUMN material VARCHAR(255) NULL AFTER weight
      `);
      console.log('✅ Campo material agregado');
    }

    if (!existingColumns.includes('warranty')) {
      await connection.execute(`
        ALTER TABLE products 
        ADD COLUMN warranty VARCHAR(100) NULL AFTER material
      `);
      console.log('✅ Campo warranty agregado');
    }

    console.log('✅ Todos los campos de especificaciones técnicas agregados exitosamente');

  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  Algunos campos ya existen en la tabla products');
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
addSpecificationsColumns();

