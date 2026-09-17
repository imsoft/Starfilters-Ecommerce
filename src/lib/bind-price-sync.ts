/**
 * Comparar y actualizar los precios del sitio contra BIND.
 *
 * El sitio guarda sus propios precios: de BIND solo se leía el inventario. Eso
 * obligaba a repetir a mano el cambio anual de precios, producto por producto y
 * tamaño por tamaño, y con el tiempo los dos lados se desincronizaron.
 *
 * Aquí no se actualiza nada solo: se compara, se muestra la diferencia y el
 * administrador decide qué aplicar. Automatizarlo del todo era arriesgado
 * porque en BIND hay precios que no cuadran (un manómetro a $165 MXN que el
 * sitio cobra a $2,811) y saldrían publicados sin que nadie los revise.
 */
import { query } from '@/config/database';
import { getBindPreciosPorCodigo } from '@/lib/bind';
import { ensureVariantProductColumn } from '@/lib/filter-category-service';

export interface FilaPrecio {
  /** Dónde vive el precio: una variante (tamaño) o el producto */
  origen: 'variante' | 'producto';
  id: number;
  codigo: string;
  nombre: string;
  precioSitio: number;
  monedaSitio: 'MXN' | 'USD';
  precioBind: number;
  monedaBind: 'MXN';
  /** Diferencia en porcentaje, comparando en la misma moneda */
  diferenciaPct: number | null;
  /** true si además de la cifra cambia la moneda */
  cambiaMoneda: boolean;
}

export interface ComparacionPrecios {
  diferentes: FilaPrecio[];
  iguales: number;
  sinPrecioEnBind: string[];
  sinCodigoBind: number;
}

const norm = (c: unknown) => String(c ?? '').trim().toUpperCase();

/** Compara los precios del sitio con los de BIND. No modifica nada. */
export const compararPreciosConBind = async (): Promise<ComparacionPrecios> => {
  await ensureVariantProductColumn();

  const variantes = (await query(
    `SELECT v.id, v.bind_code, v.price, v.currency, v.nominal_size,
            COALESCE(p.name, c.name, '') AS nombre
     FROM filter_category_variants v
     LEFT JOIN products p ON p.id = v.product_id
     LEFT JOIN filter_categories c ON c.id = v.category_id
     WHERE v.is_active = 1`
  )) as any[];

  const productos = (await query(
    `SELECT id, bind_code, price, currency, name FROM products WHERE status = 'active'`
  )) as any[];

  const conCodigo = [
    ...variantes
      .filter((v) => norm(v.bind_code))
      .map((v) => ({
        origen: 'variante' as const,
        id: Number(v.id),
        codigo: norm(v.bind_code),
        nombre: [v.nombre, v.nominal_size].filter(Boolean).join(' — '),
        precioSitio: Number(v.price) || 0,
        monedaSitio: (v.currency === 'USD' ? 'USD' : 'MXN') as 'MXN' | 'USD',
      })),
    ...productos
      .filter((p) => norm(p.bind_code))
      .map((p) => ({
        origen: 'producto' as const,
        id: Number(p.id),
        codigo: norm(p.bind_code),
        nombre: String(p.name || ''),
        precioSitio: Number(p.price) || 0,
        monedaSitio: (p.currency === 'USD' ? 'USD' : 'MXN') as 'MXN' | 'USD',
      })),
  ];

  const sinCodigoBind =
    variantes.filter((v) => !norm(v.bind_code)).length +
    productos.filter((p) => !norm(p.bind_code)).length;

  const preciosBind = await getBindPreciosPorCodigo(conCodigo.map((f) => f.codigo));

  const diferentes: FilaPrecio[] = [];
  const sinPrecioEnBind: string[] = [];
  let iguales = 0;

  for (const fila of conCodigo) {
    const enBind = preciosBind.get(fila.codigo);
    if (!enBind || enBind.precio <= 0) {
      if (!sinPrecioEnBind.includes(fila.codigo)) sinPrecioEnBind.push(fila.codigo);
      continue;
    }

    // BIND siempre devuelve pesos; si el sitio tiene el precio en dólares,
    // aplicar significa además cambiarle la moneda a esa fila.
    const cambiaMoneda = fila.monedaSitio !== 'MXN';
    const mismaCifra = Math.abs(enBind.precio - fila.precioSitio) < 0.01;

    if (!cambiaMoneda && mismaCifra) {
      iguales++;
      continue;
    }

    diferentes.push({
      ...fila,
      precioBind: enBind.precio,
      monedaBind: enBind.moneda,
      // El porcentaje solo tiene sentido comparando en la misma moneda
      diferenciaPct: cambiaMoneda
        ? null
        : ((fila.precioSitio - enBind.precio) / enBind.precio) * 100,
      cambiaMoneda,
    });
  }

  // Primero lo urgente: lo que hoy está en $0 en el sitio y ya tiene precio en
  // BIND (eso es lo que el cliente ve como "$0.00" en la tienda). Después,
  // cambios de moneda y diferencias grandes.
  diferentes.sort((a, b) => {
    const aSin = a.precioSitio <= 0, bSin = b.precioSitio <= 0;
    if (aSin !== bSin) return aSin ? -1 : 1;
    if (a.cambiaMoneda !== b.cambiaMoneda) return a.cambiaMoneda ? -1 : 1;
    return Math.abs(b.diferenciaPct ?? 0) - Math.abs(a.diferenciaPct ?? 0);
  });

  return { diferentes, iguales, sinPrecioEnBind, sinCodigoBind };
};

