-- Tres proyectos de ejemplo para la Galería de Proyectos
-- Ejecutar: mysql -u root -p starfilters_db < database/seed_portfolio_examples.sql

INSERT INTO portfolio_projects
  (uuid, title, title_en, description, description_en, image_url, link_url, sort_order, is_active)
VALUES
  (
    UUID(),
    'Cuarto Limpio ISO 7 – Laboratorio Farmacéutico',
    'ISO 7 Cleanroom – Pharmaceutical Laboratory',
    'Diseño e instalación de un cuarto limpio Clase 10,000 (ISO 7) para un laboratorio farmacéutico en Guadalajara. Incluye sistema HVAC con filtros HEPA, control de presión diferencial y monitoreo continuo de partículas.',
    'Design and installation of a Class 10,000 (ISO 7) cleanroom for a pharmaceutical laboratory in Guadalajara. Includes HVAC system with HEPA filters, differential pressure control, and continuous particle monitoring.',
    'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&auto=format&fit=crop',
    NULL,
    1,
    1
  ),
  (
    UUID(),
    'Sistema de Filtración HVAC – Planta Automotriz',
    'HVAC Filtration System – Automotive Plant',
    'Suministro e instalación de filtros de media eficiencia (MERV-11) y filtros de bolsa en el sistema de climatización de una planta de manufactura automotriz en Monterrey. Reducción del 40% en partículas suspendidas dentro de la línea de pintura.',
    'Supply and installation of medium-efficiency (MERV-11) and bag filters in the HVAC system of an automotive manufacturing plant in Monterrey. 40% reduction in suspended particles within the paint line.',
    'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&auto=format&fit=crop',
    NULL,
    2,
    1
  ),
  (
    UUID(),
    'Sala de Servidores con Control de Contaminación',
    'Server Room with Contamination Control',
    'Implementación de filtros electrostáticos y sistema de presión positiva para proteger una sala de servidores críticos en Ciudad de México. El proyecto garantiza un ambiente libre de polvo y humedad controlada para maximizar la vida útil del equipo.',
    'Implementation of electrostatic filters and positive pressure system to protect a critical server room in Mexico City. The project ensures a dust-free environment with controlled humidity to maximize equipment lifespan.',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop',
    NULL,
    3,
    1
  );
