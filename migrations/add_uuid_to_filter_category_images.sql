-- ============================================
-- Agregar columna uuid a filter_category_images
-- ============================================
-- Esta migración agrega la columna uuid que falta en la tabla
-- ============================================

-- Verificar si la columna uuid ya existe
SET @dbname = DATABASE();
SET @tablename = 'filter_category_images';
SET @columnname = 'uuid';

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "✅ La columna uuid ya existe" AS resultado;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(36) UNIQUE NOT NULL AFTER id;')
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Agregar índice si no existe
SET @indexname = 'idx_filter_category_images_uuid';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (INDEX_NAME = @indexname)
  ) > 0,
  'SELECT "✅ El índice ya existe" AS resultado;',
  CONCAT('CREATE INDEX ', @indexname, ' ON ', @tablename, ' (uuid);')
));

PREPARE createIndexIfNotExists FROM @preparedStatement;
EXECUTE createIndexIfNotExists;
DEALLOCATE PREPARE createIndexIfNotExists;

-- Verificar estructura final
SELECT '✅ Verificación final de la tabla:' AS '';
DESCRIBE filter_category_images;
