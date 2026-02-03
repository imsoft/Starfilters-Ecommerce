/**
 * Servicio de Productos - Base de datos local como fuente única
 *
 * Este servicio usa MySQL como la fuente única de verdad para productos.
 * Bind se usa solo para sincronizar el inventario después de compras.
 */

import { query } from '@/config/database';
import type { Product } from './database';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

/**
 * Obtener todos los productos desde la base de datos local
 */
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    console.log('🔍 Obteniendo todos los productos desde la base de datos local...');

    const products = await query(
      'SELECT * FROM products ORDER BY created_at DESC'
    ) as Product[];

    console.log(`✅ ${products.length} productos obtenidos de la base de datos`);
    return products;
  } catch (error) {
    console.error('❌ Error obteniendo productos de la base de datos:', error);
    return [];
  }
};

/**
 * Obtener un producto por su UUID
 * También soporta UUIDs de variantes en formato "variant-{id}"
 */
export const getProductByUuid = async (uuid: string): Promise<Product | null> => {
  try {
    console.log('🔍 Obteniendo producto por UUID:', uuid);

    // Verificar si es un UUID de variante
    if (uuid.startsWith('variant-')) {
      const variantId = parseInt(uuid.replace('variant-', ''));
      if (isNaN(variantId)) {
        console.log('❌ ID de variante inválido');
        return null;
      }

      console.log('🔍 Buscando variante con ID:', variantId);
      const variantsAsProducts = await query(
        `SELECT
          fcv.id as id,
          CONCAT('variant-', fcv.id) as uuid,
          fcv.category_id as filter_category_id,
          NULL as bind_id,
          fcv.bind_code as bind_code,
          NULL as sku,
          fcv.nominal_size as nominal_size,
          fcv.real_size as real_size,
          CONCAT(fc.name, ' - ', fcv.nominal_size) as name,
          CONCAT(COALESCE(fc.name_en, fc.name), ' - ', fcv.nominal_size) as name_en,
          fc.description as description,
          fc.description_en as description_en,
          fcv.price as price,
          COALESCE(fcv.currency, 'MXN') as currency,
          fcv.price_usd as price_usd,
          fc.name as category,
          fc.name_en as category_en,
          fcv.stock as stock,
          IF(fcv.is_active = 1, 'active', 'inactive') as status,
          NULL as tags,
          NULL as dimensions,
          NULL as weight,
          NULL as material,
          NULL as warranty,
          fc.main_image as image_url,
          NULL as efficiency,
          NULL as efficiency_en,
          NULL as efficiency_class,
          NULL as characteristics,
          NULL as characteristics_en,
          NULL as frame_material,
          NULL as max_temperature,
          NULL as typical_installation,
          NULL as typical_installation_en,
          NULL as applications,
          NULL as applications_en,
          NULL as benefits,
          NULL as benefits_en,
          fcv.created_at as created_at,
          fcv.updated_at as updated_at
        FROM filter_category_variants fcv
        INNER JOIN filter_categories fc ON fcv.category_id = fc.id
        WHERE fcv.id = ?`,
        [variantId]
      ) as Product[];

      if (variantsAsProducts.length === 0) {
        console.log('❌ Variante no encontrada');
        return null;
      }

      console.log('✅ Variante obtenida como producto');
      return variantsAsProducts[0];
    }

    // Buscar producto normal por UUID
    const products = await query(
      'SELECT * FROM products WHERE uuid = ?',
      [uuid]
    ) as Product[];

    if (products.length === 0) {
      console.log('❌ Producto no encontrado');
      return null;
    }

    console.log('✅ Producto obtenido');
    return products[0];
  } catch (error) {
    console.error('❌ Error obteniendo producto:', error);
    return null;
  }
};

/**
 * Obtener un producto por su ID
 */
export const getProductById = async (id: number): Promise<Product | null> => {
  try {
    console.log('🔍 Obteniendo producto por ID:', id);

    const products = await query(
      'SELECT * FROM products WHERE id = ?',
      [id]
    ) as Product[];

    if (products.length === 0) {
      console.log('❌ Producto no encontrado');
      return null;
    }

    console.log('✅ Producto obtenido');
    return products[0];
  } catch (error) {
    console.error('❌ Error obteniendo producto:', error);
    return null;
  }
};

/**
 * Crear un nuevo producto en la base de datos local
 * Usa INSERT dinámico para mayor compatibilidad con diferentes esquemas de BD
 */
