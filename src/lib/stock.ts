/**
 * Existencias de un producto según BIND.
 *
 * Esto vivía escrito dos veces y las dos copias no coincidían:
 *
 *   - El listado de /productos SUMABA el inventario de todos los códigos del
 *     producto (el suyo más el de cada tamaño activo), así que un filtro con
 *     un tamaño agotado y otro con piezas salía como "Disponible".
 *   - /api/check-stock miraba UN SOLO código: el del producto o, si no tenía,
 *     el del primer tamaño que encontrara. Si justo ese estaba en cero,
 *     respondía "agotado".
 *
 * Resultado: la tarjeta decía "Disponible" y al agregar al carrito saltaba
 * "Este producto está agotado". Aquí queda una sola definición para las dos.
 */

/** Deja los códigos como los guarda el mapa de BIND: sin espacios y en mayúsculas. */
export const normalizarCodigosBind = (
  codigos: Array<string | null | undefined>
): string[] => {
  const vistos = new Set<string>();
  for (const codigo of codigos) {
    if (!codigo) continue;
    const limpio = String(codigo).trim().toUpperCase();
    if (limpio) vistos.add(limpio);
  }
  return [...vistos];
};

/**
 * Piezas disponibles sumando todos los códigos que BIND reconozca.
 *
 * Devuelve `null` cuando no hay dato en el que confiar —BIND no respondió, o no
 * reconoció ninguno de los códigos—, para que quien llame decida el respaldo.
 * Es importante distinguirlo de un cero: `null` significa "no sé", y bloquear
 * la venta por no saber deja fuera productos que sí hay.
 */
export const existenciaSegunBind = (
  inventario: Map<string, number> | null | undefined,
  codigos: string[]
): number | null => {
  if (!inventario || codigos.length === 0) return null;

  const reconocidos = codigos.filter((codigo) => inventario.has(codigo));
  if (reconocidos.length === 0) return null;

  return reconocidos.reduce((suma, codigo) => suma + (inventario.get(codigo) ?? 0), 0);
};
