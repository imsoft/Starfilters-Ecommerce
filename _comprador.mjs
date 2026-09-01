import { chromium } from 'playwright';
import { anotarYCapturar } from './_anotar.mjs';
const P = 'https://srv1171123.hstgr.cloud';
const D = '/tmp/dsg/manual/img';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 950 }, locale: 'es-MX' });
const ir = async (u, esperar = 1500) => {
  const p = await ctx.newPage();
  await p.goto(P + u, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(esperar);
  return p;
};
const hecho = [];
const reg = (n) => { hecho.push(n); console.log('  ✓', n); };

// C1 — Inicio y menú
let p = await ir('/');
await anotarYCapturar(p, { archivo: `${D}/c1-inicio.png`, clip: { x:0, y:0, width:1440, height:560 }, marcas: [
  { sel: 'header nav a[href="/"]', texto: 'Regresa al inicio', n:1, lado:'abajo' },
  { sel: 'header nav', texto: 'Menú principal del sitio', n:2, lado:'abajo' },
]});
reg('c1-inicio'); await p.close();

// C2 — Idioma y moneda
p = await ir('/');
await anotarYCapturar(p, { archivo: `${D}/c2-idioma.png`, clip: { x:820, y:0, width:620, height:230 }, marcas: [
  { sel: '[data-region-toggle]', texto: 'Cambia idioma y moneda', n:1, lado:'abajo' },
]});
reg('c2-idioma'); await p.close();

// C3 — Catálogo con filtros
p = await ir('/productos?category=filtros-de-aire');
await anotarYCapturar(p, { archivo: `${D}/c3-catalogo.png`, clip: { x:0, y:70, width:1440, height:640 }, marcas: [
  { sel: '#filter-product-type', texto: 'Familia de producto', n:1, lado:'abajo' },
  { sel: '#filter-filter-type', texto: 'Tipo dentro de la familia', n:2, lado:'der' },
]});
reg('c3-catalogo'); await p.close();

// C4 — Tarjeta de producto
p = await ir('/productos?category=filtros-de-aire');
const tarjeta = await p.$('[data-name]');
if (tarjeta) {
  const caja = await tarjeta.boundingBox();
  await anotarYCapturar(p, { archivo: `${D}/c4-tarjeta.png`,
    clip: { x: Math.max(0,caja.x-30), y: Math.max(0,caja.y-30), width: 700, height: caja.height+90 },
    marcas: [
      { sel: 'a.block.w-full', texto: 'Abre la ficha para elegir medida y ver precio', n:1, lado:'der' },
    ]});
  reg('c4-tarjeta');
}
await p.close();

// C5 — Ficha de producto
const enlace = await (async () => { const q = await ir('/productos?category=filtros-de-aire'); const h = await q.$eval('a[href*="/product/"]', a=>a.getAttribute('href')).catch(()=>null); await q.close(); return h; })();
if (enlace) {
  p = await ir(enlace);
  await anotarYCapturar(p, { archivo: `${D}/c5-ficha.png`, clip: { x:0, y:60, width:1440, height:820 }, marcas: [
    { sel: 'select', texto: 'Elige la medida: el precio cambia con ella', n:1, lado:'izq' },
  ]});
  reg('c5-ficha');
  // C6 — botón agregar
  const btn = await p.$('button:has-text("Agregar"), button:has-text("carrito")');
  if (btn) {
    const c = await btn.boundingBox();
    await anotarYCapturar(p, { archivo: `${D}/c6-agregar.png`,
      clip: { x: Math.max(0,c.x-320), y: Math.max(0,c.y-190), width: 1000, height: 330 },
      marcas: [{ sel: '#add-to-cart-btn, button[id*="add"], form button[type="submit"]', texto: 'Agrega la medida elegida al carrito', n:1, lado:'arriba' }]});
    reg('c6-agregar');
  }
  await p.close();
}
console.log('\nтotal:', hecho.length);
await b.close();
