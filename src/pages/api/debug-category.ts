import type { APIRoute } from 'astro';
import { query } from '@/config/database';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('id') || '22';

    // 1. Verificar si existe la categoría
    const categories = await query(
      'SELECT id, name, status FROM filter_categories WHERE id = ?',
      [categoryId]
    ) as any[];

    // 2. Contar variantes para esta categoría
    const variants = await query(
      'SELECT id, bind_code, nominal_size, price, stock, is_active FROM filter_category_variants WHERE category_id = ?',
      [categoryId]
    ) as any[];

    // 3. Contar productos con filter_category_id
    const products = await query(
      'SELECT id, uuid, name, filter_category_id, status FROM products WHERE filter_category_id = ?',
      [categoryId]
    ) as any[];

    // 4. Contar total de variantes en la tabla
    const totalVariants = await query(
      'SELECT COUNT(*) as total FROM filter_category_variants'
    ) as any[];

    // 5. Contar total de categorías
    const totalCategories = await query(
      'SELECT COUNT(*) as total FROM filter_categories'
    ) as any[];

    return new Response(JSON.stringify({
      categoryId,
      category: categories[0] || null,
      categoryExists: categories.length > 0,
      variantsForCategory: variants.length,
      variants: variants.slice(0, 5), // Solo primeras 5
      productsForCategory: products.length,
      products: products.slice(0, 5), // Solo primeros 5
      totalVariantsInDb: totalVariants[0]?.total || 0,
      totalCategoriesInDb: totalCategories[0]?.total || 0,
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en diagnóstico:', error);
    return new Response(JSON.stringify({
      error: 'Error en diagnóstico',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
