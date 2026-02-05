-- Agregar campo "Código de producto" a la tabla filter_category_variants
-- Este campo es visible para el cliente en la tabla de tamaños/variantes

ALTER TABLE filter_category_variants
ADD COLUMN product_code VARCHAR(100) DEFAULT NULL AFTER bind_code;
