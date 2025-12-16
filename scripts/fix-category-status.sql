-- Script para corregir el status de categorías que están NULL
-- Ejecutar en phpMyAdmin o desde la línea de comandos

-- Ver categorías con status NULL
SELECT id, name, status FROM filter_categories WHERE status IS NULL;

-- Actualizar categorías con status NULL a 'active'
UPDATE filter_categories 
SET status = 'active' 
WHERE status IS NULL;

-- Verificar el cambio
SELECT id, name, status FROM filter_categories;

