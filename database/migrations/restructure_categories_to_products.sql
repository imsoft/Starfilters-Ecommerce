-- ============================================
-- Migración: Reestructurar Categorías y Productos
-- ============================================
-- Este script realiza los siguientes cambios:
-- 1. Simplifica filter_categories (solo título, descripción, imagen)
-- 2. Agrega filter_category_id a products
-- 3. Mueve variantes de filter_category_variants a products
-- 4. Elimina productos actuales sin categoría
-- ============================================

USE starfilters_ecommerce_db;

-- ============================================
-- PASO 1: Agregar filter_category_id a products
-- ============================================
ALTER TABLE products 
ADD COLUMN filter_category_id INT NULL AFTER id,
ADD INDEX idx_products_filter_category (filter_category_id);

-- Agregar foreign key (después de migrar datos)
-- ALTER TABLE products ADD FOREIGN KEY (filter_category_id) REFERENCES filter_categories(id) ON DELETE SET NULL;

-- ============================================
-- PASO 2: Agregar campos necesarios a products para las variantes
-- ============================================
-- Verificar y agregar bind_code si no existe
SET @dbname = DATABASE();
SET @tablename = 'products';
SET @columnname = 'bind_code';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(100) NULL AFTER bind_id')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verificar y agregar nominal_size si no existe
SET @columnname = 'nominal_size';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(100) NULL AFTER bind_code')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verificar y agregar real_size si no existe
SET @columnname = 'real_size';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(100) NULL AFTER nominal_size')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verificar y agregar currency si no existe
SET @columnname = 'currency';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, " ENUM('MXN', 'USD') DEFAULT 'MXN' AFTER price")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verificar y agregar price_usd si no existe
SET @columnname = 'price_usd';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' DECIMAL(10, 2) NULL AFTER currency')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================
-- PASO 3: Mover variantes de filter_category_variants a products
-- ============================================
-- Insertar cada variante como un producto nuevo
INSERT INTO products (
    uuid,
    filter_category_id,
    bind_code,
    name,
    name_en,
    description,
    description_en,
    nominal_size,
    real_size,
    price,
    currency,
    price_usd,
    stock,
    status,
    category,
    created_at,
    updated_at
)
SELECT 
    UUID() as uuid,
    fcv.category_id as filter_category_id,
    fcv.bind_code,
    CONCAT(fc.name, ' - ', fcv.nominal_size) as name,
    CONCAT(IFNULL(fc.name_en, fc.name), ' - ', fcv.nominal_size) as name_en,
    CONCAT('Variante: ', fcv.nominal_size, ' (', fcv.real_size, ')') as description,
    CONCAT('Variant: ', fcv.nominal_size, ' (', fcv.real_size, ')') as description_en,
    fcv.nominal_size,
    fcv.real_size,
    fcv.price,
    IFNULL(fcv.currency, 'MXN') as currency,
    fcv.price_usd,
    fcv.stock,
    IF(fcv.is_active = 1, 'active', 'inactive') as status,
    fc.name as category,
    IFNULL(fcv.created_at, NOW()) as created_at,
    IFNULL(fcv.updated_at, NOW()) as updated_at
FROM filter_category_variants fcv
INNER JOIN filter_categories fc ON fcv.category_id = fc.id
WHERE NOT EXISTS (
    SELECT 1 FROM products p 
    WHERE p.filter_category_id = fcv.category_id 
    AND p.bind_code = fcv.bind_code
);

-- ============================================
-- PASO 4: Eliminar productos actuales que NO tienen filter_category_id
-- ============================================
-- IMPORTANTE: Esto elimina los productos antiguos que no pertenecen a categorías
DELETE FROM products WHERE filter_category_id IS NULL;

-- ============================================
-- PASO 5: Simplificar filter_categories
-- ============================================
-- Eliminar columnas innecesarias (solo mantener: id, name, name_en, slug, description, description_en, main_image, status, created_at, updated_at)

-- Eliminar efficiency y efficiency_en
ALTER TABLE filter_categories 
DROP COLUMN IF EXISTS efficiency,
DROP COLUMN IF EXISTS efficiency_en,
DROP COLUMN IF EXISTS efficiency_class,
DROP COLUMN IF EXISTS characteristics,
DROP COLUMN IF EXISTS characteristics_en,
DROP COLUMN IF EXISTS typical_installation,
DROP COLUMN IF EXISTS typical_installation_en,
DROP COLUMN IF EXISTS applications,
DROP COLUMN IF EXISTS applications_en,
DROP COLUMN IF EXISTS benefits,
DROP COLUMN IF EXISTS benefits_en,
DROP COLUMN IF EXISTS max_temperature,
DROP COLUMN IF EXISTS frame_material;

-- ============================================
-- PASO 6: Agregar foreign key constraint
-- ============================================
ALTER TABLE products 
ADD CONSTRAINT fk_products_filter_category 
FOREIGN KEY (filter_category_id) 
REFERENCES filter_categories(id) 
ON DELETE SET NULL;

-- ============================================
-- PASO 7: Verificación
-- ============================================
SELECT '=== RESUMEN DE MIGRACIÓN ===' as '';
SELECT 
    'Categorías activas' as tipo,
    COUNT(*) as total
FROM filter_categories 
WHERE status = 'active' OR status IS NULL
UNION ALL
SELECT 
    'Productos con categoría' as tipo,
    COUNT(*) as total
FROM products 
WHERE filter_category_id IS NOT NULL
UNION ALL
SELECT 
    'Variantes migradas' as tipo,
    COUNT(*) as total
FROM filter_category_variants;

SELECT '=== PRIMERAS 5 CATEGORÍAS ===' as '';
SELECT id, name, slug, status FROM filter_categories LIMIT 5;

SELECT '=== PRIMEROS 5 PRODUCTOS ===' as '';
SELECT id, filter_category_id, name, bind_code, price, stock, status FROM products LIMIT 5;
