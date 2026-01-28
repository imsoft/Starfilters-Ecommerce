# Ver Tablas SQL en el VPS

## 🔌 Opción 1: Terminal SSH (Más Rápida)

### 1. Conectarte al VPS:
```bash
ssh starfilters@TU_IP_VPS
# O si usas root:
ssh root@TU_IP_VPS
```

### 2. Conectarte a MySQL:
```bash
# Usando el usuario de la aplicación
mysql -u starfilters_user -p starfilters_ecommerce_db

# O si prefieres usar root:
sudo mysql -u root -p
```

### 3. Comandos útiles para ver las tablas:

```sql
-- Ver todas las bases de datos
SHOW DATABASES;

-- Usar la base de datos
USE starfilters_ecommerce_db;

-- Ver todas las tablas
SHOW TABLES;

-- Ver estructura de una tabla específica
DESCRIBE products;
DESCRIBE users;
DESCRIBE orders;
DESCRIBE filter_categories;
DESCRIBE product_images;

-- Ver datos de una tabla (primeras 10 filas)
SELECT * FROM products LIMIT 10;
SELECT * FROM users LIMIT 10;
SELECT * FROM orders LIMIT 10;
SELECT * FROM filter_categories LIMIT 10;

-- Contar registros en cada tabla
SELECT 
  'products' as tabla, COUNT(*) as total FROM products
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'filter_categories', COUNT(*) FROM filter_categories
UNION ALL
SELECT 'product_images', COUNT(*) FROM product_images
UNION ALL
SELECT 'blog_posts', COUNT(*) FROM blog_posts;

-- Ver todas las columnas de una tabla
SHOW COLUMNS FROM products;
SHOW COLUMNS FROM users;
SHOW COLUMNS FROM filter_categories;

-- Salir de MySQL
EXIT;
```

---

## 🖥️ Opción 2: TablePlus con Túnel SSH (Recomendada - Interfaz Gráfica)

### 1. Obtener credenciales de la base de datos:

En el VPS, ejecuta:
```bash
cd ~/starfilters-app
cat .env | grep DB_
```

Esto te mostrará:
```
DB_HOST=localhost
DB_USER=starfilters_user
DB_PASSWORD=tu_contraseña
DB_NAME=starfilters_ecommerce_db
DB_PORT=3306
```

### 2. Configurar TablePlus:

1. **Abrir TablePlus**
2. **Crear nueva conexión** (botón "+")
3. **Seleccionar MySQL**
4. **Configurar la conexión:**

```
Nombre: Star Filters VPS
Host: 127.0.0.1 (o localhost)
Puerto: 3306
Usuario: starfilters_user
Contraseña: [la contraseña que obtuviste]
Base de datos: starfilters_ecommerce_db
```

5. **Ir a la pestaña "SSH"** (muy importante):
   - ✅ Activar "Use SSH Tunnel"
   - **SSH Host:** TU_IP_VPS (o el dominio)
   - **SSH Port:** 22
   - **SSH User:** starfilters (o root)
   - **SSH Password:** [tu contraseña SSH] (o usar clave SSH)
   - **SSH Key:** [si usas clave SSH, selecciona el archivo .pem o .key]

6. **Hacer clic en "Test"** para verificar la conexión
7. **Hacer clic en "Connect"** para conectar

### 3. Explorar las tablas:

Una vez conectado, verás todas las tablas en el panel izquierdo:
- `products` - Productos
- `users` - Usuarios
- `orders` - Órdenes
- `order_items` - Items de órdenes
- `filter_categories` - Categorías de filtros
- `filter_category_images` - Imágenes de categorías
- `product_images` - Imágenes de productos
- `blog_posts` - Artículos del blog
- `admin_users` - Usuarios administradores
- Y más...

---

## 🌐 Opción 3: phpMyAdmin (Si está disponible en Hostinger)

### 1. Acceder a phpMyAdmin:

