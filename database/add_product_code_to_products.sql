-- Agregar campo "Código de producto" a la tabla products
-- Este campo es visible para el cliente y puede usarse para identificar productos

ALTER TABLE products
ADD COLUMN product_code VARCHAR(100) DEFAULT NULL AFTER sku;
