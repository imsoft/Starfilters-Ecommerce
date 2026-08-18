-- Medidas del paquete para cotizar envíos con Pakke.
--
-- Las columnas previas `weight` y `dimensions` son VARCHAR(100) de texto libre
-- ("23", "231 x 231 mm"), imposibles de usar en un cálculo de tarifas. Estas
-- son numéricas y se capturan desde el formulario de producto del admin.
--
-- Se dejan NULL a propósito: mientras un producto no las tenga, la cotización
-- usa el paquete por defecto configurado en las variables PAKKE_DEFAULT_*.
--
-- OPCIONAL: la aplicación crea estas columnas sola (ensureProductColumns en
-- lib/product-service.ts) la primera vez que se guarda un producto o se pide
-- una cotización. Este archivo sirve para adelantarlo en un despliegue.
-- Si ya existen, MySQL responde "Duplicate column name" y no pasa nada.

ALTER TABLE products ADD COLUMN package_weight_kg DECIMAL(8,3) NULL COMMENT 'Peso del paquete en kg';
ALTER TABLE products ADD COLUMN package_length_cm DECIMAL(8,2) NULL COMMENT 'Largo del paquete en cm';
ALTER TABLE products ADD COLUMN package_width_cm  DECIMAL(8,2) NULL COMMENT 'Ancho del paquete en cm';
ALTER TABLE products ADD COLUMN package_height_cm DECIMAL(8,2) NULL COMMENT 'Alto del paquete en cm';
