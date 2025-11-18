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
 */
export const getProductByUuid = async (uuid: string): Promise<Product | null> => {
  try {
    console.log('🔍 Obteniendo producto por UUID:', uuid);

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
 */
export const createProduct = async (productData: Partial<Product>): Promise<number | null> => {
  try {
    console.log('✨ Creando producto en la base de datos...');

    const result = await query(
      `INSERT INTO products (
        uuid, bind_id, name, name_en, description, description_en,
        price, category, category_en, stock, status, tags,
        dimensions, weight, material, warranty
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productData.uuid,
        productData.bind_id || null,
        productData.name,
        productData.name_en || null,
        productData.description,
        productData.description_en || null,
        productData.price,
        productData.category,
        productData.category_en || null,
        productData.stock || 0,
        productData.status || 'active',
        productData.tags || null,
        productData.dimensions || null,
        productData.weight || null,
        productData.material || null,
        productData.warranty || null,
      ]
    ) as ResultSetHeader;

    console.log('✅ Producto creado con ID:', result.insertId);
    return result.insertId;
  } catch (error) {
    console.error('❌ Error creando producto:', error);
    return null;
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
        name = ?, name_en = ?, description = ?, description_en = ?,
        price = ?, category = ?, category_en = ?, stock = ?,
        status = ?, tags = ?, dimensions = ?, weight = ?,
        material = ?, warranty = ?, bind_id = ?
      WHERE id = ?`,
      [
        productData.name,
        productData.name_en || null,
        productData.description,
        productData.description_en || null,
        productData.price,
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
 * Obtener productos por categoría
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
  getActiveProducts,
  getRecentProducts,
  getProductStats,
};
