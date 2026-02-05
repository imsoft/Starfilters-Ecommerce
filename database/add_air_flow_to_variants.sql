-- Agregar campo "Flujo de aire" a la tabla filter_category_variants
-- Este campo muestra el flujo de aire para cada variante/tamaño

ALTER TABLE filter_category_variants
ADD COLUMN air_flow VARCHAR(255) DEFAULT NULL AFTER product_code;
