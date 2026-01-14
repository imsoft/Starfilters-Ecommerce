# Scripts de Utilidades y Deployment

Este directorio contiene scripts útiles para administrar el VPS, la base de datos y el sistema.

## 🚀 Scripts de Deployment VPS

### `vps-update-all.sh`
Script completo e interactivo para actualizar el VPS con todas las mejoras.
- Actualiza código desde GitHub
- Ejecuta scripts SQL necesarios
- Reconstruye la aplicación
- Reinicia PM2

**Uso:**
```bash
./scripts/vps-update-all.sh
```

### `update-filter-categories-db.sh`
Actualiza la base de datos con los campos necesarios para filter categories.
- Verifica que la BD existe
- Agrega campos faltantes de forma segura

**Uso:**
```bash
./scripts/update-filter-categories-db.sh
```

### `check-database-name.sh`
Verifica el nombre correcto de la base de datos.

**Uso:**
```bash
./scripts/check-database-name.sh
```

## 🔧 Scripts de Diagnóstico y Fix

### `fix-server-start.sh`
Corrige problemas de inicio del servidor usando server.js.

### `fix-pm2-start.sh`
Corrige problemas de PM2 con configuración correcta.

### `fix-app-crashing.sh`
Diagnostica por qué la aplicación se está cayendo.

### `check-nginx-config.sh`
Verifica la configuración de Nginx y el estado de la aplicación.

### `diagnose-502.sh`
Diagnostica errores 502 Bad Gateway.

### `quick-fix-502.sh`
Solución rápida para errores 502.

### `fix-order-items-query.sh`
Corrige el error de query en order_items.

## 📊 Scripts de Base de Datos

### `export-database-structure.sh`
Exporta la estructura completa de la base de datos.

**Uso:**
```bash
./scripts/export-database-structure.sh
```

### `show-database-info.sh`
Muestra información clave de la base de datos.

### `show-all-tables-structure.sh`
Muestra la estructura de todas las tablas.

## 👤 Scripts de Usuarios

### `create-admin.js`
Crear un usuario administrador.

**Uso:**
```bash
node scripts/create-admin.js
```

### `reset-admin-password.js`
Restablecer contraseña de administrador.

**Uso:**
```bash
node scripts/reset-admin-password.js
```

### `activate-user.js`
Activar un usuario.

**Uso:**
```bash
node scripts/activate-user.js
```

## 🛠️ Scripts de Utilidades

### `edit-env-vps.sh`
Editar archivo .env en el VPS de forma segura.

### `fix-vps-complete.sh`
Script completo para arreglar problemas comunes en el VPS.

---

## 📝 Notas

- Todos los scripts de bash deben tener permisos de ejecución: `chmod +x script.sh`
- Los scripts de Node.js requieren variables de entorno en `.env`
- Los scripts de SQL verifican si los cambios ya existen antes de aplicarlos
