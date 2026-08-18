# Scripts

Utilidades de administración para la base de datos, el contenido y los assets del
sitio. Todos los scripts de Node leen la conexión desde las variables de entorno
de `.env`, así que ejecútalos desde la raíz del proyecto.

## 👤 Usuarios y administradores

| Script | Qué hace |
| --- | --- |
| `create-admin.js` | Crea un usuario administrador. |
| `reset-admin-password.js` | Restablece la contraseña de un administrador. |
| `activate-user.js` | Activa una cuenta de usuario. |
| `seed-admin-team.js` | Carga el equipo que se muestra en el admin. |

### Traducciones

| Script | Qué hace |
| --- | --- |
| `traducir-tamanos.js` | Rellena al inglés los nombres de tamaños/variantes (`nominal_size_en`). Simula por defecto; `--aplicar` escribe. Solo toca filas vacías y omite lo que traduciría a medias. |

## 🔍 Diagnóstico (solo lectura)

| Script | Qué hace |
| --- | --- |
| `check-db.js` | Revisa el estado general de la base de datos y sus tablas. |
| `check-hero.js` | Verifica la configuración del Hero en `site_settings`. |
| `categorias-arbol.js` | Imprime el árbol de categorías con su jerarquía. |
| `smoke-crawl.mjs` | Recorre todas las rutas ES/EN y reporta las que fallan. |
| `check-i18n-parity.mjs` | Compara el contenido ES contra EN (`pnpm check:i18n`). |

Corre `smoke-crawl.mjs` y `check:i18n` antes de cada despliegue.

## 🌱 Seeds y contenido

| Script | Qué hace |
| --- | --- |
| `seed-webshop-categories.js` | Carga las familias de producto del webshop. |
| `seed-filter-type-categories.js` | Carga los tipos de filtro. |
| `seed-case-study-pharma.js` | Caso de éxito de ejemplo (anonimizado). |
| `seed-test-product.js` | Producto de prueba para desarrollo. |
| `init-home-tables.js` | Crea `benefits` y `testimonials` si faltan. Es idempotente; **sin estas tablas el home se corta**. |

## 🗂️ Catálogo

| Script | Qué hace |
| --- | --- |
| `set-category-parent.js` | Reasigna el padre de una categoría. |
| `assign-variant.js` | Asigna un tamaño/variante a un producto. |
| `generate-excel-templates.js` | Genera las plantillas de importación masiva. |

## 🎨 Assets

| Script | Qué hace |
| --- | --- |
| `generate-favicons.mjs` | Genera los favicons a partir del logo. |
| `generate-og-image.mjs` | Genera la imagen Open Graph por defecto. |

## 🚀 Deployment

Ver [`deployment/README.md`](deployment/README.md) y la guía
[`docs/DEPLOY_VPS_PASO_A_PASO.md`](../docs/DEPLOY_VPS_PASO_A_PASO.md).

## 📦 `archive/`

Migraciones y correcciones de un solo uso que **ya se aplicaron** a la base de datos.
Se conservan como registro de cómo llegó el esquema a su estado actual; no hace falta
volver a ejecutarlas. El SQL equivalente vive en [`database/`](../database/).
