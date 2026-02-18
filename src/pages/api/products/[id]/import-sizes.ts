import type { APIRoute } from 'astro';
import * as XLSX from 'xlsx';
import { requireAdmin } from '@/lib/auth-utils';
import { getProductById } from '@/lib/product-service';
import {
  getCategoryVariants,
  addCategoryVariant,
  updateCategoryVariant,
  type FilterCategoryVariant,
} from '@/lib/filter-category-service';
import { getExchangeRate } from '@/lib/currency-service';

export const prerender = false;

const SIZE_COLUMN_MAP: Record<string, string> = {
  medida_nominal: 'nominal_size',
  tamaño_nominal: 'nominal_size',
  nominal_size: 'nominal_size',
  medida_real: 'real_size',
  tamaño_real: 'real_size',
  real_size: 'real_size',
  precio: 'price',
  price: 'price',
  moneda: 'currency',
  currency: 'currency',
  id_bind: 'bind_code',
  bind_code: 'bind_code',
  codigo_producto: 'product_code',
  codigo_de_producto: 'product_code',
  product_code: 'product_code',
  flujo_aire: 'air_flow',
  flujo_de_aire: 'air_flow',
  air_flow: 'air_flow',
};

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const authResult = await requireAdmin(cookies);
  if (authResult.redirect) {
    return new Response(
      JSON.stringify({ success: false, message: 'No autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const id = parseInt(params.id || '0');
  if (!id || isNaN(id)) {
    return new Response(
      JSON.stringify({ success: false, message: 'ID de producto inválido' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const product = await getProductById(id);
  if (!product) {
    return new Response(
      JSON.stringify({ success: false, message: 'Producto no encontrado' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const filterCategoryId = product.filter_category_id;
  if (!filterCategoryId) {
    return new Response(
      JSON.stringify({
        success: false,
        message:
          'El producto debe tener una categoría de filtro asignada para importar tamaños. Edita el producto y asigna una categoría primero.',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let file: File;
  try {
    const formData = await request.formData();
    file = formData.get('file') as File;
    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ success: false, message: 'No se envió ningún archivo' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch {
    return new Response(
      JSON.stringify({ success: false, message: 'Error al leer el formulario' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(arrayBuffer, { type: 'array' });
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, message: 'El archivo no es un Excel válido' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];

  if (data.length < 2) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'El Excel no tiene filas de datos (solo encabezados o vacío)',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const headers = (data[0] as string[]).map((h: string) =>
    String(h || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
  );

  const rows: Array<{
    nominal_size: string;
    real_size: string;
    price: number;
    currency: 'MXN' | 'USD';
    bind_code: string;
    product_code?: string;
    air_flow?: string;
  }> = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i] as any[];
    if (!row || row.length === 0) continue;

    const record: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      const mapped = SIZE_COLUMN_MAP[header];
      if (mapped && row[index] !== undefined && row[index] !== null && row[index] !== '') {
        const value = row[index];
        if (mapped === 'price') {
          const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : Number(value);
          record[mapped] = isNaN(num) ? 0 : num;
        } else if (mapped === 'currency') {
          const cur = String(value).toUpperCase();
          record[mapped] = cur === 'USD' ? 'USD' : 'MXN';
        } else {
          record[mapped] = String(value).trim();
        }
      }
    });

    const bindCode = (record.bind_code as string) || '';
    if (!bindCode) continue;

    rows.push({
      nominal_size: (record.nominal_size as string) || '',
      real_size: (record.real_size as string) || '',
      price: (record.price as number) || 0,
      currency: (record.currency as 'MXN' | 'USD') || 'MXN',
      bind_code: bindCode,
      product_code: (record.product_code as string) || undefined,
      air_flow: (record.air_flow as string) || undefined,
    });
  }

  if (rows.length === 0) {
    return new Response(
      JSON.stringify({
        success: false,
        message:
          'No se encontraron filas válidas. Asegúrate de tener la columna "id_bind" (o "bind_code") y al menos una fila con datos.',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let exchangeRate = 1;
  try {
    exchangeRate = await getExchangeRate();
  } catch {
    // usar 1 si falla la tasa
  }

  const existingVariants = await getCategoryVariants(filterCategoryId);
  const existingByBind = new Map<string, FilterCategoryVariant>();
  existingVariants.forEach((v) => {
    if (v.bind_code) existingByBind.set(v.bind_code, v);
  });

  let imported = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const size of rows) {
    const bindCode = size.bind_code.trim();
    let priceUsd: number | null = null;
    if (size.currency === 'USD') {
      priceUsd = size.price;
    } else if (size.currency === 'MXN') {
      priceUsd = size.price / exchangeRate;
    }

    const variantData = {
      category_id: filterCategoryId,
      bind_code: bindCode,
      product_code: size.product_code?.trim() || null,
      air_flow: size.air_flow?.trim() || null,
      nominal_size: size.nominal_size?.trim() || '',
      real_size: size.real_size?.trim() || '',
      price: size.price || 0,
      currency: size.currency || 'MXN',
      price_usd: priceUsd,
      stock: 0,
      is_active: true,
    };

    try {
      const existing = existingByBind.get(bindCode);
      if (existing) {
        await updateCategoryVariant(existing.id, variantData);
        updated++;
      } else {
        const newId = await addCategoryVariant(variantData);
        if (newId) {
          imported++;
          existingByBind.set(bindCode, { id: newId, bind_code: bindCode } as FilterCategoryVariant);
        } else {
          errors.push(`No se pudo crear variante: ${bindCode}`);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${bindCode}: ${msg}`);
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Se importaron ${imported} tamaños nuevos y se actualizaron ${updated}.`,
      importedCount: imported,
      updatedCount: updated,
      totalProcessed: rows.length,
      errors: errors.length > 0 ? errors : undefined,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
