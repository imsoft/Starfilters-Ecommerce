-- Tabla para beneficios del banner en la homepage
CREATE TABLE IF NOT EXISTS benefits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  text_es VARCHAR(255) NOT NULL,
  text_en VARCHAR(255) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Datos iniciales de ejemplo
INSERT INTO benefits (text_es, text_en, sort_order) VALUES
  ('Más de 40 años de experiencia en filtración industrial', 'Over 40 years of experience in industrial filtration', 1),
  ('Validación NEBB certificada', 'NEBB certified validation', 2),
  ('Envío gratuito en pedidos mayores a $5,000 MXN', 'Free shipping on orders over $5,000 MXN', 3),
  ('Soporte técnico profesional', 'Professional technical support', 4),
  ('Filtros HEPA con calidad certificada ISO 14644', 'HEPA filters with ISO 14644 certified quality', 5);
