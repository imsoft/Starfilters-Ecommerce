# Nuevas Funcionalidades de Administración

## Resumen de Cambios

Se han implementado dos nuevas funcionalidades en el panel de administración:

1. **Gestión de Imagen del Hero** - Personaliza la imagen principal de la sección Hero
2. **Configuración de WhatsApp** - Botón flotante de WhatsApp en todas las páginas

---

## 🖼️ 1. Gestión de Imagen del Hero

### ¿Qué es?
Una página de administración donde puedes cambiar la imagen principal de la sección Hero de tu sitio web.

### ¿Dónde está?
**Ruta:** `/admin/settings/hero`

### Características:
- ✅ Subir imágenes directamente desde tu computadora
- ✅ O usar una URL de imagen existente
- ✅ Vista previa en tiempo real
- ✅ Almacenamiento en Cloudinary
- ✅ Elimina automáticamente la imagen anterior

### Cómo usarlo:

#### Opción 1: Subir una imagen

1. Ve a **Admin → Configuración → Hero**
2. En la sección "Subir Nueva Imagen":
   - Haz clic en "Selecciona una imagen"
   - Elige tu imagen (JPG, PNG, WebP)
   - Haz clic en "Subir y Actualizar"

3. La imagen se subirá a Cloudinary y se actualizará automáticamente

#### Opción 2: Usar una URL

1. Ve a **Admin → Configuración → Hero**
2. En la sección "O usar una URL":
   - Pega la URL completa de tu imagen
   - Haz clic en "Actualizar con URL"

### Recomendaciones:
- **Resolución:** 1920x1080px (Full HD) o mayor
- **Formato:** JPG para fotografías, PNG para gráficos
- **Tamaño:** Menos de 500KB para mejor rendimiento
- **Aspecto:** Usa imágenes con buen contraste para que el texto sea legible

---

## 💬 2. Botón Flotante de WhatsApp

### ¿Qué es?
Un botón flotante que aparece en la esquina inferior derecha de todas las páginas públicas, permitiendo a los visitantes contactarte fácilmente por WhatsApp.

### ¿Dónde configurarlo?
**Ruta:** `/admin/settings/whatsapp`

### Características:
- ✅ Botón siempre visible (fixed position)
- ✅ Configuración de número de WhatsApp
- ✅ Mensaje personalizado predeterminado
- ✅ Animación de pulso para llamar la atención
- ✅ Vista previa en tiempo real
- ✅ Responsive (se adapta a móviles)

### Cómo configurarlo:

1. **Ve a Admin → Configuración → WhatsApp**

2. **Configura el número:**
   - Incluye el código de país (sin el +)
   - Solo números, sin espacios ni guiones
   - Ejemplo para México: `5215551234567`
     - 52 = código de país
     - 1 = para móvil en México
     - 5551234567 = tu número

3. **Escribe el mensaje predeterminado:**
   - Este texto aparecerá cuando alguien haga clic en el botón
   - Ejemplo: "Hola, me gustaría obtener más información sobre sus productos."
   - Puedes usar emojis 😊

4. **Haz clic en "Guardar Configuración"**

5. **Prueba el botón:**
   - Haz clic en "Probar en WhatsApp" para verificar que funciona
   - O visita cualquier página de tu sitio web

### Ejemplo de Configuración:

```
Número: 5215551234567
Mensaje: Hola! 👋 Me gustaría obtener más información sobre los filtros industriales. ¿Podrían ayudarme?
```

### Características del Botón:

