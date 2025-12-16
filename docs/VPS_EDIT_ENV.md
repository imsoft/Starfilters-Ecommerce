# 🔧 Editar .env en el VPS

## Método 1: Manual (Recomendado)

### Paso 1: Conectarse al VPS

```bash
ssh root@72.60.228.9
```

### Paso 2: Navegar al directorio del proyecto

```bash
cd ~/starfilters-app
```

### Paso 3: Ver el contenido actual del .env

```bash
cat .env
```

### Paso 4: Editar el archivo .env

Usando **nano** (más fácil):

```bash
nano .env
```

**Instrucciones de nano:**
- Usa las flechas para moverte
- Edita las líneas necesarias
- `Ctrl + O` para guardar (luego Enter)
- `Ctrl + X` para salir

O usando **vi**:

```bash
vi .env
```

**Instrucciones de vi:**
- Presiona `i` para entrar en modo inserción
- Edita las líneas necesarias
- Presiona `Esc` para salir del modo inserción
- Escribe `:wq` y Enter para guardar y salir

### Paso 5: Agregar las variables de Resend

Agrega estas líneas al final del archivo `.env` (si no están):

```env
# Configuración de Resend (Email)
RESEND_API_KEY=re_tu_api_key_aqui
RESEND_FROM_EMAIL=noreply@tu-dominio.com
RESEND_FROM_NAME=StarFilters
```

**⚠️ IMPORTANTE:** Reemplaza:
- `re_tu_api_key_aqui` con tu API key real de Resend
- `noreply@tu-dominio.com` con el email de tu dominio de Google Workspace
- Verifica que `ADMIN_EMAIL` esté configurado (para recibir notificaciones de nuevas órdenes)

### Paso 6: Verificar que se guardaron los cambios

```bash
cat .env | grep RESEND
```

Deberías ver las 3 líneas de Resend.

### Paso 7: Reiniciar la aplicación

```bash
pm2 restart starfilters-app
```

### Paso 8: Verificar logs

```bash
pm2 logs starfilters-app --lines 50
```

Busca mensajes como:
- `✅ Email enviado exitosamente con Resend`
- O errores si falta alguna configuración

---

## Método 2: Usando el script

Si prefieres usar el script automatizado:

```bash
# Desde tu máquina local
cd /ruta/a/tu/proyecto
./scripts/edit-env-vps.sh
```

---

## Variables que debes configurar

### Variables de Resend (NUEVAS - Agregar)

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@starfilters.mx
RESEND_FROM_NAME=StarFilters
```

### Variables existentes (Verificar que estén)

```env
SITE_URL=https://srv1171123.hstgr.cloud
ADMIN_EMAIL=admin@tu-dominio.com
```

---

## Ejemplo completo de sección de email en .env

```env
# Configuración del sitio
SITE_URL=https://srv1171123.hstgr.cloud
ADMIN_EMAIL=ventas@starfilters.mx

# ... otras configuraciones ...

# Configuración de Resend (Email)
RESEND_API_KEY=re_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
RESEND_FROM_EMAIL=noreply@starfilters.mx
RESEND_FROM_NAME=StarFilters
```

---

## Verificación rápida

Después de editar, ejecuta esto para verificar:

```bash
# Ver todas las variables de email
cat .env | grep -E "(RESEND|ADMIN_EMAIL|SITE_URL)"

# Reiniciar aplicación
pm2 restart starfilters-app

# Ver logs en tiempo real
pm2 logs starfilters-app --lines 100 | grep "📧"
```

---

## Solución de problemas

### Error: "RESEND_API_KEY no configurada"
- Verifica que la variable esté en el `.env`
- Verifica que no tenga espacios extra
- Reinicia la aplicación: `pm2 restart starfilters-app`

### Error: "Domain not verified"
- El dominio debe estar verificado en Resend
- Verifica que `RESEND_FROM_EMAIL` use un email del dominio verificado

### No se envían emails
- Verifica los logs: `pm2 logs starfilters-app | grep "📧"`
- Verifica que `RESEND_API_KEY` sea válida
- Verifica que el dominio esté verificado en Resend

