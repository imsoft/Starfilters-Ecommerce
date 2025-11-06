# StarFilters Ecommerce

![StarFilters Logo](public/logos/logo-starfilters.png)

Una plataforma de comercio electrónico moderna y completa para la venta de filtros automotrices y equipos para cuartos limpios, construida con Astro, React y TypeScript.

## 🚀 Características Principales

### 🛒 Ecommerce Completo
- **Catálogo de productos** con categorías organizadas
- **Carrito de compras** persistente con sesiones
- **Sistema de checkout** integrado con Stripe
- **Gestión de órdenes** con seguimiento de estado
- **Sistema de reseñas** y calificaciones
- **Lista de deseos** para usuarios registrados

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

### 🌐 Internacionalización
- **Soporte multiidioma** (Español e Inglés)
- **Rutas localizadas** automáticamente
- **Contenido traducible** en base de datos
- **Selector de idioma** en la interfaz

### 🎨 Diseño Moderno
- **UI/UX responsiva** con Tailwind CSS
- **Componentes reutilizables** con Radix UI
- **Animaciones suaves** con CSS transitions
- **Tema consistente** en toda la aplicación

## 🛠️ Stack Tecnológico

### Frontend
- **[Astro 5.15.1](https://astro.build/)** - Framework web moderno
- **[React 19.1.1](https://react.dev/)** - Biblioteca de UI
- **[TypeScript](https://www.typescriptlang.org/)** - Tipado estático
- **[Tailwind CSS 4.1.12](https://tailwindcss.com/)** - Framework CSS
- **[Radix UI](https://www.radix-ui.com/)** - Componentes accesibles

### Backend
- **[Node.js](https://nodejs.org/)** - Runtime de JavaScript
- **[MySQL2](https://github.com/sidorares/node-mysql2)** - Base de datos
- **[JWT](https://jwt.io/)** - Autenticación
- **[bcrypt](https://github.com/kelektiv/node.bcrypt.js)** - Encriptación

### Servicios Externos
- **[Stripe](https://stripe.com/)** - Procesamiento de pagos
- **[Cloudinary](https://cloudinary.com/)** - Gestión de imágenes
- **[Hostinger](https://www.hostinger.com/)** - Hosting y base de datos

### Herramientas de Desarrollo
- **[Vite](https://vitejs.dev/)** - Build tool
- **[ESLint](https://eslint.org/)** - Linter
- **[Prettier](https://prettier.io/)** - Formateador

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
│   └── 📁 types/                # Definiciones de tipos
├── 📁 database/                # Scripts de base de datos
├── 📁 docs/                    # Documentación
├── 📁 scripts/                 # Scripts de utilidad
├── 📁 public/                  # Archivos estáticos
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
git clone https://github.com/tu-usuario/starfilters-ecommerce.git
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
cp env.example .env
```

Edita el archivo `.env` con tus configuraciones:

```env
# Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=starfilters_db
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

#### `products`
- Información de productos (nombre, descripción, precio, stock)
- Soporte para múltiples imágenes
- Categorización y tags
- Estados (activo, inactivo, borrador)

#### `orders` & `order_items`
- Gestión completa de órdenes
- Items detallados por orden
- Estados de seguimiento
- Información de envío

#### `users` & `admin_users`
- Usuarios del sitio web
- Administradores del sistema
- Autenticación y perfiles

#### `blog_posts`
- Sistema de blog completo
- Editor WYSIWYG
- SEO y metadatos
- Categorías y tags

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

# Base de Datos
node scripts/create-admin.js              # Crear administrador
node scripts/create-test-user.js          # Crear usuario de prueba
node scripts/test-db-connection.js       # Probar conexión DB

# Utilidades
node scripts/translate-existing-content.js  # Traducir contenido
node scripts/migrate-product-images.js      # Migrar imágenes
```

## 🌐 Despliegue

### Hostinger (Recomendado)
1. Subir archivos al servidor
2. Configurar base de datos MySQL
3. Instalar dependencias: `pnpm install`
4. Build de producción: `pnpm build`
5. Configurar variables de entorno
6. Configurar dominio y SSL

### Vercel
1. Conectar repositorio GitHub
2. Configurar variables de entorno
3. Deploy automático en cada push

Ver documentación detallada en `docs/deployment/`

## 🔐 Seguridad

- **Autenticación JWT** con tokens seguros
- **Encriptación bcrypt** para contraseñas
- **Validación de entrada** en todos los endpoints
- **Sanitización de datos** para prevenir XSS
- **Rate limiting** en APIs críticas
- **HTTPS obligatorio** en producción

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

---

**Desarrollado con ❤️ para StarFilters**

https://developers.bind.com.mx/api-details#api=bind-erp-api&operation=Products_AddProduct