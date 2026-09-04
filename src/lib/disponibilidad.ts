/**
 * "Disponible" / "Agotado" de un producto, con la misma regla que el catálogo.
 *
 * La existencia sale de BIND sumando los códigos del producto y de sus
 * medidas (propias o heredadas de la categoría). Si BIND no responde o no
 * reconoce ningún código, no se bloquea: el cobro vuelve a validar. Esta regla vivía solo en
 * WebshopContent; las tarjetas del carrito y de productos relacionados no
 * decían nada de existencias. Aquí queda una sola versión para todas.
 */
import { getProductVariants } from './filter-category-service';
import { existenciaSegunBind, normalizarCodigosBind } from './stock';

export type InventarioBind = Map<string, number> | null | undefined;

export const hayExistenciaDeProducto = async (
  product: { id: number; filter_category_id?: number | null; bind_code?: string | null; bind_id?: string | null; stock?: number | null },
  inventarioBind: InventarioBind
): Promise<boolean> => {
  let codigosMedidas: string[] = [];
  try {
    const variantes = await getProductVariants(product.id, product.filter_category_id ?? null);
    codigosMedidas = variantes.filter((v) => v.is_active && v.bind_code).map((v) => v.bind_code as string);
  } catch {
    // Sin medidas legibles se evalúa solo el código del producto.
  }
  const codigos = normalizarCodigosBind([product.bind_code, product.bind_id, ...codigosMedidas]);
  const enBind = existenciaSegunBind(inventarioBind, codigos);
  // Sin dato de BIND no se marca agotado: el stock local nunca se sincroniza
  // y siempre es 0. Misma regla que el catálogo y el cobro.
  return enBind === null ? true : enBind > 0;
};
