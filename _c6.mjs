import { chromium } from 'playwright';
import { anotarYCapturar } from './_anotar.mjs';
const P='https://srv1171123.hstgr.cloud', D='/tmp/dsg/manual/img';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 950 }, locale: 'es-MX' });
let p = await ctx.newPage();
await p.goto(P+'/productos?category=filtros-de-aire', { waitUntil:'networkidle', timeout:60000 });
const href = await p.$eval('a[href*="/product/"]', a=>a.getAttribute('href'));
await p.goto(P+href, { waitUntil:'networkidle', timeout:60000 });
await p.waitForTimeout(1500);
const c = await (await p.$('#add-to-cart-btn')).boundingBox();
await p.evaluate(y => window.scrollTo(0, y), Math.max(0, c.y - 300));
await p.waitForTimeout(600);
await anotarYCapturar(p, { archivo: `${D}/c6-agregar.png`, clip: null,
  marcas: [{ sel: '#add-to-cart-btn', texto: 'Agrega la medida elegida al carrito', n:1, lado:'der' }] });
// recorte manual a la zona del botón
const c2 = await (await p.$('#add-to-cart-btn')).boundingBox();
console.log('botón en y=', Math.round(c2.y));
await b.close();
