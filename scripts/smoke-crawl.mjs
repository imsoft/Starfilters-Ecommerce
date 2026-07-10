/**
 * Smoke test pre-deploy: recorre todas las rutas públicas (ES/EN) con un
 * navegador real en desktop y móvil, y reporta:
 *   - errores de JavaScript (pageerror / console.error)
 *   - páginas con status >= 400
 *   - recursos que responden 404
 *   - enlaces internos rotos (todos los <a href> descubiertos)
 *
 * Uso:
 *   1. pnpm build && PORT=3999 node server.js   (en otra terminal)
 *   2. node scripts/smoke-crawl.mjs             (o BASE=https://... node scripts/smoke-crawl.mjs)
 *
 * Requiere playwright con chromium instalado (npm i -g playwright && npx playwright install chromium,
 * o correrlo desde una carpeta que lo tenga en node_modules).
 * Termina con código de salida 1 si encuentra problemas.
 */
import { chromium, devices } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:3999';
const ROUTES = [
  '/', '/en',
  '/filtros', '/en/filters',
  '/cuartos-limpios', '/en/cleanrooms',
  '/servicios', '/en/services',
  '/soluciones', '/en/solutions',
  '/casos-de-exito', '/en/success-cases',
  '/productos', '/en/products',
  '/blog', '/en/blog',
  '/preguntas-frecuentes', '/en/faq',
  '/contacto', '/en/contact',
  '/acerca-de', '/en/about',
  '/carrito', '/en/cart', '/cart',
  '/accesorios',
  '/login', '/en/login',
  '/signup', '/en/signup',
  '/forgot-password', '/en/forgot-password',
  '/privacy', '/terms', '/en/privacy', '/en/terms',
];

// Ruido conocido que no es un bug (trackers externos, miniatura de YouTube
// con fallback onerror, abortos de media en headless).
const IGNORE = [
  'leadconnectorhq',
  'img.youtube.com',
  'res.cloudinary.com',
  'favicon',
  'via.placeholder.com',
  '/videos/',
];
const ignorable = (s) => IGNORE.some((p) => s.includes(p));

const problems = [];
const allLinks = new Set();

async function crawl(label, ctxOpts) {
  const browser = await chromium.launch();
  const context = await browser.newContext(ctxOpts);
  const page = await context.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !ignorable(m.text())) errs.push(`console: ${m.text().slice(0, 160)}`); });
  page.on('response', (r) => { if (r.status() === 404 && !ignorable(r.url())) errs.push(`404: ${r.url().slice(0, 140)}`); });

  for (const route of ROUTES) {
    errs.length = 0;
    let status = null;
    try {
      const resp = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 20000 });
      status = resp?.status();
      await page.waitForTimeout(400);
      if (label === 'desktop') {
        const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
        hrefs.filter((h) => h && h.startsWith('/') && !h.startsWith('//')).forEach((h) => allLinks.add(h.split('#')[0]));
      }
    } catch (e) {
      errs.push(`nav-error: ${e.message.slice(0, 120)}`);
    }
    if ((status && status >= 400) || errs.length) {
      problems.push({ ctx: label, route, status, errs: [...errs] });
    }
  }
  await browser.close();
}

console.log(`== crawl desktop (${BASE}) ==`);
await crawl('desktop', { viewport: { width: 1280, height: 900 } });
console.log('== crawl móvil (iPhone 13) ==');
await crawl('mobile', { ...devices['iPhone 13'] });

console.log(`== verificando ${allLinks.size} enlaces internos ==`);
const browser = await chromium.launch();
const ctx = await browser.newContext();
const broken = [];
for (const link of allLinks) {
  try {
    const r = await ctx.request.get(BASE + link, { maxRedirects: 5, timeout: 15000 });
    if (r.status() >= 400) broken.push({ link, status: r.status() });
  } catch (e) {
    broken.push({ link, status: 'ERR ' + e.message.slice(0, 60) });
  }
}
await browser.close();

console.log('\n===== PROBLEMAS EN PÁGINAS =====');
console.log(problems.length ? JSON.stringify(problems, null, 2) : '✅ ninguno');
console.log('\n===== ENLACES ROTOS =====');
console.log(broken.length ? JSON.stringify(broken, null, 2) : '✅ ninguno');

process.exit(problems.length || broken.length ? 1 : 0);
