-- Agregar columna bind_id a la tabla products
-- Esta columna almacenará el ID del producto en Bind ERP

ALTER TABLE products
ADD COLUMN bind_id VARCHAR(100) NULL AFTER uuid,
ADD INDEX idx_bind_id (bind_id);

-- Comentario para documentar el cambio
-- bind_id: ID del producto en Bind ERP para sincronización
