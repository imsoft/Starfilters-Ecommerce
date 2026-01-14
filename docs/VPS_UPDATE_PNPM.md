# Guía: Actualizar pnpm en el VPS

Esta guía te ayudará a actualizar pnpm de la versión 10.26.0 a 10.28.0 (o cualquier versión más reciente) en tu VPS.

## 🚀 Método Rápido (Recomendado)

### Paso 1: Configurar pnpm (si es necesario)

Si recibes el error `ERR_PNPM_NO_GLOBAL_BIN_DIR`, primero configura pnpm:

```bash
# Conectarse al VPS
ssh root@tu-servidor-ip

# Configurar pnpm (si no está configurado)
pnpm setup

# IMPORTANTE: Recargar la configuración del shell
source /root/.bashrc
# O si usas zsh:
source /root/.zshrc
```

### Paso 2: Actualizar pnpm

```bash
# Actualizar pnpm globalmente
pnpm add -g pnpm

# Verificar la nueva versión
pnpm --version
```

**Debería mostrar:** `10.28.0` o superior

## 🔧 Solución de Problemas Comunes

### Error: "ERR_PNPM_NO_GLOBAL_BIN_DIR"

**Solución:**

```bash
# 1. Ejecutar setup
pnpm setup

# 2. Recargar configuración del shell (IMPORTANTE)
source /root/.bashrc

# 3. Verificar que PNPM_HOME está en el PATH
echo $PNPM_HOME
# Debe mostrar: /root/.local/share/pnpm

# 4. Verificar PATH
echo $PATH | grep pnpm
# Debe incluir /root/.local/share/pnpm

# 5. Ahora intentar actualizar
pnpm add -g pnpm
```

### Si aún no funciona después de source

```bash
# Verificar que el directorio existe
ls -la /root/.local/share/pnpm

# Si no existe, crearlo manualmente
mkdir -p /root/.local/share/pnpm

# Agregar manualmente al PATH para esta sesión
export PNPM_HOME="/root/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

# Ahora intentar actualizar
pnpm add -g pnpm
```

### Método Alternativo: Usando npm

Si pnpm no funciona, puedes usar npm para actualizar pnpm:

```bash
# Actualizar pnpm usando npm
npm install -g pnpm@latest

# Verificar versión
pnpm --version
```

### Método Alternativo: Usando Corepack

```bash
# Habilitar corepack (si no está habilitado)
corepack enable

# Actualizar pnpm
corepack prepare pnpm@latest --activate

# Verificar versión
pnpm --version
```

## ✅ Verificación Completa

Después de actualizar, verifica que todo funciona:

```bash
# 1. Ver versión de pnpm
pnpm --version
# Debe mostrar: 10.28.0 o superior

# 2. Verificar ubicación
which pnpm
# Debe mostrar: /root/.local/share/pnpm/pnpm

# 3. Verificar que funciona en el proyecto
cd ~/starfilters-app
pnpm --version

# 4. Probar instalación de dependencias (opcional)
pnpm install --dry-run
```

## 🔄 Hacer los Cambios Permanentes

Para que los cambios sean permanentes en nuevas sesiones SSH:

```bash
# Verificar que está en .bashrc
grep PNPM_HOME /root/.bashrc

# Si no aparece, agregarlo manualmente
echo 'export PNPM_HOME="/root/.local/share/pnpm"' >> /root/.bashrc
echo 'export PATH="$PNPM_HOME:$PATH"' >> /root/.bashrc

# Recargar
source /root/.bashrc
```

## 📝 Notas

- **IMPORTANTE:** Siempre ejecuta `source /root/.bashrc` después de `pnpm setup`
- La actualización de pnpm no afecta los proyectos existentes
- No es necesario reconstruir el proyecto después de actualizar pnpm
- Si tienes problemas, puedes volver a la versión anterior con: `npm install -g pnpm@10.26.0`

## 🆘 Si Nada Funciona

Como último recurso, reinstala pnpm completamente:

```bash
# Desinstalar pnpm actual
npm uninstall -g pnpm

# Limpiar directorio de pnpm
rm -rf /root/.local/share/pnpm

# Reinstalar pnpm
npm install -g pnpm@latest

# Configurar
pnpm setup

# Recargar shell
source /root/.bashrc

# Verificar
pnpm --version
```
