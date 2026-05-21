-- Agregar columna product_type para distinguir filtros de productos especiales
ALTER TABLE products
  ADD COLUMN product_type ENUM('filter', 'special') NOT NULL DEFAULT 'filter'
  AFTER filter_category_id;

-- Todos los productos existentes son filtros (valor por defecto ya lo cubre,
-- pero lo dejamos explícito para claridad)
UPDATE products SET product_type = 'filter' WHERE product_type = 'filter';

-- Índice para consultas por tipo
CREATE INDEX idx_products_product_type ON products (product_type, status);
