import { query, getConnection } from '../config/database';

// Función utilitaria para generar UUID
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback para entornos que no soportan crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Tipos de datos
export interface Product {
  id: number;
  uuid: string;
  name: string;
  name_en?: string;
  description: string;
  description_en?: string;
  price: number;
  category: string;
  category_en?: string;
  stock: number;
  status: 'active' | 'inactive' | 'draft';
  tags?: string;
  dimensions?: string | null;
  weight?: string | null;
  material?: string | null;
  warranty?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProductImage {
  id: number;
  uuid: string;
  product_id: number;
  image_url: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
  created_at: Date;
}

export interface BlogPost {
  id: number;
  uuid: string;
  title: string;
  title_en?: string;
  slug: string;
  slug_en?: string;
  content: string;
  content_en?: string;
  excerpt: string;
  excerpt_en?: string;
  category: string;
  featured_image: string;
  author: string;
  status: 'published' | 'draft' | 'scheduled' | 'archived';
  meta_title: string;
  meta_title_en?: string;
  meta_description: string;
  meta_description_en?: string;
  tags: string;
  publish_date: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: number;
  uuid: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country: string;
  status: 'active' | 'inactive' | 'pending';
  email_verified: boolean;
  verification_token?: string;
  reset_token?: string;
  reset_token_expires?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: number;
  uuid: string;
  order_number: string;
  user_id?: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address?: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: number;
  uuid: string;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  product_name: string;
  image_url?: string;
  created_at: Date;
}

// Funciones para Productos
export const getProducts = async (limit = 10, offset = 0): Promise<Product[]> => {
  try {
    // Consulta simplificada sin LIMIT/OFFSET
    const sql = `
      SELECT * FROM products 
      WHERE status = 'active' 
      ORDER BY created_at DESC
    `;
    
    const allProducts = await query(sql, []) as Product[];
    
    // Aplicar limit y offset en JavaScript
    const startIndex = Math.max(0, offset);
    const endIndex = startIndex + Math.max(1, limit);
    
    return allProducts.slice(startIndex, endIndex);
  } catch (error) {
    console.error('Error en getProducts:', error);
    return [];
  }
};

export const getProductById = async (id: number): Promise<Product | null> => {
  const sql = 'SELECT * FROM products WHERE id = ?';
  const result = await query(sql, [id]) as Product[];
  return result.length > 0 ? result[0] : null;
};

export const getProductByUuid = async (uuid: string): Promise<Product | null> => {
  const sql = 'SELECT * FROM products WHERE uuid = ?';
  const result = await query(sql, [uuid]) as Product[];
  
  if (result.length > 0) {
    const product = result[0];
    // Log para verificar qué datos se están recibiendo de la BD
    console.log('🔍 getProductByUuid - Producto obtenido de la BD:');
    console.log('  - Dimensions (raw):', product.dimensions, typeof product.dimensions);
    console.log('  - Weight (raw):', product.weight, typeof product.weight);
    console.log('  - Material (raw):', product.material, typeof product.material);
    console.log('  - Warranty (raw):', product.warranty, typeof product.warranty);
    console.log('  - Producto completo (raw):', JSON.stringify(product, null, 2));
    return product;
  }
  
  return null;
};

export const createProduct = async (product: Omit<Product, 'id' | 'uuid' | 'created_at' | 'updated_at'>): Promise<number> => {
  const uuid = generateUUID();
  const sql = `
    INSERT INTO products (uuid, name, name_en, description, description_en, price, category, category_en, stock, status, tags, dimensions, weight, material, warranty) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const result = await query(sql, [
    uuid,
    product.name,
    product.name_en || null,
    product.description,
    product.description_en || null,
    product.price,
    product.category,
    product.category_en || null,
    product.stock,
    product.status,
    product.tags || '',
    product.dimensions || null,
    product.weight || null,
    product.material || null,
    product.warranty || null
  ]) as any;
  return result.insertId;
};

export const updateProduct = async (id: number, product: Partial<Product>): Promise<boolean> => {
  try {
    // Verificar que el producto existe antes de actualizar
    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      console.error('❌ El producto con ID', id, 'no existe');
      return false;
    }
    
    console.log('📝 updateProduct llamado con ID:', id);
    console.log('📝 Producto existente:', JSON.stringify(existingProduct, null, 2));
    console.log('📝 Datos a actualizar (JSON):', JSON.stringify(product, null, 2));
    
    const fields: string[] = [];
    const values: any[] = [];
    
    Object.entries(product).forEach(([key, value]) => {
      // Excluir solo id y created_at, incluir todos los demás campos
      if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
        // Incluir el campo si tiene un valor, si es null (para limpiar campos), o si es string vacío
        // Verificar explícitamente si el valor está definido (incluyendo null)
        const isDefined = value !== undefined;
        const existingValue = (existingProduct as any)[key];
        
        // Normalizar valores para comparación (null, undefined, string vacío se tratan como equivalentes)
        const normalizeValue = (v: any) => {
          if (v === null || v === undefined || v === '') return null;
          if (typeof v === 'string' && v.trim() === '') return null;
          return v;
        };
        
        const normalizedExisting = normalizeValue(existingValue);
        const normalizedNew = normalizeValue(value);
        const hasChanged = normalizedExisting !== normalizedNew;
        
        console.log(`  🔍 Campo ${key}:`);
        console.log(`     - Valor actual: ${existingValue === null ? 'NULL' : existingValue === undefined ? 'undefined' : JSON.stringify(existingValue)} (${typeof existingValue})`);
        console.log(`     - Valor nuevo: ${value === null ? 'NULL' : value === undefined ? 'undefined' : JSON.stringify(value)} (${typeof value})`);
        console.log(`     - Valor normalizado actual: ${normalizedExisting === null ? 'NULL' : JSON.stringify(normalizedExisting)}`);
        console.log(`     - Valor normalizado nuevo: ${normalizedNew === null ? 'NULL' : JSON.stringify(normalizedNew)}`);
        console.log(`     - Está definido: ${isDefined}`);
        console.log(`     - Ha cambiado: ${hasChanged}`);
        
        if (isDefined) {
          // Convertir string vacío a null para campos opcionales
          let finalValue = value;
          if (value === '' || (typeof value === 'string' && value.trim() === '')) {
            finalValue = null;
          }
          
          // Solo agregar el campo si ha cambiado
          if (hasChanged) {
            fields.push(`${key} = ?`);
            values.push(finalValue);
            console.log(`  ✅ Campo ${key} agregado: ${finalValue === null ? 'NULL' : JSON.stringify(finalValue)}`);
          } else {
            console.log(`  ⏭️  Campo ${key} omitido (sin cambios)`);
          }
        } else {
          console.log(`  ⏭️  Campo ${key} omitido (undefined)`);
        }
      }
    });
    
    if (fields.length === 0) {
      console.warn('⚠️ No hay campos para actualizar');
      return false;
    }
    
    values.push(id);
    const sql = `UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    
    console.log('🔍 SQL generado:', sql);
    console.log('🔍 Valores (count):', values.length);
    console.log('🔍 Valores detallados:', values.map((v, i) => `${i}: ${v === null ? 'NULL' : JSON.stringify(v)}`));
    
    const result = await query(sql, values) as any;
    
    console.log('📊 Resultado de query:', result);
    console.log('📊 Filas afectadas:', result.affectedRows);
    console.log('📊 Info:', result.info);
    
    if (result.affectedRows === 0) {
      console.warn('⚠️ La actualización no afectó ninguna fila. Posibles causas:');
      console.warn('  - El ID del producto no existe');
      console.warn('  - Los valores son exactamente los mismos que ya existen');
    }
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('❌ Error en updateProduct:', error);
    if (error instanceof Error) {
      console.error('❌ Mensaje de error:', error.message);
      console.error('❌ Stack:', error.stack);
    }
    throw error;
  }
};

