-- Script para corregir y actualizar la tabla blog_posts
-- Ejecuta este script en tu base de datos MySQL
-- NOTA: MySQL no soporta IF NOT EXISTS en ALTER TABLE, así que si una columna ya existe, dará error
-- En ese caso, simplemente ignora el error y continúa con las siguientes

-- Agregar campo featured_image_url (ejecuta solo si no existe)
-- ALTER TABLE blog_posts ADD COLUMN featured_image_url VARCHAR(500) AFTER featured_image;

-- Si featured_image existe pero featured_image_url no, copiar los datos
-- UPDATE blog_posts SET featured_image_url = featured_image WHERE featured_image_url IS NULL AND featured_image IS NOT NULL;

-- Agregar campos de traducción (ejecuta solo los que no existan)
-- ALTER TABLE blog_posts ADD COLUMN title_en VARCHAR(255) AFTER title;
-- ALTER TABLE blog_posts ADD COLUMN slug_en VARCHAR(255) AFTER slug;
-- ALTER TABLE blog_posts ADD COLUMN content_en LONGTEXT AFTER content;
-- ALTER TABLE blog_posts ADD COLUMN excerpt_en TEXT AFTER excerpt;
-- ALTER TABLE blog_posts ADD COLUMN meta_title_en VARCHAR(255) AFTER meta_title;
-- ALTER TABLE blog_posts ADD COLUMN meta_description_en TEXT AFTER meta_description;

-- Agregar índice único para slug_en (ejecuta solo si no existe)
-- ALTER TABLE blog_posts ADD UNIQUE INDEX idx_blog_posts_slug_en (slug_en);

-- RECOMENDACIÓN: Usa el script Node.js en su lugar: node scripts/fix-blog-posts-table.js
-- Ese script verifica automáticamente qué columnas existen antes de agregarlas

