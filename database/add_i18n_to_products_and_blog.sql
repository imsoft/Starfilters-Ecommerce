-- Agregar campos de traducción para productos y blog
-- Ejecutar este script después del schema.sql principal

-- Modificar tabla de productos para agregar campos en inglés
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS name_en VARCHAR(255),
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS category_en VARCHAR(100);

-- Modificar tabla de blog para agregar campos en inglés
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS title_en VARCHAR(255),
ADD COLUMN IF NOT EXISTS slug_en VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS content_en LONGTEXT,
ADD COLUMN IF NOT EXISTS excerpt_en TEXT,
ADD COLUMN IF NOT EXISTS meta_title_en VARCHAR(255),
ADD COLUMN IF NOT EXISTS meta_description_en TEXT;

-- Crear índices para los nuevos campos
CREATE INDEX IF NOT EXISTS idx_products_category_en ON products(category_en);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug_en ON blog_posts(slug_en);

-- Actualizar los datos existentes con traducciones de ejemplo (opcional)
UPDATE products SET 
    name_en = CASE 
        WHEN name = 'Filtro de Aire Premium' THEN 'Premium Air Filter'
        WHEN name = 'Filtro de Aceite Standard' THEN 'Standard Oil Filter'
        WHEN name = 'Filtro de Combustible' THEN 'Fuel Filter'
        ELSE CONCAT(name, ' (EN)')
    END,
    description_en = CASE 
        WHEN name = 'Filtro de Aire Premium' THEN 'High quality air filter for better engine performance'
        WHEN name = 'Filtro de Aceite Standard' THEN 'Standard oil filter for regular maintenance'
        WHEN name = 'Filtro de Combustible' THEN 'Fuel filter for injection system protection'
        ELSE description
    END,
    category_en = CASE 
        WHEN category = 'Filtros de Aire' THEN 'Air Filters'
        WHEN category = 'Filtros de Aceite' THEN 'Oil Filters'
        WHEN category = 'Filtros de Combustible' THEN 'Fuel Filters'
        ELSE category
    END;

-- Actualizar blog posts existentes
UPDATE blog_posts SET 
    title_en = CASE 
        WHEN title = 'Guía Completa de Mantenimiento de Filtros' THEN 'Complete Filter Maintenance Guide'
        WHEN title = 'Tipos de Filtros y Sus Funciones' THEN 'Types of Filters and Their Functions'
        ELSE CONCAT(title, ' (EN)')
    END,
    slug_en = CASE 
        WHEN slug = 'guia-mantenimiento-filtros' THEN 'filter-maintenance-guide'
        WHEN slug = 'tipos-filtros-funciones' THEN 'filter-types-and-functions'
        ELSE CONCAT(slug, '-en')
    END,
    excerpt_en = CASE 
        WHEN excerpt LIKE '%mantenimiento%' THEN 'Learn everything about proper maintenance of your vehicle filters'
        WHEN excerpt LIKE '%tipos%' THEN 'Learn about different types of filters and their specific functions'
        ELSE excerpt
    END;
