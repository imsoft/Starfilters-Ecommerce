#!/usr/bin/env node
/**
 * Script para generar templates de Excel para importación masiva
 * Ejecutar: node scripts/generate-excel-templates.js
 */

import * as XLSX from 'xlsx';

// Template para Productos
const productosHeaders = [
  'sku',
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
  'estado',
  'etiquetas',
  'medida_nominal',
  'medida_real',
  'dimensiones',
  'peso',
  'material',
  'garantia',
  'bind_id',
  'id_bind',
  'codigo_de_producto',
  'flujo_aire',
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
  // Producto activo
  [
    'SF-HEPA-H13-2424',
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
    'SF-HEPA-H13-001',
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
  // Producto inactivo
  [
    'SF-PRE-G4-2020',
    'Filtro Prefiltro G4',
    'Pre-filter G4',
    'Prefiltro de baja eficiencia para sistemas de ventilación',
    'Low efficiency pre-filter for ventilation systems',
    '250.00',
    'MXN',
    '12.50',
    'Filtros de Aire',
    'Air Filters',
    'Prefiltros',
    '50',
    'inactive',
    'prefiltro, ventilacion',
    '20x20x2',
    '20x20x2',
    '500x500x50mm',
    '1.5kg',
    'Cartón',
    '6 meses',
    '',
    'PRE-G4-20-20',
    'SF-PRE-G4-001',
    '35% a 0.3µm',
    '35% at 0.3µm',
    'G4',
    'Marco de cartón, fácil instalación',
    'Cardboard frame, easy installation',
    'Cartón',
    '60°C',
    'Sistemas de ventilación general',
    'General ventilation systems',
    'Oficinas, comercios',
    'Offices, commercial',
    'Bajo costo, fácil mantenimiento',
    'Low cost, easy maintenance',
    '',
    '',
  ],
];

// Template para Categorías
const categoriasHeaders = [
  'nombre',
  'nombre_en',
  'descripcion',
  'descripcion_en',
  'imagen_principal',
  'estado',
];

const categoriasExample = [
  // Categoría activa
  [
    'Filtros HEPA',
    'HEPA Filters',
    'Filtros de alta eficiencia para partículas',
    'High efficiency particulate air filters',
    'https://ejemplo.com/hepa-category.jpg',
    'active',
  ],
  // Categoría inactiva
  [
    'Filtros Descontinuados',
    'Discontinued Filters',
    'Categoría de filtros que ya no se fabrican',
    'Category of filters that are no longer manufactured',
    '',
    'inactive',
  ],
];

// Función helper para aplicar negrita a la primera fila (encabezados)
function applyBoldHeaders(worksheet, headerCount) {
  // Aplicar negrita a todas las celdas de la primera fila
  for (let col = 0; col < headerCount; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    
    // Crear o actualizar el estilo de la celda
    worksheet[cellAddress].s = {
      font: { bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { fgColor: { rgb: 'E2E8F0' } }, // Fondo gris claro para encabezados
    };
  }
}

// Crear workbook para productos
const productosWB = XLSX.utils.book_new();
const productosWS = XLSX.utils.aoa_to_sheet([productosHeaders, ...productosExample]);
applyBoldHeaders(productosWS, productosHeaders.length);
XLSX.utils.book_append_sheet(productosWB, productosWS, 'Productos');

// Crear workbook para categorías
const categoriasWB = XLSX.utils.book_new();
const categoriasWS = XLSX.utils.aoa_to_sheet([categoriasHeaders, ...categoriasExample]);
applyBoldHeaders(categoriasWS, categoriasHeaders.length);
XLSX.utils.book_append_sheet(categoriasWB, categoriasWS, 'Categorías');

// Escribir archivos
XLSX.writeFile(productosWB, 'public/templates/productos-template.xlsx');
XLSX.writeFile(categoriasWB, 'public/templates/categorias-template.xlsx');

console.log('✅ Templates de Excel generados:');
console.log('   - public/templates/productos-template.xlsx');
console.log('   - public/templates/categorias-template.xlsx');
