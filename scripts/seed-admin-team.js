#!/usr/bin/env node

/**
 * Seed: administradores del equipo Star Filters.
 *
 * Crea (o actualiza) como administradores a:
 *   - Ander Gentry      a.gentry@starfilters.mx
 *   - Marcelle Derksen  m.derksen@starfilters.mx
 *   - Fernando          starinfo@starfilters.mx
 *
 * Todos con contraseña temporal "Star1234" (la cambiarán después), cuenta
 * activa y correo verificado. Idempotente: si ya existen, restablece la
 * contraseña y asegura el rol de admin.
 *
 * Uso: node scripts/seed-admin-team.js
 */

import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const PASSWORD = 'Star1234';

const ADMINS = [
  { email: 'a.gentry@starfilters.mx',  firstName: 'Ander',    lastName: 'Gentry',  fullName: 'Ander Gentry' },
  { email: 'm.derksen@starfilters.mx', firstName: 'Marcelle', lastName: 'Derksen', fullName: 'Marcelle Derksen' },
  { email: 'starinfo@starfilters.mx',  firstName: 'Fernando', lastName: 'Star Filters', fullName: 'Fernando' },
];

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'starfilters_ecommerce_db',
  });

  console.log('🔗 Conectado a la base de datos.');

  for (const admin of ADMINS) {
    const passwordHash = await bcrypt.hash(PASSWORD, 10);

    // 1) Usuario en `users` (activo y verificado para poder iniciar sesión)
    const [existingUser] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [admin.email]
    );

    if (existingUser.length === 0) {
      await connection.execute(
        `INSERT INTO users (uuid, email, password_hash, first_name, last_name, company, country, status, email_verified)
         VALUES (?, ?, ?, ?, ?, 'Star Filters', 'México', 'active', TRUE)`,
        [randomUUID(), admin.email, passwordHash, admin.firstName, admin.lastName]
      );
      console.log(`✅ Usuario creado: ${admin.email}`);
    } else {
      await connection.execute(
        `UPDATE users SET password_hash = ?, status = 'active', email_verified = TRUE, verification_token = NULL WHERE email = ?`,
        [passwordHash, admin.email]
      );
      console.log(`♻️  Usuario existente actualizado (contraseña restablecida): ${admin.email}`);
    }

    // 2) Rol de administrador en `admin_users`
    const [existingAdmin] = await connection.execute(
      'SELECT id FROM admin_users WHERE email = ?',
      [admin.email]
    );

    if (existingAdmin.length === 0) {
      await connection.execute(
        `INSERT INTO admin_users (uuid, username, email, password_hash, full_name, role, status)
         VALUES (?, ?, ?, ?, ?, 'admin', 'active')`,
        [randomUUID(), admin.email.split('@')[0], admin.email, passwordHash, admin.fullName]
      );
      console.log(`🔑 Rol de administrador otorgado: ${admin.email}`);
    } else {
      await connection.execute(
        `UPDATE admin_users SET password_hash = ?, status = 'active' WHERE email = ?`,
        [passwordHash, admin.email]
      );
      console.log(`🔑 Rol de administrador ya existía (contraseña sincronizada): ${admin.email}`);
    }
  }

  console.log('\n🎉 Listo. Los 3 pueden iniciar sesión en /login con la contraseña temporal y entrar a /admin.');
  console.log('⚠️  Pídeles cambiarla en su primer inicio de sesión (perfil o "¿Olvidaste tu contraseña?").');

  await connection.end();
}

seed().catch((err) => {
  console.error('❌ Error en el seed:', err.message);
  process.exit(1);
});
