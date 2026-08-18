-- Crear tabla de configuración del sitio
CREATE TABLE IF NOT EXISTS site_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar valores por defecto
INSERT INTO site_settings (setting_key, setting_value) VALUES
('hero_image', '/images/hero-default.jpg'),
('whatsapp_number', ''),
('whatsapp_message', 'Hola, me gustaría obtener más información sobre sus productos.')
ON DUPLICATE KEY UPDATE setting_key=setting_key;
