#!/usr/bin/env node

/**
 * Cuenta temporal de administrador para pruebas.
 *
 * Crea un usuario que puede entrar al sitio Y al panel, con una contraseña
 * generada al azar que se imprime UNA sola vez. Cuando terminen las pruebas,
 * se borra con --borrar. Así la contraseña deja de servir aunque haya
 * quedado escrita en un chat.
 *
 *   node scripts/admin-pruebas.js            → crea la cuenta e imprime la contraseña
 *   node scripts/admin-pruebas.js --borrar   → la elimina por completo
 *
 * Solo toca las filas de pruebas@imsoft.io. No modifica nada más.
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
dotenv.config();

const CORREO = 'pruebas@imsoft.io';
const BORRAR = process.argv.includes('--borrar');

const main = async () => {
  const con = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const q = async (sql, params = []) => (await con.query(sql, params))[0];

  console.log(`Base de datos: ${process.env.DB_NAME}`);

  if (BORRAR) {
    const a = await q('DELETE FROM admin_users WHERE email = ?', [CORREO]);
    const u = await q('DELETE FROM users WHERE email = ?', [CORREO]);
    console.log(`Cuenta de pruebas eliminada (admin_users: ${a.affectedRows}, users: ${u.affectedRows}).`);
    await con.end();
    return;
  }

  // Contraseña al azar, legible: 16 caracteres sin ambiguos (0/O, 1/l).
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(16);
  const contrasena = [...bytes].map((b) => alfabeto[b % alfabeto.length]).join('');
  const hash = await bcrypt.hash(contrasena, 10);

  // Si ya existía de una corrida anterior, se reemplaza: así siempre hay una
  // sola cuenta de pruebas y una sola contraseña vigente.
  await q('DELETE FROM admin_users WHERE email = ?', [CORREO]);
  await q('DELETE FROM users WHERE email = ?', [CORREO]);

  // Con quién se inicia sesión en el sitio.
  await q(
    `INSERT INTO users (uuid, email, password_hash, first_name, last_name, status, email_verified)
     VALUES (UUID(), ?, ?, 'Pruebas', 'imSoft', 'active', 1)`,
    [CORREO, hash]
  );
  // Lo que convierte ese correo en administrador.
  await q(
    `INSERT INTO admin_users (uuid, username, email, password_hash, full_name, role, status)
     VALUES (UUID(), 'pruebas', ?, ?, 'Pruebas imSoft', 'admin', 'active')`,
    [CORREO, hash]
  );

  console.log('\nCuenta de pruebas creada.');
  console.log(`  correo:      ${CORREO}`);
  console.log(`  contraseña:  ${contrasena}`);
  console.log('\nCuando terminen las pruebas:  node scripts/admin-pruebas.js --borrar');

  await con.end();
};

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
