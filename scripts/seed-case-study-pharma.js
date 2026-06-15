#!/usr/bin/env node

/**
 * Seed de un caso de éxito de ejemplo (industria farmacéutica), anonimizado.
 *
 * Basado en un proyecto real de cuarto limpio, SIN el nombre del cliente.
 * Crea:
 *   1. La entrada en `case_studies` (contenido completo: reto, solución, resultados)
 *      que se muestra en /casos-de-exito y su página de detalle.
 *   2. Una tarjeta en `portfolio_projects` para la "Galería de Proyectos" del home,
 *      enlazada al caso de éxito.
 *
 * Crea las tablas si no existen y es idempotente (no duplica por slug / link_url).
 *
 * Uso: node scripts/seed-case-study-pharma.js
 */

import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const IMAGE = '/images/cleanrooms-page/Construccion%20Cuartos%20Limpios%20Star%20Filters.JPG';
const SLUG = 'planta-farmaceutica-el-salto-jalisco';

const caseStudy = {
  slug: SLUG,
  title: 'Cuarto limpio para planta farmacéutica en El Salto, Jalisco',
  title_en: 'Cleanroom for a pharmaceutical plant in El Salto, Jalisco',
  industry: 'Farmacéutica',
  industry_en: 'Pharmaceutical',
  excerpt: 'Más de 3,000 m² desarrollados como contratista principal, con diseño en cumplimiento de NOM-059, GMP e ISO 14644.',
  excerpt_en: 'Over 3,000 m² delivered as main contractor, with a design compliant with NOM-059, GMP and ISO 14644.',
  challenge: 'Controlar los niveles de partículas en las áreas críticas de una planta farmacéutica, garantizando ambientes validados para la producción de sólidos, semisólidos e inyectables conforme a NOM-059, GMP e ISO 14644.',
  challenge_en: 'Control particle levels in the critical areas of a pharmaceutical plant, ensuring validated environments for the production of solids, semi-solids and injectables in compliance with NOM-059, GMP and ISO 14644.',
  solution: [
    '• Diseño, construcción y validación de líneas de producción de sólidos, semisólidos e inyectables.',
    '• Implementación de áreas especializadas, laboratorios y almacenes.',
    '• Instalación de más de 20 UMAs con sistemas HEPA, desecación y control ambiental.',
    '• Clasificaciones logradas desde ISO 9 hasta ISO 5 con flujo laminar.',
  ].join('\n'),
  solution_en: [
    '• Design, construction and validation of production lines for solids, semi-solids and injectables.',
    '• Implementation of specialized areas, laboratories and warehouses.',
    '• Installation of more than 20 AHUs with HEPA systems, desiccation and environmental control.',
    '• Cleanliness classifications achieved from ISO 9 to ISO 5 with laminar flow.',
  ].join('\n'),
  results: 'Más de 3,000 m² de áreas controladas entregadas como contratista principal, más de 20 UMAs instaladas y clasificaciones de ISO 9 a ISO 5 validadas. Proyecto desarrollado entre 2017 y 2022 en El Salto, Jalisco.',
  results_en: 'Over 3,000 m² of controlled areas delivered as main contractor, more than 20 AHUs installed, and ISO 9 to ISO 5 classifications validated. Project carried out between 2017 and 2022 in El Salto, Jalisco.',
  client_name: null, // Anonimizado a petición del cliente.
  featured_image: IMAGE,
  tags: 'Cuarto limpio, NOM-059, GMP, ISO 14644, UMA, HEPA, Flujo laminar',
};

const portfolioCard = {
  title: 'Cuarto limpio para planta farmacéutica',
  title_en: 'Cleanroom for a pharmaceutical plant',
  description: 'Más de 3,000 m² de áreas controladas en El Salto, Jalisco, en cumplimiento con NOM-059, GMP e ISO 14644.',
  description_en: 'Over 3,000 m² of controlled areas in El Salto, Jalisco, compliant with NOM-059, GMP and ISO 14644.',
  image_url: IMAGE,
  link_url: `/casos-de-exito/${SLUG}`,
};

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'starfilters_ecommerce_db',
  });

  console.log('🔗 Conectado a la base de datos.');

  // 1. Crear tablas si no existen.
  await connection.query(`
    CREATE TABLE IF NOT EXISTS case_studies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL UNIQUE,
      slug VARCHAR(255) NOT NULL UNIQUE,
      title VARCHAR(500) NOT NULL,
      title_en VARCHAR(500),
      industry VARCHAR(255) NOT NULL,
      industry_en VARCHAR(255),
      excerpt TEXT, excerpt_en TEXT,
      challenge TEXT, challenge_en TEXT,
      solution TEXT, solution_en TEXT,
      results TEXT, results_en TEXT,
      client_name VARCHAR(255),
      featured_image VARCHAR(1000),
      gallery_images TEXT,
      tags VARCHAR(500),
      is_active TINYINT(1) DEFAULT 1,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS portfolio_projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      title_en VARCHAR(255),
      description TEXT NOT NULL,
      description_en TEXT,
      image_url VARCHAR(500) NOT NULL,
      link_url VARCHAR(500),
      sort_order INT DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Tablas verificadas.');

  // 2. Caso de éxito (idempotente por slug).
  const [existingCase] = await connection.execute(
    'SELECT id FROM case_studies WHERE slug = ?',
    [caseStudy.slug]
  );
  if (existingCase.length > 0) {
    console.log('⏭️  El caso de éxito ya existe (slug:', caseStudy.slug + ').');
  } else {
    await connection.execute(
      `INSERT INTO case_studies
        (uuid, slug, title, title_en, industry, industry_en, excerpt, excerpt_en,
         challenge, challenge_en, solution, solution_en, results, results_en,
         client_name, featured_image, tags, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
      [
        randomUUID(), caseStudy.slug, caseStudy.title, caseStudy.title_en,
        caseStudy.industry, caseStudy.industry_en, caseStudy.excerpt, caseStudy.excerpt_en,
        caseStudy.challenge, caseStudy.challenge_en, caseStudy.solution, caseStudy.solution_en,
        caseStudy.results, caseStudy.results_en, caseStudy.client_name,
        caseStudy.featured_image, caseStudy.tags,
      ]
    );
    console.log('✅ Caso de éxito creado:', caseStudy.title);
  }

  // 3. Tarjeta de portafolio (idempotente por link_url).
  const [existingCard] = await connection.execute(
    'SELECT id FROM portfolio_projects WHERE link_url = ?',
    [portfolioCard.link_url]
  );
  if (existingCard.length > 0) {
    console.log('⏭️  La tarjeta de galería ya existe.');
  } else {
    await connection.execute(
      `INSERT INTO portfolio_projects
        (uuid, title, title_en, description, description_en, image_url, link_url, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)`,
      [
        randomUUID(), portfolioCard.title, portfolioCard.title_en,
        portfolioCard.description, portfolioCard.description_en,
        portfolioCard.image_url, portfolioCard.link_url,
      ]
    );
    console.log('✅ Tarjeta de galería creada y enlazada al caso de éxito.');
  }

  console.log('\n🎉 Listo. Caso de éxito en /casos-de-exito y tarjeta en la Galería de Proyectos del home.');
  await connection.end();
}

seed().catch((err) => {
  console.error('❌ Error en el seed:', err);
  process.exit(1);
});
