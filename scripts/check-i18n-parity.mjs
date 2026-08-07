#!/usr/bin/env node
/**
 * Comprueba que cada página en inglés tenga el MISMO diseño que su equivalente
 * en español. Compara la secuencia de atributos class= del markup: los textos y
 * las rutas cambian entre idiomas, pero las clases de Tailwind describen el
 * diseño y deben ser idénticas.
 *
 * Nació de encontrar /en/product/[id] con una plantilla vieja y distinta a
 * /product/[id]. Correr antes de desplegar:  pnpm check:i18n
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Mapa de ruta española -> ruta inglesa (relativas a src/pages).
const PAIRS = [
  ['index.astro', 'en/index.astro'],
  ['acerca-de/index.astro', 'en/about/index.astro'],
  ['blog/index.astro', 'en/blog/index.astro'],
  ['blog/[uuid]/index.astro', 'en/blog/[uuid]/index.astro'],
  ['carrito/index.astro', 'en/cart/index.astro'],
  ['casos-de-exito/index.astro', 'en/success-cases/index.astro'],
  ['casos-de-exito/[slug]/index.astro', 'en/success-cases/[slug]/index.astro'],
  ['change-password/index.astro', 'en/change-password/index.astro'],
  ['checkout/index.astro', 'en/checkout/index.astro'],
  ['contacto/index.astro', 'en/contact/index.astro'],
  ['cuartos-limpios/index.astro', 'en/cleanrooms/index.astro'],
  ['filtros/index.astro', 'en/filters/index.astro'],
  ['filtros/[slug]/index.astro', 'en/filters/[slug]/index.astro'],
  ['forgot-password/index.astro', 'en/forgot-password/index.astro'],
  ['login/index.astro', 'en/login/index.astro'],
  ['orders/index.astro', 'en/orders/index.astro'],
  ['orders/[id]/index.astro', 'en/orders/[id]/index.astro'],
  ['preguntas-frecuentes/index.astro', 'en/faq/index.astro'],
  ['privacy/index.astro', 'en/privacy/index.astro'],
  ['product/[id]/index.astro', 'en/product/[id]/index.astro'],
  ['productos/index.astro', 'en/products/index.astro'],
  ['profile/index.astro', 'en/profile/index.astro'],
  ['reset-password/index.astro', 'en/reset-password/index.astro'],
  ['servicios/index.astro', 'en/services/index.astro'],
  ['signup/index.astro', 'en/signup/index.astro'],
  ['signup/success.astro', 'en/signup/success.astro'],
  ['soluciones/index.astro', 'en/solutions/index.astro'],
  ['terms/index.astro', 'en/terms/index.astro'],
  ['verify-email/index.astro', 'en/verify-email/index.astro'],
];

/** Clases de Tailwind en orden de aparición: la huella del diseño de la página. */
function classFingerprint(file) {
  const src = readFileSync(file, 'utf8');
  return [...src.matchAll(/class=["']([^"']*)["']/g)].map((m) =>
    // El orden dentro del atributo no cambia el resultado visual.
    m[1].trim().split(/\s+/).sort().join(' ')
  );
}

let failures = 0;
let skipped = 0;

for (const [esRel, enRel] of PAIRS) {
  const es = join(root, 'src/pages', esRel);
  const en = join(root, 'src/pages', enRel);

  if (!existsSync(es) || !existsSync(en)) {
    console.log(`⏭️  ${esRel} ↔ ${enRel} (falta alguno de los dos)`);
    skipped++;
    continue;
  }

  const a = classFingerprint(es);
  const b = classFingerprint(en);

  if (a.length === b.length && a.every((cls, i) => cls === b[i])) {
    console.log(`✅ ${esRel} ↔ ${enRel}`);
    continue;
  }

  failures++;
  console.log(`\n❌ ${esRel} ↔ ${enRel} — el diseño NO coincide`);
  console.log(`   bloques con class: ${a.length} (es) vs ${b.length} (en)`);

  const max = Math.max(a.length, b.length);
  let shown = 0;
  for (let i = 0; i < max && shown < 5; i++) {
    if (a[i] !== b[i]) {
      console.log(`   #${i + 1}`);
      console.log(`     es: ${a[i] ?? '(no existe)'}`);
      console.log(`     en: ${b[i] ?? '(no existe)'}`);
      shown++;
    }
  }
  console.log('');
}

console.log(
  `\n${failures === 0 ? '✅' : '❌'} ${PAIRS.length - skipped} pares comparados, ` +
  `${failures} con diseños distintos${skipped ? `, ${skipped} omitidos` : ''}.`
);

if (failures > 0) {
  console.log(
    'Arregla la página en inglés para que use el mismo markup que la española\n' +
    '(o mejor: extrae la vista a un componente compartido con un prop `lang`,\n' +
    'como src/components/shared/ProductDetail.astro).'
  );
  process.exit(1);
}
