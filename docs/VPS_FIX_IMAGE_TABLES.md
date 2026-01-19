# Fix: Crear Tablas de Imágenes de Carrusel

## Problema
Las imágenes de carrusel no se guardan porque falta la tabla `filter_category_images` en la base de datos.

## Solución

### Paso 1: Conectarse al VPS
```bash
ssh root@72.60.228.9
cd ~/starfilters-app
```

### Paso 2: Actualizar el código
```bash
git pull origin main
```

### Paso 3: Crear la tabla filter_category_images

**Opción A: Usando el script SQL directamente**
```bash
mysql -u root -p starfilters_db < migrations/create_filter_category_images_table.sql
```
(Te pedirá la contraseña de MySQL)

**Opción B: Usando el script de verificación**
```bash
chmod +x scripts/verify-image-tables.sh
./scripts/verify-image-tables.sh
```

**Opción C: Manualmente en MySQL**
```bash
mysql -u root -p starfilters_db
```

Luego ejecuta:
```sql
CREATE TABLE IF NOT EXISTS filter_category_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    category_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    sort_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES filter_categories(id) ON DELETE CASCADE,
    INDEX idx_filter_category_images_category_id (category_id),
    INDEX idx_filter_category_images_uuid (uuid),
    INDEX idx_filter_category_images_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Paso 4: Verificar que la tabla se creó
```bash
mysql -u root -p starfilters_db -e "DESCRIBE filter_category_images;"
```

Deberías ver algo como:
```
+------------+--------------+------+-----+-------------------+-------------------+
| Field      | Type         | Null | Key | Default          | Extra             |
+------------+--------------+------+-----+-------------------+-------------------+
| id         | int          | NO   | PRI | NULL              | auto_increment    |
| uuid       | varchar(36)  | NO   | UNI | NULL              |                   |
| category_id| int          | NO   | MUL | NULL              |                   |
| image_url  | varchar(500) | NO   |     | NULL              |                   |
| alt_text   | varchar(255) | YES  |     | NULL              |                   |
| sort_order | int          | YES  | MUL | 0                 |                   |
| is_primary | tinyint(1)   | YES  |     | 0                 |                   |
| created_at | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+------------+--------------+------+-----+-------------------+-------------------+
```

### Paso 5: Recompilar y reiniciar
```bash
pnpm build
pm2 restart all
```

### Paso 6: Probar
1. Ve a crear una categoría de filtro
2. Sube una imagen principal y 2-3 imágenes de carrusel
3. Crea la categoría
4. Ve a editar la categoría y verifica que las imágenes de carrusel aparezcan

## Verificación de Tablas Existentes

Para verificar qué tablas de imágenes existen:
```bash
mysql -u root -p starfilters_db -e "SHOW TABLES LIKE '%images%';"
```

Deberías ver:
- `product_images` ✅
- `filter_category_images` ✅ (después de crear)

## Notas
- La tabla `product_images` ya debería existir desde migraciones anteriores
- Si `product_images` no existe, también se puede crear con el mismo patrón
- Las imágenes se guardan en Cloudinary, pero sus URLs y metadatos se guardan en estas tablas
