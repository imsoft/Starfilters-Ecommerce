-- Migración para optimizar sistema de imágenes de productos
-- Ejecutar en TablePlus o phpMyAdmin

-- 1. Migrar imagen principal de products a product_images
INSERT INTO product_images (uuid, product_id, image_url, alt_text, sort_order, is_primary)
SELECT 
    UUID() as uuid,
    id as product_id,
    image_url,
    CONCAT(name, ' - Imagen principal') as alt_text,
    0 as sort_order,
    1 as is_primary
FROM products 
WHERE image_url IS NOT NULL AND image_url != '';

-- 2. Verificar la migración
SELECT 
    p.id,
    p.name,
    p.image_url as 'Imagen en products',
    pi.image_url as 'Imagen en product_images',
    pi.is_primary,
    pi.sort_order
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
ORDER BY p.id;

-- 3. Opcional: Eliminar image_url de products (después de verificar que todo funciona)
-- ALTER TABLE products DROP COLUMN image_url;
