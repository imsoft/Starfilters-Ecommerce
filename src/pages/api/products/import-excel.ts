import type { APIRoute } from 'astro';
import * as XLSX from 'xlsx';
import { createProduct } from '@/lib/product-service';
import { generateUUID } from '@/lib/database';
import { getFilterCategoryIdByName, createCategory, addCategoryVariant } from '@/lib/filter-category-service';
import { getExchangeRate } from '@/lib/currency-service';

import { requireAdminApi } from '@/lib/auth-utils';
// Función helper para normalizar listas separadas por comas
// Maneja tanto "item1, item2" como "item1,item2" y los normaliza
function normalizeCommaSeparatedList(value: string): string {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .join(', ');
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const noAutorizado = await requireAdminApi(cookies);
  if (noAutorizado) return noAutorizado;

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

    // Primera fila son los encabezados.
    //
    // Los acentos se quitan antes de comparar. Antes no se quitaban, así que una
    // columna llamada "Características" no coincidía con la clave del mapa
    // ("caracteristicas") y la columna entera se descartaba SIN AVISAR: el
    // producto se creaba sin características y parecía que no se habían
    // guardado. Lo mismo con cualquier encabezado acentuado.
    const normalizar = (texto: string) =>
      String(texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_');

    const headers = (data[0] as string[]).map(normalizar);

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
      'codigo_producto': 'product_code',
      'codigo_de_producto': 'product_code',
      'product_code': 'product_code',
      'código_producto': 'product_code',
      'código_de_producto': 'product_code',
      'flujo_aire': 'air_flow',
      'flujo_de_aire': 'air_flow',
      'air_flow': 'air_flow',
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
      // Como lo escribe quien llena la hoja, no como se llama la columna en la base.
      'medidas': 'dimensions',
      'medidas_del_equipo': 'dimensions',
      'medida': 'dimensions',
      'caracteristicas_del_producto': 'characteristics',
      'beneficios_del_producto': 'benefits',
      'aplicaciones_del_producto': 'applications',
      'descripcion_corta': 'description',
      'codigo': 'product_code',
      'clave': 'product_code',
    };

    const results = {
      success: [] as any[],
      errors: [] as any[],
      warnings: [] as any[],
      createdCategories: [] as any[],
    };

    // Las claves del mapa pasan por la misma normalización que los encabezados.
    const mapaNormalizado: Record<string, string> = {};
    for (const [clave, campo] of Object.entries(columnMap)) {
      mapaNormalizado[normalizar(clave)] = campo as string;
    }

    // Una columna que no se reconoce se descartaba en silencio y nadie se
    // enteraba de que ese dato nunca llegó a la base. Ahora se avisa.
    const noReconocidas = headers.filter((h) => h && !mapaNormalizado[h]);
    for (const columna of noReconocidas) {
      results.warnings.push({
        row: 1,
        message: `La columna "${columna}" no se reconoce y no se importó. Revisa el nombre del encabezado.`,
      });
    }

    // Varias filas con el mismo nombre son medidas del MISMO producto, no
    // productos distintos. Antes cada fila creaba su propio producto y el
    // catálogo terminaba con "Gabinete 12x24" repetido una vez por medida.
    // Se cuenta de antemano para saber, ya en la primera fila, si el nombre
    // se repite y hay que crear un solo producto con sus tamaños.
    const indiceNombre = headers.findIndex((h) => mapaNormalizado[h] === 'name');
    const filasPorNombre = new Map<string, number>();
    if (indiceNombre >= 0) {
      for (let i = 1; i < data.length; i++) {
        const row = data[i] as any[];
        if (!row || row.length === 0) continue;
        const nombre = String(row[indiceNombre] ?? '').trim().toLowerCase();
        if (nombre) filasPorNombre.set(nombre, (filasPorNombre.get(nombre) ?? 0) + 1);
      }
    }
    // nombre + categoría -> id del producto ya creado en esta importación.
    const productosDelGrupo = new Map<string, number>();

    let exchangeRate = 1;
    try {
      exchangeRate = await getExchangeRate();
    } catch {
      // si falla la tasa se guarda el precio tal cual
    }

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

          const mappedField = mapaNormalizado[header];
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

        const nombreClave = String(productData.name).trim().toLowerCase();
        const esGrupoDeMedidas = (filasPorNombre.get(nombreClave) ?? 0) > 1;

        // Un grupo de medidas necesita una categoría de filtro: los tamaños
        // viven en filter_category_variants, que cuelga de la categoría.
        if (esGrupoDeMedidas && !productData.filter_category_id) {
          results.warnings.push({
            row: i + 1,
            message: `"${productData.name}" se repite en varias filas pero no tiene categoría de filtro, así que cada fila se creó como un producto aparte. Agrega la columna "categoria_filtro" para que las medidas queden dentro de un solo producto.`,
          });
        }

        if (esGrupoDeMedidas && productData.filter_category_id) {
          const categoryId = productData.filter_category_id;
          const claveGrupo = `${nombreClave}|${categoryId}`;

          // Los campos de medida pertenecen al tamaño, no al producto.
          const medida = {
            nominal_size: String(productData.nominal_size ?? '').trim(),
            real_size: String(productData.real_size ?? '').trim(),
            bind_code: String(productData.bind_code ?? '').trim(),
            product_code: String(productData.product_code ?? '').trim(),
            air_flow: String(productData.air_flow ?? '').trim(),
            price: Number(productData.price) || 0,
            currency: productData.currency === 'USD' ? 'USD' : 'MXN',
          };

          let productId = productosDelGrupo.get(claveGrupo) ?? null;

          if (!productId) {
            // La primera fila crea el producto, ya sin los datos de medida.
            const base = { ...productData };
            delete base.nominal_size;
            delete base.real_size;
            delete base.bind_code;
            delete base.product_code;
            delete base.air_flow;

            productId = await createProduct(base);
            if (!productId) {
              results.errors.push({ row: i + 1, message: 'Error al crear el producto en la base de datos' });
              continue;
            }
            productosDelGrupo.set(claveGrupo, productId);
            results.success.push({ id: productId, name: productData.name });
          }

          await addCategoryVariant({
            category_id: categoryId,
            product_id: productId,
            nominal_size: medida.nominal_size,
            real_size: medida.real_size,
            bind_code: medida.bind_code || null,
            product_code: medida.product_code || null,
            air_flow: medida.air_flow || null,
            price: medida.price,
            currency: medida.currency,
            price_usd: medida.currency === 'USD' ? medida.price : medida.price / exchangeRate,
            stock: 0,
            is_active: true,
          } as any);

          continue;
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
