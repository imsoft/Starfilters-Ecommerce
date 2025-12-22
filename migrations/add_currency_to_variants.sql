-- Agregar campo de moneda y precio en USD a las variantes
ALTER TABLE filter_category_variants
ADD COLUMN currency ENUM('MXN', 'USD') DEFAULT 'MXN' AFTER price,
ADD COLUMN price_usd DECIMAL(10, 2) DEFAULT NULL AFTER currency;

-- Comentario: Los productos pueden tener precio en USD que se convertirá a MXN automáticamente
