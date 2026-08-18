CREATE TABLE IF NOT EXISTS testimonials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE,
  body TEXT NOT NULL,
  body_en TEXT,
  author VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  role_en VARCHAR(255),
  company_logo_url VARCHAR(500),
  project_image_url VARCHAR(500),
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Migrar testimonios existentes
INSERT INTO testimonials (uuid, body, body_en, author, role, role_en, company_logo_url, sort_order, is_active) VALUES
(
  UUID(),
  'Se han realizado trabajos de Cuarto Limpio, HVAC y venta de filtros de aire acondicionado HEPA y Pleat, quedando a nuestra total satisfacción.',
  'Cleanroom, HVAC, and HEPA filter projects were carried out to our complete satisfaction.',
  'Ing. Luis C.',
  'Facilities Engineer',
  'Facilities Engineer',
  '/images/home-page/flex.png',
  1, 1
),
(
  UUID(),
  'Nos gustaría destacar la seriedad y el compromiso por parte del Ing. Gentry y de todo su equipo para realizar el trabajo en el menor tiempo posible, cumpliendo así nuestro ajustado período para el término del proyecto.',
  'We would like to highlight the seriousness and commitment from Eng. Gentry and his entire team to complete the work in the shortest time possible, meeting our tight deadline.',
  'Alondra F. D.',
  'Gerente General',
  'General Manager',
  '/images/home-page/life.png',
  2, 1
),
(
  UUID(),
  'Nos permitimos recomendar ampliamente a la empresa Starfilters, quedando a nuestra total satisfacción con los filtros de aire acondicionado tipo Pleat, W, Metálico Lavable y de Bolsa.',
  'We highly recommend Starfilters; we were completely satisfied with their Pleat, W, Washable Metal, and Bag air filters.',
  'Ing. Ernesto O.B.',
  'Jefe de Mantenimiento',
  'Maintenance Manager',
  '/images/home-page/envases.png',
  3, 1
),
(
  UUID(),
  'Desde hace más de 10 años la relación persiste en los servicios rutinarios de monitoreo de partículas no viables tras la incorporación y puesta en marcha de varios sistemas de filtración y acondicionamiento de aire HVAC.',
  'For over 10 years we have trusted Starfilters for routine monitoring services after implementing multiple HVAC filtration systems. Their service is exceptional.',
  'QFB José N. C.',
  'Gerente de validación e ingeniería',
  'Validation and Engineering Manager',
  '/images/home-page/nordin.png',
  4, 1
),
(
  UUID(),
  'Se instaló, acondicionó y validó el Sistema de Aire HVAC, Air-Shower, Transfers, Puertas y Ventanas, quedando a satisfacción con los trabajos recibidos en tiempo y forma.',
  'They installed, conditioned, and validated our HVAC system, air showers, transfers, doors, and windows, delivering everything on time and to our satisfaction.',
  'Ing. Miguel R. A.',
  'Ingeniero Bioquímico',
  'Biochemical Engineer',
  '/images/home-page/itc.png',
  5, 1
),
(
  UUID(),
  'Star Filters demostró gran profesionalismo, habilidades técnicas y compromiso con la calidad en la construcción de un cuarto limpio ISO 5 de 1,622 m² en el Vancouver Innovation Center (The VIC). A pesar del plazo ajustado y los altos requerimientos, el equipo mantuvo una comunicación clara y constante, logrando un proyecto bien gestionado, dentro del presupuesto y con resultados sobresalientes. Altamente recomendados como socios en diseño, construcción y gestión de proyectos de cuartos limpios.',
  'Star Filters showed great professionalism, technical skill, and commitment to quality while building a 1,622 m² ISO 5 cleanroom at The VIC. Despite tight deadlines, they maintained clear communication and delivered outstanding results.',
  'Marc E.',
  'Principal and Cofounder',
  'Principal and Cofounder',
  '/images/home-page/nbpp.png',
  6, 1
);
