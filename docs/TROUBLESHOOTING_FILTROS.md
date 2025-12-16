# 🔧 Solución de Problemas - Página de Filtros

## Problema: No se actualiza /filtros

### Pasos para diagnosticar y solucionar

#### 1. Verificar que los cambios estén aplicados en el VPS

```bash
ssh root@72.60.228.9
cd ~/starfilters-app

# Verificar que estás en la última versión
git status
git log --oneline -5

# Si no estás actualizado, hacer pull
git pull origin main

# Reinstalar dependencias si es necesario
pnpm install

# Reconstruir la aplicación
pnpm build

# Reiniciar la aplicación
pm2 restart starfilters-app
```

#### 2. Verificar logs del servidor

```bash
# Ver logs en tiempo real
pm2 logs starfilters-app --lines 100 | grep "filtros\|📦\|✅\|❌"

# Buscar específicamente logs de categorías
pm2 logs starfilters-app | grep "categorías activas"
```

Deberías ver mensajes como:
- `📦 Página /filtros: X categorías activas encontradas`
- `✅ Página /filtros: X productos listos para mostrar`

#### 3. Verificar en la base de datos

Conéctate a la base de datos y ejecuta:

```sql
-- Ver todas las categorías y su estado
SELECT id, name, status, slug FROM filter_categories;

-- Ver categorías activas específicamente
SELECT id, name, status, slug FROM filter_categories WHERE status = 'active';

-- Ver variantes de una categoría específica
SELECT id, category_id, nominal_size, price, stock, is_active 
FROM filter_category_variants 
WHERE category_id = 1; -- Reemplaza 1 con el ID de tu categoría

-- Ver variantes activas de una categoría
SELECT COUNT(*) as variantes_activas
FROM filter_category_variants 
WHERE category_id = 1 AND is_active = 1;
```

#### 4. Verificar que la categoría esté activa

En el panel de administración (`/admin/filter-categories`):
1. Verifica que la categoría tenga estado "Activo" (no "Inactivo" o "Borrador")
2. Si está inactiva, edítala y cambia el estado a "Activo"
3. Guarda los cambios

#### 5. Verificar que la categoría tenga variantes activas

La página `/filtros` solo muestra categorías que:
- Tienen `status = 'active'`
- Tienen al menos una variante activa (`is_active = 1`)

Si la categoría está activa pero no aparece, verifica:
1. Que tenga variantes creadas
2. Que al menos una variante tenga `is_active = 1`

#### 6. Limpiar caché del navegador

Si los cambios están aplicados pero no ves actualizaciones:
1. Presiona `Ctrl + Shift + R` (Windows/Linux) o `Cmd + Shift + R` (Mac) para hard refresh
2. O abre la página en modo incógnito
3. O limpia la caché del navegador completamente

#### 7. Verificar que la aplicación esté corriendo

```bash
# Ver estado de PM2
pm2 status

# Ver información detallada
pm2 info starfilters-app

# Reiniciar si es necesario
pm2 restart starfilters-app
```

## Problemas comunes y soluciones

### Problema: Categoría activa pero no aparece

**Causa:** La categoría no tiene variantes activas

**Solución:**
1. Ve a `/admin/filter-categories/edit/{id}`
2. Verifica que haya variantes creadas
3. Asegúrate de que al menos una variante tenga el checkbox "Activo" marcado
4. Guarda los cambios

### Problema: Cambios no se reflejan después de actualizar

**Causa:** Caché del servidor o del navegador

**Solución:**
1. Reinicia PM2: `pm2 restart starfilters-app`
2. Limpia caché del navegador
3. Verifica que el build se haya completado correctamente

### Problema: Error en logs

**Causa:** Error en la consulta o conexión a la base de datos

**Solución:**
1. Revisa los logs: `pm2 logs starfilters-app`
2. Verifica la conexión a la base de datos en `.env`
3. Verifica que las tablas existan y tengan la estructura correcta

## Comandos útiles

```bash
# Ver logs en tiempo real
pm2 logs starfilters-app --lines 50

# Reiniciar aplicación
pm2 restart starfilters-app

# Ver uso de recursos
pm2 monit

# Verificar que el servidor esté escuchando
netstat -tulpn | grep :3000  # O el puerto que uses
```

## Verificación final

Después de aplicar los cambios, verifica:

1. ✅ Los cambios están en GitHub (`git log`)
2. ✅ Los cambios están en el VPS (`git pull`)
3. ✅ La aplicación se reconstruyó (`pnpm build`)
4. ✅ PM2 reinició la aplicación (`pm2 restart`)
5. ✅ La categoría tiene `status = 'active'`
6. ✅ La categoría tiene variantes activas
7. ✅ Los logs muestran categorías encontradas
8. ✅ La página muestra las categorías

