-- Agregar campo "Flujo de aire" a la tabla products
-- Este campo es visible en la ficha del producto

ALTER TABLE products
ADD COLUMN air_flow VARCHAR(255) DEFAULT NULL AFTER product_code;
