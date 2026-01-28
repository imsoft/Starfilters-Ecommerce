-- Migración para agregar campo profile_image a la tabla users
-- Ejecutar en phpMyAdmin o cliente MySQL

ALTER TABLE users 
ADD COLUMN profile_image VARCHAR(500) NULL AFTER last_name;

-- Actualizar el campo updated_at para que se actualice automáticamente
ALTER TABLE users 
MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
