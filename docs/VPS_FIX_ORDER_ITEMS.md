# Fix: Error "Unknown column 'p.image_url' in 'field list'"

## Problema
El error indica que hay una consulta SQL que intenta acceder a `p.image_url` desde la tabla `products`, pero esa columna no existe (fue migrada a `product_images`).

## Solución
El commit `59aa5ae` ya corrigió este problema, pero el VPS necesita actualizarse.

## Pasos para corregir en el VPS

```bash
# 1. Conectarse al VPS
ssh root@72.60.228.9

# 2. Ir al directorio de la aplicación
cd ~/starfilters-app

# 3. Detener la aplicación
pm2 stop starfilters-app

# 4. Asegurarse de estar en la rama main y actualizar
git fetch origin
git reset --hard origin/main

# 5. Limpiar completamente el build anterior
rm -rf dist/ .astro/ node_modules/.cache

# 6. Reinstalar dependencias (opcional, pero recomendado)
pnpm install

# 7. Reconstruir la aplicación
pnpm build

# 8. Verificar que el código compilado no tenga la consulta antigua
grep -r "p.image_url" dist/server/chunks/ || echo "✅ No se encontró la consulta antigua"

# 9. Verificar que getOrderItems esté correcto
grep -A 5 "getOrderItems" dist/server/chunks/database*.mjs | head -10

# 10. Reiniciar la aplicación
pm2 restart starfilters-app

# 11. Verificar logs
pm2 logs starfilters-app --lines 30
```

## Verificación

Después de aplicar los cambios, verifica que:
1. No aparezca el error "Unknown column 'p.image_url'"
2. Las órdenes se muestren correctamente en el admin
3. Los items de las órdenes tengan sus imágenes (desde `order_items.image_url`)

## Nota

El código actual de `getOrderItems` ya no hace JOIN con `products`. El `image_url` se guarda directamente en `order_items` cuando se crea la orden, por lo que no es necesario hacer JOIN.

