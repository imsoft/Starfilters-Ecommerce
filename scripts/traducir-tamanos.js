/**
 * Rellena `filter_category_variants.nominal_size_en` con la traducción al inglés
 * del nombre del tamaño/modelo.
 *
 * Por qué existe: la ficha de producto en inglés muestra el nombre en español
 * cuando la traducción está vacía (respaldo intencional en ProductDetail.astro,
 * si no el selector saldría en blanco). Capturar a mano fila por fila en el
 * admin es lento cuando hay decenas de variantes.
 *
 * Solo traduce nombres que son TEXTO. Las medidas puras ("21.125\" x 21.125\" x 3\"")
 * se escriben igual en los dos idiomas: se dejan vacías a propósito para que el
 * respaldo las muestre tal cual.
 *
 * Uso:
 *   node scripts/traducir-tamanos.js            # simula, no escribe nada
 *   node scripts/traducir-tamanos.js --aplicar  # escribe en la base de datos
 *
 * Solo rellena filas vacías: nunca pisa una traducción ya capturada a mano.
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const APLICAR = process.argv.includes('--aplicar');

/**
 * Diccionario español → inglés, del más largo al más corto para que
 * "rango de presión" gane sobre "rango".
 *
 * No incluye preposiciones sueltas ("de" → "of"): traducirlas palabra por
 * palabra producía spanglish ("Filtro de bolsa" → "Filtro of bag"), que es peor
 * que dejar el nombre en español. Aquí se prefiere no traducir a traducir mal.
 */
const TRADUCCIONES = [
  // Unidades de presión y accesorios de manómetro. Van primero porque son
  // frases completas y deben ganar sobre las palabras sueltas de abajo.
  ['pulgadas de columna de agua', 'inches of water column'],
  ['columna de agua', 'water column'],
  ['con alarma', 'with alarm'],
  ['sin alarma', 'without alarm'],
  ['con imán', 'with magnet'],
  ['con iman', 'with magnet'],
  ['pascales', 'pascals'],
  ['pascal', 'pascal'],
  ['alarma', 'alarm'],
  ['agua', 'water'],
  ['columna', 'column'],
  ['rango de presión', 'pressure range'],
  ['rango de presion', 'pressure range'],
  ['filtro de bolsa', 'bag filter'],
  ['celda de carbón activado', 'activated carbon cell'],
  ['celda de carbon activado', 'activated carbon cell'],
  ['carbón activado', 'activated carbon'],
  ['carbon activado', 'activated carbon'],
  ['acero inoxidable', 'stainless steel'],
  ['alta eficiencia', 'high efficiency'],
  ['media eficiencia', 'medium efficiency'],
  ['mediana eficiencia', 'medium efficiency'],
  ['baja eficiencia', 'low efficiency'],
  ['flujo laminar', 'laminar flow'],
  ['cuarto limpio', 'cleanroom'],
  ['sin marco', 'frameless'],
  ['con marco', 'framed'],
  ['manómetro', 'pressure gauge'],
  ['manometro', 'pressure gauge'],
  ['analógico', 'analog'],
  ['analogico', 'analog'],
  ['análogo', 'analog'],
  ['analogo', 'analog'],
  ['prefiltro', 'prefilter'],
  ['filtro', 'filter'],
  ['izquierda', 'left'],
  ['derecha', 'right'],
  ['presión', 'pressure'],
  ['presion', 'pressure'],
  ['plegado', 'pleated'],
  ['redondo', 'round'],
  ['cuadrado', 'square'],
  ['bolsa', 'bag'],
  ['celda', 'cell'],
  ['rango', 'range'],
  ['marco', 'frame'],
  ['grande', 'large'],
  ['mediano', 'medium'],
  ['chico', 'small'],
  ['ancho', 'width'],
  ['alto', 'height'],
  ['largo', 'length'],
  ['doble', 'double'],
  ['sencillo', 'single'],
  ['simple', 'single'],
  ['metros', 'meters'],
  ['metro', 'meter'],
  ['litros', 'liters'],
  ['litro', 'liter'],
  ['pulgadas', 'inches'],
  ['pulgada', 'inch'],
  ['blanco', 'white'],
  ['negro', 'black'],
  ['gris', 'grey'],
  ['azul', 'blue'],
  ['modelo', 'model'],
  ['tipo', 'type'],
  ['nuevo', 'new'],
  ['digital', 'digital'],
];

/**
 * Palabras que pueden quedar en el resultado sin ser un error: unidades,
 * siglas técnicas y términos que se escriben igual en los dos idiomas.
 */
const ACEPTADAS = new Set([
  'mm', 'cm', 'm', 'in', 'pa', 'kpa', 'psi', 'cfm', 'lpm', 'mpt', 'npt',
  'hepa', 'ulpa', 'merv', 'iso', 'astm', 'pvc', 'led', 'usb', 'ip',
  'digital', 'analog', 'standard', 'star', 'filters', 'x', 'a', 'b', 'c',
]);