export const createProduct = async (productData: Partial<Product>): Promise<number | null> => {
  try {
    console.log('✨ Creando producto en la base de datos...');

    // Construir INSERT dinámico con solo los campos que tienen valor
    const fields: string[] = [];
    const values: any[] = [];
    const placeholders: string[] = [];

    // Campos requeridos
    if (productData.uuid) {
      fields.push('uuid');
      values.push(productData.uuid);
      placeholders.push('?');
    }
    
    if (productData.name) {
      fields.push('name');
      values.push(productData.name);
      placeholders.push('?');
    }

    // Campos opcionales básicos
    const optionalFields: { field: keyof Product; dbColumn: string }[] = [
      { field: 'filter_category_id', dbColumn: 'filter_category_id' },
      { field: 'bind_id', dbColumn: 'bind_id' },
      { field: 'bind_code', dbColumn: 'bind_code' },
      { field: 'sku', dbColumn: 'sku' },
      { field: 'name_en', dbColumn: 'name_en' },
      { field: 'description', dbColumn: 'description' },
      { field: 'description_en', dbColumn: 'description_en' },
      { field: 'price', dbColumn: 'price' },
      { field: 'currency', dbColumn: 'currency' },
      { field: 'price_usd', dbColumn: 'price_usd' },
      { field: 'nominal_size', dbColumn: 'nominal_size' },
      { field: 'real_size', dbColumn: 'real_size' },
      { field: 'category', dbColumn: 'category' },
      { field: 'category_en', dbColumn: 'category_en' },
      { field: 'stock', dbColumn: 'stock' },
      { field: 'status', dbColumn: 'status' },
      { field: 'tags', dbColumn: 'tags' },
      { field: 'dimensions', dbColumn: 'dimensions' },
      { field: 'weight', dbColumn: 'weight' },
      { field: 'material', dbColumn: 'material' },
      { field: 'warranty', dbColumn: 'warranty' },
      // Campos técnicos (pueden no existir en todas las BD)
      { field: 'efficiency', dbColumn: 'efficiency' },
      { field: 'efficiency_en', dbColumn: 'efficiency_en' },
      { field: 'efficiency_class', dbColumn: 'efficiency_class' },
      { field: 'characteristics', dbColumn: 'characteristics' },
      { field: 'characteristics_en', dbColumn: 'characteristics_en' },
      { field: 'frame_material', dbColumn: 'frame_material' },
      { field: 'max_temperature', dbColumn: 'max_temperature' },
      { field: 'typical_installation', dbColumn: 'typical_installation' },
      { field: 'typical_installation_en', dbColumn: 'typical_installation_en' },
      { field: 'applications', dbColumn: 'applications' },
      { field: 'applications_en', dbColumn: 'applications_en' },
      { field: 'benefits', dbColumn: 'benefits' },
      { field: 'benefits_en', dbColumn: 'benefits_en' },
    ];

    for (const { field, dbColumn } of optionalFields) {
      const value = productData[field];
      if (value !== undefined) {
        fields.push(dbColumn);
        values.push(value === null ? null : value);
        placeholders.push('?');
      }
    }

    // Valores por defecto si no se proporcionaron
    if (!fields.includes('price')) {
      fields.push('price');
      values.push(0);
      placeholders.push('?');
    }
    if (!fields.includes('stock')) {
      fields.push('stock');
      values.push(0);
      placeholders.push('?');
    }
    if (!fields.includes('status')) {
      fields.push('status');
      values.push('active');
      placeholders.push('?');
    }
    if (!fields.includes('currency')) {
      fields.push('currency');
      values.push('MXN');
      placeholders.push('?');
    }
    if (!fields.includes('category')) {
      fields.push('category');
      values.push('Filtros de Aire');
      placeholders.push('?');
    }

    const sql = `INSERT INTO products (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
    
    console.log('📝 SQL:', sql);
    console.log('📝 Valores:', values.length);

    const result = await query(sql, values) as ResultSetHeader;

    console.log('✅ Producto creado con ID:', result.insertId);
    return result.insertId;
  } catch (error: any) {
    console.error('❌ Error creando producto:', error);
    
    // Si el error es por columnas que no existen, intentar con campos básicos
    if (error.code === 'ER_BAD_FIELD_ERROR' || error.code === 'ER_WRONG_VALUE_COUNT_ON_ROW') {
      console.log('⚠️ Intentando crear producto con campos básicos...');
      
      try {
        const basicResult = await query(
          `INSERT INTO products (uuid, name, description, price, currency, category, stock, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            productData.uuid,
            productData.name,
            productData.description || null,
            productData.price || 0,
            productData.currency || 'MXN',
            productData.category || 'Filtros de Aire',
            productData.stock || 0,
            productData.status || 'active'
          ]
        ) as ResultSetHeader;
        
        console.log('✅ Producto creado con campos básicos, ID:', basicResult.insertId);
        return basicResult.insertId;
      } catch (basicError) {
        console.error('❌ Error creando producto con campos básicos:', basicError);
        throw basicError;
      }
    }
    
    throw error;
  }
};

