-- ============================================
-- Script de Actualización Completa para Filter Categories
-- ============================================
-- Este script agrega todos los campos necesarios para el sistema completo
-- de categorías de filtros con todas las funcionalidades mejoradas.
--
-- Ejecutar en la base de datos MySQL/MariaDB
-- ============================================

-- 1. Agregar columna efficiency_en a filter_categories (si no existe)
SET @dbname = DATABASE();
SET @tablename = 'filter_categories';
SET @columnname = 'efficiency_en';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TEXT NULL AFTER efficiency')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 2. Cambiar efficiency de VARCHAR(100) a TEXT (si es necesario)
-- Esto permite almacenar múltiples valores separados por saltos de línea
SET @preparedStatement = (SELECT IF(
  (
    SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = 'efficiency')
      AND (DATA_TYPE = 'varchar')
  ) > 0,
  CONCAT('ALTER TABLE ', @tablename, ' MODIFY COLUMN efficiency TEXT NULL'),
  'SELECT 1'
));
PREPARE alterIfNeeded FROM @preparedStatement;
EXECUTE alterIfNeeded;
DEALLOCATE PREPARE alterIfNeeded;

-- 3. Agregar campos currency y price_usd a filter_category_variants (si no existen)
SET @tablename = 'filter_category_variants';

-- Verificar y agregar currency
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

-- Verificar y agregar price_usd
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
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' DECIMAL(10, 2) DEFAULT NULL AFTER currency')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================
-- Verificación Final
-- ============================================
-- Mostrar estructura actualizada de las tablas
SELECT '✅ Verificación de filter_categories:' AS '';
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @dbname
  AND TABLE_NAME = 'filter_categories'
  AND COLUMN_NAME IN ('efficiency', 'efficiency_en', 'characteristics', 'benefits', 'typical_installation', 'applications')
ORDER BY ORDINAL_POSITION;

SELECT '✅ Verificación de filter_category_variants:' AS '';
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @dbname
  AND TABLE_NAME = 'filter_category_variants'
  AND COLUMN_NAME IN ('price', 'currency', 'price_usd')
ORDER BY ORDINAL_POSITION;

SELECT '✅ Script completado exitosamente!' AS '';
