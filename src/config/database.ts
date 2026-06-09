import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'starfilters_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Mantener vivas las conexiones para evitar que MySQL cierre las inactivas
  // (causa de escrituras que "fallan en silencio" en servidores de larga duración)
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
};

// Log de configuración para desarrollo
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Configuración de Base de Datos:');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Puerto: ${dbConfig.port}`);
  console.log(`   Usuario: ${dbConfig.user}`);
  console.log(`   Base de datos: ${dbConfig.database}`);
}

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para obtener una conexión
export const getConnection = async () => {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
    throw error;
  }
};

// Función para ejecutar consultas
export const query = async (sql: string, params?: any[]) => {
  try {
    const [rows] = await pool.execute(sql, params || []);
    return rows;
  } catch (error) {
    console.error('Error al ejecutar consulta:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
};

// Función para cerrar el pool de conexiones
export const closePool = async () => {
  try {
    await pool.end();
    console.log('Pool de conexiones cerrado');
  } catch (error) {
    console.error('Error al cerrar el pool:', error);
  }
};

// Función para probar la conexión
export const testConnection = async () => {
  try {
    const connection = await getConnection();
    console.log('✅ Conexión a la base de datos exitosa');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error de conexión a la base de datos:', error);
    return false;
  }
};

export default pool;
