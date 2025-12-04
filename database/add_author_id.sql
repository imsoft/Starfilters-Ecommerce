-- Script SQL para agregar la columna author_id a blog_posts
-- Ejecutar: mysql -u starfilters_user -p starfilters_ecommerce_db < database/add_author_id.sql

-- Verificar si la columna existe antes de agregarla
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'blog_posts'
  AND COLUMN_NAME = 'author_id'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE blog_posts ADD COLUMN author_id INT NULL AFTER author',
  'SELECT "Columna author_id ya existe" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Mapear posts existentes al primer admin disponible
UPDATE blog_posts bp
SET bp.author_id = (
  SELECT id FROM admin_users 
  WHERE role = 'admin' 
  ORDER BY id 
  LIMIT 1
)
WHERE bp.author_id IS NULL;

SELECT 'Columna author_id agregada y posts mapeados correctamente' AS result;

