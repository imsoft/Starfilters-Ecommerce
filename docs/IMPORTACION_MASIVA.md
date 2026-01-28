# 📊 Guía de Importación Masiva desde Excel

Esta guía explica cómo usar la funcionalidad de importación masiva para productos y categorías de filtros desde archivos Excel.

---

## 📋 Contenido

1. [Importar Productos](#importar-productos)
2. [Importar Categorías](#importar-categorías)
3. [Formato de Archivos Excel](#formato-de-archivos-excel)
4. [Solución de Problemas](#solución-de-problemas)

---

## 🛍️ Importar Productos

### Paso 1: Acceder a la Página de Importación

1. Inicia sesión como administrador
2. Ve a **Productos** → **Gestión de Productos**
3. Haz clic en el botón **"Importar Excel"** (icono de documento) junto al botón "Agregar Producto"
4. O accede directamente a: `/admin/products/import`

### Paso 2: Descargar la Plantilla

1. En la página de importación, haz clic en **"Descargar Plantilla"**
2. Se descargará el archivo `productos-template.xlsx`
3. Abre el archivo en Excel o Google Sheets

### Paso 3: Llenar el Archivo Excel

El archivo incluye todas las columnas disponibles. **Solo necesitas llenar las que necesites:**

#### Columnas Requeridas:
- **nombre**: Nombre del producto (requerido)
- **precio**: Precio en MXN (requerido, por defecto 0)
- **stock**: Cantidad en inventario (requerido, por defecto 0)
- **status**: Estado del producto - `active`, `inactive` o `draft` (por defecto: `active`)

#### Columnas Opcionales Principales:
- **nombre_en**: Nombre en inglés
- **descripcion**: Descripción del producto
- **descripcion_en**: Descripción en inglés
- **categoria**: Categoría del producto (por defecto: "Filtros de Aire")
- **categoria_en**: Categoría en inglés
- **moneda**: `MXN` o `USD` (por defecto: `MXN`)
- **precio_usd**: Precio en USD (opcional)

#### Columnas de Categoría de Filtro:
- **categoria_filtro**: Nombre de la categoría de filtro (ej: "HEPA", "Pleat")
  - Si la categoría existe, se asociará automáticamente
  - Si no existe, el producto se creará sin categoría de filtro

#### Columnas Técnicas:
- **eficiencia**: Eficiencia de filtración (ej: "99.97% a 0.3µm")
- **eficiencia_en**: Eficiencia en inglés
- **clase_eficiencia**: Clase EN1822 (ej: "H13")
- **caracteristicas**: Características del producto
- **caracteristicas_en**: Características en inglés
- **material_marco**: Material del marco (ej: "Aluminio")
- **temperatura_maxima**: Temperatura máxima (ej: "70°C")
- **instalacion_tipica**: Instalación típica
- **instalacion_tipica_en**: Instalación típica en inglés
- **aplicaciones**: Aplicaciones del producto
- **aplicaciones_en**: Aplicaciones en inglés
- **beneficios**: Beneficios del producto
- **beneficios_en**: Beneficios en inglés

#### Columnas de Tamaño y Especificaciones:
- **tamaño_nominal**: Tamaño nominal (ej: "24x24x11.5")
- **tamaño_real**: Tamaño real (ej: "24x24x11.5")
- **dimensiones**: Dimensiones (ej: "610x610x292mm")
- **peso**: Peso (ej: "5kg")
- **material**: Material del producto
- **garantia**: Garantía (ej: "1 año")

#### Columnas de Identificación:
- **bind_id**: ID de Bind ERP (opcional)
- **bind_code**: Código de Bind ERP (opcional)
- **tags**: Etiquetas separadas por comas (ej: "hepa, filtro, cuarto limpio")

#### Columnas de Imágenes:
- **imagen_principal**: URL de la imagen principal
- **imagenes_carrusel**: URLs de imágenes separadas por comas (ej: "url1.jpg,url2.jpg,url3.jpg")

### Paso 4: Subir el Archivo

1. Haz clic en **"Seleccionar archivo"** y elige tu archivo Excel
2. Haz clic en **"Importar Productos"**
3. Espera a que se procese el archivo
4. Revisa los resultados:
   - ✅ Productos importados exitosamente
   - ❌ Errores (si los hay) con detalles de la fila

---

## 📁 Importar Categorías

### Paso 1: Acceder a la Página de Importación

1. Inicia sesión como administrador
2. Ve a **Categorías de Filtros**
3. Haz clic en el botón **"Importar Excel"** junto al botón "Nueva Categoría"
4. O accede directamente a: `/admin/filter-categories/import`

### Paso 2: Descargar la Plantilla

1. En la página de importación, haz clic en **"Descargar Plantilla"**
2. Se descargará el archivo `categorias-template.xlsx`
3. Abre el archivo en Excel o Google Sheets

### Paso 3: Llenar el Archivo Excel

#### Columnas Disponibles:

- **nombre**: Nombre de la categoría (requerido)
- **nombre_en**: Nombre en inglés (opcional)
- **descripcion**: Descripción de la categoría (opcional)
- **descripcion_en**: Descripción en inglés (opcional)
- **imagen_principal**: URL de la imagen principal (opcional)
  - Solo se permite una imagen principal por categoría
  - Si subes una nueva imagen, reemplazará automáticamente a la anterior
- **status**: Estado - `active`, `inactive` o `draft` (por defecto: `active`)

**Nota:** 
- El slug se genera automáticamente desde el nombre.
- Las categorías solo tienen imagen principal (no hay carrusel de imágenes).

### Paso 4: Subir el Archivo

1. Haz clic en **"Seleccionar archivo"** y elige tu archivo Excel
2. Haz clic en **"Importar Categorías"**
3. Espera a que se procese el archivo
4. Revisa los resultados

---

## 📐 Formato de Archivos Excel

### Estructura General

- **Primera fila**: Encabezados (nombres de columnas)
- **Filas siguientes**: Datos de cada producto/categoría
- **Formato**: `.xlsx` o `.xls`

### Ejemplo de Archivo de Productos

| nombre | precio | stock | categoria | status |
|--------|--------|-------|-----------|--------|
| Filtro HEPA H13 | 1500.00 | 100 | Filtros de Aire | active |
| Filtro Pleat | 500.00 | 50 | Filtros de Aire | active |

### Ejemplo de Archivo de Categorías

| nombre | nombre_en | descripcion | imagen_principal | status |
|--------|-----------|-------------|------------------|--------|
| Filtros HEPA | HEPA Filters | Filtros de alta eficiencia | https://ejemplo.com/hepa.jpg | active |
| Filtros Pleat | Pleat Filters | Filtros pleatados | https://ejemplo.com/pleat.jpg | active |

### Nombres de Columnas

Los nombres de columnas pueden estar en **español o inglés** y son case-insensitive:

- `nombre` o `name`
- `descripcion` o `description`
- `precio` o `price`
- `categoria` o `category`
- etc.

---

## ⚠️ Validaciones y Reglas

### Productos

1. **Campo requerido**: `nombre` debe estar presente
2. **Valores numéricos**: `precio`, `precio_usd`, `stock` se convierten automáticamente
3. **Status**: Debe ser `active`, `inactive` o `draft` (por defecto: `active`)
4. **Moneda**: Debe ser `MXN` o `USD` (por defecto: `MXN`)
5. **Categoría de filtro**: Si se proporciona `categoria_filtro`, se busca por nombre. Si existe, se asocia automáticamente.

### Categorías

1. **Campo requerido**: `nombre` debe estar presente
2. **Slug**: Se genera automáticamente desde el nombre (sin acentos, en minúsculas, con guiones)
3. **Status**: Debe ser `active`, `inactive` o `draft` (por defecto: `active`)

---

## 🔧 Solución de Problemas

### Error: "El archivo Excel está vacío o no tiene datos"

- **Causa**: El archivo no tiene filas de datos (solo encabezados o está vacío)
- **Solución**: Asegúrate de tener al menos una fila de datos después de los encabezados

### Error: "Falta el campo nombre" en fila X

- **Causa**: La fila no tiene valor en la columna `nombre` o `name`
- **Solución**: Completa el campo nombre para esa fila

### Error: "Error al crear el producto/categoría en la base de datos"

- **Causa**: Puede ser un problema de conexión a la base de datos o datos inválidos
- **Solución**: 
  - Verifica que los datos sean válidos
  - Revisa los logs del servidor para más detalles
  - Intenta importar de nuevo

### Los productos se crean pero sin imágenes

- **Causa**: Las URLs de imágenes deben ser accesibles públicamente
- **Solución**: 
  - Asegúrate de que las URLs sean válidas y accesibles
  - Las imágenes se subirán a Cloudinary automáticamente si las URLs son válidas
  - Puedes agregar imágenes manualmente después desde la página de edición

### La categoría de filtro no se asocia

- **Causa**: El nombre de la categoría no coincide exactamente con una existente
- **Solución**: 
  - Verifica el nombre exacto de la categoría en la base de datos
  - O crea la categoría primero antes de importar los productos

---

## 💡 Consejos

1. **Empieza con pocos productos**: Prueba con 5-10 productos primero para verificar que todo funcione
2. **Usa la plantilla**: Descarga siempre la plantilla para asegurar el formato correcto
3. **Revisa los resultados**: Siempre revisa el reporte de resultados después de importar
4. **Manejo de errores**: Si hay errores, corrige el archivo Excel y vuelve a importar
5. **Imágenes**: Las imágenes pueden agregarse después manualmente si prefieres
6. **Categorías primero**: Si tus productos necesitan categorías de filtro, créalas primero

---

## 📝 Notas Técnicas

- Los archivos Excel se procesan línea por línea
- Si una fila tiene errores, se continúa con las siguientes
- Los UUIDs se generan automáticamente para cada producto/categoría
- Las fechas de creación se establecen automáticamente
- Los campos vacíos se convierten en `null` en la base de datos

---

**Última actualización**: Diciembre 2024