export const deleteProduct = async (id: number): Promise<boolean> => {
  const sql = 'DELETE FROM products WHERE id = ?';
  const result = await query(sql, [id]) as any;
  return result.affectedRows > 0;
};

// Funciones para Órdenes
export const getOrders = async (limit = 10, offset = 0): Promise<Order[]> => {
  try {
    const sql = `
      SELECT * FROM orders 
      ORDER BY created_at DESC
    `;
    
    const allOrders = await query(sql, []) as Order[];
    
    // Aplicar limit y offset en JavaScript
    const startIndex = Math.max(0, offset);
    const endIndex = startIndex + Math.max(1, limit);
    
    return allOrders.slice(startIndex, endIndex);
  } catch (error) {
    console.error('Error en getOrders:', error);
    return [];
  }
};


export const updateOrderStatus = async (id: number, status: string): Promise<boolean> => {
  const sql = 'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?';
  const result = await query(sql, [status, id]) as any;
  return result.affectedRows > 0;
};

// Funciones para Blog
export const getBlogPosts = async (limit = 10, offset = 0): Promise<BlogPost[]> => {
  try {
    const sql = `
      SELECT * FROM blog_posts 
      WHERE status = 'published' 
      ORDER BY created_at DESC
    `;
    
    const allPosts = await query(sql, []) as BlogPost[];
    
    // Aplicar limit y offset en JavaScript
    const startIndex = Math.max(0, offset);
    const endIndex = startIndex + Math.max(1, limit);
    
    return allPosts.slice(startIndex, endIndex);
  } catch (error) {
    console.error('Error en getBlogPosts:', error);
    return [];
  }
};

