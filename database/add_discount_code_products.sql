-- Tabla para asociar productos específicos con códigos de descuento
CREATE TABLE IF NOT EXISTS discount_code_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    discount_code_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_discount_product (discount_code_id, product_id),
    FOREIGN KEY (discount_code_id) REFERENCES discount_codes(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_discount_code_id (discount_code_id),
    INDEX idx_product_id (product_id)
);
