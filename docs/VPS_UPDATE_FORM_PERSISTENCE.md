# Actualizar VPS - Persistencia de Formularios

Esta guía describe cómo actualizar el VPS con la nueva funcionalidad de persistencia de formularios.

## Descripción de los cambios

Se agregó un componente `FormPersistence.astro` que:
- **Guarda automáticamente** los datos del formulario en localStorage cada segundo
- **Restaura los datos** automáticamente cuando se recarga la página
- **Limpia los datos** cuando el formulario se envía exitosamente
- **Muestra un indicador** "Borrador guardado" al guardar
- **Muestra un banner** cuando se detectan datos guardados
- **Expira datos** después de 7 días

### Formularios actualizados

1. `/admin/products/add` - Crear productos
2. `/admin/filter-categories/create` - Crear categorías
3. `/admin/blog/add` - Crear artículos del blog
4. `/admin/discount-codes/create` - Crear códigos de descuento

## Pasos para actualizar

### 1. Conectar al VPS

```bash
ssh root@72.60.228.9
```

### 2. Ir al directorio del proyecto

```bash
cd ~/starfilters-app
```

### 3. Obtener los últimos cambios

```bash
git pull origin main
```

### 4. Instalar dependencias (si es necesario)

```bash
pnpm install
```

### 5. Compilar el proyecto

```bash
pnpm build
```

### 6. Reiniciar la aplicación

```bash
pm2 restart starfilters-app
```

### 7. Verificar el estado

```bash
pm2 status
pm2 logs starfilters-app --lines 20
```

## Verificación

Para verificar que la funcionalidad funciona correctamente:

1. Ir a cualquiera de los formularios de creación (ej: `/admin/products/add`)
2. Llenar algunos campos del formulario
3. Esperar 2 segundos (verás el indicador "Borrador guardado" en la esquina inferior derecha)
4. Recargar la página (F5 o Ctrl+R)
5. Los datos deberían restaurarse automáticamente
6. Verás un banner azul indicando "Se encontró un borrador guardado"

## Notas técnicas

- Los datos se guardan en `localStorage` del navegador con la clave `form_draft_{formId}`
- Las imágenes NO se persisten (son muy grandes para localStorage)
- Los datos expiran automáticamente después de 7 días
- Al enviar el formulario exitosamente, los datos se limpian automáticamente

## Script rápido

```bash
# Ejecutar todo de una vez
ssh root@72.60.228.9 "cd ~/starfilters-app && git pull origin main && pnpm install && pnpm build && pm2 restart starfilters-app && pm2 status"
```
