#!/usr/bin/env node

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function createTestOrders() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'starfilters_db'
    });

    console.log('🔗 Conectando a la base de datos...');

    // Primero agregar user_id a la tabla orders si no existe
    try {
      await connection.execute('ALTER TABLE orders ADD COLUMN user_id INT AFTER id');
      console.log('✅ Columna user_id agregada a la tabla orders');
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        console.log('⚠️ Error al agregar columna user_id:', error.message);
      } else {
        console.log('✅ Columna user_id ya existe');
      }
    }

    // Obtener el usuario de prueba
    const [users] = await connection.execute(
      'SELECT id, email, first_name, last_name FROM users WHERE email = ?',
      ['bugr.2487@gmail.com']
    );

    if (users.length === 0) {
      console.log('❌ Usuario de prueba no encontrado');
      await connection.end();
      return;
    }

    const user = users[0];
    console.log(`👤 Usuario encontrado: ${user.first_name} ${user.last_name} (${user.email})`);

    // Verificar si ya existen pedidos para este usuario
    const [existingOrders] = await connection.execute(
      'SELECT COUNT(*) as count FROM orders WHERE user_id = ? OR customer_email = ?',
      [user.id, user.email]
    );

    if (existingOrders[0].count > 0) {
      console.log('✅ Ya existen pedidos de prueba para este usuario');
      await connection.end();
      return;
    }

    // Obtener productos disponibles
    const [products] = await connection.execute(
      'SELECT id, name, price FROM products WHERE status = "active" LIMIT 5'
    );

    if (products.length === 0) {
      console.log('❌ No hay productos activos para crear pedidos');
      await connection.end();
      return;
    }

    console.log(`📦 Productos encontrados: ${products.length}`);

    // Crear pedidos de prueba
    const testOrders = [
      {
        order_number: 'ORD-2024-001',
        user_id: user.id,
        customer_name: `${user.first_name} ${user.last_name}`,
        customer_email: user.email,
        customer_phone: '+52 123 456 7890',
        total_amount: 89.97,
        status: 'delivered',
        shipping_address: 'Av. Principal 123\nCol. Centro\n45000 Zapopan, Jalisco\nMéxico',
        items: [
          { product_id: products[0].id, quantity: 2, price: products[0].price, product_name: products[0].name },
          { product_id: products[1].id, quantity: 1, price: products[1].price, product_name: products[1].name }
        ]
      },
      {
        order_number: 'ORD-2024-002',
        user_id: user.id,
        customer_name: `${user.first_name} ${user.last_name}`,
        customer_email: user.email,
        customer_phone: '+52 123 456 7890',
        total_amount: 44.98,
        status: 'shipped',
        shipping_address: 'Av. Principal 123\nCol. Centro\n45000 Zapopan, Jalisco\nMéxico',
        items: [
          { product_id: products[1].id, quantity: 1, price: products[1].price, product_name: products[1].name },
          { product_id: products[2].id, quantity: 1, price: products[2].price, product_name: products[2].name }
        ]
      },
      {
        order_number: 'ORD-2024-003',
        user_id: user.id,
        customer_name: `${user.first_name} ${user.last_name}`,
        customer_email: user.email,
        customer_phone: '+52 123 456 7890',
        total_amount: 29.99,
        status: 'processing',
        shipping_address: 'Av. Principal 123\nCol. Centro\n45000 Zapopan, Jalisco\nMéxico',
        items: [
          { product_id: products[0].id, quantity: 1, price: products[0].price, product_name: products[0].name }
        ]
      }
    ];

    for (const orderData of testOrders) {
      // Insertar orden
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (order_number, user_id, customer_name, customer_email, customer_phone, total_amount, status, shipping_address, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY))`,
        [
          orderData.order_number,
          orderData.user_id,
          orderData.customer_name,
          orderData.customer_email,
          orderData.customer_phone,
          orderData.total_amount,
          orderData.status,
          orderData.shipping_address
        ]
      );

      const orderId = orderResult.insertId;

      // Insertar items de la orden
      for (const item of orderData.items) {
        await connection.execute(
          'INSERT INTO order_items (order_id, product_id, quantity, price, product_name) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.product_id, item.quantity, item.price, item.product_name]
        );
      }

      console.log(`✅ Pedido creado: ${orderData.order_number} (${orderData.status})`);
    }

    console.log('\n🎉 Pedidos de prueba creados exitosamente!');
    console.log('🔍 Puedes verlos en: http://localhost:4321/orders');

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestOrders();
