-- Migración: Agregar campos de especificaciones técnicas a products
-- Estas columnas son necesarias para el formulario de edición de productos en el admin
-- Ejecutar en la base de datos de producción

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS efficiency TEXT AFTER air_flow,
  ADD COLUMN IF NOT EXISTS efficiency_en TEXT AFTER efficiency,
  ADD COLUMN IF NOT EXISTS efficiency_class VARCHAR(100) AFTER efficiency_en,
  ADD COLUMN IF NOT EXISTS characteristics TEXT AFTER efficiency_class,
  ADD COLUMN IF NOT EXISTS characteristics_en TEXT AFTER characteristics,
  ADD COLUMN IF NOT EXISTS frame_material VARCHAR(255) AFTER characteristics_en,
  ADD COLUMN IF NOT EXISTS max_temperature VARCHAR(100) AFTER frame_material,
  ADD COLUMN IF NOT EXISTS typical_installation TEXT AFTER max_temperature,
  ADD COLUMN IF NOT EXISTS typical_installation_en TEXT AFTER typical_installation,
  ADD COLUMN IF NOT EXISTS applications TEXT AFTER typical_installation_en,
  ADD COLUMN IF NOT EXISTS applications_en TEXT AFTER applications,
  ADD COLUMN IF NOT EXISTS benefits TEXT AFTER applications_en,
  ADD COLUMN IF NOT EXISTS benefits_en TEXT AFTER benefits;