/**
 * Actualizar un producto en la base de datos local
 */
export const updateProduct = async (id: number, productData: Partial<Product>): Promise<boolean> => {
  try {
    console.log('📝 Actualizando producto ID:', id);

    await query(
      `UPDATE products SET
        filter_category_id = ?, name = ?, name_en = ?, description = ?, description_en = ?,
        price = ?, currency = ?, price_usd = ?, nominal_size = ?, real_size = ?,
        category = ?, category_en = ?, stock = ?,
        status = ?, tags = ?, dimensions = ?, weight = ?,
        material = ?, warranty = ?, bind_id = ?, bind_code = ?, sku = ?,
        efficiency = ?, efficiency_en = ?, efficiency_class = ?,
        characteristics = ?, characteristics_en = ?, frame_material = ?, max_temperature = ?,
        typical_installation = ?, typical_installation_en = ?,
        applications = ?, applications_en = ?,
        benefits = ?, benefits_en = ?
      WHERE id = ?`,
      [
        productData.filter_category_id || null,
        productData.name,
        productData.name_en || null,
        productData.description,
        productData.description_en || null,
        productData.price,
        productData.currency || 'MXN',
        productData.price_usd || null,
        productData.nominal_size || null,
        productData.real_size || null,
        productData.category,
        productData.category_en || null,
        productData.stock,
        productData.status,
        productData.tags || null,
        productData.dimensions || null,
        productData.weight || null,
        productData.material || null,
        productData.warranty || null,
        productData.bind_id || null,
        productData.bind_code || null,
        productData.sku || null,
        productData.efficiency || null,
        productData.efficiency_en || null,
        productData.efficiency_class || null,
        productData.characteristics || null,
        productData.characteristics_en || null,
        productData.frame_material || null,
        productData.max_temperature || null,
        productData.typical_installation || null,
        productData.typical_installation_en || null,
        productData.applications || null,
        productData.applications_en || null,
        productData.benefits || null,
        productData.benefits_en || null,
        id,
      ]
    );

    console.log('✅ Producto actualizado');
    return true;
  } catch (error) {
    console.error('❌ Error actualizando producto:', error);
    return false;
  }
};

/**
 * Eliminar un producto de la base de datos local
 */
export const deleteProduct = async (id: number): Promise<boolean> => {
  try {
    console.log('🗑️ Eliminando producto ID:', id);

    await query('DELETE FROM products WHERE id = ?', [id]);

    console.log('✅ Producto eliminado');
    return true;
  } catch (error) {
    console.error('❌ Error eliminando producto:', error);
    return false;
  }
};

/**
 * Buscar productos por término de búsqueda
 */
export const searchProducts = async (searchTerm: string, category?: string): Promise<Product[]> => {
  try {
    console.log('🔍 Buscando productos:', searchTerm);

    let sql = `
      SELECT * FROM products
      WHERE (name LIKE ? OR description LIKE ? OR tags LIKE ?)
      AND status = 'active'
    `;

    const params: any[] = [
      `%${searchTerm}%`,
      `%${searchTerm}%`,
      `%${searchTerm}%`
    ];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' ORDER BY created_at DESC';

    const products = await query(sql, params) as Product[];

    console.log(`✅ ${products.length} productos encontrados`);
    return products;
  } catch (error) {
    console.error('❌ Error buscando productos:', error);
    return [];
  }
};

/**
 * Obtener productos por categoría (nombre de categoría)
 */
export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    console.log('🔍 Obteniendo productos de categoría:', category);

    const products = await query(
      'SELECT * FROM products WHERE category = ? AND status = "active" ORDER BY created_at DESC',
      [category]
    ) as Product[];

    console.log(`✅ ${products.length} productos encontrados`);
    return products;
  } catch (error) {
    console.error('❌ Error obteniendo productos por categoría:', error);
    return [];
  }
};

/**
 * Obtener productos por filter_category_id
 * Si no hay productos directos, busca variantes de la categoría y las convierte en productos
 */
