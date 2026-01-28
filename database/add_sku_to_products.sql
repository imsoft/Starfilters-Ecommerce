-- Migración para agregar columna SKU a la tabla products
-- Ejecutar en phpMyAdmin de Hostinger

-- Agregar columna sku
ALTER TABLE products ADD COLUMN sku VARCHAR(100) NULL AFTER bind_code;

-- Agregar índice para búsquedas rápidas por SKU
CREATE INDEX idx_products_sku ON products(sku);
