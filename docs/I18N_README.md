# Sistema de Internacionalización (i18n) - StarFilters

## Configuración Completada

Se ha implementado un sistema completo de internacionalización usando **astro-i18next** que soporta Español (ES) e Inglés (EN).

## 📁 Estructura de Archivos

```
public/locales/
├── es/
│   ├── common.json       # Traducciones comunes (nav, hero, stats, features, footer)
│   ├── cleanrooms.json   # Traducciones de la página de cuartos limpios
│   └── services.json     # Traducciones de la página de servicios
└── en/
    ├── common.json
    ├── cleanrooms.json
    └── services.json

src/
├── components/shared/
│   ├── LanguageSelector.tsx  # Selector de idioma
│   ├── HeroSection.astro     # ✅ Actualizado con traducciones
│   ├── Stats.astro           # ✅ Actualizado con traducciones
│   ├── BentoGrid.astro       # ✅ Actualizado con traducciones
│   └── Navbar.astro          # ✅ Incluye selector de idioma
├── types/
│   └── astro-i18next.d.ts    # Declaraciones de tipos
└── lib/
    └── i18n.ts               # Utilidades de i18n

astro-i18next.config.mjs      # Configuración principal
astro.config.mjs              # Integración de astro-i18next
```

## 🚀 Componentes Actualizados

### ✅ Completados
1. **HeroSection.astro** - Sección principal con traducciones
2. **Stats.astro** - Estadísticas con traducciones
3. **BentoGrid.astro** - Características con traducciones
4. **Navbar.astro** - Navegación con selector de idioma
5. **LanguageSelector.tsx** - Componente React para cambiar idioma

### Componentes con traducciones listas (pendientes de actualizar):
- FeatureServiceSection.astro
- Páginas de cuartos limpios
- Páginas de servicios

## 📝 Cómo Usar las Traducciones

### En componentes Astro:

```astro
---
import { t } from "astro-i18next";
---

<h1>{t("hero.title")}</h1>
<p>{t("hero.description")}</p>
```

### Agregar nuevas traducciones:

1. **Editar archivo español:** `public/locales/es/common.json`
```json
{
  "newSection": {
    "title": "Nuevo Título",
    "description": "Nueva descripción"
  }
}
```

2. **Editar archivo inglés:** `public/locales/en/common.json`
```json
{
  "newSection": {
    "title": "New Title",
    "description": "New description"
  }
}
```

3. **Usar en componentes:**
```astro
<h2>{t("newSection.title")}</h2>
<p>{t("newSection.description")}</p>
```

## 🌍 Rutas Traducidas

El sistema maneja automáticamente las rutas en ambos idiomas:

| Español | Inglés |
|---------|--------|
| `/` | `/en` |
| `/cuartos-limpios` | `/en/cleanrooms` |
| `/servicios` | `/en/services` |
| `/filtros` | `/en/filters` |
| `/blog` | `/en/blog` |
| `/carrito` | `/en/cart` |
| `/perfil` | `/en/profile` |

## 🔧 Selector de Idioma

El selector de idioma está en el Navbar y permite cambiar entre ES/EN automáticamente, redirigiendo a la URL correcta.

## 📦 Archivos de Traducciones

### common.json
Contiene traducciones compartidas:
- `nav` - Navegación
- `hero` - Sección principal
- `stats` - Estadísticas
- `features` - Características
- `footer` - Pie de página

### cleanrooms.json
Traducciones específicas de cuartos limpios:
- `seo` - Meta tags SEO
- `hero` - Contenido principal
- `experience` - Sección de experiencia
- `numbers` - Números/estadísticas

### services.json
Traducciones de servicios:
- `seo` - Meta tags SEO
- `hero` - Contenido principal
- `features` - Características de servicios

## 🎯 Próximos Pasos

Para terminar la implementación:

1. **Actualizar FeatureServiceSection.astro:**
```astro
---
import { t } from "astro-i18next";
---

<h2>{t("services.hero.title", { ns: "services" })}</h2>
```

2. **Actualizar páginas de cuartos limpios y servicios** siguiendo el mismo patrón

3. **Crear páginas en inglés:**
   - Crear `/src/pages/en/` con las versiones en inglés de cada página
   - O usar el sistema de enrutamiento dinámico de astro-i18next

4. **Actualizar SEO por idioma** en cada página

## 🐛 Solución de Problemas

### Error de TypeScript con astro-i18next
Ya solucionado con el archivo `src/types/astro-i18next.d.ts`

### Las traducciones no aparecen
- Verificar que los archivos JSON estén en `public/locales/`
- Verificar que la estructura de claves coincida
- Reiniciar el servidor de desarrollo

## 📚 Recursos

- [astro-i18next Documentación](https://github.com/yassinedoghri/astro-i18next)
- [i18next Documentación](https://www.i18next.com/)

## ✨ Estado Actual

- ✅ Configuración completa de i18n
- ✅ Archivos de traducción ES/EN creados
- ✅ Componentes principales actualizados
- ✅ Selector de idioma funcional
- ⏳ Pendiente: Actualizar páginas restantes
- ⏳ Pendiente: Crear rutas /en/*