export const getProductsByFilterCategory = async (filterCategoryId: number): Promise<Product[]> => {
  try {
    console.log('🔍 Obteniendo productos de filter_category_id:', filterCategoryId);

    // Primero buscar productos directos con filter_category_id
    const products = await query(
      'SELECT * FROM products WHERE filter_category_id = ? AND status = "active" ORDER BY created_at DESC',
      [filterCategoryId]
    ) as Product[];

    if (products.length > 0) {
      console.log(`✅ ${products.length} productos encontrados para categoría ${filterCategoryId}`);
      return products;
    }

    // Si no hay productos, buscar variantes de la categoría y convertirlas en productos
    console.log('⚠️ No hay productos directos, buscando variantes de categoría...');

    const variantsAsProducts = await query(
      `SELECT
        fcv.id as id,
        CONCAT('variant-', fcv.id) as uuid,
        fcv.category_id as filter_category_id,
        NULL as bind_id,
        fcv.bind_code as bind_code,
        NULL as sku,
        fcv.nominal_size as nominal_size,
        fcv.real_size as real_size,
        CONCAT(fc.name, ' - ', fcv.nominal_size) as name,
        CONCAT(COALESCE(fc.name_en, fc.name), ' - ', fcv.nominal_size) as name_en,
        fc.description as description,
        fc.description_en as description_en,
        fcv.price as price,
        COALESCE(fcv.currency, 'MXN') as currency,
        fcv.price_usd as price_usd,
        fc.name as category,
        fc.name_en as category_en,
        fcv.stock as stock,
        IF(fcv.is_active = 1, 'active', 'inactive') as status,
        NULL as tags,
        NULL as dimensions,
        NULL as weight,
        NULL as material,
        NULL as warranty,
        fc.main_image as image_url,
        NULL as efficiency,
        NULL as efficiency_en,
        NULL as efficiency_class,
        NULL as characteristics,
        NULL as characteristics_en,
        NULL as frame_material,
        NULL as max_temperature,
        NULL as typical_installation,
        NULL as typical_installation_en,
        NULL as applications,
        NULL as applications_en,
        NULL as benefits,
        NULL as benefits_en,
        fcv.created_at as created_at,
        fcv.updated_at as updated_at
      FROM filter_category_variants fcv
      INNER JOIN filter_categories fc ON fcv.category_id = fc.id
      WHERE fcv.category_id = ? AND fcv.is_active = 1
      ORDER BY fcv.bind_code`,
      [filterCategoryId]
    ) as Product[];

    console.log(`✅ ${variantsAsProducts.length} variantes encontradas y convertidas a productos para categoría ${filterCategoryId}`);
    return variantsAsProducts;
  } catch (error) {
    console.error('❌ Error obteniendo productos por filter_category_id:', error);
    return [];
  }
};

/**
 * Obtener productos activos (para el sitio público)
 */
export const getActiveProducts = async (): Promise<Product[]> => {
  try {
    console.log('🔍 Obteniendo productos activos...');

    const products = await query(
      'SELECT * FROM products WHERE status = "active" ORDER BY created_at DESC'
    ) as Product[];

    console.log(`✅ ${products.length} productos activos encontrados`);
    return products;
  } catch (error) {
    console.error('❌ Error obteniendo productos activos:', error);
    return [];
  }
};

/**
 * Obtener productos recientes (para dashboard)
 */
export const getRecentProducts = async (limit: number = 5): Promise<Product[]> => {
  try {
    console.log(`🔍 Obteniendo ${limit} productos recientes...`);

    const products = await query(
      'SELECT * FROM products ORDER BY created_at DESC LIMIT ?',
      [limit]
    ) as Product[];

    console.log(`✅ ${products.length} productos recientes obtenidos`);
    return products;
  } catch (error) {
    console.error('❌ Error obteniendo productos recientes:', error);
    return [];
  }
};

/**
 * Obtener estadísticas de productos
 */
export const getProductStats = async () => {
  try {
    const allProducts = await getAllProducts();
    const activeProducts = allProducts.filter(p => p.status === 'active');
    const inactiveProducts = allProducts.filter(p => p.status === 'inactive' || p.status === 'draft');
    const lowStockProducts = allProducts.filter(p => p.stock < 5);

    return {
      total: allProducts.length,
      active: activeProducts.length,
      inactive: inactiveProducts.length,
      lowStock: lowStockProducts.length,
    };
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return {
      total: 0,
      active: 0,
      inactive: 0,
      lowStock: 0,
    };
  }
};

export default {
  getAllProducts,
  getProductByUuid,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductsByCategory,
  getProductsByFilterCategory,
  getActiveProducts,
  getRecentProducts,
  getProductStats,
};
