-- Migración para agregar campo profile_image a la tabla admin_users
-- Ejecutar en phpMyAdmin o cliente MySQL

ALTER TABLE admin_users 
ADD COLUMN profile_image VARCHAR(500) NULL AFTER full_name;

-- Actualizar el campo updated_at para que se actualice automáticamente
ALTER TABLE admin_users 
MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
