SELECT 
    id,
    uuid,
    product_id,
    SUBSTRING(image_url, 1, 80) as image_url_short,
    is_primary,
    sort_order,
    alt_text
FROM product_images 
WHERE product_id = 22
ORDER BY is_primary DESC, sort_order ASC;