export const getAllBlogPosts = async (limit = 100, offset = 0): Promise<BlogPost[]> => {
  try {
    const sql = `
      SELECT * FROM blog_posts 
      ORDER BY created_at DESC
    `;
    
    const allPosts = await query(sql, []) as BlogPost[];
    
    // Aplicar limit y offset en JavaScript
    const startIndex = Math.max(0, offset);
    const endIndex = startIndex + Math.max(1, limit);
    
    return allPosts.slice(startIndex, endIndex);
  } catch (error) {
    console.error('Error en getAllBlogPosts:', error);
    return [];
  }
};

export const getBlogPostById = async (id: number): Promise<BlogPost | null> => {
  const sql = 'SELECT * FROM blog_posts WHERE id = ?';
  const result = await query(sql, [id]) as BlogPost[];
  return result.length > 0 ? result[0] : null;
};


export const getBlogPostByUuid = async (uuid: string): Promise<BlogPost | null> => {
  const sql = 'SELECT * FROM blog_posts WHERE uuid = ? AND status = "published"';
  const result = await query(sql, [uuid]) as BlogPost[];
  return result.length > 0 ? result[0] : null;
};



export const deleteBlogPost = async (id: number): Promise<boolean> => {
  const sql = 'DELETE FROM blog_posts WHERE id = ?';
  const result = await query(sql, [id]) as any;
  return result.affectedRows > 0;
};

// Funciones para Órdenes
export const createOrder = async (order: Omit<Order, 'id' | 'uuid' | 'created_at' | 'updated_at'>): Promise<number> => {
  const uuid = generateUUID();
  const sql = `
    INSERT INTO orders (uuid, order_number, user_id, customer_name, customer_email, customer_phone, total_amount, status, shipping_address) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const result = await query(sql, [
    uuid,
    order.order_number,
    order.user_id || null,
    order.customer_name,
    order.customer_email,
    order.customer_phone || null,
    order.total_amount,
    order.status,
    order.shipping_address || null
  ]) as any;
  return result.insertId;
};

export const createOrderItem = async (item: Omit<OrderItem, 'id' | 'uuid' | 'created_at'>): Promise<number> => {
  const uuid = generateUUID();
  const sql = `
    INSERT INTO order_items (uuid, order_id, product_id, quantity, price, product_name, image_url) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const result = await query(sql, [
    uuid,
    item.order_id,
    item.product_id,
    item.quantity,
    item.price,
    item.product_name,
    item.image_url || null
  ]) as any;
  return result.insertId;
};

// Funciones para Usuarios
export const getUserByEmail = async (email: string): Promise<User | null> => {
  const sql = 'SELECT * FROM users WHERE email = ?';
  const result = await query(sql, [email]) as User[];
  return result.length > 0 ? result[0] : null;
};

export const getUserById = async (id: number): Promise<User | null> => {
  const sql = 'SELECT * FROM users WHERE id = ?';
  const result = await query(sql, [id]) as User[];
  return result.length > 0 ? result[0] : null;
};

