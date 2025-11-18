-- Agregar columna efficiency_en a la tabla filter_categories
ALTER TABLE filter_categories
ADD COLUMN efficiency_en TEXT NULL
AFTER efficiency;

