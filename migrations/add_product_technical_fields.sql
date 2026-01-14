-- Agregar campos técnicos a la tabla products
-- Estos campos son similares a los que tienen las categorías de filtros

-- Agregar campos de eficiencia
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS efficiency TEXT NULL COMMENT 'Eficiencia de filtración (ej: 99.997%)',
ADD COLUMN IF NOT EXISTS efficiency_en TEXT NULL COMMENT 'Eficiencia en inglés',
ADD COLUMN IF NOT EXISTS efficiency_class VARCHAR(50) NULL COMMENT 'Clase EN1822 (ej: H14)';

-- Agregar características
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS characteristics TEXT NULL COMMENT 'Características del producto',
ADD COLUMN IF NOT EXISTS characteristics_en TEXT NULL COMMENT 'Características en inglés',
ADD COLUMN IF NOT EXISTS frame_material VARCHAR(100) NULL COMMENT 'Material del marco (ej: Aluminio)',
ADD COLUMN IF NOT EXISTS max_temperature VARCHAR(50) NULL COMMENT 'Temperatura máxima (ej: 70ºC)';

-- Agregar información adicional
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS typical_installation TEXT NULL COMMENT 'Instalación típica',
ADD COLUMN IF NOT EXISTS typical_installation_en TEXT NULL COMMENT 'Instalación típica en inglés',
ADD COLUMN IF NOT EXISTS applications TEXT NULL COMMENT 'Aplicaciones del producto',
ADD COLUMN IF NOT EXISTS applications_en TEXT NULL COMMENT 'Aplicaciones en inglés',
ADD COLUMN IF NOT EXISTS benefits TEXT NULL COMMENT 'Beneficios del producto',
ADD COLUMN IF NOT EXISTS benefits_en TEXT NULL COMMENT 'Beneficios en inglés';

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
