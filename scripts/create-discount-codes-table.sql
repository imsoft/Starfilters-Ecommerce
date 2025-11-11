-- Tabla para códigos de descuento
CREATE TABLE IF NOT EXISTS discount_codes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  discount_type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
  discount_value DECIMAL(10, 2) NOT NULL,
  min_purchase_amount DECIMAL(10, 2) DEFAULT NULL,
  max_discount_amount DECIMAL(10, 2) DEFAULT NULL,
  usage_limit INT DEFAULT NULL,
  usage_count INT DEFAULT 0,
  start_date DATETIME DEFAULT NULL,
  end_date DATETIME DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_active (is_active),
  INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para registrar el uso de códigos de descuento
CREATE TABLE IF NOT EXISTS discount_code_usage (
  id INT PRIMARY KEY AUTO_INCREMENT,
  discount_code_id INT NOT NULL,
  order_id INT NOT NULL,
  user_id INT DEFAULT NULL,
  discount_amount DECIMAL(10, 2) NOT NULL,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (discount_code_id) REFERENCES discount_codes(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_discount_code (discount_code_id),
  INDEX idx_order (order_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar algunos códigos de ejemplo
INSERT INTO discount_codes (code, description, discount_type, discount_value, min_purchase_amount, is_active) VALUES
('BIENVENIDA10', 'Descuento de bienvenida del 10%', 'percentage', 10.00, 500.00, TRUE),
('VERANO2025', 'Descuento de verano $200 MXN', 'fixed', 200.00, 1000.00, TRUE),
('PRIMERACOMPRA', 'Primera compra 15% descuento', 'percentage', 15.00, 300.00, TRUE);
