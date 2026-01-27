# Configuración de TablePlus para Desarrollo Local

## 🗄️ **Configuración de TablePlus**

### **1. Crear Nueva Conexión en TablePlus**

1. **Abrir TablePlus**
2. **Crear nueva conexión** (botón "+")
3. **Seleccionar MySQL**
4. **Configurar la conexión:**

```
Nombre: Star Filters Local
Host: localhost
Puerto: 3306
Usuario: root
Contraseña: (dejar vacío)
Base de datos: starfilters_db
```

### **2. Conectar a la Base de Datos**

- **Hacer clic en "Test"** para verificar la conexión
- **Hacer clic en "Connect"** para conectar

### **3. Explorar las Tablas Creadas**

Una vez conectado, verás las siguientes tablas:

#### **📊 Tablas Principales:**
- **`users`** - Usuarios registrados en el sitio
- **`products`** - Catálogo de productos
- **`orders`** - Órdenes de compra
- **`order_items`** - Items de cada orden
- **`blog_posts`** - Artículos del blog
- **`admin_users`** - Usuarios administradores

#### **👤 Usuario de Prueba Creado:**
```
Email: test@starfilters.com
Contraseña: Test123456
Estado: active
```

### **4. Comandos Útiles para TablePlus**

#### **Ver todos los usuarios:**
```sql
SELECT * FROM users;
```

#### **Ver productos:**
```sql
SELECT * FROM products;
```

#### **Ver órdenes:**
```sql
SELECT * FROM orders;
```

#### **Ver artículos del blog:**
```sql
SELECT * FROM blog_posts;
```

#### **Crear un nuevo usuario manualmente:**
```sql
INSERT INTO users (email, password_hash, first_name, last_name, status, email_verified) 
VALUES ('nuevo@ejemplo.com', 'hash_de_contraseña', 'Nombre', 'Apellido', 'active', true);
```

### **5. Probar el Sistema**

#### **Registro de Usuario:**
1. Ir a `http://localhost:4321/signup`
2. Llenar el formulario de registro
3. Verificar en TablePlus que el usuario se creó

#### **Login de Usuario:**
1. Ir a `http://localhost:4321/login`
2. Usar las credenciales de prueba:
   - Email: `test@starfilters.com`
   - Contraseña: `Test123456`

#### **Panel de Administración:**
1. Ir a `http://localhost:4321/admin/dashboard`
2. Explorar las diferentes secciones

### **6. Scripts Útiles**

#### **Probar conexión:**
```bash
node --loader ts-node/esm scripts/test-db-connection.js
```

#### **Crear usuario de prueba:**
```bash
node scripts/create-test-user-simple.js
```

#### **Ver estadísticas de la base de datos:**
```sql
SELECT 
  (SELECT COUNT(*) FROM users WHERE status = 'active') as usuarios_activos,
  (SELECT COUNT(*) FROM products WHERE status = 'active') as productos_activos,
  (SELECT COUNT(*) FROM orders) as total_ordenes,
  (SELECT COUNT(*) FROM blog_posts WHERE status = 'published') as articulos_publicados;
```

### **7. Estructura de Datos**

#### **Tabla `users`:**
- `id` - ID único del usuario
- `email` - Email del usuario (único)
- `password_hash` - Hash de la contraseña
- `first_name` - Nombre
- `last_name` - Apellido
- `phone` - Teléfono (opcional)
- `address` - Dirección (opcional)
- `city` - Ciudad (opcional)
- `postal_code` - Código postal (opcional)
- `country` - País
- `status` - Estado (active, inactive, pending)
- `email_verified` - Email verificado (boolean)
- `verification_token` - Token de verificación
- `reset_token` - Token de reset de contraseña
- `reset_token_expires` - Expiración del token de reset
- `created_at` - Fecha de creación
- `updated_at` - Fecha de actualización

### **8. Solución de Problemas**

#### **Error de conexión:**
- Verificar que MySQL esté corriendo: `brew services start mysql`
- Verificar que la base de datos exista: `mysql -u root -e "SHOW DATABASES;"`
- Verificar el archivo `.env` esté configurado correctamente

#### **Tablas no existen:**
```bash
mysql -u root starfilters_db < database/schema.sql
```

#### **Usuario de prueba no funciona:**
```bash
node scripts/create-test-user-simple.js
```

### **9. Próximos Pasos**

1. **Probar el registro** de nuevos usuarios
2. **Probar el login** con diferentes usuarios
3. **Explorar el panel de administración**
4. **Crear productos** desde el admin
5. **Crear artículos de blog** desde el admin
6. **Probar el sistema de órdenes**

¡Ahora puedes usar TablePlus para explorar y gestionar tu base de datos local!
