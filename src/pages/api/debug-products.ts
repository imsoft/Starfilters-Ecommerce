import type { APIRoute } from 'astro';
import { getProductsByFilterCategory } from '@/lib/product-service';
import { getCategoryBySlug, getCategoryById } from '@/lib/filter-category-service';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');
    const id = url.searchParams.get('id');

    let categoryId: number | null = null;
    let category: any = null;

    // Buscar por slug o ID
    if (slug) {
      console.log('🔍 Buscando categoría por slug:', slug);
      category = await getCategoryBySlug(slug);
      if (category) {
        categoryId = category.id;
      }
    } else if (id) {
      console.log('🔍 Buscando categoría por ID:', id);
      categoryId = parseInt(id);
      category = await getCategoryById(categoryId);
    }

    if (!categoryId) {
      return new Response(JSON.stringify({
        error: 'Categoría no encontrada',
        slug,
        id
      }, null, 2), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener productos
    console.log('🔍 Obteniendo productos para categoría ID:', categoryId);
    const products = await getProductsByFilterCategory(categoryId);

    return new Response(JSON.stringify({
      category: {
        id: category?.id,
        name: category?.name,
        slug: category?.slug
      },
      categoryId,
      productsFound: products.length,
      products: products.slice(0, 5).map(p => ({
        id: p.id,
        uuid: p.uuid,
        name: p.name,
        status: p.status,
        filter_category_id: p.filter_category_id
      }))
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en debug-products:', error);
    return new Response(JSON.stringify({
      error: 'Error interno',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
