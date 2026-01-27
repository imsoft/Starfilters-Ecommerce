# Configuración de Base de Datos MySQL para Star Filters

## 📋 Pasos para configurar la base de datos en Hostinger

### 1. Crear la Base de Datos en Hostinger

1. **Accede al panel de control de Hostinger**
2. **Ve a "Bases de Datos MySQL"**
3. **Crea una nueva base de datos:**
   - Nombre: `starfilters_db` (o el que prefieras)
   - Usuario: Crea un usuario específico para la aplicación
   - Contraseña: Genera una contraseña segura

### 2. Configurar Variables de Entorno

1. **Copia el archivo de ejemplo:**
   ```bash
   cp env.example .env
   ```

2. **Edita el archivo `.env` con tus datos de Hostinger:**
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=tu_nombre_de_base_de_datos
   DB_USER=tu_usuario_de_base_de_datos
   DB_PASSWORD=tu_contraseña_de_base_de_datos
   ```

### 3. Crear las Tablas

1. **Accede a phpMyAdmin en Hostinger**
2. **Selecciona tu base de datos**
3. **Ve a la pestaña "SQL"**
4. **Copia y pega el contenido del archivo `database/schema.sql`**
5. **Ejecuta el script**

### 4. Probar la Conexión

```bash
node scripts/test-db-connection.js
```

## 🗂️ Estructura de la Base de Datos

### Tablas Creadas:

- **`products`** - Catálogo de productos
- **`orders`** - Órdenes de compra
- **`order_items`** - Items de cada orden
- **`blog_posts`** - Artículos del blog
- **`admin_users`** - Usuarios administradores

### Datos de Ejemplo:

El script incluye datos de ejemplo para productos y artículos del blog.

## 🔧 Uso en el Código

### Importar las funciones:

```typescript
import { getProducts, createProduct, getOrders } from '../lib/database';
```

### Ejemplos de uso:

```typescript
// Obtener productos
const products = await getProducts(10, 0);

// Crear un producto
const productId = await createProduct({
  name: 'Nuevo Filtro',
  description: 'Descripción del filtro',
  price: 25.99,
  category: 'Filtros de Aire',
  stock: 50,
  image_url: '/images/filtro.jpg',
  status: 'active'
});

// Obtener órdenes
const orders = await getOrders(10, 0);
```

## 🚀 Despliegue en Hostinger

### 1. Subir archivos

Sube todos los archivos del proyecto a tu hosting de Hostinger.

### 2. Instalar dependencias

En el terminal de Hostinger o mediante SSH:
```bash
npm install
# o
pnpm install
```

### 3. Configurar variables de entorno

Asegúrate de que el archivo `.env` esté configurado con los datos correctos de tu base de datos.

### 4. Construir el proyecto

```bash
npm run build
# o
pnpm build
```

## 🔍 Solución de Problemas

### Error de conexión:
- Verifica que los datos en `.env` sean correctos
- Asegúrate de que la base de datos exista
- Verifica que el usuario tenga permisos

### Error de tablas:
- Ejecuta el script `database/schema.sql` en phpMyAdmin
- Verifica que todas las tablas se hayan creado correctamente

### Error de permisos:
- Asegúrate de que el usuario de la base de datos tenga permisos de lectura/escritura
- Verifica que las tablas existan y sean accesibles

## 📞 Soporte

Si tienes problemas con la configuración, verifica:
1. Los datos de conexión en `.env`
2. Que la base de datos esté creada
3. Que las tablas existan
4. Los permisos del usuario de la base de datos
