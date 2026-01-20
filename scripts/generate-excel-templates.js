#!/usr/bin/env node
/**
 * Script para generar templates de Excel para importación masiva
 * Ejecutar: node scripts/generate-excel-templates.js
 */

import * as XLSX from 'xlsx';

// Template para Productos
const productosHeaders = [
  'nombre',
  'nombre_en',
  'descripcion',
  'descripcion_en',
  'precio',
  'moneda',
  'precio_usd',
  'categoria',
  'categoria_en',
  'categoria_filtro',
  'stock',
  'status',
  'tags',
  'tamaño_nominal',
  'tamaño_real',
  'dimensiones',
  'peso',
  'material',
  'garantia',
  'bind_id',
  'bind_code',
  'eficiencia',
  'eficiencia_en',
  'clase_eficiencia',
  'caracteristicas',
  'caracteristicas_en',
  'material_marco',
  'temperatura_maxima',
  'instalacion_tipica',
  'instalacion_tipica_en',
  'aplicaciones',
  'aplicaciones_en',
  'beneficios',
  'beneficios_en',
  'imagen_principal',
  'imagenes_carrusel',
];

const productosExample = [
  [
    'Filtro HEPA H13',
    'HEPA Filter H13',
    'Filtro HEPA de alta eficiencia para cuartos limpios',
    'High efficiency HEPA filter for cleanrooms',
    '1500.00',
    'MXN',
    '75.00',
    'Filtros de Aire',
    'Air Filters',
    'HEPA',
    '100',
    'active',
    'hepa, filtro, cuarto limpio',
    '24x24x11.5',
    '24x24x11.5',
    '610x610x292mm',
    '5kg',
    'Aluminio',
    '1 año',
    '',
    'HEPA-24-24-H13',
    '99.97% a 0.3µm',
    '99.97% at 0.3µm',
    'H13',
    'Marco de aluminio, sellado con goma',
    'Aluminum frame, rubber sealed',
    'Aluminio',
    '70°C',
    'Sistema de filtración de aire',
    'Air filtration system',
    'Cuartos limpios, hospitales',
    'Cleanrooms, hospitals',
    'Alta eficiencia, bajo consumo',
    'High efficiency, low consumption',
    'https://ejemplo.com/imagen-principal.jpg',
    'https://ejemplo.com/imagen1.jpg,https://ejemplo.com/imagen2.jpg',
  ],
];

// Template para Categorías
const categoriasHeaders = [
  'nombre',
  'nombre_en',
  'descripcion',
  'descripcion_en',
  'imagen_principal',
  'status',
];

const categoriasExample = [
  [
    'Filtros HEPA',
    'HEPA Filters',
    'Filtros de alta eficiencia para partículas',
    'High efficiency particulate air filters',
    'https://ejemplo.com/hepa-category.jpg',
    'active',
  ],
];

// Crear workbook para productos
const productosWB = XLSX.utils.book_new();
const productosWS = XLSX.utils.aoa_to_sheet([productosHeaders, ...productosExample]);
XLSX.utils.book_append_sheet(productosWB, productosWS, 'Productos');

// Crear workbook para categorías
const categoriasWB = XLSX.utils.book_new();
const categoriasWS = XLSX.utils.aoa_to_sheet([categoriasHeaders, ...categoriasExample]);
XLSX.utils.book_append_sheet(categoriasWB, categoriasWS, 'Categorías');

// Escribir archivos
XLSX.writeFile(productosWB, 'public/templates/productos-template.xlsx');
XLSX.writeFile(categoriasWB, 'public/templates/categorias-template.xlsx');

console.log('✅ Templates de Excel generados:');
console.log('   - public/templates/productos-template.xlsx');
console.log('   - public/templates/categorias-template.xlsx');
