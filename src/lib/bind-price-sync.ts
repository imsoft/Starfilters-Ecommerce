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

  // Primero lo más llamativo: cambios de moneda y diferencias grandes
  diferentes.sort((a, b) => {
    if (a.cambiaMoneda !== b.cambiaMoneda) return a.cambiaMoneda ? -1 : 1;
    return Math.abs(b.diferenciaPct ?? 0) - Math.abs(a.diferenciaPct ?? 0);
  });

  return { diferentes, iguales, sinPrecioEnBind, sinCodigoBind };
};

/**
 * Aplica los precios de BIND a las filas seleccionadas.
 * Se vuelve a consultar BIND: no se confía en lo que venga del formulario.
 */
export const aplicarPreciosDeBind = async (
  seleccion: Array<{ origen: 'variante' | 'producto'; id: number }>
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
    try {
      if (fila.origen === 'variante') {
        await query(
          'UPDATE filter_category_variants SET price = ?, currency = ?, price_usd = ? WHERE id = ?',
          [fila.precioBind, 'MXN', null, fila.id]
        );
      } else {
        await query(
          'UPDATE products SET price = ?, currency = ?, price_usd = ? WHERE id = ?',
          [fila.precioBind, 'MXN', null, fila.id]
        );
      }
      aplicados++;
    } catch (error: any) {
      fallidos.push(`${fila.codigo} (${error?.sqlMessage || error?.message || 'error'})`);
    }
  }

  return { aplicados, fallidos };
};
