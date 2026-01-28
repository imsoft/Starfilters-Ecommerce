/**
 * Servicio de Categorías de Filtros - Base de datos local
 *
 * Este servicio maneja todas las operaciones CRUD para categorías de filtros,
 * sus imágenes y variantes.
 */

import { query } from '@/config/database';
import { generateUUID } from '@/lib/database';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

/**
 * Tipos de datos
 */
export interface FilterCategory {
  id: number;
  name: string;
  name_en?: string;
  slug: string;
  description?: string;
  description_en?: string;
  main_image?: string;
  status: 'active' | 'inactive' | 'draft';
  created_at?: Date;
  updated_at?: Date;
}

export interface FilterCategoryImage {
  id: number;
  category_id: number;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
  created_at?: Date;
}

export interface FilterCategoryVariant {
  id: number;
  category_id: number;
  bind_code: string;
  nominal_size: string;
  real_size: string;
  price: number;
  currency?: 'MXN' | 'USD';
  price_usd?: number | null;
  stock: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * ===================================
 * CATEGORÍAS
 * ===================================
 */

/**
 * Obtener todas las categorías
 */
export const getAllCategories = async (): Promise<FilterCategory[]> => {
  try {
    console.log('🔍 Obteniendo todas las categorías de filtros...');

    const categories = await query(
      'SELECT * FROM filter_categories ORDER BY created_at DESC'
    ) as FilterCategory[];

    console.log(`✅ ${categories.length} categorías obtenidas`);
    return categories;
  } catch (error) {
    console.error('❌ Error obteniendo categorías:', error);
    return [];
  }
};

/**
 * Obtener categorías activas
 */
export const getActiveCategories = async (): Promise<FilterCategory[]> => {
  try {
    console.log('🔍 Obteniendo categorías activas...');

    // Incluir categorías con status = 'active' o status IS NULL (para compatibilidad)
    const categories = await query(
      'SELECT * FROM filter_categories WHERE status = "active" OR status IS NULL ORDER BY created_at DESC'
    ) as FilterCategory[];

    console.log(`✅ ${categories.length} categorías activas obtenidas`);
    return categories;
  } catch (error) {
    console.error('❌ Error obteniendo categorías activas:', error);
    return [];
  }
};

/**
 * Obtener ID de categoría por nombre
 */
export const getFilterCategoryIdByName = async (name: string): Promise<number | null> => {
  try {
    const categories = await query(
      'SELECT id FROM filter_categories WHERE name = ? OR name_en = ? LIMIT 1',
      [name, name]
    ) as FilterCategory[];
    
    return categories.length > 0 ? categories[0].id : null;
  } catch (error) {
    console.error('❌ Error obteniendo categoría por nombre:', error);
    return null;
  }
};

/**
 * Obtener una categoría por ID
 */
export const getCategoryById = async (id: number): Promise<FilterCategory | null> => {
  try {
    console.log('🔍 Obteniendo categoría por ID:', id);

    const categories = await query(
      'SELECT * FROM filter_categories WHERE id = ?',
      [id]
    ) as FilterCategory[];

    if (categories.length === 0) {
      console.log('❌ Categoría no encontrada');
      return null;
    }

    console.log('✅ Categoría obtenida');
    return categories[0];
  } catch (error) {
    console.error('❌ Error obteniendo categoría:', error);
    return null;
  }
};

/**
 * Obtener una categoría por slug
 */
export const getCategoryBySlug = async (slug: string): Promise<FilterCategory | null> => {
  try {
    console.log('🔍 Obteniendo categoría por slug:', slug);

    const categories = await query(
      'SELECT * FROM filter_categories WHERE slug = ?',
      [slug]
    ) as FilterCategory[];

    if (categories.length === 0) {
      console.log('❌ Categoría no encontrada');
      return null;
    }

    console.log('✅ Categoría obtenida');
    return categories[0];
  } catch (error) {
    console.error('❌ Error obteniendo categoría:', error);
    return null;
  }
};

/**
 * Crear una nueva categoría
 */
export const createCategory = async (categoryData: Partial<FilterCategory>): Promise<number | null> => {
  try {
    console.log('✨ Creando categoría:', categoryData.name);

    const result = await query(
      `INSERT INTO filter_categories (
        name, name_en, slug, description, description_en, main_image, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        categoryData.name,
        categoryData.name_en || null,
        categoryData.slug,
        categoryData.description || null,
        categoryData.description_en || null,
        categoryData.main_image || null,
        categoryData.status || 'active',
      ]
    ) as ResultSetHeader;

    console.log('✅ Categoría creada con ID:', result.insertId);
    return result.insertId;
  } catch (error) {
    console.error('❌ Error creando categoría:', error);
    return null;
  }
};

/**
 * Actualizar una categoría
 */
export const updateCategory = async (id: number, categoryData: Partial<FilterCategory>): Promise<boolean> => {
  try {
    console.log('📝 Actualizando categoría ID:', id);

    await query(
      `UPDATE filter_categories SET
        name = ?, name_en = ?, slug = ?, description = ?, description_en = ?,
        main_image = ?, status = ?
      WHERE id = ?`,
      [
        categoryData.name,
        categoryData.name_en || null,
        categoryData.slug,
        categoryData.description || null,
        categoryData.description_en || null,
        categoryData.main_image || null,
        categoryData.status,
        id,
      ]
    );

    console.log('✅ Categoría actualizada');
    return true;
  } catch (error) {
    console.error('❌ Error actualizando categoría:', error);
    return false;
  }
};

/**
 * Eliminar una categoría
 */
export const deleteCategory = async (id: number): Promise<boolean> => {
  try {
    console.log('🗑️ Eliminando categoría ID:', id);

    await query('DELETE FROM filter_categories WHERE id = ?', [id]);

    console.log('✅ Categoría eliminada (cascade eliminará imágenes y variantes)');
    return true;
  } catch (error) {
    console.error('❌ Error eliminando categoría:', error);
    return false;
  }
};

/**
 * ===================================
 * IMÁGENES
 * ===================================
 */

/**
 * Obtener todas las imágenes de una categoría
 */
export const getCategoryImages = async (categoryId: number): Promise<FilterCategoryImage[]> => {
  try {
    console.log('🔍 Obteniendo imágenes de categoría:', categoryId);

    const images = await query(
      'SELECT * FROM filter_category_images WHERE category_id = ? ORDER BY sort_order, id',
      [categoryId]
    ) as FilterCategoryImage[];

    console.log(`✅ ${images.length} imágenes obtenidas`);
    return images;
  } catch (error) {
    console.error('❌ Error obteniendo imágenes:', error);
    return [];
  }
};

/**
 * Agregar una imagen a una categoría
 */
export const addCategoryImage = async (imageData: Partial<FilterCategoryImage>): Promise<number | null> => {
  try {
    console.log('✨ Agregando imagen a categoría:', imageData.category_id);

    const uuid = generateUUID();
    const result = await query(
      `INSERT INTO filter_category_images (
        uuid, category_id, image_url, alt_text, is_primary, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        uuid,
        imageData.category_id,
        imageData.image_url,
        imageData.alt_text || null,
        imageData.is_primary || false,
        imageData.sort_order || 0,
      ]
    ) as ResultSetHeader;

    console.log('✅ Imagen agregada con ID:', result.insertId, 'UUID:', uuid);
    return result.insertId;
  } catch (error) {
    console.error('❌ Error agregando imagen:', error);
    return null;
  }
};

/**
 * Eliminar una imagen
 */
export const deleteCategoryImage = async (id: number): Promise<boolean> => {
  try {
    console.log('🗑️ Eliminando imagen ID:', id);

    await query('DELETE FROM filter_category_images WHERE id = ?', [id]);

    console.log('✅ Imagen eliminada');
    return true;
  } catch (error) {
    console.error('❌ Error eliminando imagen:', error);
    return false;
  }
};

/**
 * Eliminar todas las imágenes principales de una categoría
 */
export const deletePrimaryCategoryImages = async (categoryId: number): Promise<boolean> => {
  try {
    console.log('🗑️ Eliminando imágenes principales de categoría:', categoryId);

    await query('DELETE FROM filter_category_images WHERE category_id = ? AND is_primary = 1', [categoryId]);

    console.log('✅ Imágenes principales eliminadas');
    return true;
  } catch (error) {
    console.error('❌ Error eliminando imágenes principales:', error);
    return false;
  }
};

/**
 * ===================================
 * VARIANTES
 * ===================================
 */

/**
 * Obtener todas las variantes de una categoría
 */
export const getCategoryVariants = async (categoryId: number): Promise<FilterCategoryVariant[]> => {
  try {
    console.log('🔍 Obteniendo variantes de categoría:', categoryId);

    const variants = await query(
      'SELECT * FROM filter_category_variants WHERE category_id = ? ORDER BY bind_code',
      [categoryId]
    ) as FilterCategoryVariant[];

    console.log(`✅ ${variants.length} variantes obtenidas`);
    return variants;
  } catch (error) {
    console.error('❌ Error obteniendo variantes:', error);
    return [];
  }
};

/**
 * Obtener una variante por bind_code
 */
export const getVariantByBindCode = async (bindCode: string): Promise<FilterCategoryVariant | null> => {
  try {
    console.log('🔍 Obteniendo variante por bind_code:', bindCode);

    const variants = await query(
      'SELECT * FROM filter_category_variants WHERE bind_code = ?',
      [bindCode]
    ) as FilterCategoryVariant[];

    if (variants.length === 0) {
      console.log('❌ Variante no encontrada');
      return null;
    }

    console.log('✅ Variante obtenida');
    return variants[0];
  } catch (error) {
    console.error('❌ Error obteniendo variante:', error);
    return null;
  }
};

/**
 * Agregar una variante a una categoría
 */
export const addCategoryVariant = async (variantData: Partial<FilterCategoryVariant>): Promise<number | null> => {
  try {
    console.log('✨ Agregando variante:', variantData.bind_code);

    const result = await query(
      `INSERT INTO filter_category_variants (
        category_id, bind_code, nominal_size, real_size, price, currency, price_usd, stock, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        variantData.category_id,
        variantData.bind_code,
        variantData.nominal_size,
        variantData.real_size,
        variantData.price,
        variantData.currency || 'MXN',
        variantData.price_usd || null,
        variantData.stock || 0,
        variantData.is_active !== undefined ? variantData.is_active : true,
      ]
    ) as ResultSetHeader;

    console.log('✅ Variante agregada con ID:', result.insertId);
    return result.insertId;
  } catch (error) {
    console.error('❌ Error agregando variante:', error);
    return null;
  }
};

/**
 * Actualizar una variante
 */
export const updateCategoryVariant = async (id: number, variantData: Partial<FilterCategoryVariant>): Promise<boolean> => {
  try {
    console.log('📝 Actualizando variante ID:', id);

    await query(
      `UPDATE filter_category_variants SET
        bind_code = ?, nominal_size = ?, real_size = ?, price = ?, currency = ?, price_usd = ?, stock = ?, is_active = ?
      WHERE id = ?`,
      [
        variantData.bind_code,
        variantData.nominal_size,
        variantData.real_size,
        variantData.price,
        variantData.currency || 'MXN',
        variantData.price_usd || null,
        variantData.stock,
        variantData.is_active,
        id,
      ]
    );

    console.log('✅ Variante actualizada');
    return true;
  } catch (error) {
    console.error('❌ Error actualizando variante:', error);
    return false;
  }
};

/**
 * Eliminar una variante
 */
export const deleteCategoryVariant = async (id: number): Promise<boolean> => {
  try {
    console.log('🗑️ Eliminando variante ID:', id);

    await query('DELETE FROM filter_category_variants WHERE id = ?', [id]);

    console.log('✅ Variante eliminada');
    return true;
  } catch (error) {
    console.error('❌ Error eliminando variante:', error);
    return false;
  }
};

/**
 * Obtener estadísticas de categorías
 */
export const getCategoryStats = async () => {
  try {
    const allCategories = await getAllCategories();
    const activeCategories = allCategories.filter(c => c.status === 'active');
    const inactiveCategories = allCategories.filter(c => c.status === 'inactive' || c.status === 'draft');

    return {
      total: allCategories.length,
      active: activeCategories.length,
      inactive: inactiveCategories.length,
    };
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return {
      total: 0,
      active: 0,
      inactive: 0,
    };
  }
};

export default {
  // Categorías
  getAllCategories,
  getActiveCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  // Imágenes
  getCategoryImages,
  addCategoryImage,
  deleteCategoryImage,
  deletePrimaryCategoryImages,
  // Variantes
  getCategoryVariants,
  getVariantByBindCode,
  addCategoryVariant,
  updateCategoryVariant,
  deleteCategoryVariant,
  // Estadísticas
  getCategoryStats,
};
