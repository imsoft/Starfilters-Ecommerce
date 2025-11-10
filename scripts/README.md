# Scripts de Migración y Utilidades

Este directorio contiene scripts útiles para administrar la base de datos y el sistema.

## 🆕 Migración Bind ID

### `migrate-bind-id.js`

Agrega la columna `bind_id` a la tabla `products` para almacenar el ID del producto en Bind ERP.

**Uso:**
```bash
node scripts/migrate-bind-id.js
```

**Lo que hace:**
1. Verifica si la columna `bind_id` ya existe
2. Si no existe, la crea después de la columna `uuid`
3. Agrega un índice `idx_bind_id` para búsquedas rápidas
4. Muestra la estructura final de la tabla

**Salida esperada:**
```
✅ Columna bind_id agregada exitosamente
✅ Índice idx_bind_id creado exitosamente
🎉 ¡Migración completada exitosamente!
```

**Si ya fue ejecutado:**
```
⚠️  La columna bind_id ya existe en la tabla products
✅ No se necesita migración
```

**Requisitos:**
- Node.js 18+
- MySQL corriendo en localhost
- Variables de entorno configuradas en `.env`

---

## Otros Scripts Disponibles

### Gestión de Usuarios

- **`create-admin.js`** - Crear un usuario administrador
- **`activate-user.js`** - Activar un usuario
- **`create-test-user.js`** - Crear usuario de prueba

### Gestión de Productos

- **`add-tags-column-to-products.js`** - Agregar columna de etiquetas
- **`add-specifications-to-products.js`** - Agregar especificaciones técnicas
- **`add-dimensions-to-products.js`** - Agregar dimensiones
- **`migrate-product-images.js`** - Migrar sistema de imágenes
- **`remove-image-url-column.js`** - Limpiar columna antigua

### Internacionalización

- **`add-i18n-fields.js`** - Agregar campos de traducción
- **`translate-existing-content.js`** - Traducir contenido existente

### Testing y Desarrollo

- **`test-db-connection.js`** - Verificar conexión a MySQL
- **`create-test-orders.js`** - Crear órdenes de prueba
- **`test-lazy-loading-performance.js`** - Probar rendimiento

### Utilidades de Migración

- **`add-uuids-migration.js`** - Agregar UUIDs a registros existentes
- **`add-missing-tables-and-columns.js`** - Completar schema

---

## 📋 Cómo Ejecutar Scripts

### 1. Verificar configuración

Asegúrate de que tu archivo `.env` tenga las credenciales correctas:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=starfilters_db
```

### 2. Ejecutar script

```bash
node scripts/nombre-del-script.js
```

### 3. Verificar resultado

Los scripts muestran logs detallados con emojis para fácil lectura:

- ✅ - Operación exitosa
- ❌ - Error
- ⚠️  - Advertencia
- 🔍 - Verificación
- 📡 - Conexión
- 🚀 - Inicio de proceso

---

## 🛡️ Seguridad

### Antes de ejecutar en producción:

1. **Hacer backup de la base de datos:**
   ```bash
   mysqldump -u root -p starfilters_db > backup-$(date +%Y%m%d-%H%M%S).sql
   ```

2. **Probar en desarrollo primero**

3. **Verificar que no hay usuarios activos**

4. **Revisar el código del script**

---

## ⚠️ Troubleshooting

### Error: "Cannot connect to MySQL"

**Solución:**
1. Verifica que MySQL esté corriendo:
   ```bash
   mysql -u root -p
   ```
2. Revisa las credenciales en `.env`
3. Verifica el puerto (por defecto 3306)

### Error: "Column already exists"

**Solución:**
- Esto es normal, el script detecta si la columna ya existe y no hace nada

### Error: "Access denied"

**Solución:**
- Verifica el usuario y contraseña en `.env`
- Asegúrate que el usuario tiene permisos `ALTER TABLE`

---

## 📝 Crear Nuevos Scripts

Si necesitas crear un nuevo script de migración, usa esta plantilla:

```javascript
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'starfilters_db',
};

async function runMigration() {
  let connection;

  try {
    console.log('📡 Conectando a MySQL...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión exitosa\n');

    // Tu lógica aquí
    console.log('🚀 Ejecutando migración...');

    // Ejemplo:
    // await connection.query('ALTER TABLE ...');

    console.log('✅ Migración completada\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
```

---

## 📚 Recursos

- [MySQL ALTER TABLE Docs](https://dev.mysql.com/doc/refman/8.0/en/alter-table.html)
- [Node.js MySQL2 Docs](https://sidorares.github.io/node-mysql2/docs)
- [Documentación del Proyecto](../docs/)

---

**Última actualización:** 2025-01-09
