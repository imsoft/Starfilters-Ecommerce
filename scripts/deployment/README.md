# 🚀 Scripts de Deployment para Hostinger

Esta carpeta contiene scripts de ayuda para facilitar el deployment de la aplicación en Hostinger.

## 📋 Scripts Disponibles

### 1. `export-database.js` - Exportar Base de Datos
Exporta la base de datos local para importarla en Hostinger.

```bash
node scripts/deployment/export-database.js
```

**Qué hace:**
- Exporta la base de datos local a un archivo `.sql`
- Guarda el archivo en `database/exports/`
- Incluye la fecha en el nombre del archivo

**Requisitos:**
- MySQL instalado
- Variables `DB_USER` y `DB_NAME` configuradas en `.env`

---

### 2. `create-env-template.js` - Crear Template de .env
Crea un archivo template con todas las variables de entorno necesarias.

```bash
node scripts/deployment/create-env-template.js
```

**Qué hace:**
- Crea un archivo `.env.production.example` con todas las variables necesarias
- Incluye comentarios explicativos
- Marca las variables que DEBES reemplazar

**Siguiente paso:**
1. Copia el archivo generado a tu servidor
2. Renómbralo a `.env`
3. Reemplaza los valores marcados con ⚠️

---

### 3. `create-htaccess.js` - Crear .htaccess
Genera el archivo `.htaccess` optimizado para Hostinger.

```bash
node scripts/deployment/create-htaccess.js
```

**Qué incluye:**
- ✅ Redirección automática HTTP → HTTPS
- ✅ Compresión GZIP
- ✅ Cache del navegador
- ✅ Headers de seguridad
- ✅ Protección de archivos sensibles (.env, .sql, .log)

---

### 4. `deploy-checklist.js` - Verificar Requisitos
Verifica que todos los requisitos estén completos antes del deployment.

```bash
node scripts/deployment/deploy-checklist.js
```

**Qué verifica:**
- ✅ Archivo `.env` existe
- ✅ Variables de entorno necesarias están configuradas
- ✅ Dependencias instaladas (`node_modules`)
- ✅ Build realizado (`dist` existe)
- ✅ `.env` está en `.gitignore` (seguridad)
- ✅ Base de datos exportada

**Ejemplo de salida:**
```
🔍 Verificando requisitos para deployment en Hostinger...
────────────────────────────────────────────────────────
✅ 1. Archivo .env existe
   ✓ Archivo .env encontrado
✅ 2. Variables de entorno configuradas
   ✓ Todas las variables requeridas están configuradas
✅ 3. Dependencias instaladas
   ✓ node_modules existe
✅ 4. Build de producción
   ✓ Carpeta dist existe
✅ 5. .env protegido en .gitignore
   ✓ .env está en .gitignore
✅ 6. Base de datos exportada
   ✓ Base de datos exportada (1 archivo(s))
```

---

## 🎯 Flujo Completo de Deployment

### Paso 1: Preparación
```bash
# 1. Crear template de .env
node scripts/deployment/create-env-template.js

# 2. Crear archivo .htaccess
node scripts/deployment/create-htaccess.js

# 3. Exportar base de datos
node scripts/deployment/export-database.js
```

### Paso 2: Verificación
```bash
# Verificar que todo esté listo
node scripts/deployment/deploy-checklist.js
```

Si todos los checks pasan ✅, continúa con el siguiente paso.

### Paso 3: Build
```bash
npm run build
```

### Paso 4: Subir Archivos
- **Opción A: FTP**
  - Usa FileZilla u otro cliente FTP
  - Sube todo a `public_html/`

- **Opción B: SSH**
  ```bash
  ssh usuario@tu_ip_hostinger
  cd public_html
  git clone https://github.com/imsoft/Starfilters-Ecommerce.git .
  npm install
  ```

### Paso 5: Configuración en Hostinger
1. Configura Node.js en el panel
2. Configura variables de entorno
3. Activa SSL/HTTPS
4. Configura webhooks de Stripe

---

## 🆘 Solución de Problemas

### Error: "Cannot find module"
```bash
# Instalar dependencias
npm install
```

### Error: "DB_USER no definido"
```bash
# Crear archivo .env localmente
cp .env.production.example .env
# Editar y configurar las variables
```

### Error: "mysqldump: command not found"
- Verifica que MySQL esté instalado
- En macOS: `brew install mysql`
- En Linux: `sudo apt-get install mysql-client`

---

## 📚 Recursos Adicionales

- [Guía Completa de Deployment](./../../docs/deployment/DEPLOY_HOSTINGER.md)
- [Checklist Paso a Paso](./../../docs/deployment/HOSTINGER_CHECKLIST.md)
- [README Principal](../../README.md)

---

## ✅ Checklist Rápido

Antes de hacer el deployment, asegúrate de tener:

- [ ] Archivo `.env` creado y configurado
- [ ] Base de datos exportada
- [ ] Archivo `.htaccess` generado
- [ ] Build de producción realizado
- [ ] Credenciales de Hostinger (FTP/SSH, MySQL)
- [ ] Credenciales de Stripe (producción)
- [ ] Credenciales de Cloudinary
- [ ] Verificación completada sin errores

---

¿Listo para deploy? ¡Adelante! 🚀
