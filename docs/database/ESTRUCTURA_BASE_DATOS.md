# 📊 Documentación Completa de la Base de Datos

## Base de Datos: `starfilters_ecommerce_db`

Esta documentación describe la estructura completa de la base de datos del sistema Star Filters Ecommerce.

---

## 📋 Índice de Tablas

1. [admin_users](#admin_users) - Usuarios administradores
2. [blog_posts](#blog_posts) - Artículos del blog
3. [cart](#cart) - Carrito de compras
4. [categories](#categories) - Categorías generales
5. [discount_codes](#discount_codes) - Códigos de descuento
6. [discount_code_usage](#discount_code_usage) - Uso de códigos de descuento
7. [filter_categories](#filter_categories) - Categorías de filtros
8. [filter_category_images](#filter_category_images) - Imágenes de categorías de filtros
9. [filter_category_variants](#filter_category_variants) - Variantes de categorías de filtros
10. [orders](#orders) - Órdenes de compra
11. [order_items](#order_items) - Items de órdenes
12. [products](#products) - Productos
13. [product_images](#product_images) - Imágenes de productos
14. [product_reviews](#product_reviews) - Reseñas de productos
15. [site_settings](#site_settings) - Configuraciones del sitio
16. [users](#users) - Usuarios del sistema
17. [wishlist](#wishlist) - Lista de deseos

---

## 📑 Descripción Detallada de Tablas

### `admin_users`

**Propósito:** Almacena los usuarios administradores del sistema.

| Campo | Tipo | Null | Key | Default | Descripción |
|-------|------|------|-----|---------|-------------|
| `id` | `int` | NO | PRI | `NULL` | ID único del administrador (auto_increment) |
| `uuid` | `varchar(36)` | NO | UNI | `NULL` | UUID único del administrador |
| `username` | `varchar(50)` | NO | UNI | `NULL` | Nombre de usuario único |
| `email` | `varchar(255)` | NO | UNI | `NULL` | Email único del administrador |
| `password_hash` | `varchar(255)` | NO | | `NULL` | Hash de la contraseña (bcrypt) |
| `full_name` | `varchar(255)` | YES | | `NULL` | Nombre completo del administrador |
| `profile_image` | `varchar(500)` | YES | | `NULL` | URL de la imagen de perfil |
| `role` | `enum('admin','editor')` | YES | | `editor` | Rol del administrador |
| `status` | `enum('active','inactive')` | YES | | `active` | Estado del administrador |
| `created_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de creación |
| `updated_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de última actualización |

**Relaciones:**
- `author_id` en `blog_posts` → `id` (opcional)

**Notas:**
- Los administradores pueden tener rol `admin` (acceso completo) o `editor` (acceso limitado)
- El campo `profile_image` almacena la URL de la imagen en Cloudinary

---

### `blog_posts`

**Propósito:** Almacena los artículos del blog con soporte multiidioma (español/inglés).

| Campo | Tipo | Null | Key | Default | Descripción |
|-------|------|------|-----|---------|-------------|
| `id` | `int` | NO | PRI | `NULL` | ID único del artículo |
| `uuid` | `varchar(36)` | NO | UNI | `NULL` | UUID único del artículo |
| `title` | `varchar(255)` | NO | | `NULL` | Título en español |
| `slug` | `varchar(255)` | NO | UNI | `NULL` | Slug único en español |
| `content` | `longtext` | YES | | `NULL` | Contenido completo en español |
| `excerpt` | `text` | YES | | `NULL` | Extracto/resumen en español |
| `featured_image` | `varchar(500)` | YES | | `NULL` | URL de imagen destacada (legacy) |
| `featured_image_url` | `varchar(500)` | YES | | `NULL` | URL de imagen destacada |
| `author` | `varchar(100)` | YES | | `Admin` | Nombre del autor (texto) |
| `author_id` | `int` | YES | | `NULL` | ID del autor (FK a `admin_users`) |
| `category` | `varchar(100)` | YES | | `General` | Categoría del artículo |
| `status` | `enum('published','draft','archived')` | YES | MUL | `draft` | Estado de publicación |
| `publish_date` | `timestamp` | YES | | `NULL` | Fecha de publicación |
| `meta_title` | `varchar(255)` | YES | | `NULL` | Meta título SEO (español) |
| `meta_description` | `text` | YES | | `NULL` | Meta descripción SEO (español) |
| `tags` | `varchar(500)` | YES | | `NULL` | Tags separados por comas |
| `created_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de creación |
| `updated_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de última actualización |
| `title_en` | `varchar(255)` | YES | | `NULL` | Título en inglés |
| `slug_en` | `varchar(255)` | YES | MUL | `NULL` | Slug único en inglés |
| `content_en` | `longtext` | YES | | `NULL` | Contenido completo en inglés |
| `excerpt_en` | `text` | YES | | `NULL` | Extracto/resumen en inglés |
| `meta_title_en` | `varchar(255)` | YES | | `NULL` | Meta título SEO (inglés) |
| `meta_description_en` | `text` | YES | | `NULL` | Meta descripción SEO (inglés) |

**Relaciones:**
- `author_id` → `admin_users.id` (opcional)

**Notas:**
- Soporte completo para i18n (español e inglés)
- El `slug` y `slug_en` deben ser únicos
- `status` puede ser: `published` (publicado), `draft` (borrador), `archived` (archivado)

---

### `cart`

**Propósito:** Almacena los items del carrito de compras (tanto para usuarios registrados como invitados).

| Campo | Tipo | Null | Key | Default | Descripción |
|-------|------|------|-----|---------|-------------|
| `id` | `int` | NO | PRI | `NULL` | ID único del item |
| `uuid` | `varchar(36)` | NO | UNI | `NULL` | UUID único del item |
| `user_id` | `int` | YES | MUL | `NULL` | ID del usuario (FK a `users.id`) |
| `session_id` | `varchar(255)` | YES | MUL | `NULL` | ID de sesión para usuarios invitados |
| `product_id` | `int` | NO | MUL | `NULL` | ID del producto (FK a `products.id`) |
| `quantity` | `int` | NO | | `1` | Cantidad del producto |
| `created_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de creación |
| `updated_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de última actualización |

**Relaciones:**
- `user_id` → `users.id` (opcional, para usuarios registrados)
- `product_id` → `products.id` (requerido)

**Notas:**
- Si `user_id` es NULL, se usa `session_id` para usuarios invitados
- El carrito se puede migrar de `session_id` a `user_id` cuando el usuario inicia sesión

---

### `categories`

**Propósito:** Categorías generales del catálogo (estructura jerárquica con parent_id).

| Campo | Tipo | Null | Key | Default | Descripción |
|-------|------|------|-----|---------|-------------|
| `id` | `int` | NO | PRI | `NULL` | ID único de la categoría |
| `uuid` | `varchar(36)` | NO | UNI | `NULL` | UUID único de la categoría |
| `name` | `varchar(100)` | NO | | `NULL` | Nombre de la categoría |
| `slug` | `varchar(100)` | NO | UNI | `NULL` | Slug único de la categoría |
| `description` | `text` | YES | | `NULL` | Descripción de la categoría |
| `parent_id` | `int` | YES | MUL | `NULL` | ID de la categoría padre (FK a `categories.id`) |
| `status` | `enum('active','inactive')` | YES | MUL | `active` | Estado de la categoría |
| `created_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de creación |
| `updated_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de última actualización |

**Relaciones:**
- `parent_id` → `categories.id` (auto-referencia, para jerarquía)

**Notas:**
- Permite crear categorías anidadas (subcategorías)
- Si `parent_id` es NULL, es una categoría raíz

---

### `discount_codes`

**Propósito:** Almacena los códigos de descuento disponibles.

| Campo | Tipo | Null | Key | Default | Descripción |
|-------|------|------|-----|---------|-------------|
| `id` | `int` | NO | PRI | `NULL` | ID único del código |
| `code` | `varchar(50)` | NO | UNI | `NULL` | Código único del descuento |
| `description` | `varchar(255)` | YES | | `NULL` | Descripción del descuento |
| `discount_type` | `enum('percentage','fixed')` | NO | | `percentage` | Tipo de descuento |
| `discount_value` | `decimal(10,2)` | NO | | `NULL` | Valor del descuento |
| `min_purchase_amount` | `decimal(10,2)` | YES | | `NULL` | Monto mínimo de compra requerido |
| `max_discount_amount` | `decimal(10,2)` | YES | | `NULL` | Monto máximo de descuento (para porcentajes) |
| `usage_limit` | `int` | YES | | `NULL` | Límite de usos totales (NULL = ilimitado) |
| `usage_count` | `int` | YES | | `0` | Contador de usos actuales |
| `start_date` | `datetime` | YES | MUL | `NULL` | Fecha de inicio de validez |
| `end_date` | `datetime` | YES | | `NULL` | Fecha de fin de validez |
| `is_active` | `tinyint(1)` | YES | MUL | `1` | Estado activo/inactivo |
| `created_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de creación |
| `updated_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de última actualización |

**Relaciones:**
- `id` → `discount_code_usage.discount_code_id`

**Notas:**
- `discount_type`: `percentage` (porcentaje) o `fixed` (monto fijo)
- Si `usage_limit` es NULL, el código no tiene límite de usos
- `usage_count` se incrementa automáticamente al usar el código

---

### `discount_code_usage`

**Propósito:** Registra cada uso de un código de descuento en una orden.

| Campo | Tipo | Null | Key | Default | Descripción |
|-------|------|------|-----|---------|-------------|
| `id` | `int` | NO | PRI | `NULL` | ID único del registro |
| `discount_code_id` | `int` | NO | MUL | `NULL` | ID del código usado (FK a `discount_codes.id`) |
| `order_id` | `int` | NO | MUL | `NULL` | ID de la orden (FK a `orders.id`) |
| `user_id` | `int` | YES | MUL | `NULL` | ID del usuario (FK a `users.id`) |
| `discount_amount` | `decimal(10,2)` | NO | | `NULL` | Monto descontado en esta orden |
| `used_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha y hora de uso |

**Relaciones:**
- `discount_code_id` → `discount_codes.id`
- `order_id` → `orders.id`
- `user_id` → `users.id` (opcional)

**Notas:**
- Un código de descuento puede usarse múltiples veces (según `usage_limit`)
- `discount_amount` almacena el monto real descontado en esta orden específica

---

### `filter_categories`

**Propósito:** Categorías específicas de filtros industriales con información técnica detallada.

| Campo | Tipo | Null | Key | Default | Descripción |
|-------|------|------|-----|---------|-------------|
| `id` | `int` | NO | PRI | `NULL` | ID único de la categoría |
| `name` | `varchar(255)` | NO | | `NULL` | Nombre en español |
| `name_en` | `varchar(255)` | YES | | `NULL` | Nombre en inglés |
| `slug` | `varchar(255)` | NO | UNI | `NULL` | Slug único |
| `description` | `text` | YES | | `NULL` | Descripción en español |
| `description_en` | `text` | YES | | `NULL` | Descripción en inglés |
| `main_image` | `varchar(500)` | YES | | `NULL` | URL de la imagen principal |
| `efficiency` | `varchar(100)` | YES | | `NULL` | Eficiencia del filtro |
| `efficiency_en` | `text` | YES | | `NULL` | Eficiencia en inglés |
| `efficiency_class` | `varchar(100)` | YES | | `NULL` | Clase de eficiencia (ej: HEPA, MERV) |
| `characteristics` | `text` | YES | | `NULL` | Características técnicas en español |
| `characteristics_en` | `text` | YES | | `NULL` | Características técnicas en inglés |
| `typical_installation` | `text` | YES | | `NULL` | Instalación típica en español |
| `typical_installation_en` | `text` | YES | | `NULL` | Instalación típica en inglés |
| `applications` | `text` | YES | | `NULL` | Aplicaciones en español |
| `applications_en` | `text` | YES | | `NULL` | Aplicaciones en inglés |
| `benefits` | `text` | YES | | `NULL` | Beneficios en español |
| `benefits_en` | `text` | YES | | `NULL` | Beneficios en inglés |
| `max_temperature` | `varchar(50)` | YES | | `NULL` | Temperatura máxima |
| `frame_material` | `varchar(100)` | YES | | `NULL` | Material del marco |
| `status` | `enum('active','inactive','draft')` | YES | MUL | `active` | Estado de la categoría |
| `created_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de creación |
| `updated_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de última actualización |

**Relaciones:**
- `id` → `filter_category_images.category_id`
- `id` → `filter_category_variants.category_id`
- `id` → `products.filter_category_id` (opcional)

**Notas:**
- Soporte completo para i18n (español e inglés)
- `main_image` almacena la URL de la imagen principal en Cloudinary
- Las imágenes adicionales se almacenan en `filter_category_images`
- Las variantes (tamaños/precios) se almacenan en `filter_category_variants`

---

### `filter_category_images`

**Propósito:** Almacena las imágenes adicionales de las categorías de filtros (carrusel).

| Campo | Tipo | Null | Key | Default | Descripción |
|-------|------|------|-----|---------|-------------|
| `id` | `int` | NO | PRI | `NULL` | ID único de la imagen |
| `uuid` | `varchar(36)` | NO | UNI | `NULL` | UUID único de la imagen |
| `category_id` | `int` | NO | MUL | `NULL` | ID de la categoría (FK a `filter_categories.id`) |
| `image_url` | `varchar(500)` | NO | | `NULL` | URL de la imagen en Cloudinary |
| `alt_text` | `varchar(255)` | YES | | `NULL` | Texto alternativo para SEO |
| `is_primary` | `tinyint(1)` | YES | MUL | `0` | Indica si es imagen principal (0=no, 1=sí) |
| `sort_order` | `int` | YES | | `0` | Orden de visualización |
| `created_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de creación |

**Relaciones:**
- `category_id` → `filter_categories.id` (requerido)

**Notas:**
- Máximo 4 imágenes de carrusel por categoría (`is_primary = 0`)
- Solo una imagen puede ser principal (`is_primary = 1`)
- `sort_order` determina el orden de visualización en el carrusel

---

### `filter_category_variants`

**Propósito:** Almacena las variantes (tamaños/precios) de cada categoría de filtro.

| Campo | Tipo | Null | Key | Default | Descripción |
|-------|------|------|-----|---------|-------------|
| `id` | `int` | NO | PRI | `NULL` | ID único de la variante |
| `category_id` | `int` | NO | MUL | `NULL` | ID de la categoría (FK a `filter_categories.id`) |
| `bind_code` | `varchar(50)` | NO | UNI | `NULL` | Código único de Bind ERP |
| `nominal_size` | `varchar(100)` | NO | | `NULL` | Tamaño nominal (ej: "24x24x12") |
| `real_size` | `varchar(100)` | NO | | `NULL` | Tamaño real |
| `price` | `decimal(10,2)` | NO | | `NULL` | Precio en la moneda base |
| `currency` | `enum('MXN','USD')` | YES | | `MXN` | Moneda del precio |
| `price_usd` | `decimal(10,2)` | YES | | `NULL` | Precio en USD (si aplica) |
| `stock` | `int` | YES | | `0` | Stock disponible |
| `is_active` | `tinyint(1)` | YES | MUL | `1` | Estado activo/inactivo |
| `created_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de creación |
| `updated_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de última actualización |

**Relaciones:**
- `category_id` → `filter_categories.id` (requerido)

**Notas:**
- `bind_code` es único y se sincroniza con Bind ERP
- Cada categoría puede tener múltiples variantes (diferentes tamaños)
- `stock` se actualiza desde Bind ERP

---

### `orders`

**Propósito:** Almacena las órdenes de compra realizadas por los clientes.

| Campo | Tipo | Null | Key | Default | Descripción |
|-------|------|------|-----|---------|-------------|
| `id` | `int` | NO | PRI | `NULL` | ID único de la orden |
| `uuid` | `varchar(36)` | NO | UNI | `NULL` | UUID único de la orden |
| `user_id` | `int` | YES | | `NULL` | ID del usuario (FK a `users.id`, opcional) |
| `order_number` | `varchar(50)` | NO | UNI | `NULL` | Número único de orden |
| `customer_name` | `varchar(255)` | NO | | `NULL` | Nombre del cliente |
| `customer_email` | `varchar(255)` | NO | | `NULL` | Email del cliente |
| `customer_phone` | `varchar(20)` | YES | | `NULL` | Teléfono del cliente |
| `total_amount` | `decimal(10,2)` | NO | | `NULL` | Monto total de la orden |
| `status` | `enum(...)` | YES | MUL | `pending` | Estado de la orden |
| `shipping_address` | `text` | YES | | `NULL` | Dirección de envío |
| `created_at` | `timestamp` | YES | MUL | `CURRENT_TIMESTAMP` | Fecha de creación |
| `updated_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de última actualización |

**Estados de `status`:**
- `pending` - Pendiente de pago
- `processing` - En proceso
- `shipped` - Enviado
- `delivered` - Entregado
- `cancelled` - Cancelado

**Relaciones:**
- `user_id` → `users.id` (opcional, para usuarios registrados)
- `id` → `order_items.order_id`
- `id` → `discount_code_usage.order_id`

**Notas:**
- `order_number` es único y se genera automáticamente
- `user_id` puede ser NULL para compras de invitados
- Los items de la orden se almacenan en `order_items`

---

### `order_items`

**Propósito:** Almacena los productos incluidos en cada orden.

| Campo | Tipo | Null | Key | Default | Descripción |
|-------|------|------|-----|---------|-------------|
| `id` | `int` | NO | PRI | `NULL` | ID único del item |
| `uuid` | `varchar(36)` | NO | UNI | `NULL` | UUID único del item |
| `order_id` | `int` | NO | MUL | `NULL` | ID de la orden (FK a `orders.id`) |
| `product_id` | `int` | NO | MUL | `NULL` | ID del producto (FK a `products.id`) |
| `quantity` | `int` | NO | | `NULL` | Cantidad del producto |
| `price` | `decimal(10,2)` | NO | | `NULL` | Precio unitario al momento de la compra |
| `product_name` | `varchar(255)` | NO | | `NULL` | Nombre del producto (snapshot) |
| `image_url` | `varchar(500)` | YES | | `NULL` | URL de la imagen (snapshot) |
| `created_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de creación |

**Relaciones:**
- `order_id` → `orders.id` (requerido)
- `product_id` → `products.id` (requerido)

**Notas:**
- `product_name` y `image_url` son snapshots (se guardan al momento de la compra)
- `price` es el precio al momento de la compra (no cambia aunque el producto cambie de precio)
- `quantity` debe ser mayor a 0

---

### `products`

**Propósito:** Almacena el catálogo completo de productos con información técnica detallada.

| Campo | Tipo | Null | Key | Default | Descripción |
|-------|------|------|-----|---------|-------------|
| `id` | `int` | NO | PRI | `NULL` | ID único del producto |
| `filter_category_id` | `int` | YES | MUL | `NULL` | ID de categoría de filtro (FK a `filter_categories.id`) |
| `uuid` | `varchar(36)` | NO | UNI | `NULL` | UUID único del producto |
| `bind_id` | `varchar(100)` | YES | MUL | `NULL` | ID único de Bind ERP |
| `bind_code` | `varchar(100)` | YES | | `NULL` | Código de Bind ERP |
| `nominal_size` | `varchar(100)` | YES | | `NULL` | Tamaño nominal |
| `real_size` | `varchar(100)` | YES | | `NULL` | Tamaño real |
| `name` | `varchar(255)` | NO | | `NULL` | Nombre en español |
| `description` | `text` | YES | | `NULL` | Descripción en español |
| `price` | `decimal(10,2)` | NO | | `NULL` | Precio en moneda base |
| `currency` | `enum('MXN','USD')` | YES | | `MXN` | Moneda del precio |
| `price_usd` | `decimal(10,2)` | YES | | `NULL` | Precio en USD |
| `category` | `varchar(100)` | YES | MUL | `NULL` | Categoría general |
| `tags` | `varchar(500)` | YES | | `NULL` | Tags separados por comas |
| `dimensions` | `varchar(100)` | YES | | `NULL` | Dimensiones |
| `weight` | `varchar(100)` | YES | | `NULL` | Peso |
| `material` | `varchar(255)` | YES | | `NULL` | Material |
| `warranty` | `varchar(100)` | YES | | `NULL` | Garantía |
| `stock` | `int` | YES | | `0` | Stock disponible |
| `status` | `enum(...)` | YES | MUL | `draft` | Estado del producto |
| `created_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de creación |
| `updated_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de última actualización |
| `name_en` | `varchar(255)` | YES | | `NULL` | Nombre en inglés |
| `description_en` | `text` | YES | | `NULL` | Descripción en inglés |
| `image_url` | `varchar(500)` | YES | | `NULL` | URL de imagen principal (legacy) |
| `category_en` | `varchar(100)` | YES | MUL | `NULL` | Categoría en inglés |
| `efficiency` | `text` | YES | | `NULL` | Eficiencia |
| `efficiency_en` | `text` | YES | | `NULL` | Eficiencia en inglés |
| `efficiency_class` | `varchar(50)` | YES | | `NULL` | Clase de eficiencia |
| `characteristics` | `text` | YES | | `NULL` | Características en español |
| `characteristics_en` | `text` | YES | | `NULL` | Características en inglés |
| `frame_material` | `varchar(100)` | YES | | `NULL` | Material del marco |
| `max_temperature` | `varchar(50)` | YES | | `NULL` | Temperatura máxima |
| `typical_installation` | `text` | YES | | `NULL` | Instalación típica en español |
| `typical_installation_en` | `text` | YES | | `NULL` | Instalación típica en inglés |
| `applications` | `text` | YES | | `NULL` | Aplicaciones en español |
| `applications_en` | `text` | YES | | `NULL` | Aplicaciones en inglés |
| `benefits` | `text` | YES | | `NULL` | Beneficios en español |
| `benefits_en` | `text` | YES | | `NULL` | Beneficios en inglés |

**Estados de `status`:**
- `active` - Activo y visible
- `inactive` - Inactivo (no visible)
- `draft` - Borrador

**Relaciones:**
- `filter_category_id` → `filter_categories.id` (opcional)
- `id` → `product_images.product_id`
- `id` → `cart.product_id`
- `id` → `order_items.product_id`
- `id` → `wishlist.product_id`
- `id` → `product_reviews.product_id`

**Notas:**
- `bind_id` y `bind_code` se sincronizan con Bind ERP
- `image_url` es legacy; las imágenes se almacenan en `product_images`
- Soporte completo para i18n (español e inglés)
- `stock` se actualiza desde Bind ERP

---

### `product_images`

**Propósito:** Almacena las imágenes de los productos (múltiples imágenes por producto).

| Campo | Tipo | Null | Key | Default | Descripción |
|-------|------|------|-----|---------|-------------|
| `id` | `int` | NO | PRI | `NULL` | ID único de la imagen |
| `uuid` | `varchar(36)` | NO | UNI | `NULL` | UUID único de la imagen |
| `product_id` | `int` | NO | MUL | `NULL` | ID del producto (FK a `products.id`) |
| `image_url` | `varchar(500)` | NO | | `NULL` | URL de la imagen en Cloudinary |
| `alt_text` | `varchar(255)` | YES | | `NULL` | Texto alternativo para SEO |
| `sort_order` | `int` | YES | | `0` | Orden de visualización |
| `is_primary` | `tinyint(1)` | YES | | `0` | Indica si es imagen principal (0=no, 1=sí) |
| `created_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de creación |

**Relaciones:**
- `product_id` → `products.id` (requerido)

**Notas:**
- Solo una imagen puede ser principal (`is_primary = 1`) por producto
- `sort_order` determina el orden de visualización en la galería
- Las imágenes se almacenan en Cloudinary

---

### `product_reviews`

**Propósito:** Almacena las reseñas/calificaciones de los productos por los usuarios.

| Campo | Tipo | Null | Key | Default | Descripción |
|-------|------|------|-----|---------|-------------|
| `id` | `int` | NO | PRI | `NULL` | ID único de la reseña |
| `uuid` | `varchar(36)` | NO | UNI | `NULL` | UUID único de la reseña |
| `product_id` | `int` | NO | MUL | `NULL` | ID del producto (FK a `products.id`) |
| `user_id` | `int` | NO | MUL | `NULL` | ID del usuario (FK a `users.id`) |
| `rating` | `int` | NO | | `NULL` | Calificación (1-5) |
| `title` | `varchar(255)` | YES | | `NULL` | Título de la reseña |
| `comment` | `text` | YES | | `NULL` | Comentario de la reseña |
| `status` | `enum(...)` | YES | | `pending` | Estado de la reseña |
| `created_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de creación |
| `updated_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de última actualización |

**Estados de `status`:**
- `pending` - Pendiente de aprobación
- `approved` - Aprobada y visible
- `rejected` - Rechazada (no visible)

**Relaciones:**
- `product_id` → `products.id` (requerido)
- `user_id` → `users.id` (requerido)

**Notas:**
- `rating` debe estar entre 1 y 5
- Las reseñas requieren aprobación antes de mostrarse (`status = 'approved'`)
- Un usuario puede dejar solo una reseña por producto

---

### `site_settings`

**Propósito:** Almacena configuraciones generales del sitio (key-value).

| Campo | Tipo | Null | Key | Default | Descripción |
|-------|------|------|-----|---------|-------------|
| `id` | `int` | NO | PRI | `NULL` | ID único del setting |
| `setting_key` | `varchar(100)` | NO | UNI | `NULL` | Clave única del setting |
| `setting_value` | `text` | YES | | `NULL` | Valor del setting |
| `created_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de creación |
| `updated_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de última actualización |

**Notas:**
- Sistema de configuración flexible tipo key-value
- `setting_key` debe ser único
- `setting_value` puede almacenar JSON, texto, números, etc.

**Ejemplos de settings:**
- `site_name` - Nombre del sitio
- `site_description` - Descripción del sitio
- `contact_email` - Email de contacto
- `maintenance_mode` - Modo de mantenimiento (true/false)

---

### `users`

**Propósito:** Almacena los usuarios registrados del sistema.

| Campo | Tipo | Null | Key | Default | Descripción |
|-------|------|------|-----|---------|-------------|
| `id` | `int` | NO | PRI | `NULL` | ID único del usuario |
| `uuid` | `varchar(36)` | NO | UNI | `NULL` | UUID único del usuario |
| `email` | `varchar(255)` | NO | UNI | `NULL` | Email único del usuario |
| `password_hash` | `varchar(255)` | NO | | `NULL` | Hash de la contraseña (bcrypt) |
| `first_name` | `varchar(100)` | NO | | `NULL` | Nombre |
| `last_name` | `varchar(100)` | NO | | `NULL` | Apellido |
| `profile_image` | `varchar(500)` | YES | | `NULL` | URL de la imagen de perfil (Cloudinary) |
| `phone` | `varchar(20)` | YES | | `NULL` | Teléfono |
| `address` | `text` | YES | | `NULL` | Dirección |
| `city` | `varchar(100)` | YES | | `NULL` | Ciudad |
| `postal_code` | `varchar(20)` | YES | | `NULL` | Código postal |
| `country` | `varchar(100)` | YES | | `México` | País |
| `status` | `enum(...)` | YES | MUL | `pending` | Estado del usuario |
| `email_verified` | `tinyint(1)` | YES | | `0` | Email verificado (0=no, 1=sí) |
| `verification_token` | `varchar(255)` | YES | MUL | `NULL` | Token de verificación de email |
| `reset_token` | `varchar(255)` | YES | MUL | `NULL` | Token de reset de contraseña |
| `reset_token_expires` | `timestamp` | YES | | `NULL` | Expiración del token de reset |
| `created_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de creación |
| `updated_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de última actualización |

**Estados de `status`:**
- `active` - Activo
- `inactive` - Inactivo
- `pending` - Pendiente de verificación

**Relaciones:**
- `id` → `cart.user_id` (opcional)
- `id` → `orders.user_id` (opcional)
- `id` → `wishlist.user_id`
- `id` → `product_reviews.user_id`
- `id` → `discount_code_usage.user_id` (opcional)

**Notas:**
- `email` debe ser único
- `password_hash` usa bcrypt
- `profile_image` almacena la URL de la imagen de perfil en Cloudinary (ruta: `starfilters-ecommerce/users/profile/{user_id}`)
- `verification_token` se usa para verificar el email al registrarse
- `reset_token` y `reset_token_expires` se usan para resetear contraseñas

---

### `wishlist`

**Propósito:** Almacena los productos favoritos de los usuarios (lista de deseos).

| Campo | Tipo | Null | Key | Default | Descripción |
|-------|------|------|-----|---------|-------------|
| `id` | `int` | NO | PRI | `NULL` | ID único del item |
| `uuid` | `varchar(36)` | NO | UNI | `NULL` | UUID único del item |
| `user_id` | `int` | NO | MUL | `NULL` | ID del usuario (FK a `users.id`) |
| `product_id` | `int` | NO | MUL | `NULL` | ID del producto (FK a `products.id`) |
| `created_at` | `timestamp` | YES | | `CURRENT_TIMESTAMP` | Fecha de creación |

**Relaciones:**
- `user_id` → `users.id` (requerido)
- `product_id` → `products.id` (requerido)

**Notas:**
- Un usuario puede tener múltiples productos en su wishlist
- Un producto solo puede estar una vez en la wishlist de un usuario (debe haber un índice único compuesto)

---

## 🔗 Diagrama de Relaciones Principales

```
users
  ├── cart (user_id)
  ├── orders (user_id)
  ├── wishlist (user_id)
  ├── product_reviews (user_id)
  └── discount_code_usage (user_id)

products
  ├── cart (product_id)
  ├── order_items (product_id)
  ├── wishlist (product_id)
  ├── product_reviews (product_id)
  ├── product_images (product_id)
  └── filter_categories (filter_category_id) [opcional]

filter_categories
  ├── filter_category_images (category_id)
  ├── filter_category_variants (category_id)
  └── products (filter_category_id) [opcional]

orders
  ├── order_items (order_id)
  └── discount_code_usage (order_id)

discount_codes
  └── discount_code_usage (discount_code_id)

admin_users
  └── blog_posts (author_id) [opcional]

categories
  └── categories (parent_id) [auto-referencia]
```

---

## 📝 Consultas Útiles

### Ver estadísticas generales:
```sql
SELECT 
  (SELECT COUNT(*) FROM users WHERE status = 'active') as usuarios_activos,
  (SELECT COUNT(*) FROM products WHERE status = 'active') as productos_activos,
  (SELECT COUNT(*) FROM orders) as total_ordenes,
  (SELECT COUNT(*) FROM filter_categories WHERE status = 'active') as categorias_activas,
  (SELECT COUNT(*) FROM blog_posts WHERE status = 'published') as articulos_publicados;
```

### Ver productos con sus imágenes principales:
```sql
SELECT 
  p.id,
  p.name,
  p.price,
  p.stock,
  pi.image_url as imagen_principal
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
WHERE p.status = 'active'
LIMIT 20;
```

### Ver categorías con sus imágenes:
```sql
SELECT 
  fc.id,
  fc.name,
  fc.slug,
  fc.main_image,
  COUNT(fci.id) as total_imagenes_carrusel
FROM filter_categories fc
LEFT JOIN filter_category_images fci ON fc.id = fci.category_id AND fci.is_primary = 0
GROUP BY fc.id
ORDER BY fc.created_at DESC;
```

### Ver órdenes recientes con detalles:
```sql
SELECT 
  o.id,
  o.order_number,
  o.total_amount,
  o.status,
  o.created_at,
  u.email as usuario_email,
  COUNT(oi.id) as total_items
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id
ORDER BY o.created_at DESC
LIMIT 20;
```

---

## 🔐 Índices y Optimizaciones

### Índices Principales:
- Todos los campos `id` son PRIMARY KEY
- Todos los campos `uuid` tienen índice UNIQUE
- Campos `email`, `username`, `code`, `slug` tienen índice UNIQUE
- Campos `status` tienen índice MUL para filtrado rápido
- Foreign Keys tienen índices automáticos

### Optimizaciones Recomendadas:
- Agregar índice compuesto en `wishlist(user_id, product_id)` para evitar duplicados
- Agregar índice en `orders(created_at)` para consultas por fecha
- Agregar índice en `products(category)` para filtrado por categoría

---

## 📚 Notas Finales

- Todas las tablas usan `utf8mb4` para soporte completo de Unicode
- Los timestamps se actualizan automáticamente con `ON UPDATE CURRENT_TIMESTAMP`
- Los UUIDs se generan usando `crypto.randomUUID()` o función equivalente
- Las contraseñas se hashean con bcrypt antes de almacenarse
- Las imágenes se almacenan en Cloudinary y se guardan las URLs en la BD

---

**Última actualización:** 2026-01-27
