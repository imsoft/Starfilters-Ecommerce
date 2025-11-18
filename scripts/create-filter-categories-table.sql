-- Tabla para categorías de filtros
CREATE TABLE IF NOT EXISTS filter_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  description_en TEXT,
  main_image VARCHAR(500),
  efficiency VARCHAR(100),
  efficiency_class VARCHAR(100),
  characteristics TEXT,
  characteristics_en TEXT,
  typical_installation TEXT,
  typical_installation_en TEXT,
  applications TEXT,
  applications_en TEXT,
  benefits TEXT,
  benefits_en TEXT,
  max_temperature VARCHAR(50),
  frame_material VARCHAR(100),
  status ENUM('active', 'inactive', 'draft') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para imágenes de las categorías
CREATE TABLE IF NOT EXISTS filter_category_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES filter_categories(id) ON DELETE CASCADE,
  INDEX idx_category (category_id),
  INDEX idx_primary (is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para variantes/tamaños de las categorías
CREATE TABLE IF NOT EXISTS filter_category_variants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT NOT NULL,
  bind_code VARCHAR(50) NOT NULL UNIQUE,
  nominal_size VARCHAR(100) NOT NULL,
  real_size VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES filter_categories(id) ON DELETE CASCADE,
  INDEX idx_category (category_id),
  INDEX idx_bind_code (bind_code),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar ejemplo: Mini pleat sello gel downstream
INSERT INTO filter_categories (
  name,
  name_en,
  slug,
  description,
  description_en,
  main_image,
  efficiency,
  efficiency_class,
  characteristics,
  characteristics_en,
  typical_installation,
  typical_installation_en,
  applications,
  applications_en,
  benefits,
  benefits_en,
  max_temperature,
  frame_material
) VALUES (
  'Mini pleat sello gel downstream',
  'Mini pleat gel seal downstream',
  'mini-pleat-sello-gel-downstream',
  'El filtro HEPA mini pleat con sello de gel está diseñado para filtración terminal en áreas que requieren un muy alto nivel de limpieza. La función del sello gel es asegurar una hermeticidad perfecta entre el filtro y su marco de montaje, evitando fugas de aire no filtrado. La dirección del flujo de aire es hacia abajo y el gel se encuentra en el lado de salida del aire limpio, es decir, después del medio filtrante.',
  'The HEPA mini pleat filter with gel seal is designed for terminal filtration in areas requiring a very high level of cleanliness. The gel seal function is to ensure a perfect seal between the filter and its mounting frame, preventing unfiltered air leaks. The airflow direction is downward and the gel is located on the clean air outlet side, that is, after the filter media.',
  'filtro-hepa-mini-pleat-sello-gel-star-filters-1.jpg',
  '99.997%',
  'EN1822 Clase: H14',
  'Marco de aluminio\nTemperatura max. 70ºC',
  'Aluminum frame\nMax. temperature 70ºC',
  'En techos de cuartos limpios donde el aire fluye hacia abajo (por ejemplo, plafones o gabinetes terminales HEPA tipo laminar flow).',
  'In cleanroom ceilings where air flows downward (e.g., plenums or laminar flow HEPA terminal cabinets).',
  'Cuartos limpios ISO. Industria de productos electrónicos, producción de semiconductores, industria farmacéutica, máquinas de precisión, hospitales e industria alimentaria.',
  'ISO cleanrooms. Electronic products industry, semiconductor production, pharmaceutical industry, precision machinery, hospitals and food industry.',
  'Compacto y liviano\nAlta capacidad y tiempo de vida\nFácil instalación\n100% libre de fuga probado en cada filtro\nCaída de presión baja',
  'Compact and lightweight\nHigh capacity and lifetime\nEasy installation\n100% leak-free tested on each filter\nLow pressure drop',
  '70ºC',
  'Aluminio'
);

-- Obtener el ID de la categoría recién insertada
SET @category_id = LAST_INSERT_ID();

-- Insertar imágenes de la categoría
INSERT INTO filter_category_images (category_id, image_url, alt_text, is_primary, sort_order) VALUES
(@category_id, 'filtro-hepa-mini-pleat-sello-gel-star-filters-1.jpg', 'Filtro HEPA mini pleat sello gel - Vista 1', TRUE, 1),
(@category_id, 'filtro-hepa-mini-pleat-sello-gel-star-filters-2.jpg', 'Filtro HEPA mini pleat sello gel - Vista 2', FALSE, 2),
(@category_id, 'filtro-hepa-mini-pleat-sello-gel-star-filters-3.jpg', 'Filtro HEPA mini pleat sello gel - Vista 3', FALSE, 3),
(@category_id, 'filtro-hepa-mini-pleat-sello-gel-star-filters-4.jpg', 'Filtro HEPA mini pleat sello gel - Vista 4', FALSE, 4);

-- Insertar variantes/tamaños
INSERT INTO filter_category_variants (category_id, bind_code, nominal_size, real_size, price, stock) VALUES
(@category_id, 'HGD1', '9.125" x 9.125" x 3"', '231 x 231 x 75 mm', 158.00, 10),
(@category_id, 'HGD2', '9.125" x 21.125" x 3"', '231 x 536 x 75 mm', 184.00, 10),
(@category_id, 'HGD3', '21.75" x 20" x 3"', '552 x 510 x 75 mm', 276.00, 10),
(@category_id, 'HGD4', '21.125" x 21.125" x 3"', '536 x 536 x 75 mm', 265.00, 10),
(@category_id, 'HGD5', '21.75" x 44" x 3"', '552 x 1117 x 75 mm', 465.00, 10),
(@category_id, 'HGD6', '21.125" x 45.125" x 3"', '552 x 1146 x 75 mm', 480.00, 10),
(@category_id, 'HGD7', '22.375" x 46.375" x 3"', '1178 x 568 x 75 mm', 499.00, 10),
(@category_id, 'HGD8', '20.5" x 44.5" x 3"', '520 x 1130 x 75 mm', 480.00, 10),
(@category_id, 'HGD9', '6.125" x 6.125" x 3"', '156 x 156 x 75 mm', 145.00, 10),
(@category_id, 'HGD10', '20.875" x 44.875" x 3"', '530 x 1138 x 75 mm', 480.00, 10),
(@category_id, 'HGD11', '23.425" x 23.425" x 3"', '596 x 596 x 75 mm', 264.00, 10);
