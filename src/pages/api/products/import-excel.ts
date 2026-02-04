import type { APIRoute } from 'astro';
import * as XLSX from 'xlsx';
import { createProduct } from '@/lib/product-service';
import { generateUUID } from '@/lib/database';
import { getFilterCategoryIdByName, createCategory } from '@/lib/filter-category-service';

// Función helper para normalizar listas separadas por comas
// Maneja tanto "item1, item2" como "item1,item2" y los normaliza
function normalizeCommaSeparatedList(value: string): string {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .join(', ');
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
      'descripcion': 'description',
      'description': 'description',
      'precio': 'price',
      'price': 'price',
      'categoria': 'category',
      'category': 'category',
      'categoría': 'category',
      'stock': 'stock',
      'estado': 'status',
      'status': 'status',
      'nombre_en': 'name_en',
      'name_en': 'name_en',
      'descripcion_en': 'description_en',
      'description_en': 'description_en',
      'categoria_en': 'category_en',
      'category_en': 'category_en',
      'categoría_en': 'category_en',
      'moneda': 'currency',
      'currency': 'currency',
      'precio_usd': 'price_usd',
      'price_usd': 'price_usd',
      'medida_nominal': 'nominal_size',
      'tamaño_nominal': 'nominal_size',
      'nominal_size': 'nominal_size',
      'medida_real': 'real_size',
      'tamaño_real': 'real_size',
      'real_size': 'real_size',
      'dimensiones': 'dimensions',
      'dimensions': 'dimensions',
      'peso': 'weight',
      'weight': 'weight',
      'material': 'material',
      'garantia': 'warranty',
      'warranty': 'warranty',
      'tags': 'tags',
      'etiquetas': 'tags',
      'imagen_principal': 'image_primary',
      'image_primary': 'image_primary',
      'imagenes_carrusel': 'images_carousel',
      'images_carousel': 'images_carousel',
      'categoria_filtro': 'filter_category',
      'filter_category': 'filter_category',
      'filter_category_id': 'filter_category_id',
      'sku': 'sku',
      'bind_id': 'bind_id',
      'id_bind': 'bind_code',
      'bind_code': 'bind_code',
      'eficiencia': 'efficiency',
      'efficiency': 'efficiency',
      'eficiencia_en': 'efficiency_en',
      'efficiency_en': 'efficiency_en',
      'clase_eficiencia': 'efficiency_class',
      'efficiency_class': 'efficiency_class',
      'caracteristicas': 'characteristics',
      'characteristics': 'characteristics',
      'caracteristicas_en': 'characteristics_en',
      'characteristics_en': 'characteristics_en',
      'material_marco': 'frame_material',
      'frame_material': 'frame_material',
      'temperatura_maxima': 'max_temperature',
      'max_temperature': 'max_temperature',
      'instalacion_tipica': 'typical_installation',
      'typical_installation': 'typical_installation',
      'instalacion_tipica_en': 'typical_installation_en',
      'typical_installation_en': 'typical_installation_en',
      'aplicaciones': 'applications',
      'applications': 'applications',
      'aplicaciones_en': 'applications_en',
      'applications_en': 'applications_en',
      'beneficios': 'benefits',
      'benefits': 'benefits',
      'beneficios_en': 'benefits_en',
      'benefits_en': 'benefits_en',
    };

    const results = {
      success: [] as any[],
      errors: [] as any[],
      warnings: [] as any[],
      createdCategories: [] as any[],
    };

    // Procesar cada fila (empezando desde la fila 2, índice 1)
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      if (!row || row.length === 0) continue;

      try {
        const productData: any = {
          uuid: generateUUID(),
        };

        // Mapear columnas a campos del producto
        headers.forEach((header, index) => {
          const value = row[index];
          if (value === undefined || value === null || value === '') return;

          const mappedField = columnMap[header];
          if (mappedField) {
            // Convertir valores según el tipo de campo
            if (mappedField === 'price' || mappedField === 'price_usd' || mappedField === 'stock') {
              const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : Number(value);
              productData[mappedField] = isNaN(numValue) ? 0 : numValue;
            } else if (mappedField === 'status') {
              const statusValue = String(value).toLowerCase();
              productData[mappedField] = ['active', 'inactive', 'draft'].includes(statusValue) 
                ? statusValue 
                : 'active';
            } else if (mappedField === 'currency') {
              const currencyValue = String(value).toUpperCase();
              productData[mappedField] = ['MXN', 'USD'].includes(currencyValue) ? currencyValue : 'MXN';
            } else if (mappedField === 'tags' || mappedField === 'images_carousel') {
              // Normalizar listas separadas por comas (tags e imágenes del carrusel)
              productData[mappedField] = normalizeCommaSeparatedList(String(value));
            } else {
              productData[mappedField] = String(value).trim();
            }
          }
        });

        // Validar campos requeridos
        if (!productData.name) {
          results.errors.push({ row: i + 1, message: 'Falta el campo nombre' });
          continue;
        }

        // Valores por defecto
        if (!productData.price) productData.price = 0;
        if (!productData.stock) productData.stock = 0;
        if (!productData.status) productData.status = 'active';
        if (!productData.currency) productData.currency = 'MXN';
        if (!productData.category) productData.category = 'Filtros de Aire';

        // Procesar filter_category si se proporcionó
        if (productData.filter_category && !productData.filter_category_id) {
          let categoryId = await getFilterCategoryIdByName(productData.filter_category);
          
          // Si la categoría no existe, crearla automáticamente
          if (!categoryId) {
            try {
              // Generar slug desde el nombre
              const slug = productData.filter_category
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
              
              categoryId = await createCategory({
                name: productData.filter_category,
                slug: slug,
                status: 'active',
              });
              
              if (categoryId) {
                results.createdCategories.push({
                  id: categoryId,
                  name: productData.filter_category,
                  row: i + 1
                });
                results.warnings.push({
                  row: i + 1,
                  message: `Categoría "${productData.filter_category}" no existía y fue creada automáticamente`
                });
              } else {
                results.warnings.push({
                  row: i + 1,
                  message: `No se pudo crear la categoría "${productData.filter_category}". El producto se creará sin categoría de filtro.`
                });
              }
            } catch (error) {
              results.warnings.push({
                row: i + 1,
                message: `Error al crear categoría "${productData.filter_category}": ${error instanceof Error ? error.message : 'Error desconocido'}`
              });
            }
          }
          
          if (categoryId) {
            productData.filter_category_id = categoryId;
          }
          delete productData.filter_category;
        }

        // Crear el producto
        const productId = await createProduct(productData);

        if (productId) {
          results.success.push({ id: productId, name: productData.name });
          
          // TODO: Procesar imágenes si se proporcionaron URLs
          // Esto requeriría subirlas a Cloudinary y asociarlas al producto
        } else {
          results.errors.push({ row: i + 1, message: 'Error al crear el producto en la base de datos' });
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
        warningCount: results.warnings.length,
        createdCategoriesCount: results.createdCategories.length,
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
