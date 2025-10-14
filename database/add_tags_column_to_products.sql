-- Migración para agregar campo tags a la tabla products
-- Ejecutar en phpMyAdmin o cliente MySQL

ALTER TABLE products 
ADD COLUMN tags VARCHAR(500) NULL AFTER category;

-- Actualizar el índice para mejorar búsquedas por tags
CREATE INDEX idx_products_tags ON products(tags);
