# Guía de Traducción de Contenido

> **⚠️ Obsoleto.** El script `scripts/translate-existing-content.js` que describe esta
> guía ya no existe. Hoy las traducciones se cargan desde el admin, en los campos `_en`
> de cada producto y artículo. Verifica la paridad ES/EN con `pnpm check:i18n`.
> Se conserva como referencia de la estructura de datos.

## 📝 Agregar Nuevas Traducciones

### Para Productos

1. **Edita el archivo** `scripts/translate-existing-content.js`
2. **Busca** la sección `productTranslations`
3. **Agrega** tu nueva traducción:

```javascript
{
  name: 'Nombre del Producto en Español',
  name_en: 'Product Name in English',
  description: 'Descripción en español',
  description_en: 'Description in English',
  category: 'Categoría en Español',
  category_en: 'Category in English'
}
```

### Para Artículos de Blog

1. **Busca** la sección `blogTranslations`
2. **Agrega** tu nuevo artículo:

```javascript
{
  title: 'Título del Artículo en Español',
  title_en: 'Article Title in English',
  slug: 'slug-espanol',
  slug_en: 'slug-english',
  excerpt: 'Extracto en español',
  excerpt_en: 'Excerpt in English',
  content: '<h1>Contenido HTML en español</h1>',
  content_en: '<h1>HTML Content in English</h1>',
  meta_title: 'Meta título español',
  meta_title_en: 'Meta title English',
  meta_description: 'Meta descripción español',
  meta_description_en: 'Meta description English'
}
```

### Ejecutar Traducciones

```bash
node scripts/translate-existing-content.js
```

## 🌐 Traducciones por Idioma

El script traduce automáticamente:
- ✅ **ES** → **EN** (Español a Inglés)

Si necesitas más idiomas en el futuro, agrega columnas como:
- `name_fr` (Francés)
- `name_de` (Alemán)
- `name_pt` (Portugués)

## 📊 Verificar Traducciones

Puedes verificar las traducciones en la base de datos:

```sql
-- Ver productos traducidos
SELECT name, name_en, category, category_en FROM products;

-- Ver blog posts traducidos
SELECT title, title_en, slug, slug_en FROM blog_posts;
```

## 🎯 Estrategia de Fallback

Si un campo en inglés está vacío, se usa automáticamente el campo en español:

```typescript
const name = product.name_en || product.name;
```

Esto garantiza que siempre haya contenido, incluso si falta una traducción.

## 📝 Notas

- Las traducciones son **bidireccionales**: puedes traducir de español a inglés o viceversa
- Si actualizas un producto o artículo, asegúrate de actualizar ambos idiomas
- Los slugs deben ser únicos en ambos idiomas
- Las URLs funcionan automáticamente según el idioma del usuario
