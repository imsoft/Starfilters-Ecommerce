# 📊 Exportar Estructura de Base de Datos desde VPS

## Opción 1: Script Automático (Recomendado)

### Paso 1: Conectarse al VPS

```bash
ssh root@72.60.228.9
cd ~/starfilters-app
```

### Paso 2: Ejecutar el script

```bash
# Opción A: Mostrar información rápida
./scripts/show-database-info.sh

# Opción B: Exportar estructura completa
./scripts/export-database-structure.sh
```

### Paso 3: Ver los resultados

Los archivos se guardarán en `database/exports/`:
- `db_structure_TIMESTAMP.sql` - Estructura completa
- `db_data_TIMESTAMP.sql` - Datos de tablas importantes

## Opción 2: Comandos Manuales

### Exportar solo estructura (sin datos)

```bash
mysqldump -h localhost -u tu_usuario -p tu_base_de_datos \
    --no-data \
    --routines \
    --triggers \
    > estructura.sql
```

### Exportar estructura + datos

```bash
mysqldump -h localhost -u tu_usuario -p tu_base_de_datos \
    > backup_completo.sql
```

### Mostrar información específica

```bash
mysql -h localhost -u tu_usuario -p tu_base_de_datos <<EOF
-- Ver todas las tablas
SHOW TABLES;

-- Ver estructura de una tabla
DESCRIBE filter_categories;

-- Ver datos de categorías
SELECT id, name, status, slug FROM filter_categories;

-- Ver variantes
SELECT * FROM filter_category_variants LIMIT 10;

-- Ver productos
SELECT id, name, status, category FROM products LIMIT 10;
EOF
```

## Opción 3: Exportar desde phpMyAdmin

1. Accede a phpMyAdmin en Hostinger
2. Selecciona tu base de datos
3. Ve a la pestaña "Exportar"
4. Selecciona "Personalizado"
5. Elige:
   - Estructura: ✅
   - Datos: ✅ (opcional)
6. Haz clic en "Continuar"
7. Descarga el archivo SQL

## Opción 4: Consultas Específicas para Compartir

Ejecuta estas consultas y comparte los resultados:

```sql
-- 1. Ver todas las tablas
SHOW TABLES;

-- 2. Estructura de filter_categories
SHOW CREATE TABLE filter_categories;

-- 3. Estructura de filter_category_variants
SHOW CREATE TABLE filter_category_variants;

-- 4. Estructura de products
SHOW CREATE TABLE products;

-- 5. Datos de categorías
SELECT * FROM filter_categories;

-- 6. Datos de variantes
SELECT * FROM filter_category_variants;

-- 7. Datos de productos (primeros 10)
SELECT * FROM products LIMIT 10;
```

## Compartir los Resultados

Una vez que tengas la información, puedes:

1. **Copiar y pegar** el resultado de los comandos aquí
2. **Subir el archivo SQL** a un servicio como Pastebin o GitHub Gist
3. **Mostrar el contenido** del archivo con `cat archivo.sql`

## Ejemplo de Uso Rápido

```bash
# En el VPS
cd ~/starfilters-app
./scripts/show-database-info.sh > db_info.txt
cat db_info.txt
```

Luego copia y pega el contenido de `db_info.txt` aquí.

