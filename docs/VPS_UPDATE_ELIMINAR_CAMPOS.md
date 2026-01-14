# Guía Paso a Paso: Actualizar VPS - Eliminación de Campos

Esta guía te llevará paso a paso para actualizar el proyecto en el VPS después de eliminar campos innecesarios.

## 📋 Paso 1: Conectarse al VPS

```bash
ssh root@72.60.228.9
```

Si te pide contraseña, ingrésala.

## 📋 Paso 2: Navegar al directorio del proyecto

```bash
cd ~/starfilters-app
```

Verifica que estás en el directorio correcto:
```bash
pwd
# Debe mostrar: /root/starfilters-app
```

## 📋 Paso 3: Obtener los últimos cambios de GitHub

```bash
git pull origin main
```

**Si hay conflictos o cambios locales:**
```bash
# Si quieres descartar cambios locales y usar solo los de GitHub
git reset --hard origin/main
git pull origin main
```

**Verificar que se actualizó correctamente:**
```bash
git log --oneline -3
```

Deberías ver el commit más reciente: "refactor: eliminar campos innecesarios de formularios de productos"

## 📋 Paso 4: Limpiar builds anteriores (OPCIONAL pero recomendado)

```bash
# Limpiar directorios de build
rm -rf dist/ .astro/
```

Esto asegura que no haya archivos antiguos que puedan causar problemas.

## 📋 Paso 5: Instalar dependencias (si es necesario)

```bash
pnpm install
```

Esto puede tardar unos minutos. Solo instala si hay cambios en `package.json`.

**Nota:** En este caso, no debería haber cambios en las dependencias, pero es bueno verificar.

## 📋 Paso 6: Construir el proyecto

```bash
pnpm build
```

**Espera a que termine.** Deberías ver al final:
```
✓ Completed in X.XXs
[build] Complete!
```

Si ves errores, detente y revisa los mensajes de error.

## 📋 Paso 7: Reiniciar la aplicación con PM2

```bash
# Ver el estado actual
pm2 status

# Reiniciar la aplicación
pm2 restart starfilters-app

# Guardar la configuración de PM2
pm2 save

# Esperar unos segundos y verificar el estado
sleep 3
pm2 status
```

**Verificar que está "online":**
- Debe mostrar `status: online` en verde
- No debe mostrar `status: errored` o `status: stopped`

## 📋 Paso 8: Verificar que la aplicación está funcionando

```bash
# Verificar que está escuchando en el puerto 3000
netstat -tlnp | grep 3000
```

Deberías ver algo como:
```
tcp  0  0  0.0.0.0:3000  0.0.0.0:*  LISTEN  12345/node
```

**Ver los logs recientes:**
```bash
pm2 logs starfilters-app --lines 20
```

No deberías ver errores críticos. Si ves errores, anótalos.

## 📋 Paso 9: Reiniciar Nginx (si es necesario)

```bash
# Verificar configuración
nginx -t

# Si dice "syntax is ok", reiniciar
systemctl restart nginx

# Verificar estado
systemctl status nginx
```

## 📋 Paso 10: Probar en el navegador

Abre tu navegador y visita:

1. **Formulario de agregar producto:**
   ```
   https://srv1171123.hstgr.cloud/admin/products/add
   ```

2. **Formulario de editar producto:**
   ```
   https://srv1171123.hstgr.cloud/admin/products/edit/[ID]
   ```
   (Reemplaza `[ID]` con el ID de un producto existente)

**Verificar que los campos eliminados NO aparecen:**
- ❌ NO debe aparecer "Categoría y Variante"
- ❌ NO debe aparecer "Código Bind"
- ❌ NO debe aparecer "Medida Nominal"
- ❌ NO debe aparecer "Medida Real"
- ❌ NO debe aparecer "Precio (MXN)"
- ❌ NO debe aparecer "Precio (USD)"
- ❌ NO debe aparecer "Moneda Principal"
- ❌ NO debe aparecer "Stock/Inventario"
- ❌ NO debe aparecer "Clase EN1822"
- ❌ NO debe aparecer "Material del Marco"
- ❌ NO debe aparecer "Temperatura Máxima"

**Verificar que los campos que SÍ deben aparecer están presentes:**
- ✅ Información Básica (Título, Descripción)
- ✅ Imágenes (Principal y Galería)
- ✅ Eficiencia (Lista)
- ✅ Características (Lista)
- ✅ Instalación Típica (Textarea)
- ✅ Aplicaciones (Lista)
- ✅ Beneficios (Lista)
- ✅ Tabla de Tamaños
- ✅ Estado de Publicación

## 🔧 Solución de Problemas

### Problema: "Cannot find module" en los logs

**Solución:**
```bash
# Limpiar y reconstruir completamente
rm -rf dist/ .astro/ node_modules/
pnpm install
pnpm build
pm2 restart starfilters-app
```

### Problema: "502 Bad Gateway"

**Solución:**
```bash
# Verificar que la app está corriendo
pm2 status

# Ver logs de errores
pm2 logs starfilters-app --err --lines 50

# Si está detenida, iniciarla
pm2 start ecosystem.config.cjs --name starfilters-app

# Reiniciar Nginx
systemctl restart nginx
```

### Problema: Los campos eliminados aún aparecen

**Causa:** El build no se actualizó correctamente o hay caché.

**Solución:**
```bash
# Limpiar completamente
rm -rf dist/ .astro/

# Reconstruir
pnpm build

# Reiniciar PM2
pm2 restart starfilters-app

# Limpiar caché del navegador (Ctrl+Shift+R o Cmd+Shift+R)
```

## ✅ Checklist Final

Antes de terminar, verifica:

- [ ] `git pull` ejecutado sin errores
- [ ] `pnpm build` completado exitosamente
- [ ] PM2 muestra la app como "online"
- [ ] Puerto 3000 está en uso
- [ ] No hay errores en los logs de PM2
- [ ] El sitio web carga correctamente
- [ ] Los campos eliminados NO aparecen en los formularios
- [ ] Los campos que deben aparecer están presentes
- [ ] La tabla de tamaños funciona correctamente

## 📝 Comandos Rápidos (Todo en uno)

Si prefieres ejecutar todo de una vez:

```bash
cd ~/starfilters-app && \
git pull origin main && \
rm -rf dist/ .astro/ && \
pnpm install && \
pnpm build && \
pm2 restart starfilters-app && \
pm2 save && \
sleep 3 && \
pm2 status && \
pm2 logs starfilters-app --lines 20
```

## 🆘 Si Algo Sale Mal

1. **Ver logs detallados:**
   ```bash
   pm2 logs starfilters-app --lines 100
   ```

2. **Volver a la versión anterior:**
   ```bash
   git log --oneline -5
   git checkout COMMIT_HASH_ANTERIOR
   pnpm build
   pm2 restart starfilters-app
   ```

3. **Reiniciar completamente:**
   ```bash
   pm2 stop starfilters-app
   pm2 delete starfilters-app
   rm -rf dist/ .astro/
   pnpm build
   pm2 start ecosystem.config.cjs --name starfilters-app
   pm2 save
   ```

## 📞 Información Útil

**IP del VPS:** 72.60.228.9  
**URL del sitio:** https://srv1171123.hstgr.cloud  
**Directorio del proyecto:** /root/starfilters-app  
**Base de datos:** starfilters_ecommerce_db
