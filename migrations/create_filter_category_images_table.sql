-- ============================================
-- Crear tabla filter_category_images
-- ============================================
-- Esta tabla almacena las imágenes de carrusel para las categorías de filtros
-- ============================================

CREATE TABLE IF NOT EXISTS filter_category_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    category_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    sort_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES filter_categories(id) ON DELETE CASCADE,
    INDEX idx_filter_category_images_category_id (category_id),
    INDEX idx_filter_category_images_uuid (uuid),
    INDEX idx_filter_category_images_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verificar que la tabla se creó correctamente
SELECT '✅ Tabla filter_category_images creada exitosamente!' AS '';
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'filter_category_images'
ORDER BY ORDINAL_POSITION;
