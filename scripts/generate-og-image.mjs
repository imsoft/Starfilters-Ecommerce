/**
 * Genera la imagen OG 1200x630 para redes sociales
 * usando sharp para componer logo + fondo + texto
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir  = resolve(__dirname, '../public');

// SVG de la imagen OG — fondo azul marino con logo y tagline
const ogSvg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e3a5f"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#1d4ed8"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
  </defs>

  <!-- Fondo -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Franja de color izquierda -->
  <rect x="0" y="0" width="8" height="630" fill="url(#accent)"/>

  <!-- Círculos decorativos -->
  <circle cx="1100" cy="80"  r="180" fill="#1d4ed8" opacity="0.12"/>
  <circle cx="980"  cy="580" r="220" fill="#1d4ed8" opacity="0.08"/>
  <circle cx="120"  cy="560" r="140" fill="#3b82f6" opacity="0.07"/>

  <!-- Logo placeholder (texto STAR FILTERS) -->
  <text x="80" y="120" font-family="Arial, sans-serif" font-size="52" font-weight="900"
        fill="#ffffff" letter-spacing="2">STAR</text>
  <text x="80" y="175" font-family="Arial, sans-serif" font-size="52" font-weight="900"
        fill="#3b82f6" letter-spacing="2">FILTERS</text>

  <!-- Línea separadora -->
  <rect x="80" y="205" width="120" height="4" fill="#3b82f6" rx="2"/>

  <!-- Tagline principal -->
  <text x="80" y="310" font-family="Arial, sans-serif" font-size="68" font-weight="700"
        fill="#ffffff">Controlamos</text>
  <text x="80" y="390" font-family="Arial, sans-serif" font-size="68" font-weight="700"
        fill="#ffffff">partículas en</text>
  <text x="80" y="470" font-family="Arial, sans-serif" font-size="68" font-weight="700"
        fill="#3b82f6">el aire.</text>

  <!-- Subtítulo -->
  <text x="80" y="545" font-family="Arial, sans-serif" font-size="28" fill="#94a3b8">
    Filtros industriales · Cuartos Limpios · Servicios de Validación
  </text>

  <!-- URL -->
  <text x="80" y="600" font-family="Arial, sans-serif" font-size="22" fill="#64748b">
    starfilters.mx
  </text>

  <!-- Ícono de filtro decorativo derecha -->
  <g transform="translate(850, 200)" opacity="0.15">
    <path d="M0 40 L280 40 L280 80 L0 80 Z" fill="#3b82f6"/>
    <path d="M40 110 L240 110 L240 150 L40 150 Z" fill="#3b82f6"/>
    <path d="M80 180 L200 180 L200 220 L80 220 Z" fill="#3b82f6"/>
    <path d="M120 250 L160 250 L160 310 L120 310 Z" fill="#3b82f6"/>
  </g>
</svg>
`.trim();

console.log('Generando og-image.jpg (1200×630)...');

await sharp(Buffer.from(ogSvg))
  .jpeg({ quality: 92, mozjpeg: true })
  .toFile(resolve(outDir, 'og-image.jpg'));

console.log('✅ og-image.jpg generado en /public/');
