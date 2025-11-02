-- Script SQL para agregar la columna dimensions a la tabla products
-- Ejecuta este script en phpMyAdmin de Hostinger

ALTER TABLE products 
ADD COLUMN dimensions VARCHAR(100) NULL 
AFTER tags;

