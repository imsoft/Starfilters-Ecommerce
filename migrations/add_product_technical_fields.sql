-- Agregar campos técnicos a la tabla products
-- Estos campos son similares a los que tienen las categorías de filtros
-- Compatible con versiones antiguas de MySQL (sin IF NOT EXISTS)

-- Agregar campos de eficiencia (uno por uno para evitar errores si ya existen)
ALTER TABLE products ADD COLUMN efficiency TEXT NULL COMMENT 'Eficiencia de filtración (ej: 99.997%)';
ALTER TABLE products ADD COLUMN efficiency_en TEXT NULL COMMENT 'Eficiencia en inglés';
ALTER TABLE products ADD COLUMN efficiency_class VARCHAR(50) NULL COMMENT 'Clase EN1822 (ej: H14)';

-- Agregar características
ALTER TABLE products ADD COLUMN characteristics TEXT NULL COMMENT 'Características del producto';
ALTER TABLE products ADD COLUMN characteristics_en TEXT NULL COMMENT 'Características en inglés';
ALTER TABLE products ADD COLUMN frame_material VARCHAR(100) NULL COMMENT 'Material del marco (ej: Aluminio)';
ALTER TABLE products ADD COLUMN max_temperature VARCHAR(50) NULL COMMENT 'Temperatura máxima (ej: 70ºC)';

-- Agregar información adicional
ALTER TABLE products ADD COLUMN typical_installation TEXT NULL COMMENT 'Instalación típica';
ALTER TABLE products ADD COLUMN typical_installation_en TEXT NULL COMMENT 'Instalación típica en inglés';
ALTER TABLE products ADD COLUMN applications TEXT NULL COMMENT 'Aplicaciones del producto';
ALTER TABLE products ADD COLUMN applications_en TEXT NULL COMMENT 'Aplicaciones en inglés';
ALTER TABLE products ADD COLUMN benefits TEXT NULL COMMENT 'Beneficios del producto';
ALTER TABLE products ADD COLUMN benefits_en TEXT NULL COMMENT 'Beneficios en inglés';

-- Verificar que los campos se agregaron correctamente
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'products'
  AND COLUMN_NAME IN (
    'efficiency', 'efficiency_en', 'efficiency_class',
    'characteristics', 'characteristics_en', 'frame_material', 'max_temperature',
    'typical_installation', 'typical_installation_en',
    'applications', 'applications_en',
    'benefits', 'benefits_en'
  )
ORDER BY COLUMN_NAME;
