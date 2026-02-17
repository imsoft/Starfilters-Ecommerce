-- Migración: Agregar campos de especificaciones técnicas a products
-- Estas columnas son necesarias para el formulario de edición de productos en el admin
-- Ejecutar en la base de datos de producción

ALTER TABLE products
  ADD COLUMN efficiency TEXT AFTER air_flow,
  ADD COLUMN efficiency_en TEXT AFTER efficiency,
  ADD COLUMN efficiency_class VARCHAR(100) AFTER efficiency_en,
  ADD COLUMN characteristics TEXT AFTER efficiency_class,
  ADD COLUMN characteristics_en TEXT AFTER characteristics,
  ADD COLUMN frame_material VARCHAR(255) AFTER characteristics_en,
  ADD COLUMN max_temperature VARCHAR(100) AFTER frame_material,
  ADD COLUMN typical_installation TEXT AFTER max_temperature,
  ADD COLUMN typical_installation_en TEXT AFTER typical_installation,
  ADD COLUMN applications TEXT AFTER typical_installation_en,
  ADD COLUMN applications_en TEXT AFTER applications,
  ADD COLUMN benefits TEXT AFTER applications_en,
  ADD COLUMN benefits_en TEXT AFTER benefits;
