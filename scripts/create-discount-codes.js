import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '..', '.env') });

async function createDiscountCodesTables() {
  let connection;

  try {
    console.log('🔌 Conectando a la base de datos...');

    // Crear conexión
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    });

    console.log('✅ Conexión establecida');

    // Crear tabla discount_codes
    console.log('\n📋 Creando tabla discount_codes...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS discount_codes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(50) NOT NULL UNIQUE,
        description VARCHAR(255),
        discount_type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
        discount_value DECIMAL(10, 2) NOT NULL,
        min_purchase_amount DECIMAL(10, 2) DEFAULT NULL,
        max_discount_amount DECIMAL(10, 2) DEFAULT NULL,
        usage_limit INT DEFAULT NULL,
        usage_count INT DEFAULT 0,
        start_date DATETIME DEFAULT NULL,
        end_date DATETIME DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_code (code),
        INDEX idx_active (is_active),
        INDEX idx_dates (start_date, end_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla discount_codes creada exitosamente');

    // Crear tabla discount_code_usage
    console.log('\n📋 Creando tabla discount_code_usage...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS discount_code_usage (
        id INT PRIMARY KEY AUTO_INCREMENT,
        discount_code_id INT NOT NULL,
        order_id INT NOT NULL,
        user_id INT DEFAULT NULL,
        discount_amount DECIMAL(10, 2) NOT NULL,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (discount_code_id) REFERENCES discount_codes(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_discount_code (discount_code_id),
        INDEX idx_order (order_id),
        INDEX idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla discount_code_usage creada exitosamente');

    // Insertar códigos de ejemplo
    console.log('\n📝 Insertando códigos de descuento de ejemplo...');

    // Verificar si ya existen códigos
    const [existing] = await connection.execute('SELECT COUNT(*) as count FROM discount_codes');

    if (existing[0].count === 0) {
      await connection.execute(`
        INSERT INTO discount_codes (code, description, discount_type, discount_value, min_purchase_amount, is_active) VALUES
        ('BIENVENIDA10', 'Descuento de bienvenida del 10%', 'percentage', 10.00, 500.00, TRUE),
        ('VERANO2025', 'Descuento de verano $200 MXN', 'fixed', 200.00, 1000.00, TRUE),
        ('PRIMERACOMPRA', 'Primera compra 15% descuento', 'percentage', 15.00, 300.00, TRUE)
      `);
      console.log('✅ Códigos de descuento de ejemplo insertados');
    } else {
      console.log('ℹ️  Ya existen códigos de descuento en la base de datos, omitiendo inserción de ejemplos');
    }

    // Mostrar códigos existentes
    console.log('\n📊 Códigos de descuento actuales:');
    const [codes] = await connection.execute('SELECT * FROM discount_codes');
    console.table(codes.map(code => ({
      ID: code.id,
      Código: code.code,
      Tipo: code.discount_type,
      Valor: code.discount_value,
      'Mín. Compra': code.min_purchase_amount || 'N/A',
      Activo: code.is_active ? 'Sí' : 'No',
      'Uso': `${code.usage_count}${code.usage_limit ? '/' + code.usage_limit : ''}`
    })));

    console.log('\n🎉 ¡Script ejecutado exitosamente!');

  } catch (error) {
    console.error('\n❌ Error ejecutando el script:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar el script
createDiscountCodesTables();
