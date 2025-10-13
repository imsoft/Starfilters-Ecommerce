#!/usr/bin/env node

import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

async function addUUIDs() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'starfilters_db'
    });

    console.log('🔗 Conectando a la base de datos...');
    console.log('📝 Agregando campos UUID a todas las tablas...');

    // Agregar campos UUID a todas las tablas
    const tables = [
      'products',
      'orders', 
      'order_items',
      'blog_posts',
      'users',
      'admin_users'
    ];

    for (const table of tables) {
      try {
        // Primero agregar la columna sin DEFAULT
        console.log(`📋 Agregando campo uuid a tabla ${table}...`);
        await connection.execute(`
          ALTER TABLE ${table} 
          ADD COLUMN uuid VARCHAR(36) UNIQUE
          AFTER id
        `);
        console.log(`✅ Campo uuid agregado a ${table}`);

        // Obtener todos los registros existentes
        const [rows] = await connection.execute(`SELECT id FROM ${table} ORDER BY id`);
        
        if (rows.length > 0) {
          console.log(`🔄 Generando UUIDs para ${rows.length} registros existentes en ${table}...`);
          
          // Generar UUIDs para todos los registros
          for (const row of rows) {
            const uuid = randomUUID();
            await connection.execute(`UPDATE ${table} SET uuid = ? WHERE id = ?`, [uuid, row.id]);
          }
          
          console.log(`✅ UUIDs generados para ${table}`);
        }

        // Ahora hacer el campo NOT NULL
        await connection.execute(`
          ALTER TABLE ${table} 
          MODIFY COLUMN uuid VARCHAR(36) UNIQUE NOT NULL
        `);
        console.log(`🔒 Campo uuid marcado como NOT NULL en ${table}`);

        // Crear índice para el UUID
        try {
          await connection.execute(`CREATE INDEX idx_${table}_uuid ON ${table}(uuid)`);
          console.log(`🔍 Índice creado para ${table}.uuid`);
        } catch (indexError) {
          if (indexError.code !== 'ER_DUP_KEYNAME') {
            console.log(`⚠️ Error al crear índice para ${table}:`, indexError.message);
          }
        }

      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`✅ Campo uuid ya existe en ${table}`);
          
          // Verificar si hay registros sin UUID
          const [emptyUuids] = await connection.execute(`SELECT id FROM ${table} WHERE uuid IS NULL OR uuid = ''`);
          
          if (emptyUuids.length > 0) {
            console.log(`🔄 Generando UUIDs faltantes para ${emptyUuids.length} registros en ${table}...`);
            
            for (const row of emptyUuids) {
              const uuid = randomUUID();
              await connection.execute(`UPDATE ${table} SET uuid = ? WHERE id = ?`, [uuid, row.id]);
            }
            
            console.log(`✅ UUIDs faltantes generados para ${table}`);
          }
        } else {
          console.log(`❌ Error al modificar ${table}:`, error.message);
        }
      }
    }

    console.log('\n🎉 Migración de UUIDs completada!');
    
    // Verificar resultado
    console.log('\n📊 Verificando UUIDs generados:');
    for (const table of tables) {
      const [count] = await connection.execute(`SELECT COUNT(*) as total FROM ${table}`);
      const [uuidCount] = await connection.execute(`SELECT COUNT(*) as total FROM ${table} WHERE uuid IS NOT NULL AND uuid != ''`);
      
      console.log(`${table}: ${uuidCount[0].total}/${count[0].total} registros con UUID`);
      
      // Mostrar algunos ejemplos
      if (count[0].total > 0) {
        const [examples] = await connection.execute(`SELECT id, uuid FROM ${table} ORDER BY id LIMIT 3`);
        console.log(`   Ejemplos:`, examples.map(r => `ID:${r.id} -> UUID:${r.uuid}`).join(', '));
      }
    }

    await connection.end();
    console.log('\n✅ Migración completada exitosamente!');
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    process.exit(1);
  }
}

addUUIDs();
