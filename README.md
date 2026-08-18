# Star Filters Ecommerce

![Star Filters Logo](public/logos/logo-starfilters.png)

Una plataforma de comercio electrónico moderna y completa para Star Filters, líder en cuartos limpios y sistemas de filtración industrial en Norteamérica. Construida con Astro, React y TypeScript.

## 🌟 Sobre Star Filters

Star Filters cuenta con **más de 40 años de experiencia** liderando la filtración industrial en México. Somos especialistas en:

- **Cuartos Limpios**: Diseño, construcción y validación de ambientes controlados con certificación ISO 14644
- **Filtros Industriales**: Sistemas de control de partículas y contaminantes desde prefiltros hasta filtros HEPA
- **Servicios de Validación**: Validación especializada para garantizar el correcto funcionamiento de sistemas de filtración y control de partículas
- **Accesorios**: Unidades Manejadoras de Aire, Puertas y Ventanas especializadas, Air Showers, Gabinetes y más

### Certificaciones
- ISO 14644 (clases ISO 4 a ISO 9)
- GMP / BPM para industria farmacéutica
- NEBB para pruebas y validaciones certificadas
- ASHRAE para performance y eficiencia
- ISO 9001:2015 Empresa Certificada
- NOM aplicables de seguridad e instalaciones

## 🚀 Características Principales

### 🛒 Ecommerce Completo
- **Catálogo de productos** con categorías organizadas de filtros industriales
- **Carrito de compras** persistente con sesiones
- **Sistema de checkout** integrado con Stripe
- **Gestión de órdenes** con seguimiento de estado
- **Sistema de reseñas** y calificaciones
- **Lista de deseos** para usuarios registrados
- **Soporte multiidioma** (Español e Inglés)

### 🏭 Gestión de Productos y Categorías
- **Categorías de filtros** (HEPA, W/Minipleat, Bolsa, Pleat, Carbón activado)
- **Múltiples imágenes por producto** (imagen principal + carrusel)
- **Especificaciones técnicas** detalladas
- **Gestión de stock** y precios
- **Estados de productos** (activo, inactivo, borrador)

### 👥 Gestión de Usuarios
- **Registro y autenticación** de usuarios
- **Perfiles de usuario** con información personal
- **Recuperación de contraseña** por email
- **Verificación de email** para nuevas cuentas
- **Panel de administración** completo

### 📝 Sistema de Blog
- **Editor de contenido** con TipTap (WYSIWYG)
- **Gestión de artículos** con categorías y tags
- **SEO optimizado** con meta tags dinámicos
- **Sistema de imágenes** integrado con Cloudinary
- **Soporte multiidioma** para contenido

### 🌐 Internacionalización
- **Soporte multiidioma** (Español e Inglés)
- **Rutas localizadas** automáticamente (`/` para español, `/en` para inglés)
- **Contenido traducible** en base de datos
- **Selector de idioma** en la interfaz
- **SEO localizado** con meta tags por idioma

### 🎨 Diseño Moderno
- **UI/UX responsiva** con Tailwind CSS
- **Componentes reutilizables** con Radix UI
- **Animaciones suaves** con CSS transitions
- **Tema consistente** en toda la aplicación
- **Mobile-first** design

## 🛠️ Stack Tecnológico

