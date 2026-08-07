import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-utils';
import { getProductById } from '@/lib/product-service';
import { importSizesForCategory } from '@/lib/import-sizes';

export const prerender = false;

const json = (body: object, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const authResult = await requireAdmin(cookies);
  if (authResult.redirect) {
    return json({ success: false, message: 'No autorizado' }, 401);
  }

  const id = parseInt(params.id || '0');
  if (!id || isNaN(id)) {
    return json({ success: false, message: 'ID de producto inválido' }, 400);
  }

  const product = await getProductById(id);
  if (!product) {
    return json({ success: false, message: 'Producto no encontrado' }, 404);
  }

  const filterCategoryId = product.filter_category_id;
  if (!filterCategoryId) {
    return json(
      {
        success: false,
        message:
          'El producto debe tener una categoría de filtro asignada para importar tamaños. Edita el producto y asigna una categoría primero.',
      },
      400
    );
  }

  let file: File;
  try {
    const formData = await request.formData();
    file = formData.get('file') as File;
    if (!file || !(file instanceof File)) {
      return json({ success: false, message: 'No se envió ningún archivo' }, 400);
    }
  } catch {
    return json({ success: false, message: 'Error al leer el formulario' }, 400);
  }

  // Los tamaños importados quedan asignados a ESTE producto
  const result = await importSizesForCategory(filterCategoryId, file, product.id);
  const { status, ...body } = result;
  return json(body, status);
};
