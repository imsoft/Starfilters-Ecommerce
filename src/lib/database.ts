import { query, getConnection } from '../config/database';
import { randomUUID } from 'crypto';

// Función utilitaria para generar UUID
export const generateUUID = (): string => randomUUID();

// Tipos de datos
export interface Product {
  id: number;
  uuid: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image_url: string;
  status: 'active' | 'inactive' | 'draft';
  created_at: Date;
  updated_at: Date;
}

export interface BlogPost {
  id: number;
  uuid: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  featured_image: string;
  author: string;
  status: 'published' | 'draft' | 'scheduled' | 'archived';
  meta_title: string;
  meta_description: string;
  tags: string;
  publish_date: Date;
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
  return result.length > 0 ? result[0] : null;
};

export const createProduct = async (product: Omit<Product, 'id' | 'uuid' | 'created_at' | 'updated_at'>): Promise<number> => {
  const uuid = generateUUID();
  const sql = `
    INSERT INTO products (uuid, name, description, price, category, stock, image_url, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const result = await query(sql, [
    uuid,
    product.name,
    product.description,
    product.price,
    product.category,
    product.stock,
    product.image_url,
    product.status
  ]) as any;
  return result.insertId;
};

export const updateProduct = async (id: number, product: Partial<Product>): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];
  
  Object.entries(product).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at' && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });
  
  if (fields.length === 0) return false;
  
  values.push(id);
  const sql = `UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
  const result = await query(sql, values) as any;
  return result.affectedRows > 0;
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
    const rows = await query(
      'SELECT * FROM products ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    return rows as Product[];
  } catch (error) {
    console.error('Error obteniendo productos recientes:', error);
    return [];
  }
}

// Funciones para el blog
export interface CreateBlogPostData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  status: 'draft' | 'published' | 'scheduled';
  publish_date?: Date;
  tags?: string;
  featured_image_url?: string;
  meta_title?: string;
  meta_description?: string;
}

export async function createBlogPost(data: CreateBlogPostData): Promise<BlogPost | null> {
  try {
    const uuid = generateUUID();
    const now = new Date();
    
    const result = await query(
      `INSERT INTO blog_posts (
        uuid, title, slug, excerpt, content, category, author, 
        status, publish_date, tags, featured_image_url, 
        meta_title, meta_description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuid,
        data.title,
        data.slug,
        data.excerpt,
        data.content,
        data.category,
        data.author,
        data.status,
        data.publish_date || now,
        data.tags || '',
        data.featured_image_url || null,
        data.meta_title || data.title,
        data.meta_description || data.excerpt,
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
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  status: 'draft' | 'published' | 'scheduled';
  publish_date?: Date;
  tags?: string;
  featured_image_url?: string;
  meta_title?: string;
  meta_description?: string;
}

export async function updateBlogPost(uuid: string, data: UpdateBlogPostData): Promise<BlogPost | null> {
  try {
    const now = new Date();
    
    const result = await query(
      `UPDATE blog_posts SET 
        title = ?, slug = ?, excerpt = ?, content = ?, category = ?, author = ?, 
        status = ?, publish_date = ?, tags = ?, featured_image_url = ?, 
        meta_title = ?, meta_description = ?, updated_at = ?
      WHERE uuid = ?`,
      [
        data.title,
        data.slug,
        data.excerpt,
        data.content,
        data.category,
        data.author,
        data.status,
        data.publish_date || now,
        data.tags || '',
        data.featured_image_url || null,
        data.meta_title || data.title,
        data.meta_description || data.excerpt,
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