/** Aplica la capitalización de `origen` a `destino`. */
const respetarMayusculas = (origen, destino) => {
  if (origen === origen.toUpperCase() && origen.length > 1) return destino.toUpperCase();
  if (origen[0] === origen[0].toUpperCase()) {
    return destino.charAt(0).toUpperCase() + destino.slice(1);
  }
  return destino;
};

const traducir = (texto) => {
  let out = texto;
  for (const [es, en] of TRADUCCIONES) {
    const re = new RegExp(`(?<![\\p{L}])${es.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'giu');
    out = out.replace(re, (m) => respetarMayusculas(m, en));
  }
  return out;
};

/**
 * Palabras del resultado que siguen pareciendo español: o llevan tilde/ñ, o no
 * están en el diccionario ni en la lista de aceptadas. Si queda alguna, el
 * script NO escribe: prefiere dejarlo para revisión manual antes que publicar
 * una mezcla de los dos idiomas.
 */
const palabrasSinTraducir = (resultado) => {
  const traducidas = new Set(
    TRADUCCIONES.flatMap(([, en]) => en.toLowerCase().split(/\s+/))
  );
  return (resultado.match(/\p{L}+/gu) || []).filter((w) => {
    const lw = w.toLowerCase();
    if (ACEPTADAS.has(lw) || traducidas.has(lw)) return false;
    // tilde o ñ ⇒ español seguro
    if (/[áéíóúüñ]/i.test(w)) return true;
    // palabra larga desconocida ⇒ sospechosa
    return lw.length > 2;
  });
};

/** true si el nombre lleva letras suficientes para que traducir tenga sentido. */
const esTraducible = (texto) => {
  if (!texto) return false;
  // Descarta medidas puras: 21.125" x 21.125" x 3", 231 x 231 mm, 5", etc.
  const soloLetras = texto.replace(/[^\p{L}]/gu, '');
  if (soloLetras.length < 3) return false;
  if (/^(mm|cm|m|in|pa|kpa|psi|cfm|lpm|x)+$/i.test(soloLetras)) return false;
  return true;
};

const main = async () => {
  const cx = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [filas] = await cx.query(
    `SELECT v.id, v.nominal_size, COALESCE(p.name, c.name, '') AS producto
       FROM filter_category_variants v
       LEFT JOIN products p ON p.id = v.product_id
       LEFT JOIN filter_categories c ON c.id = v.category_id
      WHERE v.nominal_size IS NOT NULL
        AND v.nominal_size <> ''
        AND (v.nominal_size_en IS NULL OR v.nominal_size_en = '')`
  );

  const candidatas = filas.filter((f) => esTraducible(f.nominal_size));
  const medidas = filas.length - candidatas.length;

  console.log(`\nVariantes sin traducción: ${filas.length}`);
  console.log(`  · medidas puras (se dejan vacías a propósito): ${medidas}`);
  console.log(`  · con texto traducible: ${candidatas.length}\n`);

  if (candidatas.length === 0) {
    console.log('No hay nada que traducir.');
    await cx.end();
    return;
  }

  let cambios = 0;
  const revisar = [];

  for (const f of candidatas) {
    const en = traducir(f.nominal_size);

    if (en === f.nominal_size) {
      revisar.push([f, 'ninguna palabra del diccionario']);
      continue;
    }

    // Si quedaron palabras en español, no se escribe: media traducción se lee
    // peor que el nombre original completo en español.
    const pendientes = palabrasSinTraducir(en);
    if (pendientes.length > 0) {
      revisar.push([f, `quedaría a medias: "${en}" (sin traducir: ${pendientes.join(', ')})`]);
      continue;
    }

    console.log(`  →  [${f.producto}] "${f.nominal_size}"  ⇒  "${en}"`);
    if (APLICAR) {
      await cx.query('UPDATE filter_category_variants SET nominal_size_en = ? WHERE id = ?', [en, f.id]);
    }
    cambios++;
  }

  if (revisar.length > 0) {
    console.log(`\n  Para capturar a mano en el admin (${revisar.length}):`);
    for (const [f, motivo] of revisar) {
      console.log(`  ·  [${f.producto}] "${f.nominal_size}" — ${motivo}`);
    }
  }

  console.log('');
  if (APLICAR) {
    console.log(`✅ ${cambios} traducciones guardadas.`);
  } else {
    console.log(`Simulación: ${cambios} filas se actualizarían. No se escribió nada.`);
    console.log('Para aplicarlas de verdad:  node scripts/traducir-tamanos.js --aplicar');
  }
  console.log('Revisa el resultado en el admin: las que no convenzan se corrigen a mano.\n');

  await cx.end();
};

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