- **Ubicación:** Esquina inferior derecha
- **Color:** Verde WhatsApp oficial (#25D366)
- **Animación:** Pulso suave para llamar la atención
- **Hover:** Aumenta de tamaño al pasar el mouse
- **Logo:** Icono oficial de WhatsApp

### Cómo se ve:

```
┌─────────────────────────────────┐
│                                 │
│   Contenido de tu sitio         │
│                                 │
│                           ┌───┐ │
│                           │ W │ │ ← Botón flotante
│                           └───┘ │
└─────────────────────────────────┘
```

### Formato del Número:

| País | Código | Formato Completo | Ejemplo |
|------|--------|------------------|---------|
| México | 52 | 52 + 1 + número | 5215551234567 |
| EE.UU. | 1 | 1 + número | 15551234567 |
| España | 34 | 34 + número | 34612345678 |
| Argentina | 54 | 54 + 9 + número | 549111234567 |

### Desactivar el Botón:

Si quieres desactivar temporalmente el botón:
1. Ve a **Admin → Configuración → WhatsApp**
2. Borra el número de teléfono
3. Guarda

El botón desaparecerá automáticamente de todas las páginas.

---

## 🗄️ Cambios en la Base de Datos

Se creó una nueva tabla `site_settings` para almacenar la configuración del sitio.

### Migración SQL:

```sql
-- Crear tabla de configuración del sitio
CREATE TABLE IF NOT EXISTS site_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar valores por defecto
INSERT INTO site_settings (setting_key, setting_value) VALUES
('hero_image', '/images/hero-default.jpg'),
('whatsapp_number', ''),
('whatsapp_message', 'Hola, me gustaría obtener más información sobre sus productos.')
ON DUPLICATE KEY UPDATE setting_key=setting_key;
```

### Para aplicar la migración:

```bash
mysql -u root -p starfilters_ecommerce_db < migrations/add_site_settings.sql
```

---

## 📁 Archivos Creados

### Servicios:
1. **`/src/lib/site-settings-service.ts`**
   - Funciones para obtener y actualizar configuraciones
   - Helpers para Hero y WhatsApp

### Páginas Admin:
2. **`/src/pages/admin/settings/hero/index.astro`**
   - Página de configuración de imagen del Hero

3. **`/src/pages/admin/settings/whatsapp/index.astro`**
   - Página de configuración de WhatsApp

### Componentes:
4. **`/src/components/shared/WhatsAppButton.astro`**
   - Componente del botón flotante

### Migraciones:
5. **`/migrations/add_site_settings.sql`**
   - Migración de base de datos

---

## 📁 Archivos Modificados

1. **`/src/layouts/websiteLayout.astro`**
   - Agregado componente `<WhatsAppButton />`

---

## ✅ Checklist de Verificación

Después de desplegar, verifica:

### Hero:
- [ ] Puedes acceder a `/admin/settings/hero`
- [ ] Puedes subir una imagen
- [ ] La vista previa funciona
- [ ] La imagen se actualiza en el sitio

### WhatsApp:
- [ ] Puedes acceder a `/admin/settings/whatsapp`
- [ ] Puedes guardar un número
- [ ] El botón aparece en las páginas públicas
- [ ] El clic abre WhatsApp con el mensaje correcto
- [ ] El botón NO aparece en páginas de admin

---

## 🎨 Personalización Futura

### Para cambiar el color del botón de WhatsApp:

Edita `/src/components/shared/WhatsAppButton.astro`:

```astro
<!-- Cambia bg-[#25D366] por tu color -->
<a class="... bg-[#25D366] ...">
```

### Para cambiar la posición:

```astro
<!-- Cambia bottom-6 right-6 -->
<a class="... bottom-6 right-6 ...">

<!-- Ejemplos: -->
<!-- Izquierda: bottom-6 left-6 -->
<!-- Arriba derecha: top-20 right-6 -->
```

### Para cambiar el tamaño:

```astro
<!-- Cambia h-16 w-16 -->
<a class="... h-16 w-16 ...">

<!-- Más grande: h-20 w-20 -->
<!-- Más pequeño: h-12 w-12 -->
```

---

## 🆘 Solución de Problemas

### El botón de WhatsApp no aparece:

1. Verifica que configuraste un número en `/admin/settings/whatsapp`
2. El número debe tener al menos 10 dígitos
3. Refresca la página (Ctrl + F5)
4. Verifica que no haya errores en la consola del navegador

### La imagen del Hero no se actualiza:

1. Verifica que el archivo sea una imagen válida
2. Asegúrate de que Cloudinary esté configurado correctamente
3. Revisa los logs del servidor para errores

### No puedo acceder a las páginas de configuración:

1. Verifica que estés logueado como administrador
2. Verifica que la tabla `site_settings` exista en la base de datos
3. Ejecuta la migración si no la has corrido

---

## 📊 Resumen Visual

```
ANTES:
┌─────────────────────┐
│   Admin Panel       │
│                     │
│   - Productos       │
│   - Órdenes         │
│   - Usuarios        │
└─────────────────────┘

AHORA:
┌─────────────────────┐
│   Admin Panel       │
│                     │
│   - Productos       │
│   - Órdenes         │
│   - Usuarios        │
│   - Configuración   │ ← NUEVO
│     • Hero          │
│     • WhatsApp      │
└─────────────────────┘
```

¡Todo listo para usar! 🎉
