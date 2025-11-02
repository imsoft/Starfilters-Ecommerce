-- Script SQL para agregar las columnas de especificaciones técnicas a la tabla products
-- Ejecuta este script en phpMyAdmin de Hostinger

ALTER TABLE products 
ADD COLUMN weight VARCHAR(100) NULL AFTER dimensions,
ADD COLUMN material VARCHAR(255) NULL AFTER weight,
ADD COLUMN warranty VARCHAR(100) NULL AFTER material;

