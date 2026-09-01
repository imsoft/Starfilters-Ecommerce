#!/usr/bin/env node

/**
 * Radiografía de SOLO LECTURA del catálogo.
 *
 * Sirve para ver cómo están capturados los productos en producción sin tener
 * que describirlos a mano: qué familias y subcategorías existen, qué productos
 * parecen ser el mismo modelo repetido por medida, dónde vive el precio y qué
 * fichas están incompletas.
 *
 * NO ESCRIBE NADA. Solo ejecuta SELECT. Se puede correr en producción sin
 * riesgo y sin sacar al sitio de servicio.
 *
 * Tampoco toca pedidos ni usuarios: no salen datos personales de clientes.
 *
 * Uso:
 *   node scripts/diagnostico-catalogo.js                → imprime en pantalla
 *   node scripts/diagnostico-catalogo.js > catalogo.txt → lo guarda en archivo
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const sep = (titulo) => console.log(`\n${'='.repeat(72)}\n${titulo}\n${'='.repeat(72)}`);
const si = (v) => (v ? 'sí' : '—');

// Quita medidas del nombre para adivinar qué productos son el mismo modelo:
// "Gabinete HEPA 24x24x12" y "Gabinete HEPA 12x12x6" comparten raíz.
const raizDelNombre = (nombre) =>
  String(nombre || '')
    .toLowerCase()
    .replace(/\d+\s*[".]?\s*[x×]\s*\d+(\s*[x×]\s*\d+)?/g, ' ')   // 24x24x12
    .replace(/\b\d+(\.\d+)?\s*(mm|cm|m|in|pulg|"|'')\b/g, ' ')    // 610 mm
    .replace(/\b\d+\s*\/\s*\d+\b/g, ' ')                          // 9 1/8
    .replace(/[^a-záéíóúñ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const main = async () => {
  const con = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const q = async (sql, params = []) => {
    const [filas] = await con.query(sql, params);
    return filas;
  };

  console.log(`Radiografía del catálogo — ${new Date().toISOString()}`);
  console.log(`Base de datos: ${process.env.DB_NAME}`);

  // ---------------------------------------------------------------- familias
  sep('1. FAMILIAS Y SUBCATEGORÍAS');
  const familias = await q(`
    SELECT p.id, p.name, p.slug, p.status,
           (SELECT COUNT(*) FROM filter_categories h WHERE h.parent_id = p.id) AS hijas_total,
           (SELECT COUNT(*) FROM filter_categories h WHERE h.parent_id = p.id AND h.status = 'active') AS hijas_activas
      FROM filter_categories p
     WHERE p.parent_id IS NULL
     ORDER BY p.name`);

  for (const f of familias) {
    console.log(`\n[${f.id}] ${f.name}  (${f.status}, slug: ${f.slug})`);
    console.log(`     subcategorías: ${f.hijas_activas} activas de ${f.hijas_total}`);
    const hijas = await q(
      'SELECT id, name, slug, status FROM filter_categories WHERE parent_id = ? ORDER BY name',
      [f.id]
    );
    for (const h of hijas) console.log(`       - [${h.id}] ${h.name} (${h.status})`);
    if (!hijas.length) console.log('       (ninguna — en la tienda no aparece el segundo selector)');
  }

  // ---------------------------------------------------------------- productos
  sep('2. PRODUCTOS POR FAMILIA');
  const productos = await q(`
    SELECT pr.id, pr.uuid, pr.name, pr.product_type, pr.status,
           pr.price, pr.currency, pr.nominal_size, pr.real_size,
           pr.bind_code, pr.sku, pr.filter_category_id,
           c.name AS categoria, padre.name AS familia, padre.id AS familia_id,
           (pr.characteristics IS NOT NULL AND pr.characteristics <> '') AS tiene_caracteristicas,
           (pr.benefits        IS NOT NULL AND pr.benefits        <> '') AS tiene_beneficios,
           (pr.applications    IS NOT NULL AND pr.applications    <> '') AS tiene_aplicaciones,
           (pr.dimensions      IS NOT NULL AND pr.dimensions      <> '') AS tiene_medidas,
           (pr.description     IS NOT NULL AND pr.description     <> '') AS tiene_descripcion,
           (SELECT COUNT(*) FROM filter_category_variants v WHERE v.product_id = pr.id) AS variantes
      FROM products pr
      LEFT JOIN filter_categories c     ON c.id = pr.filter_category_id
      LEFT JOIN filter_categories padre ON padre.id = COALESCE(c.parent_id, c.id)
     ORDER BY COALESCE(padre.name, 'ZZZ sin familia'), pr.name, pr.id`);

  let familiaActual = null;
  for (const p of productos) {
    const fam = p.familia || '(sin familia asignada)';
    if (fam !== familiaActual) {
      familiaActual = fam;
      const n = productos.filter((x) => (x.familia || '(sin familia asignada)') === fam).length;
      console.log(`\n--- ${fam} — ${n} productos ---`);
    }
    const medida = p.nominal_size || p.real_size || '';
    console.log(
      `  [${String(p.id).padStart(4)}] ${String(p.name).slice(0, 42).padEnd(44)}` +
      ` medida:${String(medida || '—').slice(0, 18).padEnd(20)}` +
      ` precio:${String(p.price ?? '—').padStart(10)} ${p.currency || ''}` +
      ` var:${String(p.variantes).padStart(2)}` +
      ` bind:${(p.bind_code || '—').slice(0, 14)}` +
      ` [${p.status}/${p.product_type}]`
    );
  }

  // ------------------------------------------------- posibles modelos repetidos
  sep('3. PRODUCTOS QUE PARECEN EL MISMO MODELO REPETIDO POR MEDIDA');
  console.log('Se agrupan por familia + nombre sin las medidas. Es una SUGERENCIA:');
  console.log('confírmala antes de usarla para unir nada.\n');

  const grupos = new Map();
  for (const p of productos) {
    const clave = `${p.familia_id || 0}|${raizDelNombre(p.name)}`;
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push(p);
  }

  const repetidos = [...grupos.entries()]
    .filter(([, lista]) => lista.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  if (!repetidos.length) {
    console.log('  Ninguno: no hay nombres que se repitan dentro de una familia.');
  } else {
    for (const [clave, lista] of repetidos) {
      const fam = lista[0].familia || '(sin familia)';
      console.log(`\n  ${lista.length} productos · ${fam} · raíz "${clave.split('|')[1]}"`);
      for (const p of lista) {
        console.log(
          `     [${String(p.id).padStart(4)}] ${String(p.name).slice(0, 46).padEnd(48)}` +
          ` medida: ${String(p.nominal_size || p.real_size || '—').slice(0, 22).padEnd(24)}` +
          ` precio: ${p.price ?? '—'}`
        );
      }
      const nombresDistintos = new Set(lista.map((p) => p.name)).size;
      console.log(`     → nombres distintos entre ellos: ${nombresDistintos} de ${lista.length}` +
        (nombresDistintos === 1 ? '  (mismo nombre exacto: la medida vive en su propio campo)' : '  (la medida va dentro del nombre)'));
    }
  }

  // ------------------------------------------------------------------ precios
  sep('4. DÓNDE VIVE EL PRECIO');
  const sinPrecioPropio = productos.filter((p) => Number(p.price) <= 0);
  console.log(`Productos con precio propio en cero: ${sinPrecioPropio.length} de ${productos.length}`);
  const conVariantes = sinPrecioPropio.filter((p) => p.variantes > 0);
  console.log(`  de esos, con variantes que sí tienen precio: ${conVariantes.length}`);
  console.log(`  de esos, SIN variantes (no tienen precio en ningún lado): ${sinPrecioPropio.length - conVariantes.length}`);
  for (const p of sinPrecioPropio.filter((x) => x.variantes === 0).slice(0, 25)) {
    console.log(`     [${p.id}] ${p.name}  (${p.familia || 'sin familia'})`);
  }

  // ------------------------------------------------------------ fichas vacías
  sep('5. FICHAS INCOMPLETAS');
  console.log('nombre                                     desc carac benef aplic medidas');
  for (const p of productos) {
    const faltan = !p.tiene_caracteristicas || !p.tiene_beneficios || !p.tiene_descripcion;
    if (!faltan) continue;
    console.log(
      `  [${String(p.id).padStart(4)}] ${String(p.name).slice(0, 38).padEnd(40)}` +
      ` ${si(p.tiene_descripcion).padEnd(5)}${si(p.tiene_caracteristicas).padEnd(6)}` +
      `${si(p.tiene_beneficios).padEnd(6)}${si(p.tiene_aplicaciones).padEnd(6)}${si(p.tiene_medidas)}`
    );
  }

  // -------------------------------------------------------------- variantes
  sep('6. VARIANTES (TAMAÑOS) YA REGISTRADAS');
  const variantes = await q(`
    SELECT v.product_id, COUNT(*) n, MIN(v.price) minimo, MAX(v.price) maximo,
           SUM(v.is_active = 1) activas, p.name
      FROM filter_category_variants v
      LEFT JOIN products p ON p.id = v.product_id
     GROUP BY v.product_id, p.name
     ORDER BY n DESC`);
  if (!variantes.length) console.log('  Ninguna.');
  for (const v of variantes.slice(0, 40)) {
    console.log(`  producto ${String(v.product_id ?? '—').padStart(5)} · ${String(v.name || '(sin producto asociado)').slice(0, 40).padEnd(42)} ${String(v.n).padStart(3)} tamaños (${v.activas} activos)  precios ${v.minimo} – ${v.maximo}`);
  }

  // -------------------------------------------------------------- resumen
  sep('RESUMEN');
  console.log(`  familias:              ${familias.length}`);
  console.log(`  subcategorías activas: ${familias.reduce((s, f) => s + Number(f.hijas_activas), 0)}`);
  console.log(`  productos:             ${productos.length}`);
  console.log(`  grupos repetidos:      ${repetidos.length} (suman ${repetidos.reduce((s, [, l]) => s + l.length, 0)} productos)`);
  console.log(`  con variantes:         ${productos.filter((p) => p.variantes > 0).length}`);
  console.log(`  sin precio propio:     ${sinPrecioPropio.length}`);

  await con.end();
};

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