/** Tope de cordura: por encima de esto seguro es un dedazo, no un precio */
const PRECIO_MAXIMO = 10_000_000;

/**
 * Aplica precios a las filas seleccionadas.
 *
 * El formulario propone el precio de BIND, pero el administrador puede
 * cambiarlo antes de aplicar: manda mandar lo que venga en el campo. Solo se
 * comprueba que sea un número positivo y razonable; si no lo es, se usa el de
 * BIND en vez de guardar una cifra inválida.
 */
export const aplicarPreciosDeBind = async (
  seleccion: Array<{ origen: 'variante' | 'producto'; id: number; precio?: number }>
): Promise<{ aplicados: number; fallidos: string[] }> => {
  if (seleccion.length === 0) return { aplicados: 0, fallidos: [] };

  const comparacion = await compararPreciosConBind();
  const porClave = new Map(comparacion.diferentes.map((f) => [`${f.origen}:${f.id}`, f]));

  let aplicados = 0;
  const fallidos: string[] = [];

  for (const sel of seleccion) {
    const fila = porClave.get(`${sel.origen}:${sel.id}`);
    if (!fila) {
      fallidos.push(`${sel.origen} ${sel.id} (ya no difiere de BIND)`);
      continue;
    }
    const propuesto = Number(sel.precio);
    const valido = Number.isFinite(propuesto) && propuesto > 0 && propuesto <= PRECIO_MAXIMO;
    const precio = valido ? Number(propuesto.toFixed(2)) : fila.precioBind;
    if (!valido && sel.precio !== undefined) {
      fallidos.push(`${fila.codigo} (precio inválido, se aplicó el de BIND)`);
    }

    try {
      if (fila.origen === 'variante') {
        await query(
          'UPDATE filter_category_variants SET price = ?, currency = ?, price_usd = ? WHERE id = ?',
          [precio, 'MXN', null, fila.id]
        );
      } else {
        await query(
          'UPDATE products SET price = ?, currency = ?, price_usd = ? WHERE id = ?',
          [precio, 'MXN', null, fila.id]
        );
      }
      aplicados++;
    } catch (error: any) {
      fallidos.push(`${fila.codigo} (${error?.sqlMessage || error?.message || 'error'})`);
    }
  }

  return { aplicados, fallidos };
};

// ── Precios faltantes ───────────────────────────────────────────────────────
//
// El cliente captura el código de BIND de un producto o de una medida y espera
// ver su precio en la tienda. Pero el precio vive en la base del sitio, y solo
// llegaba cuando alguien entraba a "Precios desde BIND" y daba aplicar: hasta
// entonces la tienda mostraba $0.00.
//
// Un precio en CERO no es una decisión de nadie, es un hueco. Rellenarlo con el
// precio de lista de BIND no pisa nada: aquí nunca se toca una fila que ya
// tenga precio (eso sigue pasando por la pantalla, con revisión humana).

const CADA_CUANTO_MS = 20 * 60 * 1000;
let ultimoRelleno = 0;
let rellenoEnCurso: Promise<number> | null = null;

/**
 * Pone el precio de BIND a los productos y medidas que están en $0 y tienen un
 * código que BIND reconoce. Devuelve cuántas filas rellenó.
 *
 * Se puede llamar desde cualquier página sin miedo: corre como mucho una vez
 * cada 20 minutos y nunca dos a la vez. `forzar` se salta la espera (lo usa el
 * panel justo después de guardar un código).
 */
export const rellenarPreciosFaltantes = async (forzar = false): Promise<number> => {
  if (rellenoEnCurso) return rellenoEnCurso;
  if (!forzar && Date.now() - ultimoRelleno < CADA_CUANTO_MS) return 0;
  ultimoRelleno = Date.now();

  rellenoEnCurso = (async () => {
    try {
      const { diferentes } = await compararPreciosConBind();
      const huecos = diferentes.filter(
        (f) => !(f.precioSitio > 0) && !f.cambiaMoneda && f.precioBind > 0 && f.precioBind <= PRECIO_MAXIMO
      );
      let rellenados = 0;
      for (const f of huecos) {
        const precio = Number(f.precioBind.toFixed(2));
        // "AND price = 0": si alguien le puso precio mientras tanto, no se pisa.
        const tabla = f.origen === 'variante' ? 'filter_category_variants' : 'products';
        const r = (await query(
          `UPDATE ${tabla} SET price = ?, currency = 'MXN', price_usd = NULL
            WHERE id = ? AND (price IS NULL OR price = 0)`,
          [precio, f.id]
        )) as any;
        if (r?.affectedRows) {
          rellenados++;
          console.log(`💲 Precio faltante rellenado desde BIND: ${f.codigo} (${f.nombre}) → $${precio} MXN`);
        }
      }
      if (rellenados) console.log(`✅ ${rellenados} precio(s) faltante(s) tomados de BIND`);
      return rellenados;
    } catch (error: any) {
      console.error('⚠️ No se pudieron rellenar precios faltantes desde BIND:', error?.message);
      // Que un fallo de BIND no bloquee el siguiente intento durante 20 minutos.
      ultimoRelleno = 0;
      return 0;
    } finally {
      rellenoEnCurso = null;
    }
  })();
  return rellenoEnCurso;
};
