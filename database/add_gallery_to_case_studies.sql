-- Agrega columna de galería de imágenes a casos de éxito
-- Ejecutar: mysql -u root -p starfilters_ecommerce_db < database/add_gallery_to_case_studies.sql

ALTER TABLE case_studies
  ADD COLUMN gallery_images TEXT DEFAULT NULL
  AFTER featured_image;
