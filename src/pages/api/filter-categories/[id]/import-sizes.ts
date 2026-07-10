import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-utils';
import { getCategoryById } from '@/lib/filter-category-service';
import { importSizesForCategory } from '@/lib/import-sizes';

export const prerender = false;

// Importación masiva de tamaños directamente a una categoría de filtro.
// Permite usar la plantilla de Excel desde "Agregar producto" (donde el
// producto aún no existe) con solo haber elegido el tipo de filtro.

const json = (body: object, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const authResult = await requireAdmin(cookies);
  if (authResult.redirect) {
    return json({ success: false, message: 'No autorizado' }, 401);
  }

  const id = parseInt(params.id || '0');
  if (!id || isNaN(id)) {
    return json({ success: false, message: 'ID de categoría inválido' }, 400);
  }

  const category = await getCategoryById(id);
  if (!category) {
    return json({ success: false, message: 'Categoría de filtro no encontrada' }, 404);
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

  const result = await importSizesForCategory(id, file);
  const { status, ...body } = result;
  return json(body, status);
};