### Frontend
- **[Astro 5.16.6](https://astro.build/)** - Framework web moderno
- **[React 19.1.1](https://react.dev/)** - Biblioteca de UI
- **[TypeScript](https://www.typescriptlang.org/)** - Tipado estático
- **[Tailwind CSS 4.1.12](https://tailwindcss.com/)** - Framework CSS
- **[Radix UI](https://www.radix-ui.com/)** - Componentes accesibles

### Backend
- **[Node.js 20+](https://nodejs.org/)** - Runtime de JavaScript
- **[MySQL2 3.15.0](https://github.com/sidorares/node-mysql2)** - Base de datos
- **[Express 5.2.1](https://expressjs.com/)** - Servidor web
- **[JWT](https://jwt.io/)** - Autenticación
- **[bcrypt 6.0.0](https://github.com/kelektiv/node.bcrypt.js)** - Encriptación

### Servicios Externos
- **[Stripe 19.1.0](https://stripe.com/)** - Procesamiento de pagos
- **[Cloudinary 2.7.0](https://cloudinary.com/)** - Gestión de imágenes
- **[Hostinger](https://www.hostinger.com/)** - Hosting y base de datos

### Herramientas de Desarrollo
- **[Vite](https://vitejs.dev/)** - Build tool
- **[TipTap 3.8.0](https://tiptap.dev/)** - Editor WYSIWYG
- **[pnpm](https://pnpm.io/)** - Package manager

## 📁 Estructura del Proyecto

```
starfilters-ecommerce/
├── 📁 src/
│   ├── 📁 components/          # Componentes reutilizables
│   │   ├── 📁 admin/           # Componentes del panel admin
│   │   ├── 📁 shared/          # Componentes compartidos
│   │   └── 📁 ui/              # Componentes de UI base
│   ├── 📁 config/              # Configuraciones
│   ├── 📁 hooks/               # React hooks personalizados
│   ├── 📁 i18n/                # Internacionalización
│   ├── 📁 layouts/             # Layouts de páginas
│   ├── 📁 lib/                 # Utilidades y servicios
│   ├── 📁 pages/               # Páginas de la aplicación
│   │   ├── 📁 admin/           # Panel de administración
│   │   ├── 📁 api/             # Endpoints de API
│   │   ├── 📁 en/              # Páginas en inglés
│   │   └── ...                 # Otras páginas
│   ├── 📁 styles/              # Estilos globales
│   └── 📁 types/               # Definiciones de tipos
├── 📁 database/                # Scripts y queries SQL
├── 📁 docs/                    # Documentación
├── 📁 migrations/              # Migraciones de base de datos
├── 📁 scripts/                 # Scripts de utilidad
├── 📁 public/                  # Archivos estáticos
│   ├── 📁 images/              # Imágenes del sitio
│   └── 📁 locales/             # Archivos JSON de traducción
└── 📁 dist/                    # Build de producción
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- **Node.js** 20.x o superior
- **pnpm** (recomendado) o npm
- **MySQL** 8.0 o superior
- Cuentas en **Stripe** y **Cloudinary**

### 1. Clonar el Repositorio
```bash
git clone https://github.com/imsoft/Starfilters-Ecommerce.git
cd starfilters-ecommerce
```

### 2. Instalar Dependencias
```bash
pnpm install
# o
npm install
```

### 3. Configurar Variables de Entorno
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones:

```env
# Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=starfilters_ecommerce_db
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña

# Configuración del Sitio
SITE_URL=http://localhost:4321
ADMIN_EMAIL=admin@starfilters.com

# Autenticación
JWT_SECRET=tu-secreto-super-seguro

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

### 4. Configurar Base de Datos
```bash
# Ejecutar el script de creación de tablas
mysql -u tu_usuario -p tu_base_de_datos < database/schema.sql
```

### 5. Crear Usuario Administrador
```bash
node scripts/create-admin.js
```

### 6. Ejecutar en Desarrollo
```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:4321`

## 📊 Base de Datos

### Tablas Principales

#### `products` & `product_images`
- Información de productos (nombre, descripción, precio, stock)
- Soporte para múltiples imágenes por producto (imagen principal + carrusel)
- Especificaciones técnicas y dimensiones
- Categorización y tags
- Estados (activo, inactivo, borrador)

#### `filter_categories` & `filter_category_images`
- Categorías de filtros (HEPA, W/Minipleat, Bolsa, Pleat, Carbón activado)
- Múltiples imágenes por categoría
- Descripción y metadatos

#### `orders` & `order_items`
- Gestión completa de órdenes
- Items detallados por orden
- Estados de seguimiento
- Información de envío
- Integración con Stripe

#### `users` & `admin_users`
- Usuarios del sitio web
- Administradores del sistema
- Autenticación y perfiles
- Gestión de sesiones

#### `blog_posts`
- Sistema de blog completo
- Editor WYSIWYG con TipTap
- SEO y metadatos
- Categorías y tags
- Soporte multiidioma

#### `cart` & `wishlist`
- Carrito de compras persistente
- Lista de deseos por usuario
- Gestión de sesiones

## 🔧 Scripts Disponibles

```bash
# Desarrollo
pnpm dev                 # Servidor de desarrollo
pnpm build              # Build de producción
pnpm preview            # Preview del build
pnpm start              # Iniciar servidor de producción

# Base de Datos
node scripts/create-admin.js              # Crear administrador
node scripts/reset-admin-password.js      # Resetear contraseña admin

# Verificación
node scripts/check-db.js                  # Revisar estado de la base de datos
node scripts/check-hero.js                # Diagnosticar configuración del Hero
node scripts/smoke-crawl.mjs              # Recorrer todas las rutas ES/EN
pnpm check:i18n                           # Verificar paridad de contenido ES/EN
```

## 🌐 Despliegue

### Hostinger (Recomendado)
1. Subir archivos al servidor
2. Configurar base de datos MySQL
3. Instalar dependencias: `pnpm install`
4. Build de producción: `pnpm build`
5. Configurar variables de entorno
6. Configurar dominio y SSL
7. Iniciar servidor: `pnpm start`

Ver documentación detallada en `docs/deployment/`

## 🔐 Seguridad

- **Autenticación JWT** con tokens seguros
- **Encriptación bcrypt** para contraseñas
- **Validación de entrada** en todos los endpoints
- **Sanitización de datos** para prevenir XSS
- **Rate limiting** en APIs críticas
- **HTTPS obligatorio** en producción
- **Verificación de email** para nuevas cuentas

## 📱 Características Responsivas

- **Mobile-first** design
- **Breakpoints optimizados** para todos los dispositivos
- **Navegación táctil** mejorada
- **Imágenes adaptativas** con lazy loading
- **Performance optimizada** para móviles

## 🎯 SEO y Performance

- **Meta tags dinámicos** por página
- **Sitemap automático** generado
- **URLs amigables** y localizadas
- **Lazy loading** de imágenes
- **Code splitting** automático
- **Compresión gzip** habilitada
- **Schema.org** structured data

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

- **Email**: admin@starfilters.com
- **Documentación**: Ver carpeta `docs/`
- **Issues**: Usar el sistema de issues de GitHub

## 🙏 Agradecimientos

- [Astro](https://astro.build/) por el framework increíble
- [Tailwind CSS](https://tailwindcss.com/) por el sistema de diseño
- [Radix UI](https://www.radix-ui.com/) por los componentes accesibles
- [Stripe](https://stripe.com/) por el procesamiento de pagos
- [Cloudinary](https://cloudinary.com/) por la gestión de imágenes
- [TipTap](https://tiptap.dev/) por el editor WYSIWYG

---

**Desarrollado con ❤️ para Star Filters**

**Más de 40 años liderando la filtración industrial en México**
