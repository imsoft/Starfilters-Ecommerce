-- Migración completa: Agregar TODAS las columnas faltantes a products
-- Si una columna ya existe, ese ALTER fallará pero el resto continuará
-- Ejecutar con: mysql -u starfilters_user -p starfilters_ecommerce_db --force < database/add_technical_specs_to_products.sql

ALTER TABLE products ADD COLUMN bind_id VARCHAR(100) NULL;
ALTER TABLE products ADD COLUMN filter_category_id INT NULL;
ALTER TABLE products ADD COLUMN bind_code VARCHAR(100) NULL;
ALTER TABLE products ADD COLUMN sku VARCHAR(100) NULL;
ALTER TABLE products ADD COLUMN product_code VARCHAR(100) NULL;
ALTER TABLE products ADD COLUMN name_en VARCHAR(255) NULL;
ALTER TABLE products ADD COLUMN description_en TEXT NULL;
ALTER TABLE products ADD COLUMN category_en VARCHAR(100) NULL;
ALTER TABLE products ADD COLUMN nominal_size VARCHAR(100) NULL;
ALTER TABLE products ADD COLUMN real_size VARCHAR(100) NULL;
ALTER TABLE products ADD COLUMN currency ENUM('MXN', 'USD') DEFAULT 'MXN';
ALTER TABLE products ADD COLUMN price_usd DECIMAL(10, 2) NULL;
ALTER TABLE products ADD COLUMN air_flow VARCHAR(255) NULL;
ALTER TABLE products ADD COLUMN tags VARCHAR(500) NULL;
ALTER TABLE products ADD COLUMN dimensions VARCHAR(100) NULL;
ALTER TABLE products ADD COLUMN weight VARCHAR(100) NULL;
ALTER TABLE products ADD COLUMN material VARCHAR(255) NULL;
ALTER TABLE products ADD COLUMN warranty VARCHAR(100) NULL;
ALTER TABLE products ADD COLUMN efficiency TEXT NULL;
ALTER TABLE products ADD COLUMN efficiency_en TEXT NULL;
ALTER TABLE products ADD COLUMN efficiency_class VARCHAR(100) NULL;
ALTER TABLE products ADD COLUMN characteristics TEXT NULL;
ALTER TABLE products ADD COLUMN characteristics_en TEXT NULL;
ALTER TABLE products ADD COLUMN frame_material VARCHAR(255) NULL;
ALTER TABLE products ADD COLUMN max_temperature VARCHAR(100) NULL;
ALTER TABLE products ADD COLUMN typical_installation TEXT NULL;
ALTER TABLE products ADD COLUMN typical_installation_en TEXT NULL;
ALTER TABLE products ADD COLUMN applications TEXT NULL;
ALTER TABLE products ADD COLUMN applications_en TEXT NULL;
ALTER TABLE products ADD COLUMN benefits TEXT NULL;
ALTER TABLE products ADD COLUMN benefits_en TEXT NULL;
