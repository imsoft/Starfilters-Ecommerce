import type { APIRoute } from 'astro';
import * as XLSX from 'xlsx';
import { createCategory } from '@/lib/filter-category-service';

// Función helper para crear slug desde nombre
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, message: 'No se proporcionó ningún archivo' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Leer el archivo Excel
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];

    if (data.length < 2) {
      return new Response(
        JSON.stringify({ success: false, message: 'El archivo Excel está vacío o no tiene datos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Primera fila son los encabezados
    const headers = (data[0] as string[]).map((h: string) => 
      String(h || '').toLowerCase().trim().replace(/\s+/g, '_')
    );

    // Mapeo de columnas comunes
    const columnMap: Record<string, string> = {
      'nombre': 'name',
      'name': 'name',
      'nombre_en': 'name_en',
      'name_en': 'name_en',
      'descripcion': 'description',
      'description': 'description',
      'descripcion_en': 'description_en',
      'description_en': 'description_en',
      'imagen_principal': 'main_image',
      'main_image': 'main_image',
      'imagen': 'main_image',
      'image': 'main_image',
      'estado': 'status',
      'status': 'status',
    };

    const results = {
      success: [] as any[],
      errors: [] as any[],
    };

    // Procesar cada fila (empezando desde la fila 2, índice 1)
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      if (!row || row.length === 0) continue;

      try {
        const categoryData: any = {};

        // Mapear columnas a campos de la categoría
        headers.forEach((header, index) => {
          const value = row[index];
          if (value === undefined || value === null || value === '') return;

          const mappedField = columnMap[header];
          if (mappedField) {
            if (mappedField === 'status') {
              const statusValue = String(value).toLowerCase();
              categoryData[mappedField] = ['active', 'inactive', 'draft'].includes(statusValue) 
                ? statusValue 
                : 'active';
            } else {
              categoryData[mappedField] = String(value).trim();
            }
          }
        });

        // Validar campos requeridos
        if (!categoryData.name) {
          results.errors.push({ row: i + 1, message: 'Falta el campo nombre' });
          continue;
        }

        // Crear slug desde el nombre
        categoryData.slug = createSlug(categoryData.name);

        // Valores por defecto
        if (!categoryData.status) categoryData.status = 'active';

        // Crear la categoría
        const categoryId = await createCategory(categoryData);

        if (categoryId) {
          results.success.push({ id: categoryId, name: categoryData.name });
        } else {
          results.errors.push({ row: i + 1, message: 'Error al crear la categoría en la base de datos' });
        }
      } catch (error) {
        results.errors.push({ 
          row: i + 1, 
          message: error instanceof Error ? error.message : 'Error desconocido' 
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        successCount: results.success.length,
        errorCount: results.errors.length,
        results,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error procesando Excel:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Error al procesar el archivo Excel' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