export const getUserByUuid = async (uuid: string): Promise<User | null> => {
  const sql = 'SELECT * FROM users WHERE uuid = ?';
  const result = await query(sql, [uuid]) as User[];
  return result.length > 0 ? result[0] : null;
};

export const createUser = async (user: Omit<User, 'id' | 'uuid' | 'created_at' | 'updated_at'>): Promise<number> => {
  const uuid = generateUUID();
  const sql = `
    INSERT INTO users (uuid, email, password_hash, first_name, last_name, phone, address, city, postal_code, country, status, email_verified, verification_token) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const result = await query(sql, [
    uuid,
    user.email,
    user.password_hash,
    user.first_name,
    user.last_name,
    user.phone || null,
    user.address || null,
    user.city || null,
    user.postal_code || null,
    user.country,
    user.status,
    user.email_verified,
    user.verification_token || null
  ]) as any;
  return result.insertId;
};

export const updateUser = async (id: number, user: Partial<User>): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];
  
  Object.entries(user).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at' && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });
  
  if (fields.length === 0) return false;
  
  values.push(id);
  const sql = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
  const result = await query(sql, values) as any;
  return result.affectedRows > 0;
};

export const verifyUserEmail = async (verificationToken: string): Promise<boolean> => {
  const sql = 'UPDATE users SET email_verified = TRUE, status = "active", verification_token = NULL WHERE verification_token = ?';
  const result = await query(sql, [verificationToken]) as any;
  return result.affectedRows > 0;
};

export const updateUserPassword = async (userId: number, passwordHash: string): Promise<boolean> => {
  const sql = 'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?';
  const result = await query(sql, [passwordHash, userId]) as any;
  return result.affectedRows > 0;
};

// Función para actualizar la imagen de perfil de un administrador
export const updateAdminProfileImage = async (adminId: number, imageUrl: string): Promise<boolean> => {
  try {
    const sql = 'UPDATE admin_users SET profile_image = ?, updated_at = NOW() WHERE id = ?';
    const result = await query(sql, [imageUrl, adminId]) as any;
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error actualizando imagen de perfil del administrador:', error);
    return false;
  }
};

// Función para promover un usuario a administrador
export const promoteUserToAdmin = async (userId: number): Promise<boolean> => {
  try {
    // Primero obtener los datos del usuario
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar si ya es administrador
    const existingAdmin = await getAdminUserByEmail(user.email);
    if (existingAdmin) {
      throw new Error('El usuario ya es administrador');
    }

    // Crear entrada en admin_users
    const adminUuid = generateUUID();
    const sql = `
      INSERT INTO admin_users (uuid, username, email, password_hash, full_name, role, status) 
      VALUES (?, ?, ?, ?, ?, 'editor', 'active')
    `;
    
    const username = user.email.split('@')[0]; // Usar parte del email como username
    const fullName = `${user.first_name} ${user.last_name}`;
    
    const result = await query(sql, [
      adminUuid,
      username,
      user.email,
      user.password_hash, // Usar la misma contraseña
      fullName
    ]) as any;

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error promoviendo usuario a admin:', error);
    return false;
  }
};

// Función para obtener usuarios normales (no administradores)
export const getRegularUsers = async (limit = 50, offset = 0): Promise<User[]> => {
  try {
    const sql = `
      SELECT u.* FROM users u 
      LEFT JOIN admin_users a ON u.email = a.email 
      WHERE a.email IS NULL 
      ORDER BY u.created_at DESC
    `;
    
    const result = await query(sql, []) as User[];
    
    // Aplicar paginación en JavaScript
    const startIndex = offset;
    const endIndex = startIndex + limit;
    return result.slice(startIndex, endIndex);
  } catch (error) {
    console.error('Error obteniendo usuarios regulares:', error);
    return [];
  }
};

// Función para obtener un administrador por email
export const getAdminUserByEmail = async (email: string): Promise<any | null> => {
  const sql = 'SELECT * FROM admin_users WHERE email = ?';
  const result = await query(sql, [email]) as any[];
  return result.length > 0 ? result[0] : null;
};

// Función para obtener todos los administradores
export const getAdminUsers = async (): Promise<any[]> => {
  try {
    const sql = 'SELECT * FROM admin_users ORDER BY created_at DESC';
    const result = await query(sql, []) as any[];
    return result;
  } catch (error) {
    console.error('Error obteniendo administradores:', error);
    return [];
  }
};

// Función para verificar si un usuario es administrador
export const isUserAdmin = async (userId: number): Promise<boolean> => {
  try {
    const user = await getUserById(userId);
    if (!user) return false;

    const admin = await getAdminUserByEmail(user.email);
    return admin !== null;
  } catch (error) {
    console.error('Error verificando si es admin:', error);
    return false;
  }
};

export const setPasswordResetToken = async (email: string, token: string, expiresAt: Date): Promise<boolean> => {
  const sql = 'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?';
  const result = await query(sql, [token, expiresAt, email]) as any;
  return result.affectedRows > 0;
};

export const getUserByResetToken = async (token: string): Promise<User | null> => {
  const sql = 'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()';
  const result = await query(sql, [token]) as User[];
  return result.length > 0 ? result[0] : null;
};

export const resetPassword = async (token: string, newPasswordHash: string): Promise<boolean> => {
  const sql = 'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE reset_token = ? AND reset_token_expires > NOW()';
  const result = await query(sql, [newPasswordHash, token]) as any;
  return result.affectedRows > 0;
};

// Funciones para Pedidos/Órdenes
export const getUserOrders = async (userId: number, limit = 50, offset = 0): Promise<Order[]> => {
  try {
    // Validar parámetros
    if (!userId || isNaN(userId)) {
      console.error('getUserOrders: userId inválido:', userId);
      return [];
    }
    
    // Primero obtener el email del usuario
    const userResult = await query('SELECT email FROM users WHERE id = ?', [userId]) as any[];
    if (!userResult.length) {
      console.log('getUserOrders: No se encontró usuario con ID:', userId);
      return [];
    }
    
    const userEmail = userResult[0].email;
    
    // Consulta simplificada sin LIMIT/OFFSET por ahora
    const sql = `
      SELECT * FROM orders 
      WHERE user_id = ? OR customer_email = ?
      ORDER BY created_at DESC
    `;
    
    console.log('getUserOrders: Ejecutando consulta con parámetros:', [userId, userEmail]);
    
    const result = await query(sql, [userId, userEmail]) as Order[];
    
    // Aplicar limit y offset en JavaScript si es necesario
    const startIndex = Math.max(0, offset);
    const endIndex = startIndex + Math.max(1, limit);
    
    return result.slice(startIndex, endIndex);
  } catch (error) {
    console.error('Error en getUserOrders:', error);
    return [];
  }
};

export const getOrderById = async (orderId: number): Promise<Order | null> => {
  const sql = 'SELECT * FROM orders WHERE id = ?';
  const result = await query(sql, [orderId]) as Order[];
  return result.length > 0 ? result[0] : null;
};

export const getOrderByUuid = async (uuid: string): Promise<Order | null> => {
  const sql = 'SELECT * FROM orders WHERE uuid = ?';
  const result = await query(sql, [uuid]) as Order[];
  return result.length > 0 ? result[0] : null;
};

export const getOrderItems = async (orderId: number): Promise<OrderItem[]> => {
  const sql = `
    SELECT oi.*, p.image_url 
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
    ORDER BY oi.id
  `;
  return await query(sql, [orderId]) as OrderItem[];
};

export const getUserOrderWithItems = async (userId: number, orderId: number) => {
  const order = await getOrderById(orderId);
  if (!order) return null;
  
  // Verificar que el pedido pertenece al usuario
  const userEmailResult = await query('SELECT email FROM users WHERE id = ?', [userId]) as any[];
  if (!userEmailResult.length || (order.user_id !== userId && order.customer_email !== userEmailResult[0].email)) {
    return null;
  }
  
  const items = await getOrderItems(orderId);
  return { ...order, items };
};

// Funciones de estadísticas para el dashboard
export const getDashboardStats = async () => {
  try {
    // Obtener estadísticas básicas
    const [productsResult, ordersResult, blogResult, usersResult] = await Promise.all([
      query('SELECT COUNT(*) as total FROM products'),
      query('SELECT COUNT(*) as total FROM orders'),
      query('SELECT COUNT(*) as total FROM blog_posts'),
      query('SELECT COUNT(*) as total FROM users WHERE status = "active"')
    ]);

    // Obtener pedidos pendientes
    const pendingOrdersResult = await query('SELECT COUNT(*) as total FROM orders WHERE status = "pending"');

    // Obtener ventas del mes actual
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthlySalesResult = await query(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = "completed" AND created_at >= ?',
      [firstDayOfMonth]
    );

    return {
      totalProducts: (productsResult as any)[0]?.total || 0,
      totalOrders: (ordersResult as any)[0]?.total || 0,
      pendingOrders: (pendingOrdersResult as any)[0]?.total || 0,
      totalBlogPosts: (blogResult as any)[0]?.total || 0,
      totalUsers: (usersResult as any)[0]?.total || 0,
      monthlySales: (monthlySalesResult as any)[0]?.total || 0
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas del dashboard:', error);
    return {
      totalProducts: 0,
      totalOrders: 0,
      pendingOrders: 0,
      totalBlogPosts: 0,
      totalUsers: 0,
      monthlySales: 0
    };
  }
};

export async function getRecentProducts(limit = 5): Promise<Product[]> {
  try {
    // Obtener todos los productos y aplicar limit en JavaScript
    const sql = 'SELECT * FROM products ORDER BY created_at DESC';
    const allProducts = await query(sql, []) as Product[];
    
    // Aplicar limit en JavaScript
    return allProducts.slice(0, limit);
  } catch (error) {
    console.error('Error obteniendo productos recientes:', error);
    return [];
  }
}

// Funciones para Analytics
export interface SalesStats {
  today: number;
  week: number;
  month: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  total_sold: number;
  total_revenue: number;
}

export interface UserStats {
  total: number;
  active: number;
  newThisMonth: number;
}

export interface ConversionFunnel {
  visitors: number;
  cartAdds: number;
  checkouts: number;
  completed: number;
}

export const getSalesStats = async (): Promise<SalesStats> => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastMonthAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

    // Ventas de hoy
    const todayResult = await query(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status IN ("delivered", "shipped", "processing") AND created_at >= ?',
      [today]
    );

    // Ventas de esta semana
    const weekResult = await query(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status IN ("delivered", "shipped", "processing") AND created_at >= ?',
      [weekAgo]
    );

    // Ventas de este mes
    const monthResult = await query(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status IN ("delivered", "shipped", "processing") AND created_at >= ?',
      [monthAgo]
    );

    // Ventas del mes pasado para calcular tendencia
    const lastMonthResult = await query(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status IN ("delivered", "shipped", "processing") AND created_at >= ? AND created_at < ?',
      [lastMonthAgo, monthAgo]
    );

    const currentMonth = (monthResult as any)[0]?.total || 0;
    const lastMonth = (lastMonthResult as any)[0]?.total || 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (currentMonth > lastMonth * 1.05) trend = 'up';
    else if (currentMonth < lastMonth * 0.95) trend = 'down';

    return {
      today: (todayResult as any)[0]?.total || 0,
      week: (weekResult as any)[0]?.total || 0,
      month: currentMonth,
      trend
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de ventas:', error);
    return { today: 0, week: 0, month: 0, trend: 'stable' };
  }
};

export const getTopProducts = async (limit = 5): Promise<TopProduct[]> => {
  try {
    const result = await query(
      `SELECT 
        oi.product_id,
        oi.product_name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.price) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ("delivered", "shipped", "processing")
      GROUP BY oi.product_id, oi.product_name
      ORDER BY total_sold DESC
      LIMIT ?`,
      [limit]
    );

    return (result as any[]).map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      total_sold: item.total_sold,
      total_revenue: item.total_revenue
    }));
  } catch (error) {
    console.error('Error obteniendo productos más vendidos:', error);
    return [];
  }
};

export const getUserStats = async (): Promise<UserStats> => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalResult, activeResult, newThisMonthResult] = await Promise.all([
      query('SELECT COUNT(*) as total FROM users'),
      query('SELECT COUNT(*) as total FROM users WHERE status = "active"'),
      query('SELECT COUNT(*) as total FROM users WHERE created_at >= ?', [firstDayOfMonth])
    ]);

    return {
      total: (totalResult as any)[0]?.total || 0,
      active: (activeResult as any)[0]?.total || 0,
      newThisMonth: (newThisMonthResult as any)[0]?.total || 0
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de usuarios:', error);
    return { total: 0, active: 0, newThisMonth: 0 };
  }
};

export const getConversionFunnel = async (): Promise<ConversionFunnel> => {
  try {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Estimaciones simples basadas en datos disponibles
    const ordersResult = await query(
      'SELECT COUNT(*) as total FROM orders WHERE created_at >= ?',
      [last30Days]
    );

    const completedResult = await query(
      'SELECT COUNT(*) as total FROM orders WHERE status = "delivered" AND created_at >= ?',
      [last30Days]
    );

    // Estimaciones (en producción usarías Google Analytics o similar)
    const totalOrders = (ordersResult as any)[0]?.total || 0;
    const completed = (completedResult as any)[0]?.total || 0;
    
    // Estimaciones conservadoras para embudo
    const estimatedCheckouts = Math.round(totalOrders * 1.2); // Asumiendo 20% abandono
    const estimatedCartAdds = Math.round(totalOrders * 3); // Asumiendo 3:1 ratio
    const estimatedVisitors = Math.round(totalOrders * 10); // Asumiendo 1% conversión

    return {
      visitors: estimatedVisitors,
      cartAdds: estimatedCartAdds,
      checkouts: estimatedCheckouts,
      completed: completed
    };
  } catch (error) {
    console.error('Error obteniendo embudo de conversión:', error);
    return { visitors: 0, cartAdds: 0, checkouts: 0, completed: 0 };
  }
};

// Funciones para el blog
export interface CreateBlogPostData {
  title: string;
  title_en?: string;
  slug: string;
  slug_en?: string;
  excerpt: string;
  excerpt_en?: string;
  content: string;
  content_en?: string;
  category: string;
  author: string;
  status: 'draft' | 'published' | 'scheduled';
  publish_date?: Date;
  tags?: string;
  featured_image_url?: string;
  meta_title?: string;
  meta_title_en?: string;
  meta_description?: string;
  meta_description_en?: string;
}

export async function createBlogPost(data: CreateBlogPostData): Promise<BlogPost | null> {
  try {
    const uuid = generateUUID();
    const now = new Date();
    
    const result = await query(
      `INSERT INTO blog_posts (
        uuid, title, title_en, slug, slug_en, excerpt, excerpt_en, content, content_en, category, author, 
        status, publish_date, tags, featured_image_url, 
        meta_title, meta_title_en, meta_description, meta_description_en, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuid,
        data.title,
        data.title_en || null,
        data.slug,
        data.slug_en || null,
        data.excerpt,
        data.excerpt_en || null,
        data.content,
        data.content_en || null,
        data.category,
        data.author,
        data.status,
        data.publish_date || now,
        data.tags || '',
        data.featured_image_url || null,
        data.meta_title || data.title,
        data.meta_title_en || null,
        data.meta_description || data.excerpt,
        data.meta_description_en || null,
        now,
        now
      ]
    );

    const insertId = (result as any).insertId;
    if (insertId) {
      const rows = await query('SELECT * FROM blog_posts WHERE id = ?', [insertId]);
      return (rows as BlogPost[])[0] || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error creando post del blog:', error);
    return null;
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const rows = await query(
      'SELECT * FROM blog_posts WHERE slug = ? AND status = "published"',
      [slug]
    );
    return (rows as BlogPost[])[0] || null;
  } catch (error) {
    console.error('Error obteniendo post por slug:', error);
    return null;
  }
}

