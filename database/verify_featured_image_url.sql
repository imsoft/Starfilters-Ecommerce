-- Script para verificar y agregar la columna featured_image_url si no existe
-- Ejecutar en el VPS: mysql -u starfilters_user -p starfilters_ecommerce_db < verify_featured_image_url.sql

-- Verificar estructura de la tabla
DESCRIBE blog_posts;

-- Si la columna featured_image_url no existe, agregarla
-- (Si ya existe, esto dará error pero es seguro ignorarlo)
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS featured_image_url VARCHAR(500) DEFAULT NULL 
AFTER featured_image;

-- Verificar que se agregó correctamente
DESCRIBE blog_posts;

-- Mostrar algunos registros para verificar
SELECT id, uuid, title, featured_image, featured_image_url 
FROM blog_posts 
LIMIT 5;