1. **Accede al panel de control de Hostinger**
2. **Ve a "Bases de Datos MySQL"**
3. **Busca el botón "phpMyAdmin"** junto a tu base de datos
4. **Haz clic para abrir phpMyAdmin**

### 2. Usar phpMyAdmin:

- Verás todas las tablas en el panel izquierdo
- Haz clic en cualquier tabla para ver sus datos
- Puedes ejecutar consultas SQL en la pestaña "SQL"

---

## 🔧 Opción 4: Túnel SSH Manual (Desde Terminal)

Si prefieres usar otra herramienta (como MySQL Workbench, DBeaver, etc.):

### 1. Crear túnel SSH:
```bash
ssh -L 3307:localhost:3306 starfilters@TU_IP_VPS
```

Esto crea un túnel que redirige el puerto local 3307 al puerto 3306 del VPS.

### 2. Conectar tu herramienta:

En tu herramienta de base de datos, configura:
```
Host: localhost
Puerto: 3307
Usuario: starfilters_user
Contraseña: [tu contraseña]
Base de datos: starfilters_ecommerce_db
```

---

## 📊 Consultas Útiles para Explorar

### Ver estadísticas generales:
```sql
SELECT 
  (SELECT COUNT(*) FROM products) as total_productos,
  (SELECT COUNT(*) FROM products WHERE status = 'active') as productos_activos,
  (SELECT COUNT(*) FROM users WHERE status = 'active') as usuarios_activos,
  (SELECT COUNT(*) FROM orders) as total_ordenes,
  (SELECT COUNT(*) FROM filter_categories) as total_categorias,
  (SELECT COUNT(*) FROM product_images) as total_imagenes_productos,
  (SELECT COUNT(*) FROM filter_category_images) as total_imagenes_categorias;
```

### Ver productos con sus imágenes:
```sql
SELECT 
  p.id,
  p.name,
  p.price,
  p.stock,
  p.status,
  pi.image_url as imagen_principal
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
LIMIT 20;
```

### Ver categorías con sus imágenes:
```sql
SELECT 
  fc.id,
  fc.name,
  fc.slug,
  fc.status,
  fc.main_image,
  COUNT(fci.id) as total_imagenes_carrusel
FROM filter_categories fc
LEFT JOIN filter_category_images fci ON fc.id = fci.category_id AND fci.is_primary = 0
GROUP BY fc.id
LIMIT 20;
```

### Ver órdenes recientes:
```sql
SELECT 
  o.id,
  o.uuid,
  o.total_amount,
  o.status,
  o.created_at,
  u.email as usuario_email,
  COUNT(oi.id) as total_items
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id
ORDER BY o.created_at DESC
LIMIT 20;
```

---

## 🔐 Seguridad

⚠️ **Importante:**
- Nunca compartas tus credenciales de base de datos
- Usa conexiones SSH cuando sea posible
- No expongas MySQL directamente a internet (debe estar en localhost)
- Mantén tus contraseñas seguras

---

## 🆘 Solución de Problemas

### Error: "Access denied"
- Verifica que el usuario y contraseña sean correctos
- Verifica que el usuario tenga permisos: `SHOW GRANTS FOR 'starfilters_user'@'localhost';`

### Error: "Can't connect to MySQL server"
- Verifica que MySQL esté corriendo: `sudo systemctl status mysql`
- Verifica que el puerto 3306 esté abierto localmente

### Error en TablePlus con SSH
- Verifica que puedas conectarte por SSH normalmente
- Prueba con contraseña primero, luego con clave SSH
- Verifica que el puerto SSH (22) esté abierto

---

## 📝 Notas

- El usuario `starfilters_user` solo tiene acceso a `starfilters_ecommerce_db`
- Las conexiones remotas directas a MySQL están deshabilitadas por seguridad
- Usa siempre túneles SSH para conexiones desde fuera del VPS