// Función para generar slug desde título
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remover caracteres especiales
    .replace(/[\s_-]+/g, '-') // Reemplazar espacios y guiones con un solo guión
    .replace(/^-+|-+$/g, ''); // Remover guiones del inicio y final
}

export interface UpdateBlogPostData {
  title: string;
  title_en?: string;
  slug: string;
  slug_en?: string;
  excerpt: string;
  excerpt_en?: string;
  content: string;
  content_en?: string;
  category: string;
  author: string;
  status: 'draft' | 'published' | 'scheduled';
  publish_date?: Date;
  tags?: string;
  featured_image_url?: string;
  meta_title?: string;
  meta_title_en?: string;
  meta_description?: string;
  meta_description_en?: string;
}

export async function updateBlogPost(uuid: string, data: UpdateBlogPostData): Promise<BlogPost | null> {
  try {
    const now = new Date();

    const result = await query(
      `UPDATE blog_posts SET
        title = ?, title_en = ?, slug = ?, slug_en = ?,
        excerpt = ?, excerpt_en = ?, content = ?, content_en = ?,
        category = ?, author = ?, status = ?, publish_date = ?,
        tags = ?, featured_image = ?,
        meta_title = ?, meta_title_en = ?,
        meta_description = ?, meta_description_en = ?,
        updated_at = ?
      WHERE uuid = ?`,
      [
        data.title,
        data.title_en || null,
        data.slug,
        data.slug_en || null,
        data.excerpt,
        data.excerpt_en || null,
        data.content,
        data.content_en || null,
        data.category,
        data.author,
        data.status,
        data.publish_date || now,
        data.tags || '',
        data.featured_image_url || null,
        data.meta_title || data.title,
        data.meta_title_en || null,
        data.meta_description || data.excerpt,
        data.meta_description_en || null,
        now,
        uuid
      ]
    );

    // Verificar si se actualizó algún registro
    const affectedRows = (result as any).affectedRows;
    if (affectedRows > 0) {
      const rows = await query('SELECT * FROM blog_posts WHERE uuid = ?', [uuid]);
      return (rows as BlogPost[])[0] || null;
    }

    return null;
  } catch (error) {
    console.error('Error actualizando post del blog:', error);
    return null;
  }
}

// Funciones para manejar imágenes de productos
export const getProductImages = async (productId: number): Promise<ProductImage[]> => {
  const sql = `
    SELECT id, uuid, product_id, image_url, alt_text, sort_order, is_primary, created_at
    FROM product_images 
    WHERE product_id = ? 
    ORDER BY sort_order ASC, created_at ASC
  `;
  const result = await query(sql, [productId]) as ProductImage[];
  return result;
};

export const getProductPrimaryImage = async (productId: number): Promise<ProductImage | null> => {
  const sql = `
    SELECT id, uuid, product_id, image_url, alt_text, sort_order, is_primary, created_at
    FROM product_images 
    WHERE product_id = ? AND is_primary = 1
    LIMIT 1
  `;
  const result = await query(sql, [productId]) as ProductImage[];
  return result.length > 0 ? result[0] : null;
};

export const addProductImage = async (image: Omit<ProductImage, 'id' | 'uuid' | 'created_at'>): Promise<number> => {
  const uuid = generateUUID();
  const sql = `
    INSERT INTO product_images (uuid, product_id, image_url, alt_text, sort_order, is_primary) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const result = await query(sql, [
    uuid,
    image.product_id,
    image.image_url,
    image.alt_text || null,
    image.sort_order,
    image.is_primary
  ]) as any;
  return result.insertId;
};

export const updateProductImage = async (id: number, image: Partial<ProductImage>): Promise<void> => {
  const fields = [];
  const values = [];

  if (image.image_url !== undefined) {
    fields.push('image_url = ?');
    values.push(image.image_url);
  }
  if (image.alt_text !== undefined) {
    fields.push('alt_text = ?');
    values.push(image.alt_text);
  }
  if (image.sort_order !== undefined) {
    fields.push('sort_order = ?');
    values.push(image.sort_order);
  }
  if (image.is_primary !== undefined) {
    fields.push('is_primary = ?');
    values.push(image.is_primary);
  }

  if (fields.length === 0) {
    return;
  }

  values.push(id);
  const sql = `UPDATE product_images SET ${fields.join(', ')} WHERE id = ?`;
  await query(sql, values);
};

export const deleteProductImage = async (id: number): Promise<void> => {
  const sql = 'DELETE FROM product_images WHERE id = ?';
  await query(sql, [id]);
};

export const setPrimaryImage = async (productId: number, imageId: number): Promise<void> => {
  // Primero quitar primary de todas las imágenes del producto
  await query('UPDATE product_images SET is_primary = 0 WHERE product_id = ?', [productId]);
  
  // Luego establecer la nueva imagen como primary
  await query('UPDATE product_images SET is_primary = 1 WHERE id = ? AND product_id = ?', [imageId, productId]);
};
